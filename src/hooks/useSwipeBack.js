import { useState, useRef, useCallback, useEffect, useId } from 'react';

/**
 * Global stack of active swipe-back instances.
 * Ensures that when multiple full pages or modals are mounted simultaneously,
 * ONLY the topmost (frontmost) full page receives and responds to swipe-back gestures.
 */
let activeSwipeStack = [];

/**
 * Custom hook for native-feeling edge swipe-back gesture (PWA / iOS / Android style).
 * Slides full pages and views rightward when swiping from the left edge, and dismisses on release.
 * Strictly left-to-right swipe only. Zero visual indicators.
 *
 * @param {Object} options
 * @param {Function} options.onBack - Callback triggered when back swipe completes
 * @param {number} [options.edgeWidth=120] - Max px from left edge where swipe can start
 * @param {number} [options.threshold=55] - Distance in px needed to confirm dismissal
 * @param {boolean} [options.enabled=true] - Whether gesture tracking is enabled
 */
export function useSwipeBack({
  onBack,
  edgeWidth = 120,
  threshold = 55,
  enabled = true
}) {
  const [dragX, setDragX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const instanceId = useId();
  const containerRef = useRef(null);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isTrackingRef = useRef(false);
  const isSwipingRef = useRef(false);
  const isLockedOutRef = useRef(false);
  const currentDragXRef = useRef(0);

  // Manage instance registration in global stack
  useEffect(() => {
    if (enabled && !isExiting) {
      activeSwipeStack = activeSwipeStack.filter(id => id !== instanceId);
      activeSwipeStack.push(instanceId);
    } else {
      activeSwipeStack = activeSwipeStack.filter(id => id !== instanceId);
      isTrackingRef.current = false;
      isSwipingRef.current = false;
      isLockedOutRef.current = false;
      currentDragXRef.current = 0;
    }

    return () => {
      activeSwipeStack = activeSwipeStack.filter(id => id !== instanceId);
    };
  }, [enabled, isExiting, instanceId]);

  // Check if this instance is the frontmost active one
  const isTopmost = useCallback(() => {
    if (activeSwipeStack.length === 0) return false;
    return activeSwipeStack[activeSwipeStack.length - 1] === instanceId;
  }, [instanceId]);

  // Check if touch or mouse coordinate is within the generous left edge zone
  const checkIsWithinEdge = useCallback((clientX) => {
    // Determine effective edge width: at least 120px or 35% of viewport width
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
    const effectiveEdgeWidth = Math.max(edgeWidth, Math.min(150, screenWidth * 0.35));

    // 1. Direct screen left edge (0 to effectiveEdgeWidth)
    if (clientX <= effectiveEdgeWidth) return true;

    // 2. Relative to container's left edge (for centered layouts on tablets/desktop)
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.left + effectiveEdgeWidth) {
        return true;
      }
    }

    return false;
  }, [edgeWidth]);

  // Handle release of gesture (touchend / mouseup)
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
      const dynamicThreshold = Math.min(threshold, 55, screenWidth * 0.18);

      // Trigger back if dragged past threshold or flicked quickly to right
      if (finalDragX > dynamicThreshold || (velocity > 0.16 && finalDragX > 20)) {
        setIsExiting(true);
        setTimeout(() => {
          onBackRef.current?.();
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
  }, [threshold]);

  // Start gesture tracking
  const startTracking = useCallback((clientX, clientY, target) => {
    if (!enabled || isExiting) return false;
    if (!isTopmost()) return false;

    // If target is provided, verify it belongs to this instance's DOM tree
    if (target && containerRef.current) {
      const wrapper = containerRef.current.parentElement;
      const isInContainer = containerRef.current.contains(target);
      const isInWrapper = wrapper && wrapper.contains(target);
      if (!isInContainer && !isInWrapper) {
        return false;
      }
    }

    if (!checkIsWithinEdge(clientX)) return false;

    startXRef.current = clientX;
    startYRef.current = clientY;
    startTimeRef.current = Date.now();
    currentDragXRef.current = 0;
    isTrackingRef.current = true;
    isSwipingRef.current = false;
    isLockedOutRef.current = false;

    return true;
  }, [enabled, isExiting, isTopmost, checkIsWithinEdge]);

  // Capture-phase native touch listeners on window for instant responsiveness without browser interference
  useEffect(() => {
    if (!enabled || isExiting) return;

    const onNativeTouchStart = (e) => {
      if (!enabled || isExiting) return;
      if (!e.touches || e.touches.length !== 1) return;
      if (!isTopmost()) return;

      const touch = e.touches[0];
      startTracking(touch.clientX, touch.clientY, e.target);
    };

    const onNativeTouchMove = (e) => {
      if (!isTrackingRef.current || isLockedOutRef.current || isExiting) return;
      if (!e.touches || e.touches.length !== 1) return;
      if (!isTopmost()) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;
      const absY = Math.abs(deltaY);

      // Gesture direction disambiguation
      if (!isSwipingRef.current) {
        // Disallow leftward swipe: only left-to-right swipe is permitted
        if (deltaX < -5) {
          isLockedOutRef.current = true;
          isTrackingRef.current = false;
          return;
        }

        // Horizontal swipe detected early: rightward movement dominates
        if (deltaX > 2 && deltaX >= absY * 0.5) {
          isSwipingRef.current = true;
          setIsSwiping(true);
          if (e.cancelable) e.preventDefault();
          const clampedX = Math.max(0, deltaX);
          currentDragXRef.current = clampedX;
          setDragX(clampedX);
          return;
        }

        // Vertical scroll dominant: release gesture to allow natural scrolling
        if (absY > 8 && absY > deltaX) {
          isLockedOutRef.current = true;
          isTrackingRef.current = false;
          return;
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
      if (!isTopmost()) return;
      if (isTrackingRef.current || isSwipingRef.current) {
        handleRelease();
      }
    };

    const onNativeTouchCancel = () => {
      if (!isTopmost()) return;
      // If user was actively swiping and Android system edge or browser dispatched touchcancel:
      // complete dismissal if dragged past 30px so it feels responsive rather than aborting.
      if (isSwipingRef.current && currentDragXRef.current > 30) {
        setIsExiting(true);
        setTimeout(() => {
          onBackRef.current?.();
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

    // Register with CAPTURE phase: intercepts event at window root BEFORE any child scroll container can consume it
    window.addEventListener('touchstart', onNativeTouchStart, { capture: true, passive: true });
    window.addEventListener('touchmove', onNativeTouchMove, { capture: true, passive: false });
    window.addEventListener('touchend', onNativeTouchEnd, { capture: true, passive: true });
    window.addEventListener('touchcancel', onNativeTouchCancel, { capture: true, passive: true });

    return () => {
      window.removeEventListener('touchstart', onNativeTouchStart, { capture: true });
      window.removeEventListener('touchmove', onNativeTouchMove, { capture: true });
      window.removeEventListener('touchend', onNativeTouchEnd, { capture: true });
      window.removeEventListener('touchcancel', onNativeTouchCancel, { capture: true });
    };
  }, [enabled, isExiting, handleRelease, isTopmost, startTracking]);

  // Mouse event handlers for desktop testing (click & drag from left edge of modal)
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0 || !enabled || isExiting) return;
    if (!isTopmost()) return;

    // Do not hijack input fields or buttons on mouse click
    if (e.target && e.target.closest('input, textarea, select')) return;

    if (!startTracking(e.clientX, e.clientY, e.target)) return;

    const onWindowMouseMove = (moveEvent) => {
      if (!isTrackingRef.current || isLockedOutRef.current || isExiting) return;

      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaY = moveEvent.clientY - startYRef.current;

      if (!isSwipingRef.current) {
        if (deltaX < -5) {
          isLockedOutRef.current = true;
          isTrackingRef.current = false;
          return;
        }

        if (deltaX > 4 && deltaX > Math.abs(deltaY) * 0.5) {
          isSwipingRef.current = true;
          setIsSwiping(true);
          const clampedX = Math.max(0, deltaX);
          currentDragXRef.current = clampedX;
          setDragX(clampedX);
        } else if (Math.abs(deltaY) > 10 && Math.abs(deltaY) > deltaX) {
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
  }, [enabled, isExiting, isTopmost, startTracking, handleRelease]);

  // Derived gesture states (safely reset when disabled)
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
  const dragProgress = Math.min(1, effectiveDragX / Math.min(threshold, 55, screenWidth * 0.18));
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
      onMouseDown,
    }
  };
}

export default useSwipeBack;
