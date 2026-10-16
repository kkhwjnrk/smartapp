import React, { useState, useMemo, useRef } from 'react';

function RouteSheet({ 
  isOpen, 
  selectedRoute, 
  onSelectRoute, 
  routesList = [], 
  routeCounts = {}, 
  onClose 
}) {
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);

  const filteredRoutes = useMemo(() => {
    if (!routeSearchQuery.trim()) return routesList;
    const lower = routeSearchQuery.toLowerCase().trim();
    return routesList.filter(route => route.toLowerCase().includes(lower));
  }, [routesList, routeSearchQuery]);

  if (!isOpen) return null;

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStartY.current = e.clientY;
    currentDragY.current = 0;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e) => {
    if (!dragStartY.current) return;
    const deltaY = e.clientY - dragStartY.current;
    if (deltaY > 0) {
      currentDragY.current = deltaY;
      setDragY(deltaY);
    } else {
      currentDragY.current = 0;
      setDragY(deltaY * 0.15);
    }
  };

  const handlePointerUp = (e) => {
    if (!dragStartY.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    setIsDragging(false);
    const finalDelta = currentDragY.current;

    if (finalDelta > 60 || finalDelta === 0) {
      onClose();
    }

    setDragY(0);
    dragStartY.current = 0;
    currentDragY.current = 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" 
        style={{
          opacity: dragY > 0 ? Math.max(0.1, 1 - dragY / 250) : undefined
        }}
        onClick={onClose}
      ></div>
      <div 
        style={{
          transform: dragY !== 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="relative bg-white w-full max-w-md rounded-t-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-[100%] duration-300 max-h-[82vh] flex flex-col"
      >
        {/* Garis Handle Interaktif Drag-down to Dismiss */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full flex justify-center items-center pt-1 pb-3 -mt-4 mb-2 cursor-grab active:cursor-grabbing touch-none select-none group"
          aria-label="Tarik ke bawah untuk menutup"
        >
          <div className={`w-14 h-1.5 rounded-full transition-all duration-150 ${
            isDragging ? 'bg-zinc-600 w-16 scale-y-125' : 'bg-zinc-300 group-hover:bg-zinc-400'
          }`}></div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-3 shrink-0">
          <div>
            <h3 className="text-[18px] font-bold text-zinc-900">Pilih Kode Rute</h3>
            <p className="text-[13px] text-zinc-500">Filter toko berdasarkan rute kanvas sales</p>
          </div>
          {selectedRoute !== 'Semua' && (
            <button
              type="button"
              onClick={() => {
                onSelectRoute('Semua');
                onClose();
              }}
              className="text-[13px] font-semibold text-zinc-600 hover:text-zinc-900 underline"
            >
              Tampilkan Semua
            </button>
          )}
        </div>

        {/* Mini Search Rute jika rute ada lebih dari 4 */}
        {routesList.length > 4 && (
          <div className="relative mb-3 shrink-0">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari kode atau nama rute..."
              className="w-full pl-10 pr-9 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] focus:outline-none focus:border-zinc-400 focus:bg-white transition-all font-medium placeholder:font-normal"
              value={routeSearchQuery}
              onChange={e => setRouteSearchQuery(e.target.value)}
            />
            {routeSearchQuery && (
              <button
                type="button"
                onClick={() => setRouteSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Route List */}
        <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 -mr-1">
          {filteredRoutes.map(route => {
            const count = routeCounts[route] || 0;
            const isSelected = selectedRoute === route;
            return (
              <button
                key={route}
                type="button"
                onClick={() => {
                  onSelectRoute(route);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-zinc-900 text-white font-semibold shadow-sm'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-medium'
                }`}
              >
                <span className="text-[14px] truncate pr-2">
                  {route === 'Semua' ? 'Semua Rute' : route}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white border border-zinc-200 text-zinc-600'
                  }`}>
                    {count} toko
                  </span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RouteSheet;
