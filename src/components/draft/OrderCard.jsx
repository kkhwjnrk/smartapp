import React, { useState } from 'react';

function OrderCard({ 
  order, 
  onToggleStatus, 
  onEditOrder, 
  onDeleteOrder, 
  onCopyPN,
  onCopyFormatText
}) {
  const [copiedPn, setCopiedPn] = useState(null);
  const isCompleted = order.status === 'completed';

  const totalQty = order.items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  const handleCopySinglePn = (pn, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pn);
    setCopiedPn(pn);
    if (onCopyPN) onCopyPN(pn);
    setTimeout(() => setCopiedPn(null), 1500);
  };

  return (
    <div className={`bg-white rounded-3xl p-5 border transition-all duration-200 shadow-xs ${
      isCompleted 
        ? 'border-zinc-200/60 bg-zinc-50/50' 
        : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md'
    }`}>
      
      {/* Header: Checkbox Lingkaran & Nama Toko */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          
          {/* Checkbox Lingkaran Khas Apple Notes */}
          <button
            type="button"
            onClick={() => onToggleStatus(order.id)}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all mt-0.5 shrink-0 select-none ${
              isCompleted
                ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                : 'border-2 border-zinc-400/80 hover:border-amber-500 hover:bg-amber-50/50 active:scale-95'
            }`}
            title={isCompleted ? "Klik untuk mengembalikan ke Aktif" : "Klik untuk menandai Selesai diinput ke SADIX & Arsipkan"}
          >
            {isCompleted && (
              <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* Nama Toko & Rute */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-[17px] font-bold tracking-tight truncate ${
                isCompleted ? 'text-zinc-500 line-through decoration-zinc-300' : 'text-zinc-900'
              }`}>
                {order.storeName}
              </h3>
              {order.routeCode && (
                <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200/70 rounded-md text-[10px] font-bold tracking-wider">
                  {order.routeCode}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-0.5 text-[12px] text-zinc-400 font-medium">
              <span>{order.date || 'Hari ini'}</span>
              <span>·</span>
              <span>{order.items.length} Part</span>
              {isCompleted && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    Sudah di SADIX
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
            onClick={() => onCopyFormatText(order)}
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
            onClick={() => onEditOrder(order)}
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
            onClick={() => onDeleteOrder(order.id)}
            className="p-1.5 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus Order"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body: Daftar Item Format Catatan (- PN : Qty) */}
      <div className="py-2.5 space-y-1">
        {order.items.map((item, idx) => (
          <div 
            key={idx}
            className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-zinc-100/70 transition-colors group/item"
          >
            <div className="flex items-baseline gap-2 min-w-0 truncate">
              <span className="text-zinc-400 text-[14px] select-none font-bold">-</span>
              
              {/* Part Number Oranye Daytona khas racing */}
              <span className="font-mono font-bold text-[#EA580C] text-[15px] tracking-tight shrink-0">
                {item.pn}
              </span>
              
              <span className="text-zinc-400 text-[13px] font-semibold">:</span>
              
              {/* Qty */}
              <span className="font-bold text-zinc-900 text-[14.5px] shrink-0">
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
              title="Salin PN ke clipboard untuk paste di SADIX"
            >
              {copiedPn === item.pn ? (
                <>
                  <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
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

      {/* Footer Ringkasan Card */}
      <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[12px] text-zinc-500 font-medium">
        <span>Total: <strong className="text-zinc-900">{order.items.length}</strong> part · <strong className="text-zinc-900">{totalQty}</strong> PCS</span>
        
        {isCompleted ? (
          <button
            type="button"
            onClick={() => onToggleStatus(order.id)}
            className="text-zinc-500 hover:text-zinc-800 underline text-[11.5px]"
          >
            Kembalikan ke Aktif
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onToggleStatus(order.id)}
            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold text-[11.5px] bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors"
          >
            <span>Tandai Selesai SADIX</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

    </div>
  );
}

export default OrderCard;
