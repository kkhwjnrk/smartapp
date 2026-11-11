import React, { useState, useMemo } from 'react';
import { formatFullIndonesianDate } from '../../utils/date';
import {
  formatStoreCustomerHeader,
  calculateOrderSummary,
  groupOrderItemsByBrand
} from '../../utils/formatters';

function OrderCard({
  order,
  stores = [],
  catalogItems = [],
  onRequestToggleStatus,
  onOpenDetail,
  onEditOrder,
  onDeleteOrder,
  onCopyFormatText,
  onCopyStoreHeader,
  carryOverMonthText
}) {
  const [copiedStoreHeader, setCopiedStoreHeader] = useState(false);
  const isCompleted = order?.status === 'completed';
  const formattedDate = formatFullIndonesianDate(order?.date || order?.createdAt);
  const formattedStoreText = formatStoreCustomerHeader(order, stores);
  const orderItemsList = Array.isArray(order?.items) ? order.items : [];
  const totalQty = orderItemsList.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
  const orderSummary = calculateOrderSummary(orderItemsList, catalogItems);

  const groupedItems = useMemo(() => {
    return groupOrderItemsByBrand(order?.items || [], catalogItems);
  }, [order, catalogItems]);

  const handleCopyStore = (e) => {
    e.stopPropagation();
    if (onCopyStoreHeader) {
      onCopyStoreHeader(formattedStoreText);
    } else {
      navigator.clipboard.writeText(formattedStoreText);
    }
    setCopiedStoreHeader(true);
    setTimeout(() => setCopiedStoreHeader(false), 1500);
  };

  const isOsram = order.brand === 'osram';
  const netDisplay = isOsram
    ? orderSummary.osramFormatted
    : (orderSummary.daytonaGroupFormatted || orderSummary.formattedText);

  return (
    <div
      onClick={() => onOpenDetail(order)}
      className={`group bg-white rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer ${
        isCompleted
          ? 'border-zinc-200/70 bg-zinc-50/50'
          : 'border-zinc-200/90 hover:border-zinc-300'
      }`}
    >
      {/* 1. HEADER KARTU: IDENTITAS TOKO & AKSI CEPAT */}
      <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-zinc-100">
        <div className="min-w-0 flex-1">
          {/* Badge Rute, ID & Lanjutan */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {order.routeCode && (
              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 font-mono font-bold text-[10.5px] rounded-md tracking-tight">
                {order.routeCode}
              </span>
            )}

            {order.customerId && (
              <span className="px-2 py-0.5 bg-zinc-900 text-white font-mono font-bold text-[10.5px] rounded-md">
                {order.customerId}
              </span>
            )}

            <button
              type="button"
              onClick={handleCopyStore}
              className={`p-1 rounded-md transition-all active:scale-90 ${
                copiedStoreHeader
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
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

            {carryOverMonthText && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200/80 rounded text-[10px] font-semibold">
                ↳ {carryOverMonthText}
              </span>
            )}
          </div>

          {/* Nama Toko */}
          <h3 className={`text-[15.5px] sm:text-[16px] font-bold tracking-tight leading-snug break-words ${
            isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-900 group-hover:text-zinc-950'
          }`}>
            {order.storeName}
          </h3>

          {/* Info Tanggal & Total */}
          <p className="text-[11.5px] text-zinc-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="font-semibold text-zinc-700">{orderItemsList.length} item</span>
            <span>•</span>
            <span className="font-semibold text-zinc-700">{totalQty} pcs</span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold ml-1 text-[11px]">
                <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Selesai
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons Top-Right */}
        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onCopyFormatText(order)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors active:scale-95"
            title="Salin Catatan Order"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onEditOrder(order)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors active:scale-95"
            title="Edit Order"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onDeleteOrder(order.id)}
            className="p-1.5 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
            title="Hapus Order"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. CUPLIKAN ITEM RINGKAS (BERSIH & MUDAH DIBACA) */}
      <div className="py-2.5 space-y-1.5">
        {groupedItems.hasBothDaytonaAndDura ? (
          <>
            {/* Header Mini Daytona */}
            <div className="flex items-center justify-between text-[11px] font-bold text-orange-800 bg-orange-50/70 px-2 py-0.5 rounded-md">
              <span>DAYTONA ({groupedItems.daytonaOnlyQty} pcs)</span>
              <span className="text-[10px] text-orange-600 font-medium">{groupedItems.daytonaItems.length} item</span>
            </div>
            {groupedItems.daytonaItems.slice(0, 2).map((item, idx) => (
              <div key={`daytona-${idx}`} className="flex items-center justify-between text-[12.5px] px-1 py-0.5 text-zinc-700">
                <span className="font-mono font-bold text-[#EA580C] truncate mr-2">
                  {item.pn}
                  {item.description && <span className="font-sans font-normal text-zinc-400 text-[11.5px] ml-1.5">({item.description})</span>}
                </span>
                <span className="font-bold text-zinc-900 shrink-0 text-[12px] bg-zinc-100 px-1.5 py-0.2 rounded">
                  {item.qty} pcs
                </span>
              </div>
            ))}

            {/* Header Mini Dura */}
            <div className="flex items-center justify-between text-[11px] font-bold text-sky-800 bg-sky-50/70 px-2 py-0.5 rounded-md mt-1.5">
              <span>DURA ({groupedItems.duraQty} pcs)</span>
              <span className="text-[10px] text-sky-600 font-medium">{groupedItems.duraItems.length} item</span>
            </div>
            {groupedItems.duraItems.slice(0, 2).map((item, idx) => (
              <div key={`dura-${idx}`} className="flex items-center justify-between text-[12.5px] px-1 py-0.5 text-zinc-700">
                <span className="font-mono font-bold text-sky-700 truncate mr-2">
                  {item.pn}
                  {item.description && <span className="font-sans font-normal text-zinc-400 text-[11.5px] ml-1.5">({item.description})</span>}
                </span>
                <span className="font-bold text-zinc-900 shrink-0 text-[12px] bg-zinc-100 px-1.5 py-0.2 rounded">
                  {item.qty} pcs
                </span>
              </div>
            ))}
          </>
        ) : (
          orderItemsList.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-[12.5px] px-1 py-0.5 text-zinc-700">
              <span className={`font-mono font-bold truncate mr-2 ${
                item.brand === 'osram' ? 'text-amber-800' : item.brand === 'dura' ? 'text-sky-700' : 'text-[#EA580C]'
              }`}>
                {item.pn}
                {item.description && <span className="font-sans font-normal text-zinc-400 text-[11.5px] ml-1.5">({item.description})</span>}
              </span>
              <span className="font-bold text-zinc-900 shrink-0 text-[12px] bg-zinc-100 px-1.5 py-0.2 rounded">
                {item.qty} pcs
              </span>
            </div>
          ))
        )}

        {orderItemsList.length > 3 && !groupedItems.hasBothDaytonaAndDura && (
          <p className="text-[11px] text-zinc-400 italic px-1 pt-0.5">
            +{orderItemsList.length - 3} item lainnya...
          </p>
        )}
      </div>

      {/* 3. FOOTER KARTU: TOTAL NET & TOMBOL STATUS */}
      <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Total Net
            </span>
          </div>
          <span className="font-bold text-zinc-900 text-[14.5px] tracking-tight block">
            {netDisplay}
          </span>
        </div>

        {/* Tombol Status */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRequestToggleStatus(order);
          }}
          className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all shrink-0 active:scale-95 ${
            isCompleted
              ? 'text-zinc-600 bg-zinc-100 hover:bg-zinc-200'
              : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60'
          }`}
        >
          {isCompleted ? 'Kembalikan' : 'Selesaikan'}
        </button>
      </div>
    </div>
  );
}

export default OrderCard;
