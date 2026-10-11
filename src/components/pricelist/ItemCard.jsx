import React from 'react';

function ItemCard({ item, isEditMode, onOpenDiscount, onOpenEdit }) {
  return (
    <div 
      onClick={() => !isEditMode && onOpenDiscount(item)}
      className={`bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm transition-all duration-200 flex flex-col gap-2.5 ${
        !isEditMode ? 'cursor-pointer hover:shadow-md hover:border-zinc-300 active:scale-[0.98]' : ''
      }`}
    >
      {/* Bagian Atas Card: PN di Kiri, Kategori di Pojok Kanan Atas */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          
          {/* PN Berwarna Oranye Daytona khas racing, tegas & jelas */}
          <div className="mb-1.5">
            <span className="inline-block text-[14px] font-bold text-[#EA580C] font-mono tracking-tight bg-orange-50/90 px-2.5 py-0.5 rounded-lg border border-orange-200/70 shadow-[0_1px_2px_rgba(234,88,12,0.06)]">
              PN: {item.pn}
            </span>
          </div>

          {/* Nama / Deskripsi Barang */}
          <h3 className="font-medium text-[15px] text-zinc-900 leading-snug break-words pr-1">
            {item.description}
          </h3>
        </div>

        {/* Pojok Kanan Atas: Kategori Badge & Tombol Edit */}
        <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200/60 max-w-[140px] truncate text-right">
            {item.category || 'Lainnya'}
          </span>
          {isEditMode && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onOpenEdit(item); 
              }}
              className="text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors"
              aria-label="Edit Barang"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Bagian Bawah Card: Isi per Dus/Karton & Harga HET */}
      <div className="pt-2.5 border-t border-zinc-100 flex justify-between items-center">
        <div className="text-[13px] text-zinc-500 font-medium flex items-center gap-1.5">
          <span className="text-zinc-400">Isi/Dus:</span>
          <span className="font-semibold text-zinc-700">{item.qty} PCS</span>
        </div>
        <div className="text-[15px] font-semibold text-zinc-900">
          {item.price === "0" || !item.price ? "-" : item.price}
        </div>
      </div>
    </div>
  );
}

export default ItemCard;
