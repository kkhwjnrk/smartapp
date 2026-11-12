import React, { useState } from 'react';
import { calculateDiscount } from '../../utils/formatters';

function ItemCard({ 
  item, 
  selectedDiscountTier = 'het', 
  isEditMode, 
  onOpenDiscount, 
  onOpenEdit 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Hitung / Ambil harga aktif berdasarkan tier diskon yang dipilih
  const getDisplayPrice = () => {
    if (item.price === "0" || !item.price) return { main: "-", het: null, discBadge: null };

    const hetFormatted = item.het ? `Rp ${item.het.toLocaleString('id-ID')}` : `Rp ${item.price}`;

    // Diskon Daytona / Dura
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

    // Diskon Osram
    if (selectedDiscountTier === '35') {
      const net = item.d35 ? `Rp ${item.d35.toLocaleString('id-ID')}` : `Rp ${calculateDiscount(item.price, 35)}`;
      return { main: net, het: hetFormatted, discBadge: '35%' };
    }
    if (selectedDiscountTier === '37') {
      const net = item.d37 ? `Rp ${item.d37.toLocaleString('id-ID')}` : `Rp ${calculateDiscount(item.price, 37)}`;
      return { main: net, het: hetFormatted, discBadge: '37%' };
    }
    if (selectedDiscountTier === '40') {
      const net = item.d40 ? `Rp ${item.d40.toLocaleString('id-ID')}` : `Rp ${calculateDiscount(item.price, 40)}`;
      return { main: net, het: hetFormatted, discBadge: '40%' };
    }
    if (selectedDiscountTier === '41.5') {
      const net = item.d41_5 ? `Rp ${item.d41_5.toLocaleString('id-ID')}` : `Rp ${calculateDiscount(item.price, 41.5)}`;
      return { main: net, het: hetFormatted, discBadge: '41.5%' };
    }

    // Default: HET
    return { main: hetFormatted, het: null, discBadge: null };
  };

  const priceInfo = getDisplayPrice();
  const isOsram = item.brand === 'osram';
  const isDura = item.brand === 'dura';

  // Warna aksen badge sesuai brand
  const badgeColorClass = isOsram
    ? 'text-amber-800 bg-amber-50 border-amber-200/80 shadow-[0_1px_2px_rgba(217,119,6,0.06)]'
    : isDura
    ? 'text-sky-700 bg-sky-50 border-sky-200/80 shadow-[0_1px_2px_rgba(2,132,199,0.06)]'
    : 'text-[#EA580C] bg-orange-50/90 border-orange-200/70 shadow-[0_1px_2px_rgba(234,88,12,0.06)]';

  const brandTextAccent = isOsram
    ? 'text-amber-700 hover:text-amber-800'
    : isDura
    ? 'text-sky-700 hover:text-sky-800'
    : 'text-[#EA580C] hover:text-orange-700';

  // Peruntukan motor & teks pendukung
  const compatibilityText = item.compatibility || (
    // Fallback untuk Dura / item lama jika tidak ada compatibility eksplisit
    item.name && item.description && item.description.startsWith(item.name)
      ? item.description.slice(item.name.length).trim()
      : ''
  );

  const hasLongCompatibility = compatibilityText.length > 55;
  const productName = item.name || item.description;

  return (
    <div
      onClick={() => !isEditMode && onOpenDiscount(item)}
      className={`bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm transition-all duration-200 flex flex-col gap-2.5 ${
        !isEditMode ? 'cursor-pointer hover:shadow-md hover:border-zinc-300 active:scale-[0.99]' : ''
      }`}
    >
      {/* Bagian Atas Card: PN di Kiri, Kategori / Subkategori & Edit di Pojok Kanan Atas */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">

          {/* Badge PN, Tipe Spek, Posisi, Volt/Type */}
          <div className="mb-2 flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center text-[13.5px] font-bold font-mono tracking-tight px-2.5 py-0.5 rounded-lg border ${badgeColorClass}`}>
              PN: {item.pn}
            </span>

            {/* Badge Posisi Part (Depan / Belakang) jika ada */}
            {item.position && (
              <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                {item.position}
              </span>
            )}

            {/* Badge Volt / Type khusus Osram */}
            {item.volt && (
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                {item.volt}
              </span>
            )}
            {item.type && (
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                {item.type}
              </span>
            )}
          </div>

          {/* Nama Produk Bersih */}
          <h3 className="font-semibold text-[15px] text-zinc-900 leading-snug break-words">
            {productName}
          </h3>

          {/* Spesifikasi / Tipe Part jika ada */}
          {item.spec && (
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11.5px] font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/70 inline-flex items-center gap-1">
                <span className="text-zinc-400 font-normal">Tipe/Spek:</span>
                <span className="font-mono font-semibold text-zinc-800">{item.spec}</span>
              </span>
            </div>
          )}

          {/* Peruntukan Motor Terstruktur & Collapsible */}
          {compatibilityText ? (
            <div className="mt-2 text-[12px] text-zinc-600">
              <div className="flex items-start gap-1.5">
                <span className="text-zinc-400 shrink-0 font-medium pt-0.5">Motor:</span>
                <div className="flex-1 min-w-0">
                  <p className={`${!isExpanded && hasLongCompatibility ? 'line-clamp-2' : ''} leading-relaxed text-zinc-700`}>
                    {compatibilityText}
                  </p>

                  {/* Kode Motor / Rangka saat expanded */}
                  {isExpanded && item.motorCode && (
                    <div className="mt-2 pt-2 border-t border-zinc-100 flex items-start gap-1.5 text-[11px]">
                      <span className="text-zinc-400 shrink-0 font-medium">Kode Motor:</span>
                      <span className="font-mono text-zinc-700 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200/80">
                        {item.motorCode}
                      </span>
                    </div>
                  )}

                  {/* Tombol Toggle Buka / Tutup Selengkapnya */}
                  {hasLongCompatibility && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(prev => !prev);
                      }}
                      className={`mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium ${brandTextAccent} transition-colors select-none`}
                    >
                      <span>{isExpanded ? 'Sembunyikan' : 'Lihat selengkapnya'}</span>
                      <svg 
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
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

      {/* Bagian Bawah Card: Isi per Dus/Karton & Kolom Harga */}
      <div className="pt-2.5 border-t border-zinc-100 flex justify-between items-center">
        <div className="text-[12.5px] text-zinc-500 font-medium flex items-center gap-1.5">
          <span className="text-zinc-400">Kemasan:</span>
          <span className="font-semibold text-zinc-700">{item.qty || 1} PCS</span>
          {item.qtyCtn && (
            <span className="text-zinc-400 text-[11.5px] font-normal">({item.qtyCtn}/ctn)</span>
          )}
        </div>

        {/* Kolom Harga Aktif / Diskon */}
        <div className="text-right">
          {priceInfo.discBadge ? (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  isOsram
                    ? 'bg-amber-100 text-amber-800 border-amber-200/60'
                    : isDura
                    ? 'bg-sky-100 text-sky-800 border-sky-200/60'
                    : 'bg-orange-100 text-[#EA580C] border-orange-200/50'
                }`}>
                  {priceInfo.discBadge}
                </span>
                <span className={`text-[15.5px] font-bold ${
                  isOsram
                    ? 'text-amber-700'
                    : isDura
                    ? 'text-sky-700'
                    : 'text-[#EA580C]'
                }`}>
                  {priceInfo.main}
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 line-through">
                HET: {priceInfo.het}
              </span>
            </div>
          ) : (
            <div className="text-[15.5px] font-bold text-zinc-900">
              {priceInfo.main}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemCard;
