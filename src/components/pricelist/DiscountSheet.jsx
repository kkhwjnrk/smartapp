import React, { useState, useRef } from 'react';
import { calculateDiscount } from '../../utils/formatters';

function DiscountSheet({ item, onClose }) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);

  if (!item) return null;

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStartY.current = e.clientY;
    currentDragY.current = 0;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) { }
  };

  const handlePointerMove = (e) => {
    if (!dragStartY.current) return;
    const deltaY = e.clientY - dragStartY.current;
    if (deltaY > 0) {
      currentDragY.current = deltaY;
      setDragY(deltaY);
    } else {
      currentDragY.current = 0;
      setDragY(deltaY * 0.15); // Hambatan jika ditarik ke atas
    }
  };

  const handlePointerUp = (e) => {
    if (!dragStartY.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) { }

    setIsDragging(false);
    const finalDelta = currentDragY.current;

    // Jika di-drag ke bawah > 60px atau di-tap tanpa geser -> Tutup modal
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
        className="relative bg-white w-full max-w-md rounded-t-[2.5rem] p-7 pt-4 shadow-2xl animate-in slide-in-from-bottom-[100%] duration-300"
      >

        {/* Garis Handle Interaktif Drag-down to Dismiss */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full flex justify-center items-center pt-1 pb-4 -mt-2 cursor-grab active:cursor-grabbing touch-none select-none group"
          aria-label="Tarik ke bawah untuk menutup"
        >
          <div className={`w-14 h-1.5 rounded-full transition-all duration-150 ${isDragging ? 'bg-zinc-600 w-16 scale-y-125' : 'bg-zinc-300 group-hover:bg-zinc-400'
            }`}></div>
        </div>

        {/* Header Rincian Barang: PN di Kiri, Kategori di Pojok Kanan Atas */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1 pr-3">
            <div className="mb-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="inline-block text-[14px] font-bold text-[#EA580C] font-mono tracking-tight bg-orange-50/90 px-2.5 py-0.5 rounded-lg border border-orange-200/70">
                PN: {item.pn}
              </span>
              {item.subCategory && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
                  {item.subCategory}
                </span>
              )}
            </div>
            <div className="text-[17px] font-bold text-zinc-900 leading-snug">{item.description}</div>
          </div>
          <div className="shrink-0 pt-0.5">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
              {item.category || 'Lainnya'}
            </span>
          </div>
        </div>

        {/* Harga HET & Qty per Dus */}
        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 mb-5 flex justify-between items-center">
          <div>
            <span className="block text-[12px] font-medium text-zinc-500">Harga (HET)</span>
            <span className="text-[20px] font-bold text-zinc-900">
              {item.het ? `Rp ${item.het.toLocaleString('id-ID')}` : (item.price === "0" || !item.price ? "-" : `Rp ${item.price}`)}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[12px] font-medium text-zinc-500">Isi per Dus</span>
            <span className="text-[15px] font-semibold text-zinc-800">{item.qty || 1} PCS</span>
          </div>
        </div>

        {/* Skema Diskon Grosir */}
        <div className="space-y-1 pb-2">
          <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Skema Diskon Grosir Daytona</h4>

          <div className="flex justify-between items-center py-2.5 px-1 border-b border-zinc-100">
            <span className="text-[15px] font-medium text-zinc-700">Diskon 24%</span>
            <span className="text-[16px] font-semibold text-zinc-900">
              Rp {item.d24 ? item.d24.toLocaleString('id-ID') : calculateDiscount(item.price, 24)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5 px-1 border-b border-zinc-100">
            <span className="text-[15px] font-medium text-zinc-700">Diskon 27%</span>
            <span className="text-[16px] font-semibold text-zinc-900">
              Rp {item.d27 ? item.d27.toLocaleString('id-ID') : calculateDiscount(item.price, 27)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5 px-1">
            <span className="text-[15px] font-medium text-zinc-700">Diskon 29%</span>
            <span className="text-[16px] font-semibold text-zinc-900">
              Rp {item.d29 ? item.d29.toLocaleString('id-ID') : calculateDiscount(item.price, 29)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DiscountSheet;
