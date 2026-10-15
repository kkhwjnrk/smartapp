import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for iOS-style interactive edge swipe-back gesture.
 * Slides the page rightward when dragging from the left edge, and dismisses on release.
 *
 * @param {Object} options
 * @param {Function} options.onBack - Callback triggered when back swipe completes
 * @param {number} [options.edgeWidth=60] - Max px from left edge where swipe can start
 * @param {number} [options.threshold=90] - Distance in px needed to confirm dismissal
 * @param {boolean} [options.enabled=true] - Whether gesture tracking is enabled
 */
export function useSwipeBack({
  onBack,
  edgeWidth = 60,
  threshold = 90,
  enabled = true
}) {
  const [dragX, setDragX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isTrackingRef = useRef(false);
  const isSwipingRef = useRef(false);
  const isLockedOutRef = useRef(false);
  const currentDragXRef = useRef(0);

  // Reset all states when unmounting or toggling enabled
  useEffect(() => {
    if (!enabled) {
      setDragX(0);
      setIsSwiping(false);
      setIsExiting(false);
      isTrackingRef.current = false;
      isSwipingRef.current = false;
      isLockedOutRef.current = false;
      currentDragXRef.current = 0;
    }
  }, [enabled]);

  const handleStart = useCallback((clientX, clientY) => {
    if (!enabled || isExiting) return;

    // Must start within edge zone (default 60px from left)
    if (clientX > edgeWidth) {
      isTrackingRef.current = false;
      return;
    }

    startXRef.current = clientX;
    startYRef.current = clientY;
    startTimeRef.current = Date.now();
    currentDragXRef.current = 0;
    isTrackingRef.current = true;
    isSwipingRef.current = false;
    isLockedOutRef.current = false;
  }, [edgeWidth, enabled, isExiting]);

  const handleMove = useCallback((clientX, clientY, e) => {
    if (!isTrackingRef.current || isLockedOutRef.current || isExiting) return;

    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;

    // Gesture direction disambiguation
    if (!isSwipingRef.current) {
      // If predominantly vertical scroll: cancel tracking immediately
      if (Math.abs(deltaY) > 7 && Math.abs(deltaY) >= Math.abs(deltaX)) {
        isLockedOutRef.current = true;
        isTrackingRef.current = false;
        return;
      }

      // If moved rightward horizontally by > 6px: activate swipe back
      if (deltaX > 6 && deltaX > Math.abs(deltaY) * 1.2) {
        isSwipingRef.current = true;
        setIsSwiping(true);
      } else {
        return;
      }
    }

    // Actively swiping rightward
    if (isSwipingRef.current) {
      if (e && e.cancelable && e.preventDefault) {
        e.preventDefault();
      }
      const clampedX = Math.max(0, deltaX);
      currentDragXRef.current = clampedX;
      setDragX(clampedX);
    }
  }, [isExiting]);

  const handleEnd = useCallback((clientX) => {
    if (!isTrackingRef.current && !isSwipingRef.current) return;

    const wasSwiping = isSwipingRef.current;
    const finalDragX = currentDragXRef.current;
    const elapsed = Date.now() - startTimeRef.current;
    const velocity = elapsed > 0 ? finalDragX / elapsed : 0; // px per ms

    // Reset tracking flags
    isTrackingRef.current = false;
    isSwipingRef.current = false;
    isLockedOutRef.current = false;

    if (wasSwiping) {
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
      const dynamicThreshold = Math.min(threshold, screenWidth * 0.3);

      // Trigger back if dragged past threshold or flicked quickly to right
      if (finalDragX > dynamicThreshold || (velocity > 0.35 && finalDragX > 35)) {
        setIsExiting(true);
        setTimeout(() => {
          onBack?.();
        }, 220);
      } else {
        // Snap back with spring
        setDragX(0);
        setIsSwiping(false);
      }
    }
  }, [threshold, onBack]);

  // Touch event handlers for mobile devices (iOS Safari, Android Chrome, PWA)
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handleStart]);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY, e);
    }
  }, [handleMove]);

  const onTouchEnd = useCallback((e) => {
    const clientX = e.changedTouches?.[0]?.clientX ?? currentDragXRef.current;
    handleEnd(clientX);
  }, [handleEnd]);

  const onTouchCancel = useCallback(() => {
    setDragX(0);
    setIsSwiping(false);
    isTrackingRef.current = false;
    isSwipingRef.current = false;
    isLockedOutRef.current = false;
    currentDragXRef.current = 0;
  }, []);

  // Mouse event handlers for desktop testing
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0 || !enabled || isExiting) return;
    if (e.clientX > edgeWidth) return;

    handleStart(e.clientX, e.clientY);

    const onWindowMouseMove = (moveEvent) => {
      handleMove(moveEvent.clientX, moveEvent.clientY, moveEvent);
    };

    const onWindowMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
      handleEnd(upEvent.clientX);
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
  }, [edgeWidth, enabled, isExiting, handleStart, handleMove, handleEnd]);

  // Dynamic transform and transition styles for the sliding page
  const containerStyle = {
    transform: isExiting 
      ? 'translateX(100%)' 
      : dragX > 0 
        ? `translateX(${dragX}px)` 
        : undefined,
    transition: isSwiping 
      ? 'none' 
      : isExiting 
        ? 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)' 
        : dragX === 0 
          ? 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)' 
          : undefined,
    boxShadow: (dragX > 0 || isExiting) 
      ? '-12px 0 28px rgba(0, 0, 0, 0.16)' 
      : undefined,
    willChange: isSwiping ? 'transform' : undefined,
  };

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
  const dragProgress = Math.min(1, dragX / Math.min(threshold, screenWidth * 0.3));
  const backdropOpacity = dragX > 0 ? Math.max(0.05, 1 - (dragX / screenWidth)) : 1;

  return {
    isSwiping,
    dragX,
    dragProgress,
    isExiting,
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
