import React, { useState } from 'react';
import { formatFullIndonesianDate } from '../../utils/date';
import { formatStoreCustomerHeader, calculateOrderSummary } from '../../utils/formatters';
import useSwipeBack from '../../hooks/useSwipeBack';

function OrderDetailModal({
  isOpen,
  order,
  stores = [],
  catalogItems = [],
  onClose,
  onRequestToggleStatus,
  onEditOrder,
  onDeleteOrder,
  onCopyPN,
  onCopyFormatText,
  onCopyStoreHeader
}) {
  const [copiedPn, setCopiedPn] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedStoreHeader, setCopiedStoreHeader] = useState(false);

  const {
    isSwiping,
    dragX,
    dragProgress,
    isExiting,
    containerStyle,
    backdropOpacity,
    handlers: swipeHandlers
  } = useSwipeBack({
    onBack: onClose,
    edgeWidth: 60,
    threshold: 85,
    enabled: isOpen && !!order
  });

  if (!isOpen || !order) return null;

  const isCompleted = order.status === 'completed';
  const formattedDate = formatFullIndonesianDate(order.date || order.createdAt);
  const formattedStoreText = formatStoreCustomerHeader(order, stores);
  const orderSummary = calculateOrderSummary(order.items, catalogItems);


  const handleCopySinglePn = (pn) => {
    navigator.clipboard.writeText(pn);
    setCopiedPn(pn);
    if (onCopyPN) onCopyPN(pn);
    setTimeout(() => setCopiedPn(null), 1500);
  };

  const handleCopyAllNotes = () => {
    onCopyFormatText(order);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed Backdrop Scrim */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity pointer-events-none"
        style={{
          opacity: backdropOpacity,
          transition: isSwiping ? 'none' : 'opacity 0.25s ease'
        }}
      />

      {/* Main Sliding Detail Screen */}
      <div 
        {...swipeHandlers}
        style={containerStyle}
        className={`relative w-full h-full bg-white flex flex-col shadow-2xl ${
          dragX === 0 && !isExiting ? 'animate-in slide-in-from-right duration-250' : ''
        }`}
      >
        {/* iOS-Style Left-Edge Swipe Hint / Indicator */}
        {dragX > 10 && (
          <div 
            className="absolute left-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none flex items-center justify-center transition-all duration-100"
            style={{
              opacity: Math.min(1, dragX / 30),
              transform: `translateY(-50%) scale(${0.8 + dragProgress * 0.3})`
            }}
          >
            <div className={`p-2.5 rounded-full shadow-lg border backdrop-blur-md transition-colors ${
              dragProgress >= 1 
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/30' 
                : 'bg-white/95 text-zinc-700 border-zinc-200 shadow-zinc-900/10'
            }`}>
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </div>
        )}
      
      {/* Top Header Bar */}
      <div className="bg-white border-b border-zinc-200 px-4 py-3 shrink-0 flex items-center justify-between gap-3 shadow-2xs">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 font-semibold text-[14px] px-2 py-1 -ml-2 rounded-xl hover:bg-zinc-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-1">
          {/* Tombol Salin Format Catatan */}
          <button
            type="button"
            onClick={handleCopyAllNotes}
            className={`p-2 rounded-xl transition-all border ${
              copiedAll 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}
            title="Salin format teks catatan"
          >
            {copiedAll ? (
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            )}
          </button>

          {/* Tombol Edit */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onEditOrder(order);
            }}
            className="p-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-xl transition-colors"
            title="Edit Order Toko"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          {/* Tombol Hapus */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onDeleteOrder(order.id);
            }}
            className="p-2 bg-zinc-50 hover:bg-red-50 text-zinc-400 hover:text-red-600 border border-zinc-200 rounded-xl transition-colors"
            title="Hapus Order"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Hero Header Order Toko */}
      <div className="bg-zinc-50 border-b border-zinc-200/80 px-5 py-4 shrink-0">
        <div className="max-w-2xl mx-auto">
          {/* Baris Badge Rute & Tombol Salin ID & Nama Toko */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {order.routeCode && (
              <span className="inline-flex items-center px-2.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200/80 rounded-md text-[11px] font-bold tracking-wide">
                {order.routeCode}
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                if (onCopyStoreHeader) onCopyStoreHeader(formattedStoreText);
                else navigator.clipboard.writeText(formattedStoreText);
                setCopiedStoreHeader(true);
                setTimeout(() => setCopiedStoreHeader(false), 1500);
              }}
              className={`p-1.5 rounded-xl border transition-all active:scale-95 shrink-0 ${
                copiedStoreHeader
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-white hover:bg-orange-50 text-zinc-400 hover:text-orange-600 border-zinc-200 shadow-2xs'
              }`}
              title={`Salin ID & Nama Toko: "${formattedStoreText}"`}
            >
              {copiedStoreHeader ? (
                <svg className="w-4 h-4 text-emerald-600 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              )}
            </button>
          </div>

          {/* Nama Toko */}
          <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight leading-snug break-words">
            {order.storeName}
          </h1>


          {/* Meta Bar: Tanggal Lengkap, Total Item & Total Nominal Diskon */}
          <div className="flex items-center gap-2 mt-2 text-[13px] text-zinc-500 font-medium flex-wrap">
            <span className="text-zinc-700 font-semibold">{formattedDate}</span>
            <span>·</span>
            <span className="font-semibold text-zinc-800">{order.items.length} item</span>
            <span>·</span>
            <span className="font-bold text-zinc-900 bg-zinc-200/70 px-2 py-0.5 rounded-lg text-[12px]">
              {orderSummary.formattedText}
            </span>
            <span>·</span>
            {isCompleted ? (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Sudah Selesai
              </span>
            ) : (
              <span className="text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Order Aktif
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Daftar Semua Item */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3 pb-24">
          
          <div className="flex items-center justify-between px-1 mb-1">
            <h2 className="text-[14px] font-bold text-zinc-800">
              Rincian Item Pesanan ({order.items.length} item)
            </h2>
            <button
              type="button"
              onClick={handleCopyAllNotes}
              className="text-[12px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>{copiedAll ? '✓ Tersalin' : 'Salin Format Notes'}</span>
            </button>
          </div>

          {/* List Kartu Item */}
          <div className="divide-y divide-zinc-100 bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
            {order.items.map((item, index) => (
              <div 
                key={index}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/80 transition-colors group"
              >
                {/* Info Part */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="text-[13px] font-bold text-zinc-300 w-5 pt-0.5 text-right select-none shrink-0">
                    {index + 1}.
                  </span>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {/* Part Number Daytona Orange */}
                      <span className="font-mono font-bold text-[#EA580C] text-[16px] tracking-tight">
                        {item.pn}
                      </span>
                      
                      <span className="text-zinc-300 font-bold">:</span>
                      
                      {/* Qty Item */}
                      <span className="font-bold text-zinc-900 text-[15px]">
                        {item.qty} <span className="text-[11px] font-medium text-zinc-500">PCS</span>
                      </span>
                    </div>

                    {/* Deskripsi Barang Lengkap (Tanpa Terpotong) */}
                    {item.description && (
                      <p className="text-[13px] text-zinc-600 font-medium mt-1 leading-snug break-words whitespace-normal">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tombol Cepat Salin PN */}
                <button
                  type="button"
                  onClick={() => handleCopySinglePn(item.pn)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all shrink-0 active:scale-95 ${
                    copiedPn === item.pn
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                  title="Salin Part Number"
                >
                  {copiedPn === item.pn ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                      <span>Salin PN</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="bg-white border-t border-zinc-200 px-4 py-3 shrink-0 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          
          <button
            type="button"
            onClick={handleCopyAllNotes}
            className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-[13.5px] font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>{copiedAll ? 'Format Tersalin!' : 'Salin Semua Catatan'}</span>
          </button>

          {isCompleted ? (
            <button
              type="button"
              onClick={() => onRequestToggleStatus(order)}
              className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[13.5px] font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Kembalikan ke Aktif</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRequestToggleStatus(order)}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[13.5px] font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Tandai Selesai</span>
            </button>
          )}

        </div>
      </div>

      </div>
    </div>
  );
}

export default OrderDetailModal;
