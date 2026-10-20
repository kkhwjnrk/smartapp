import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for native-feeling PWA edge swipe-back & horizontal slide-back gesture.
 * Supports:
 * - Slide to right (from left edge or screen: deltaX > 0)
 * - Slide to left ("slide kiri" / Android right-edge back: deltaX < 0)
 * - Native non-passive touch listeners to prevent browser cancellation
 * - High-precision velocity & distance threshold evaluation
 *
 * @param {Object} options
 * @param {Function} options.onBack - Callback triggered when back swipe completes
 * @param {number} [options.edgeWidth=100] - Margin from edges where edge-specific touches start
 * @param {number} [options.threshold=75] - Distance in px needed to confirm dismissal
 * @param {boolean} [options.enabled=true] - Whether gesture tracking is enabled
 * @param {'both'|'right'|'left'} [options.direction='both'] - Allowed swipe directions ('both', 'right', 'left')
 * @param {boolean} [options.allowAnywhere=true] - Allow horizontal swipe anywhere on screen (not strictly edges)
 */
export function useSwipeBack({
  onBack,
  edgeWidth = 100,
  threshold = 75,
  enabled = true,
  direction = 'both',
  allowAnywhere = true
}) {
  const [dragOffset, setDragOffset] = useState(0); // Signed: >0 (right), <0 (left)
  const [isSwiping, setIsSwiping] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState('right'); // 'right' | 'left'

  const containerRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isTrackingRef = useRef(false);
  const isSwipingRef = useRef(false);
  const isLockedOutRef = useRef(false);
  const currentDragOffsetRef = useRef(0);
  const swipeDirectionRef = useRef(null); // 'right' | 'left' | null

  // Reset tracking refs when disabled or unmounted
  useEffect(() => {
    if (!enabled) {
      isTrackingRef.current = false;
      isSwipingRef.current = false;
      isLockedOutRef.current = false;
      currentDragOffsetRef.current = 0;
      swipeDirectionRef.current = null;
    }
  }, [enabled]);

  const getEffectiveEdgeWidth = useCallback(() => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
    return Math.max(edgeWidth, Math.min(140, screenWidth * 0.35));
  }, [edgeWidth]);

  const handleStart = useCallback((clientX, clientY, target) => {
    if (!enabled || isExiting) return;

    // Do not interfere if user is interacting with an input or textarea
    // unless touching near the outer edges (within 35px)
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
      const isNearEdge = clientX <= 35 || clientX >= screenWidth - 35;
      if (!isNearEdge) {
        isTrackingRef.current = false;
        return;
      }
    }

    let effectiveLeft = 0;
    let containerWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      effectiveLeft = rect.left;
      containerWidth = rect.width || containerWidth;
    }

    const touchXRelativeToLeft = clientX - effectiveLeft;
    const touchXRelativeToRight = containerWidth - touchXRelativeToLeft;
    const maxEdge = getEffectiveEdgeWidth();

    // If edge-only restriction is requested, verify touch starts near left or right edge
    if (!allowAnywhere) {
      const inLeftZone = touchXRelativeToLeft >= 0 && touchXRelativeToLeft <= maxEdge;
      const inRightZone = touchXRelativeToRight >= 0 && touchXRelativeToRight <= maxEdge;
      if (!inLeftZone && !inRightZone) {
        isTrackingRef.current = false;
        return;
      }
    }

    startXRef.current = clientX;
    startYRef.current = clientY;
    startTimeRef.current = Date.now();
    currentDragOffsetRef.current = 0;
    swipeDirectionRef.current = null;
    isTrackingRef.current = true;
    isSwipingRef.current = false;
    isLockedOutRef.current = false;
  }, [enabled, isExiting, allowAnywhere, getEffectiveEdgeWidth]);

  const handleMove = useCallback((clientX, clientY, e) => {
    if (!enabled || !isTrackingRef.current || isLockedOutRef.current || isExiting) return;

    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Initial gesture disambiguation
    if (!isSwipingRef.current) {
      // Check if user has moved thumb enough to detect intent
      if (absX >= 7 || absY >= 10) {
        // Horizontal displacement dominant: activate swipe-to-back
        if (absX > 6 && absX > absY * 0.6) {
          if (deltaX > 0 && (direction === 'both' || direction === 'right')) {
            isSwipingRef.current = true;
            swipeDirectionRef.current = 'right';
            setIsSwiping(true);
          } else if (deltaX < 0 && (direction === 'both' || direction === 'left')) {
            isSwipingRef.current = true;
            swipeDirectionRef.current = 'left';
            setIsSwiping(true);
          } else {
            // Direction not allowed
            isLockedOutRef.current = true;
            isTrackingRef.current = false;
            return;
          }
        } else if (absY > 12 && absY > absX) {
          // Vertical scrolling dominant: lockout gesture to allow smooth native scroll
          isLockedOutRef.current = true;
          isTrackingRef.current = false;
          return;
        }
      }
    }

    // Actively swiping horizontally
    if (isSwipingRef.current) {
      if (e && e.cancelable && e.preventDefault) {
        e.preventDefault();
      }

      let activeOffset = deltaX;
      if (swipeDirectionRef.current === 'right') {
        activeOffset = Math.max(0, deltaX);
      } else if (swipeDirectionRef.current === 'left') {
        activeOffset = Math.min(0, deltaX);
      }

      currentDragOffsetRef.current = activeOffset;
      setDragOffset(activeOffset);
    }
  }, [enabled, isExiting, direction]);

  const handleEnd = useCallback((finalClientX) => {
    if (!isTrackingRef.current && !isSwipingRef.current) return;

    const wasSwiping = isSwipingRef.current;
    let finalOffset = currentDragOffsetRef.current;
    if (finalClientX !== undefined && wasSwiping) {
      const calculated = finalClientX - startXRef.current;
      if (swipeDirectionRef.current === 'right') {
        finalOffset = Math.max(0, calculated);
      } else if (swipeDirectionRef.current === 'left') {
        finalOffset = Math.min(0, calculated);
      }
    }

    const elapsed = Date.now() - startTimeRef.current;
    const absOffset = Math.abs(finalOffset);
    const velocity = elapsed > 0 ? absOffset / elapsed : 0; // px per ms

    // Reset tracking flags
    isTrackingRef.current = false;
    isSwipingRef.current = false;
    isLockedOutRef.current = false;

    if (wasSwiping) {
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
      const dynamicThreshold = Math.min(threshold, screenWidth * 0.22);

      // Trigger back if dragged past threshold or flicked quickly
      const shouldDismiss = absOffset > dynamicThreshold || (velocity > 0.28 && absOffset > 25);

      if (shouldDismiss) {
        const exitDir = finalOffset < 0 ? 'left' : 'right';
        setExitDirection(exitDir);
        setIsExiting(true);
        setTimeout(() => {
          onBack?.();
        }, 220);
      } else {
        // Snap back to normal with smooth spring animation
        setDragOffset(0);
        setIsSwiping(false);
        swipeDirectionRef.current = null;
      }
    }
  }, [threshold, onBack]);

  const handleCancel = useCallback(() => {
    // If user dragged substantially before cancel, treat as end instead of abrupt abort
    if (isSwipingRef.current && Math.abs(currentDragOffsetRef.current) >= threshold) {
      handleEnd();
      return;
    }
    setDragOffset(0);
    setIsSwiping(false);
    isTrackingRef.current = false;
    isSwipingRef.current = false;
    isLockedOutRef.current = false;
    currentDragOffsetRef.current = 0;
    swipeDirectionRef.current = null;
  }, [handleEnd, threshold]);

  // Attach native non-passive DOM listeners directly to containerRef element
  // This guarantees that e.preventDefault() works on mobile Chrome/Safari and prevents touchcancel
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const onNativeTouchStart = (e) => {
      if (e.touches.length === 1) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
      }
    };

    const onNativeTouchMove = (e) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY, e);
      }
    };

    const onNativeTouchEnd = (e) => {
      const clientX = e.changedTouches?.[0]?.clientX ?? currentDragOffsetRef.current;
      handleEnd(clientX);
    };

    const onNativeTouchCancel = () => {
      handleCancel();
    };

    el.addEventListener('touchstart', onNativeTouchStart, { passive: true });
    el.addEventListener('touchmove', onNativeTouchMove, { passive: false });
    el.addEventListener('touchend', onNativeTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onNativeTouchCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onNativeTouchStart);
      el.removeEventListener('touchmove', onNativeTouchMove);
      el.removeEventListener('touchend', onNativeTouchEnd);
      el.removeEventListener('touchcancel', onNativeTouchCancel);
    };
  }, [enabled, handleStart, handleMove, handleEnd, handleCancel]);

  // Mouse event handlers for desktop testing & pair programming
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0 || !enabled || isExiting) return;

    handleStart(e.clientX, e.clientY, e.target);

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
  }, [enabled, isExiting, handleStart, handleMove, handleEnd]);

  // Fallback React touch handlers (for JSX spreading)
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }
  }, [handleStart]);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY, e);
    }
  }, [handleMove]);

  const onTouchEnd = useCallback((e) => {
    const clientX = e.changedTouches?.[0]?.clientX ?? currentDragOffsetRef.current;
    handleEnd(clientX);
  }, [handleEnd]);

  // Derived gesture states
  const effectiveDragOffset = enabled ? dragOffset : 0;
  const effectiveIsSwiping = enabled ? isSwiping : false;
  const effectiveIsExiting = enabled ? isExiting : false;
  const absDrag = Math.abs(effectiveDragOffset);

  // Direction indicator
  const dragDirection = effectiveDragOffset > 0 ? 'right' : effectiveDragOffset < 0 ? 'left' : null;

  // Transform styles
  const getTransform = () => {
    if (effectiveIsExiting) {
      return exitDirection === 'left' ? 'translateX(-100%)' : 'translateX(100%)';
    }
    if (effectiveDragOffset !== 0) {
      return `translateX(${effectiveDragOffset}px)`;
    }
    return undefined;
  };

  const containerStyle = {
    transform: getTransform(),
    transition: effectiveIsSwiping
      ? 'none'
      : effectiveIsExiting
        ? 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)'
        : effectiveDragOffset === 0
          ? 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)'
          : undefined,
    boxShadow: (absDrag > 0 || effectiveIsExiting)
      ? exitDirection === 'left' || effectiveDragOffset < 0
        ? '12px 0 32px rgba(0, 0, 0, 0.22)'
        : '-12px 0 32px rgba(0, 0, 0, 0.22)'
      : undefined,
    willChange: effectiveIsSwiping ? 'transform' : undefined,
    touchAction: effectiveIsSwiping ? 'none' : 'pan-y'
  };

  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
  const dynamicThreshold = Math.min(threshold, screenWidth * 0.22);
  const dragProgress = Math.min(1, absDrag / dynamicThreshold);
  const backdropOpacity = absDrag > 0 ? Math.max(0.05, 1 - (absDrag / screenWidth)) : 1;

  return {
    containerRef,
    isSwiping: effectiveIsSwiping,
    dragX: absDrag, // Always positive magnitude for backwards compatibility with dragX > 10
    dragOffset: effectiveDragOffset, // Signed displacement: >0 (right), <0 (left)
    dragDirection,
    dragProgress,
    isExiting: effectiveIsExiting,
    containerStyle,
    backdropOpacity,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: handleCancel,
      onMouseDown,
    }
  };
}

export default useSwipeBack;
