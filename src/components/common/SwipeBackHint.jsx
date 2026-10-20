import React from 'react';

/**
 * Modern floating visual indicator for PWA Swipe-Back / Slide-Kiri gesture.
 * Appears dynamically on either the left or right edge depending on gesture direction.
 *
 * @param {Object} props
 * @param {number} props.dragX - Absolute drag displacement in px
 * @param {number} props.dragProgress - Normalized progress from 0 to 1
 * @param {'left'|'right'|null} props.dragDirection - Active swipe direction
 * @param {'orange'|'emerald'|'zinc'} [props.accent='orange'] - Color theme
 */
export function SwipeBackHint({
  dragX = 0,
  dragProgress = 0,
  dragDirection = 'right',
  accent = 'orange'
}) {
  if (dragX <= 10) return null;

  const isLeftSwipe = dragDirection === 'left';
  const isReady = dragProgress >= 1;

  const accentBg = accent === 'emerald'
    ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
    : accent === 'zinc'
      ? 'bg-zinc-900 text-white border-zinc-800 shadow-zinc-900/30'
      : 'bg-[#EA580C] text-white border-orange-500 shadow-orange-500/30';

  return (
    <div
      className={`fixed ${isLeftSwipe ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 z-60 pointer-events-none flex items-center gap-1.5 transition-all duration-100 select-none`}
      style={{
        opacity: Math.min(1, dragX / 28),
        transform: `translateY(-50%) scale(${0.82 + dragProgress * 0.22})`
      }}
    >
      <div
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full shadow-xl border backdrop-blur-md transition-colors ${
          isReady
            ? accentBg
            : 'bg-white/95 text-zinc-700 border-zinc-200/90 shadow-zinc-900/15'
        }`}
      >
        {/* Left Arrow Icon if swiping right */}
        {!isLeftSwipe && (
          <svg className="w-4 h-4 stroke-[2.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        )}

        <span className="text-[11.5px] font-black tracking-tight uppercase">
          {isReady ? 'Lepas' : 'Kembali'}
        </span>

        {/* Right Arrow Icon if swiping left */}
        {isLeftSwipe && (
          <svg className="w-4 h-4 stroke-[2.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );
}

export default SwipeBackHint;
