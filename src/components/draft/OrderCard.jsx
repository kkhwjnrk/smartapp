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
  onCopyPN,
  onCopyFormatText,
  onCopyStoreHeader,
  carryOverMonthText
}) {
  const [copiedPn, setCopiedPn] = useState(null);
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

  const handleCopySinglePn = (pn, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pn);
    setCopiedPn(pn);
    if (onCopyPN) onCopyPN(pn);
    setTimeout(() => setCopiedPn(null), 1500);
  };

  // Preview maksimal 2 item ringkas agar kartu tetap rapi
  const previewItems = orderItemsList.slice(0, 2);

  return (
    <div
      onClick={() => onOpenDetail(order)}
      className={`bg-white rounded-3xl p-5 border transition-all duration-200 shadow-xs cursor-pointer ${isCompleted
        ? 'border-zinc-200/60 bg-zinc-50/50'
        : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md'
        }`}
    >

      {/* Header Baris: Info Toko & Aksi Cepat */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100">
        {/* Info Toko */}
        <div className="flex-1 min-w-0">
          {/* Baris Badge: Rute, Tombol Salin [ID Customer] [Nama Toko], & Lanjutan Bulan Lalu */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {order.routeCode && (
              <span className="inline-flex items-center px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200/80 rounded-md text-[10.5px] font-bold tracking-wider">
                {order.routeCode}
              </span>
            )}

            {/* Tombol Ikon Copy Rapi di sebelah badge rute */}
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
              className={`p-1 rounded-md transition-all active:scale-90 shrink-0 ${copiedStoreHeader
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

            {carryOverMonthText && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-md text-[10.5px] font-semibold">
                <span>↳ Lanjutan {carryOverMonthText}</span>
              </span>
            )}
          </div>

          {/* Nama Toko */}
          <h3 className={`text-[17px] font-bold tracking-tight leading-snug break-words ${isCompleted ? 'text-zinc-500 line-through decoration-zinc-300' : 'text-zinc-900'
            }`}>
            {order.storeName}
          </h3>

          {/* Meta: Tanggal Lengkap & Jumlah Item & Total Pcs */}
          <div className="flex items-center gap-2 mt-1.5 text-[12px] text-zinc-400 font-medium flex-wrap">
            <span className="text-zinc-600">{formattedDate}</span>
            <span>·</span>
            <span className="font-semibold text-zinc-700">{orderItemsList.length} item</span>
            <span>·</span>
            <span className="font-semibold text-zinc-700">{totalQty} pcs</span>
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

      {/* Body: Cuplikan Item Ringkas dengan Pembeda Daytona vs Osram */}
      <div className="py-2.5 space-y-2">
        {groupedItems.isMixed ? (
          <>
            {/* Bagian Daytona & Dura */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-orange-800 bg-orange-50/80 px-2 py-0.5 rounded-md border border-orange-200/70">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]"></span>
                  <span>DAYTONA & DURA</span>
                </span>
                <span className="text-[10.5px] font-semibold text-orange-700">
                  {groupedItems.daytonaGroupItems.length} part · {groupedItems.totalDaytonaQty} pcs
                </span>
              </div>
              {groupedItems.daytonaGroupItems.slice(0, 2).map((item, idx) => (
                <div
                  key={`d-${idx}`}
                  className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-zinc-100/70 transition-colors"
                >
                  <div className="flex items-baseline gap-2 min-w-0 truncate">
                    <span className="text-zinc-400 text-[13px] select-none font-bold">-</span>
                    <span className="font-mono font-bold text-[#EA580C] text-[14px] tracking-tight shrink-0">
                      {item.pn}
                    </span>
                    {item.brand === 'dura' && (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0 bg-sky-100 text-sky-700 border border-sky-200">
                        Dura
                      </span>
                    )}
                    <span className="text-zinc-400 text-[12.5px] font-semibold">:</span>
                    <span className="font-bold text-zinc-900 text-[13.5px] shrink-0">
                      {item.qty} <span className="text-[10.5px] font-medium text-zinc-500">PCS</span>
                    </span>
                    {item.description && (
                      <span className="text-zinc-400 text-[12px] truncate font-normal ml-1">
                        ({item.description})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleCopySinglePn(item.pn, e)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ml-2 shrink-0 ${copiedPn === item.pn
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-zinc-100/80 hover:bg-zinc-200 text-zinc-600 active:scale-95'
                      }`}
                    title="Salin PN ke clipboard"
                  >
                    {copiedPn === item.pn ? 'Tersalin' : 'Salin PN'}
                  </button>
                </div>
              ))}
              {groupedItems.daytonaGroupItems.length > 2 && (
                <div className="text-[11px] text-zinc-400 px-2 italic">
                  +{groupedItems.daytonaGroupItems.length - 2} part Daytona lainnya...
                </div>
              )}
            </div>

            {/* Bagian Osram */}
            <div className="space-y-1 pt-1 border-t border-zinc-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/70">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  <span>OSRAM</span>
                </span>
                <span className="text-[10.5px] font-semibold text-amber-800">
                  {groupedItems.osramItems.length} part · {groupedItems.totalOsramQty} pcs
                </span>
              </div>
              {groupedItems.osramItems.slice(0, 2).map((item, idx) => (
                <div
                  key={`o-${idx}`}
                  className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-zinc-100/70 transition-colors"
                >
                  <div className="flex items-baseline gap-2 min-w-0 truncate">
                    <span className="text-zinc-400 text-[13px] select-none font-bold">-</span>
                    <span className="font-mono font-bold text-amber-800 text-[14px] tracking-tight shrink-0">
                      {item.pn}
                    </span>
                    <span className="text-zinc-400 text-[12.5px] font-semibold">:</span>
                    <span className="font-bold text-zinc-900 text-[13.5px] shrink-0">
                      {item.qty} <span className="text-[10.5px] font-medium text-zinc-500">PCS</span>
                    </span>
                    {item.description && (
                      <span className="text-zinc-400 text-[12px] truncate font-normal ml-1">
                        ({item.description})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleCopySinglePn(item.pn, e)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ml-2 shrink-0 ${copiedPn === item.pn
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-zinc-100/80 hover:bg-zinc-200 text-zinc-600 active:scale-95'
                      }`}
                    title="Salin PN ke clipboard"
                  >
                    {copiedPn === item.pn ? 'Tersalin' : 'Salin PN'}
                  </button>
                </div>
              ))}
              {groupedItems.osramItems.length > 2 && (
                <div className="text-[11px] text-zinc-400 px-2 italic">
                  +{groupedItems.osramItems.length - 2} part Osram lainnya...
                </div>
              )}
            </div>
          </>
        ) : (
          previewItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-zinc-100/70 transition-colors"
            >
              <div className="flex items-baseline gap-2 min-w-0 truncate">
                <span className="text-zinc-400 text-[14px] select-none font-bold">-</span>

                {/* Part Number dengan warna brand */}
                <span className={`font-mono font-bold text-[15px] tracking-tight shrink-0 ${item.brand === 'osram'
                  ? 'text-amber-800'
                  : item.brand === 'dura'
                    ? 'text-sky-700'
                    : 'text-[#EA580C]'
                  }`}>
                  {item.pn}
                </span>

                {item.brand && item.brand !== 'daytona' && (
                  <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0 ${item.brand === 'osram'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-sky-100 text-sky-700 border border-sky-200'
                    }`}>
                    {item.brand}
                  </span>
                )}

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
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ml-2 shrink-0 ${copiedPn === item.pn
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
          ))
        )}
      </div>

      {/* Footer Kartu: Tombol Total Nominal dengan Diskon Pintar & Aksi Buka Rincian */}
      <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(order);
          }}
          className="flex-1 py-2 px-3.5 text-left bg-zinc-50 hover:bg-zinc-100 rounded-xl border border-zinc-200/80 hover:border-zinc-300 transition-all flex items-center justify-between group active:scale-[0.99]"
          title={`Buka rincian pesanan (${orderItemsList.length} item)`}
        >
          <div className="min-w-0 flex-1">
            <span className="font-bold text-zinc-900 text-[13.5px] tracking-tight block">
              {orderSummary.formattedText}
            </span>
            {orderSummary.isMixed && (
              <span className="text-[11px] text-zinc-500 font-medium block truncate mt-0.5">
                Daytona: {orderSummary.daytonaGroupFormatted} · Osram: {orderSummary.osramFormatted}
              </span>
            )}
          </div>
          <svg className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className={`px-3 py-2 rounded-xl text-[12px] font-semibold transition-all shrink-0 active:scale-95 ${isCompleted
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
