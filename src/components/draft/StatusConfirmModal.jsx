import React from 'react';
import { createPortal } from 'react-dom';

function StatusConfirmModal({
  isOpen,
  order,
  onConfirm,
  onCancel
}) {
  if (!isOpen || !order) return null;

  const isCompleted = order.status === 'completed';

  const modalContent = (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-xs transition-opacity"
        onClick={onCancel}
      />

      {/* Dialog Box */}
      <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200">
        
        {/* Icon status */}
        <div className="flex justify-center mb-4">
          {isCompleted ? (
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center shadow-inner">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-xs">
              <svg className="w-7 h-7 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="text-center mb-6">
          <h3 className="text-[17px] font-bold text-zinc-900 tracking-tight mb-2">
            {isCompleted ? 'Kembalikan ke Order Aktif?' : 'Selesaikan Order Toko?'}
          </h3>
          <p className="text-[13px] text-zinc-500 leading-relaxed px-1">
            {isCompleted ? (
              <>
                Pindahkan pesanan toko <strong className="text-zinc-800">{order.storeName}</strong> kembali ke daftar <strong>Order Aktif</strong>?
              </>
            ) : (
              <>
                Tandai seluruh pesanan untuk toko <strong className="text-zinc-800">{order.storeName}</strong> sebagai selesai dan pindahkan ke <strong>Arsip</strong>?
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[13.5px] rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(order.id)}
            className={`flex-1 py-3 text-white font-semibold text-[13.5px] rounded-xl transition-all shadow-xs active:scale-95 ${
              isCompleted
                ? 'bg-zinc-900 hover:bg-zinc-800'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isCompleted ? 'Ya, Kembalikan' : 'Ya, Selesaikan'}
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

export default StatusConfirmModal;
