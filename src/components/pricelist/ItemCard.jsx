import React, { useMemo } from 'react';
import { calculateDiscount } from '../../utils/formatters';

// Parser peruntukan motor menjadi grup brand dan teks daftar model
function parseCompatibility(compText) {
  if (!compText || typeof compText !== 'string') return [];

  // Pisahkan berdasarkan delimiter brand '|'
  const segments = compText.split('|').map(s => s.trim()).filter(Boolean);

  return segments.map(seg => {
    if (seg.includes(':')) {
      const colonIdx = seg.indexOf(':');
      const brand = seg.slice(0, colonIdx).trim();
      const modelsText = seg.slice(colonIdx + 1).trim();
      return { brand, modelsText, raw: '' };
    }
    return { brand: '', modelsText: '', raw: seg };
  });
}

// Warna aksen badge brand motor
function getBrandBadgeStyle(brandName) {
  const b = (brandName || '').toLowerCase();
  if (b.includes('honda')) {
    return 'bg-red-50 text-red-700 border-red-200/80';
  }
  if (b.includes('yamaha')) {
    return 'bg-blue-50 text-blue-700 border-blue-200/80';
  }
  if (b.includes('suzuki')) {
    return 'bg-sky-50 text-sky-700 border-sky-200/80';
  }
  if (b.includes('kawasaki')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  }
  return 'bg-zinc-100 text-zinc-700 border-zinc-200/80';
}

// Format judul barang: sertakan spec jika esensial (Busi, Roller, Bearing, Per CVT, dll), abaikan jika kode OEM/internal
function getProductTitle(item) {
  const baseName = item.name || item.description || '';
  if (!item.spec) return baseName;

  // Jangan masukkan spec internal OEM atau RD/SF ke judul jika kampas rem
  if (item.category === 'Kampas Rem' || item.spec.startsWith('OEM ') || item.spec.startsWith('RD')) {
    return baseName;
  }

  // Jika nama sudah memuat spec, jangan gandakan
  if (baseName.toLowerCase().includes(item.spec.toLowerCase())) {
    return baseName;
  }

  return `${baseName} ${item.spec}`;
}

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

  // Peruntukan motor (ambil dari compatibility, fallback untuk Dura / custom)
  const rawCompatibility = item.compatibility || (
    item.name && item.description && item.description.startsWith(item.name)
      ? item.description.slice(item.name.length).trim()
      : ''
  );

  const compatibilityGroups = useMemo(() => parseCompatibility(rawCompatibility), [rawCompatibility]);
  const productTitle = getProductTitle(item);

  return (
    <div
      onClick={() => !isEditMode && onOpenDiscount(item)}
      className={`bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm transition-all duration-200 flex flex-col gap-3 ${
        !isEditMode ? 'cursor-pointer hover:shadow-md hover:border-zinc-300 active:scale-[0.99]' : ''
      }`}
    >
      {/* ROW 1: Header Atas (PN di Kiri, Kategori & Tombol Edit di Kanan) */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center text-[13.5px] font-bold font-mono tracking-tight px-2.5 py-0.5 rounded-lg border ${badgeColorClass}`}>
            PN: {item.pn}
          </span>

          {/* Badge Khusus Osram (Volt / Type) */}
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

        {/* Kategori Badge & Tombol Edit */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-50 text-zinc-500 border border-zinc-200/80 max-w-[140px] truncate text-right">
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

      {/* ROW 2: Judul Produk & Kode Motor (Full Width) */}
      <div className="w-full space-y-1.5">
        <h3 className="font-semibold text-[15px] text-zinc-900 leading-snug break-words">
          {productTitle}
        </h3>

        {/* Kode Motor langsung badge saja tanpa label */}
        {item.motorCode && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="font-mono font-semibold text-[11.5px] px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200/80">
              {item.motorCode}
            </span>
          </div>
        )}
      </div>

      {/* ROW 3: Peruntukan Motor Terstruktur (Badge Hanya pada Brand, Teks Biasa untuk Model) */}
      {compatibilityGroups.length > 0 && (
        <div className="w-full bg-zinc-50/80 rounded-xl p-2.5 border border-zinc-200/70 space-y-2">
          {compatibilityGroups.map((group, gIdx) => (
            <div key={gIdx} className="flex items-start gap-2 text-[12.5px] leading-relaxed">
              {group.brand ? (
                <span className={`shrink-0 text-[10.5px] font-extrabold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${getBrandBadgeStyle(group.brand)}`}>
                  {group.brand}
                </span>
              ) : null}
              <span className="text-zinc-700 font-normal flex-1">
                {group.modelsText || group.raw}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ROW 4: Footer (Kemasan di Kiri Menggunakan qtyCtn, Kolom Harga di Kanan) */}
      <div className="pt-2.5 border-t border-zinc-100 flex justify-between items-center w-full">
        <div className="text-[12.5px] text-zinc-500 font-medium flex items-center gap-1.5">
          <span className="text-zinc-400">Kemasan:</span>
          <span className="font-semibold text-zinc-700">{item.qtyCtn || item.qty || 1} PCS</span>
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
