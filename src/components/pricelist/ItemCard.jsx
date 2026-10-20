import React from 'react';
import { calculateDiscount } from '../../utils/formatters';

function ItemCard({ 
  item, 
  selectedDiscountTier = 'het', 
  isEditMode, 
  onOpenDiscount, 
  onOpenEdit 
}) {
  // Hitung / Ambil harga aktif berdasarkan tier diskon yang dipilih
  const getDisplayPrice = () => {
    if (item.price === "0" || !item.price) return { main: "-", het: null, discBadge: null };

    const hetFormatted = item.het ? `Rp ${item.het.toLocaleString('id-ID')}` : `Rp ${item.price}`;

    if (selectedDiscountTier === '24') {
      const net = item.d24 ? `Rp ${item.d24.toLocaleString('id-ID')}` : `Rp ${calculateDiscount(item.price, 24)}`;
      return { main: net, het: hetFormatted, discBadge: '24%' };
    }
    if (selectedDiscountTier === '27') {
      const net = item.d27 ? `Rp ${item.d27.toLocaleString('id-ID')}` : `Rp ${calculateDiscount(item.price, 27)}`;
      return { main: net, het: hetFormatted, discBadge: '27%' };
    }
    if (selectedDiscountTier === '29') {
      const net = item.d29 ? `Rp ${item.d29.toLocaleString('id-ID')}` : `Rp ${calculateDiscount(item.price, 29)}`;
      return { main: net, het: hetFormatted, discBadge: '29%' };
    }

    // Default: HET
    return { main: hetFormatted, het: null, discBadge: null };
  };

  const priceInfo = getDisplayPrice();

  return (
    <div
      onClick={() => !isEditMode && onOpenDiscount(item)}
      className={`bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm transition-all duration-200 flex flex-col gap-2.5 ${
        !isEditMode ? 'cursor-pointer hover:shadow-md hover:border-zinc-300 active:scale-[0.98]' : ''
      }`}
    >
      {/* Bagian Atas Card: PN di Kiri, Kategori / Subkategori di Pojok Kanan Atas */}
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
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-50 text-zinc-500 border border-zinc-200/80 max-w-[130px] truncate text-right">
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

      {/* Bagian Bawah Card: Isi per Dus/Karton & Harga */}
      <div className="pt-2.5 border-t border-zinc-100 flex justify-between items-center">
        <div className="text-[13px] text-zinc-500 font-medium flex items-center gap-1.5">
          <span className="text-zinc-400">Isi/Dus:</span>
          <span className="font-semibold text-zinc-700">{item.qty || 1} PCS</span>
        </div>

        {/* Kolom Harga */}
        <div className="text-right">
          {priceInfo.discBadge ? (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-[#EA580C] border border-orange-200/50">
                  {priceInfo.discBadge}
                </span>
                <span className="text-[15.5px] font-bold text-[#EA580C]">
                  {priceInfo.main}
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 line-through">
                HET: {priceInfo.het}
              </span>
            </div>
          ) : (
            <div className="text-[15.5px] font-semibold text-zinc-900">
              {priceInfo.main}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemCard;
