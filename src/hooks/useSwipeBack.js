import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for native-feeling edge swipe-back gesture (PWA / iOS / Android style).
 * Slides full pages and views rightward when swiping from the left edge, and dismisses on release.
 * Strictly left-to-right swipe only. Zero visual indicators.
 *
 * @param {Object} options
 * @param {Function} options.onBack - Callback triggered when back swipe completes
 * @param {number} [options.edgeWidth=85] - Max px from left edge where swipe can start
 * @param {number} [options.threshold=70] - Distance in px needed to confirm dismissal
 * @param {boolean} [options.enabled=true] - Whether gesture tracking is enabled
 */
export function useSwipeBack({
  onBack,
  edgeWidth = 85,
  threshold = 70,
  enabled = true
}) {
  const [dragX, setDragX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const containerRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isTrackingRef = useRef(false);
  const isSwipingRef = useRef(false);
  const isLockedOutRef = useRef(false);
  const currentDragXRef = useRef(0);

  // Clean up gesture tracking refs when disabled
  useEffect(() => {
    if (!enabled) {
      isTrackingRef.current = false;
      isSwipingRef.current = false;
      isLockedOutRef.current = false;
      currentDragXRef.current = 0;
    }
  }, [enabled]);

  // Check if touch or mouse coordinate is within edge zone
  const checkIsWithinEdge = useCallback((clientX) => {
    // 1. Direct screen left edge (0 to edgeWidth px)
    if (clientX <= edgeWidth) return true;

    // 2. Relative to container's left edge (useful when centered on wider screens or tablets)
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.left + edgeWidth) {
        return true;
      }
    }

    return false;
  }, [edgeWidth]);

  // Handle release of gesture
  const handleRelease = useCallback(() => {
    const wasSwiping = isSwipingRef.current;
    const finalDragX = currentDragXRef.current;
    const elapsed = Date.now() - startTimeRef.current;
    const velocity = elapsed > 0 ? finalDragX / elapsed : 0; // px per ms

    isTrackingRef.current = false;
    isSwipingRef.current = false;
    isLockedOutRef.current = false;

    if (wasSwiping) {
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
      const dynamicThreshold = Math.min(threshold, screenWidth * 0.22);

      // Trigger back if dragged past dynamic threshold or flicked quickly to right
      if (finalDragX > dynamicThreshold || (velocity > 0.22 && finalDragX > 25)) {
        setIsExiting(true);
        setTimeout(() => {
          onBack?.();
        }, 180);
      } else {
        // Snap back with smooth spring
        setDragX(0);
        setIsSwiping(false);
      }
    } else {
      setDragX(0);
      setIsSwiping(false);
    }
  }, [threshold, onBack]);

  // Start touch tracking
  const startTracking = useCallback((clientX, clientY) => {
    if (!enabled || isExiting) return false;
    if (!checkIsWithinEdge(clientX)) return false;

    startXRef.current = clientX;
    startYRef.current = clientY;
    startTimeRef.current = Date.now();
    currentDragXRef.current = 0;
    isTrackingRef.current = true;
    isSwipingRef.current = false;
    isLockedOutRef.current = false;

    return true;
  }, [enabled, isExiting, checkIsWithinEdge]);

  // Native non-passive touch listeners on window during touch interaction to prevent touchcancel drops
  useEffect(() => {
    if (!enabled || isExiting) return;

    const onNativeTouchMove = (e) => {
      if (!isTrackingRef.current || isLockedOutRef.current || isExiting) return;
      if (!e.touches || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;

      // Gesture direction disambiguation
      if (!isSwipingRef.current) {
        // Disallow leftward swipe: only left-to-right swipe is permitted
        if (deltaX < -8) {
          isLockedOutRef.current = true;
          isTrackingRef.current = false;
          return;
        }

        // Horizontal swipe detected early: moved rightward by > 6px and horizontal dominates
        if (deltaX > 6 && deltaX > Math.abs(deltaY) * 0.75) {
          isSwipingRef.current = true;
          setIsSwiping(true);
          if (e.cancelable) e.preventDefault();
          const clampedX = Math.max(0, deltaX);
          currentDragXRef.current = clampedX;
          setDragX(clampedX);
        }
        // Vertical scroll dominant: release gesture to allow natural scrolling
        else if (Math.abs(deltaY) > 16 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
          isLockedOutRef.current = true;
          isTrackingRef.current = false;
        }
        return;
      }

      // Actively swiping rightward
      if (isSwipingRef.current) {
        if (e.cancelable) e.preventDefault();
        const clampedX = Math.max(0, deltaX);
        currentDragXRef.current = clampedX;
        setDragX(clampedX);
      }
    };

    const onNativeTouchEnd = () => {
      if (isTrackingRef.current || isSwipingRef.current) {
        handleRelease();
      }
    };

    const onNativeTouchCancel = () => {
      if (isSwipingRef.current && currentDragXRef.current > threshold * 0.6) {
        setIsExiting(true);
        setTimeout(() => {
          onBack?.();
        }, 180);
      } else {
        setDragX(0);
        setIsSwiping(false);
      }
      isTrackingRef.current = false;
      isSwipingRef.current = false;
      isLockedOutRef.current = false;
      currentDragXRef.current = 0;
    };

    window.addEventListener('touchmove', onNativeTouchMove, { passive: false });
    window.addEventListener('touchend', onNativeTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onNativeTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchmove', onNativeTouchMove);
      window.removeEventListener('touchend', onNativeTouchEnd);
      window.removeEventListener('touchcancel', onNativeTouchCancel);
    };
  }, [enabled, isExiting, handleRelease, threshold, onBack]);

  // Touch event handlers for React JSX binding
  const onTouchStart = useCallback((e) => {
    if (e.touches && e.touches.length === 1) {
      startTracking(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [startTracking]);

  const onTouchMove = useCallback((e) => {
    if (!isTrackingRef.current || isLockedOutRef.current) return;
    if (e.touches && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - startXRef.current;
      const deltaY = e.touches[0].clientY - startYRef.current;
      if (!isSwipingRef.current && deltaX > 6 && deltaX > Math.abs(deltaY) * 0.75) {
        isSwipingRef.current = true;
        setIsSwiping(true);
        if (e.cancelable && e.preventDefault) e.preventDefault();
      }
      if (isSwipingRef.current) {
        if (e.cancelable && e.preventDefault) e.preventDefault();
        const clampedX = Math.max(0, deltaX);
        currentDragXRef.current = clampedX;
        setDragX(clampedX);
      }
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    handleRelease();
  }, [handleRelease]);

  const onTouchCancel = useCallback(() => {
    setDragX(0);
    setIsSwiping(false);
    isTrackingRef.current = false;
    isSwipingRef.current = false;
  }, []);

  // Mouse event handlers for desktop testing
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0 || !enabled || isExiting) return;
    if (!startTracking(e.clientX, e.clientY)) return;

    const onWindowMouseMove = (moveEvent) => {
      if (!isTrackingRef.current || isLockedOutRef.current || isExiting) return;

      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaY = moveEvent.clientY - startYRef.current;

      if (!isSwipingRef.current) {
        if (deltaX < -8) {
          isLockedOutRef.current = true;
          isTrackingRef.current = false;
          return;
        }

        if (deltaX > 6 && deltaX > Math.abs(deltaY) * 0.75) {
          isSwipingRef.current = true;
          setIsSwiping(true);
          const clampedX = Math.max(0, deltaX);
          currentDragXRef.current = clampedX;
          setDragX(clampedX);
        } else if (Math.abs(deltaY) > 16 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
          isLockedOutRef.current = true;
          isTrackingRef.current = false;
        }
        return;
      }

      if (isSwipingRef.current) {
        const clampedX = Math.max(0, deltaX);
        currentDragXRef.current = clampedX;
        setDragX(clampedX);
      }
    };

    const onWindowMouseUp = () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
      handleRelease();
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
  }, [enabled, isExiting, startTracking, handleRelease]);

  // Derived gesture states
  const effectiveDragX = enabled ? dragX : 0;
  const effectiveIsSwiping = enabled ? isSwiping : false;
  const effectiveIsExiting = enabled ? isExiting : false;

  // Dynamic transform and transition styles for the sliding page
  const containerStyle = {
    transform: effectiveIsExiting 
      ? 'translateX(100%)' 
      : effectiveDragX > 0 
        ? `translateX(${effectiveDragX}px)` 
        : undefined,
    transition: effectiveIsSwiping 
      ? 'none' 
      : effectiveIsExiting 
        ? 'transform 0.18s cubic-bezier(0.32, 0.72, 0, 1)' 
        : effectiveDragX === 0 
          ? 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1)' 
          : undefined,
    boxShadow: (effectiveDragX > 0 || effectiveIsExiting) 
      ? '-12px 0 28px rgba(0, 0, 0, 0.18)' 
      : undefined,
    willChange: effectiveIsSwiping ? 'transform' : undefined,
    touchAction: 'pan-y',
    userSelect: effectiveIsSwiping ? 'none' : undefined,
    WebkitUserSelect: effectiveIsSwiping ? 'none' : undefined
  };

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
  const dragProgress = Math.min(1, effectiveDragX / Math.min(threshold, screenWidth * 0.22));
  const backdropOpacity = effectiveDragX > 0 ? Math.max(0, 1 - (effectiveDragX / (screenWidth * 0.75))) : 1;

  return {
    ref: containerRef,
    containerRef,
    isSwiping: effectiveIsSwiping,
    dragX: effectiveDragX,
    dragProgress,
    isExiting: effectiveIsExiting,
    containerStyle,
    backdropOpacity,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
      onMouseDown,
    }
  };
}

export default useSwipeBack;
