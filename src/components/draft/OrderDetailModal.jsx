import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { formatFullIndonesianDate } from '../../utils/date';
import {
  formatStoreCustomerHeader,
  calculateOrderSummary,
  groupOrderItemsByBrand,
  formatOrderNotesText
} from '../../utils/formatters';
import useSwipeBack from '../../hooks/useSwipeBack';

function OrderDetailModal({
  order,
  stores = [],
  catalogItems = [],
  onClose,
  onEditOrder,
  onDeleteOrder,
  onRequestToggleStatus,
  onCopyStoreHeader
}) {
  const [copiedPn, setCopiedPn] = useState(null);
  const [copiedType, setCopiedType] = useState(null); // 'all' | 'daytona' | 'dura'
  const [copiedStoreHeader, setCopiedStoreHeader] = useState(false);

  const {
    containerRef,
    dragX,
    isSwiping,
    isExiting,
    containerStyle,
    backdropOpacity,
    handlers: swipeHandlers
  } = useSwipeBack({
    onBack: onClose,
    edgeWidth: 90,
    threshold: 80,
    enabled: Boolean(order)
  });

  const grouped = useMemo(() => {
    if (!order) return { daytona: [], dura: [], osram: [] };
    const items = Array.isArray(order.items) ? order.items : [];
    return groupOrderItemsByBrand(items, catalogItems);
  }, [order, catalogItems]);

  const orderSummary = useMemo(() => {
    if (!order) return { totalQty: 0, totalNet: 0, totalHet: 0, brandCounts: {} };
    const items = Array.isArray(order.items) ? order.items : [];
    return calculateOrderSummary(items, catalogItems);
  }, [order, catalogItems]);

  if (!order) return null;

  const isCompleted = order.status === 'completed';
  const formattedDate = formatFullIndonesianDate(order.date || order.createdAt);
  const formattedStoreText = formatStoreCustomerHeader(order, stores);

  const handleCopySinglePn = (pn) => {
    navigator.clipboard.writeText(pn);
    setCopiedPn(pn);
    setTimeout(() => setCopiedPn(null), 1500);
  };

  const handleCopyNotes = (brandFilter = 'all') => {
    if (brandFilter === 'daytona') {
      const text = formatOrderNotesText(order, stores, 'daytona', catalogItems);
      navigator.clipboard.writeText(text);
    } else if (brandFilter === 'dura') {
      const text = formatOrderNotesText(order, stores, 'dura', catalogItems);
      navigator.clipboard.writeText(text);
    } else {
      const text = formatOrderNotesText(order, stores, brandFilter, catalogItems);
      navigator.clipboard.writeText(text);
    }
    setCopiedType(brandFilter);
    setTimeout(() => setCopiedType(null), 1800);
  };

  const renderItemRow = (item, displayIndex) => (
    <div
      key={`${item.pn}-${displayIndex}`}
      className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/80 transition-colors"
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <span className="text-[12px] font-bold text-zinc-300 w-4 pt-0.5 text-right select-none shrink-0">
          {displayIndex}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-mono font-bold text-[15.5px] tracking-tight ${
              item.brand === 'osram'
                ? 'text-amber-800'
                : item.brand === 'dura'
                  ? 'text-sky-700'
                  : 'text-[#EA580C]'
            }`}>
              {item.pn}
            </span>

            {item.brand && (
              <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded uppercase ${
                item.brand === 'dura'
                  ? 'bg-sky-100 text-sky-700 border border-sky-200'
                  : item.brand === 'osram'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-orange-100 text-[#EA580C] border border-orange-200'
              }`}>
                {item.brand}
              </span>
            )}

            <span className="font-bold text-zinc-900 text-[13.5px] bg-zinc-100 px-2 py-0.5 rounded-md">
              {item.qty} PCS
            </span>
          </div>

          {item.description && (
            <p className="text-[12.5px] text-zinc-600 font-medium mt-1 leading-snug break-words">
              {item.description}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => handleCopySinglePn(item.pn)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11.5px] font-semibold transition-all shrink-0 active:scale-95 ${
          copiedPn === item.pn
            ? 'bg-emerald-100 text-emerald-800 font-bold'
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
  );

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity"
        style={{
          opacity: backdropOpacity,
          transition: isSwiping ? 'none' : 'opacity 0.25s ease',
          pointerEvents: isSwiping ? 'none' : 'auto'
        }}
        onClick={onClose}
      />

      <div
        ref={containerRef}
        {...swipeHandlers}
        style={containerStyle}
        className={`relative w-full h-full max-w-lg mx-auto bg-white flex flex-col shadow-2xl ${
          dragX === 0 && !isExiting ? 'animate-in slide-in-from-right duration-200' : ''
        }`}
      >
        {/* Top Header Bar */}
        <div className="bg-white border-b border-zinc-200/80 px-4 py-3 shrink-0 flex items-center justify-between gap-3 shadow-2xs pt-safe">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 font-bold text-[14px] px-2 py-1 -ml-2 rounded-xl hover:bg-zinc-100 transition-colors"
          >
            <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleCopyNotes('all')}
              className={`p-2 rounded-xl transition-all border ${
                copiedType === 'all'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
              title="Salin format catatan semua item"
            >
              {copiedType === 'all' ? (
                <svg className="w-4 h-4 text-emerald-600 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              )}
            </button>

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
        <div className="bg-zinc-50/70 border-b border-zinc-200/80 px-4 py-3.5 shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              {order.routeCode && (
                <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200/80 rounded-md text-[11px] font-mono font-bold tracking-wide">
                  {order.routeCode}
                </span>
              )}

              {order.customerId && (
                <span className="px-2 py-0.5 bg-zinc-900 text-white font-mono font-bold text-[11px] rounded-md">
                  {order.customerId}
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
                className={`p-1.5 rounded-lg border transition-all active:scale-95 shrink-0 ${
                  copiedStoreHeader
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-white hover:bg-zinc-100 text-zinc-500 border-zinc-200'
                }`}
                title={`Salin Nama Toko: "${formattedStoreText}"`}
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

            <h1 className="text-[20px] font-bold text-zinc-900 tracking-tight leading-snug break-words">
              {order.storeName}
            </h1>

            <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-zinc-500 font-medium flex-wrap">
              <span className="text-zinc-700 font-semibold">{formattedDate}</span>
              <span>•</span>
              <span className="font-semibold text-zinc-800">{orderItemsList.length} item</span>
              <span>•</span>
              <span className="font-semibold text-zinc-800">{grouped.totalDaytonaQty + grouped.totalOsramQty} pcs</span>
              <span>•</span>
              {isCompleted ? (
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                  <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Sudah Selesai
                </span>
              ) : (
                <span className="text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Order Aktif
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content: Item List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 touch-pan-y">
          <div className="max-w-2xl mx-auto space-y-4 pb-24">
            {grouped.hasBothDaytonaAndDura ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
                      <h2 className="text-[14px] font-bold text-zinc-900">
                        Pesanan Daytona ({grouped.daytonaItems.length} item • {grouped.daytonaOnlyQty} pcs)
                      </h2>
                    </div>
                  </div>
                  <div className="divide-y divide-zinc-100 bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-2xs">
                    {grouped.daytonaItems.map((item, index) => renderItemRow(item, index + 1))}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                      <h2 className="text-[14px] font-bold text-zinc-900">
                        Pesanan Dura ({grouped.duraItems.length} item • {grouped.duraQty} pcs)
                      </h2>
                    </div>
                  </div>
                  <div className="divide-y divide-zinc-100 bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-2xs">
                    {grouped.duraItems.map((item, index) => renderItemRow(item, index + 1))}
                  </div>
                </div>

                <div className="p-3.5 bg-orange-50/70 border border-orange-200/80 rounded-2xl space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-orange-900 font-semibold">
                      Total Net (Daytona & Dura 1 Nota):
                    </span>
                    <span className="font-bold text-orange-950 text-[15px]">
                      {orderSummary.daytonaGroupFormatted}
                    </span>
                  </div>
                </div>
              </>
            ) : grouped.hasOsram && !grouped.hasDaytonaGroup ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h2 className="text-[14px] font-bold text-zinc-900">
                      Pesanan Osram ({grouped.osramItems.length} item • {grouped.totalOsramQty} pcs)
                    </h2>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-amber-900 font-semibold">Total Net Osram:</span>
                    <span className="font-bold text-amber-950 text-[15px]">{orderSummary.osramFormatted}</span>
                  </div>
                </div>

                <div className="divide-y divide-zinc-100 bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-2xs">
                  {grouped.osramItems.map((item, index) => renderItemRow(item, index + 1))}
                </div>
              </div>
            ) : grouped.hasDura && !grouped.hasDaytona ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                    <h2 className="text-[14px] font-bold text-zinc-900">
                      Pesanan Dura ({grouped.duraItems.length} item • {grouped.duraQty} pcs)
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyNotes('dura')}
                    className="text-[12px] font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <span>{copiedType === 'dura' ? '✓ Tersalin' : '📋 Salin Dura'}</span>
                  </button>
                </div>

                <div className="p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-2xl space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-sky-900 font-semibold">Total Net Dura (Grup Daytona):</span>
                    <span className="font-bold text-sky-950 text-[15px]">{orderSummary.daytonaGroupFormatted}</span>
                  </div>
                </div>

                <div className="divide-y divide-zinc-100 bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-2xs">
                  {grouped.duraItems.map((item, index) => renderItemRow(item, index + 1))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
                    <h2 className="text-[14px] font-bold text-zinc-900">
                      Pesanan Daytona ({grouped.daytonaItems.length} item • {grouped.daytonaOnlyQty} pcs)
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyNotes('daytona')}
                    className="text-[12px] font-semibold text-orange-700 hover:text-orange-800 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <span>{copiedType === 'daytona' ? '✓ Tersalin' : '📋 Salin Daytona'}</span>
                  </button>
                </div>

                <div className="p-3.5 bg-orange-50/70 border border-orange-200/80 rounded-2xl space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-orange-900 font-semibold">Total Net Daytona:</span>
                    <span className="font-bold text-orange-950 text-[15px]">{orderSummary.daytonaGroupFormatted}</span>
                  </div>
                </div>

                <div className="divide-y divide-zinc-100 bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-2xs">
                  {grouped.daytonaItems.map((item, index) => renderItemRow(item, index + 1))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="bg-white border-t border-zinc-200/80 px-4 py-3 shrink-0 shadow-lg pb-safe">
          <div className="max-w-2xl mx-auto space-y-2">
            {grouped.hasBothDaytonaAndDura && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyNotes('daytona')}
                  className="py-2.5 px-3 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-xl text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span>{copiedType === 'daytona' ? '✓ Daytona Tersalin' : '📋 Salin Daytona'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyNotes('dura')}
                  className="py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span>{copiedType === 'dura' ? '✓ Dura Tersalin' : '📋 Salin Dura'}</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyNotes('all')}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-[13.5px] font-bold transition-colors flex items-center justify-center gap-1.5 active:scale-98"
              >
                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>{copiedType === 'all' ? 'Format Tersalin!' : 'Salin Semua Catatan'}</span>
              </button>

              {isCompleted ? (
                <button
                  type="button"
                  onClick={() => onRequestToggleStatus(order)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[13.5px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
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
                  className="flex-1 py-3 bg-[#EA580C] hover:bg-orange-700 text-white rounded-xl text-[13.5px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
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
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

export default OrderDetailModal;
