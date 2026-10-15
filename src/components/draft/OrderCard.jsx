import React, { useState } from 'react';
import { formatFullIndonesianDate } from '../../utils/date';
import { formatStoreCustomerHeader } from '../../utils/formatters';

function OrderCard({ 
  order, 
  stores = [],
  onRequestToggleStatus, 
  onOpenDetail,
  onEditOrder, 
  onDeleteOrder, 
  onCopyPN,
  onCopyFormatText,
  onCopyStoreHeader,
  carryOverMonthText
}) {
  const [copiedPn, setCopiedPn] = useState(null);
  const [copiedStoreHeader, setCopiedStoreHeader] = useState(false);
  const isCompleted = order.status === 'completed';
  const formattedDate = formatFullIndonesianDate(order.date || order.createdAt);
  const formattedStoreText = formatStoreCustomerHeader(order, stores);

  const handleCopySinglePn = (pn, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pn);
    setCopiedPn(pn);
    if (onCopyPN) onCopyPN(pn);
    setTimeout(() => setCopiedPn(null), 1500);
  };

  // Preview maksimal 2 item ringkas agar kartu tetap rapi
  const previewItems = order.items.slice(0, 2);
  const remainingCount = order.items.length - previewItems.length;

  return (
    <div 
      onClick={() => onOpenDetail(order)}
      className={`bg-white rounded-3xl p-5 border transition-all duration-200 shadow-xs cursor-pointer ${
        isCompleted 
          ? 'border-zinc-200/60 bg-zinc-50/50' 
          : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md'
      }`}
    >
      
      {/* Header Baris: Checkbox Lingkaran & Info Toko */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          
          {/* Checkbox Lingkaran Khas Apple Notes (dengan konfirmasi) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRequestToggleStatus(order);
            }}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all mt-0.5 shrink-0 select-none ${
              isCompleted
                ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                : 'border-2 border-zinc-400/80 hover:border-amber-500 hover:bg-amber-50/50 active:scale-95'
            }`}
            title={isCompleted ? "Klik untuk mengembalikan ke Aktif" : "Klik untuk menandai Selesai"}
          >
            {isCompleted && (
              <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Info Toko */}
          <div className="flex-1 min-w-0">
            {/* Baris Badge: Rute & Lanjutan Bulan Lalu */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {order.routeCode && (
                <span className="inline-flex items-center px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200/80 rounded-md text-[10.5px] font-bold tracking-wider">
                  {order.routeCode}
                </span>
              )}
              {carryOverMonthText && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-md text-[10.5px] font-semibold">
                  <span>↳ Lanjutan {carryOverMonthText}</span>
                </span>
              )}
            </div>

            {/* Nama Toko & Ikon Copy Rapi */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className={`text-[17px] font-bold tracking-tight leading-snug break-words ${
                isCompleted ? 'text-zinc-500 line-through decoration-zinc-300' : 'text-zinc-900'
              }`}>
                {order.storeName}
              </h3>

              {/* Tombol Ikon Copy Rapi (Tanpa teks panjang agar tidak sempit) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCopyStoreHeader) {
                    onCopyStoreHeader(formattedStoreText);
                  } else {
                    navigator.clipboard.writeText(formattedStoreText);
                  }
                  setCopiedStoreHeader(true);
                  setTimeout(() => setCopiedStoreHeader(false), 1500);
                }}
                className={`p-1 rounded-lg transition-all active:scale-90 shrink-0 ${
                  copiedStoreHeader
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-zinc-400 hover:text-orange-600 hover:bg-orange-50'
                }`}
                title={`Salin ID & Nama Toko: "${formattedStoreText}"`}
              >
                {copiedStoreHeader ? (
                  <svg className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Meta: Tanggal Lengkap & Jumlah Item (tanpa total pcs) */}
            <div className="flex items-center gap-2 mt-1.5 text-[12px] text-zinc-400 font-medium flex-wrap">
              <span className="text-zinc-600">{formattedDate}</span>
              <span>·</span>
              <span className="font-semibold text-zinc-700">{order.items.length} item</span>
              {isCompleted && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Sudah Selesai
                  </span>
                </>
              )}
            </div>
          </div>
        </div>


        {/* Action Buttons Top-Right */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Tombol Salin Format Teks Notes */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCopyFormatText(order);
            }}
            className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Salin format teks catatan"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>

          {/* Tombol Edit Order */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditOrder(order);
            }}
            className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Edit Order Toko"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          {/* Tombol Hapus Order */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteOrder(order.id);
            }}
            className="p-1.5 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus Order"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body: Cuplikan Item Ringkas (Maksimal 2 item) */}
      <div className="py-2.5 space-y-1">
        {previewItems.map((item, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-zinc-100/70 transition-colors"
          >
            <div className="flex items-baseline gap-2 min-w-0 truncate">
              <span className="text-zinc-400 text-[14px] select-none font-bold">-</span>
              
              {/* Part Number Oranye Daytona */}
              <span className="font-mono font-bold text-[#EA580C] text-[15px] tracking-tight shrink-0">
                {item.pn}
              </span>
              
              <span className="text-zinc-400 text-[13px] font-semibold">:</span>
              
              {/* Qty */}
              <span className="font-bold text-zinc-900 text-[14px] shrink-0">
                {item.qty} <span className="text-[11px] font-medium text-zinc-500">PCS</span>
              </span>

              {/* Deskripsi Barang */}
              {item.description && (
                <span className="text-zinc-400 text-[12.5px] truncate font-normal ml-1">
                  ({item.description})
                </span>
              )}
            </div>

            {/* Tombol 1-Tap Salin PN */}
            <button
              type="button"
              onClick={(e) => handleCopySinglePn(item.pn, e)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ml-2 shrink-0 ${
                copiedPn === item.pn
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-zinc-100/80 hover:bg-zinc-200 text-zinc-600 active:scale-95'
              }`}
              title="Salin PN ke clipboard"
            >
              {copiedPn === item.pn ? (
                <>
                  <svg className="w-3 h-3 text-emerald-600 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <span>Salin PN</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Footer Kartu: Tombol Buka Rincian Halaman Penuh */}
      <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(order);
          }}
          className="flex-1 py-2 px-3 text-left text-[12.5px] font-semibold text-zinc-700 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 rounded-xl border border-zinc-200/70 transition-colors flex items-center justify-between"
        >
          <span>
            {remainingCount > 0 
              ? `Buka Rincian (${order.items.length} item · +${remainingCount} lainnya)` 
              : `Buka Rincian (${order.items.length} item)`}
          </span>
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Tombol Cepat Selesai / Kembalikan */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRequestToggleStatus(order);
          }}
          className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all shrink-0 active:scale-95 ${
            isCompleted
              ? 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200'
              : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          {isCompleted ? 'Kembalikan' : 'Selesaikan'}
        </button>
      </div>

    </div>
  );
}

export default OrderCard;
