import React, { useState, useMemo, useRef } from 'react';
import OrderCard from './OrderCard';

function DraftTab({
  orders = [],
  onToggleOrderStatus,
  onOpenAddOrder,
  onOpenEditOrder,
  onDeleteOrder
}) {
  const [orderSubTab, setOrderSubTab] = useState('active'); // 'active' | 'archive'
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Trigger floating toast
  const showToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
    }, 2200);
  };

  // Salin Part Number tunggal
  const handleCopyPN = (pn) => {
    showToast(`PN ${pn} tersalin!`);
  };

  // Salin seluruh format catatan toko (mirip Notes HP)
  const handleCopyFormatText = (order) => {
    const lines = [
      order.storeName,
      ...order.items.map(item => `- ${item.pn}: ${item.qty}`)
    ];
    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    showToast(`Format catatan ${order.storeName} tersalin!`);
  };

  // Toggle order status dengan feedback toast
  const handleToggleStatusWithToast = (orderId) => {
    const target = orders.find(o => o.id === orderId);
    if (!target) return;
    const willComplete = target.status === 'pending';
    onToggleOrderStatus(orderId);
    if (willComplete) {
      showToast(`✓ Order ${target.storeName} dipindahkan ke Arsip`);
    } else {
      showToast(`Order ${target.storeName} dikembalikan ke Aktif`);
    }
  };

  // Filter orders berdasarkan tab Aktif / Arsip dan search query
  const { activeOrders, archivedOrders, currentDisplayedOrders } = useMemo(() => {
    const active = orders.filter(o => o.status === 'pending');
    const archive = orders.filter(o => o.status === 'completed');

    const listToFilter = orderSubTab === 'active' ? active : archive;

    const filtered = listToFilter.filter(order => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchStore = order.storeName?.toLowerCase().includes(q);
      const matchRoute = order.routeCode?.toLowerCase().includes(q);
      const matchDate = order.date?.toLowerCase().includes(q);
      const matchPn = order.items?.some(i => i.pn?.toLowerCase().includes(q));
      const matchDesc = order.items?.some(i => i.description?.toLowerCase().includes(q));
      return matchStore || matchRoute || matchDate || matchPn || matchDesc;
    });

    return {
      activeOrders: active,
      archivedOrders: archive,
      currentDisplayedOrders: filtered
    };
  }, [orders, orderSubTab, searchQuery]);

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-300">

      {/* Top Segmented Control: Aktif vs Arsip */}
      <div className="flex bg-zinc-100 p-1 rounded-2xl shadow-2xs">
        <button
          type="button"
          onClick={() => setOrderSubTab('active')}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${orderSubTab === 'active'
              ? 'bg-white text-zinc-900 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800'
            }`}
        >
          <span>Order Aktif</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${orderSubTab === 'active' ? 'bg-orange-50 text-orange-700' : 'bg-zinc-200 text-zinc-600'
            }`}>
            {activeOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOrderSubTab('archive')}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${orderSubTab === 'archive'
              ? 'bg-white text-zinc-900 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800'
            }`}
        >
          <span>Arsip</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${orderSubTab === 'archive' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-200 text-zinc-600'
            }`}>
            {archivedOrders.length}
          </span>
        </button>
      </div>

      {/* Bar Pencarian & Tombol Catat Order */}
      <div className="flex gap-2.5 items-center">
        {/* Kolom Cari dengan Tombol X */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={orderSubTab === 'active' ? "Cari toko, PN, atau tanggal..." : "Cari di arsip order..."}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-zinc-200/80 rounded-2xl text-[14px] focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all shadow-2xs placeholder:text-zinc-400 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
              title="Hapus pencarian"
            >
              <svg className="w-4 h-4 bg-zinc-200/70 hover:bg-zinc-300/80 rounded-full p-0.5 text-zinc-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tombol Catat Order Baru */}
        <button
          onClick={onOpenAddOrder}
          className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-[13.5px] font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Catat Order</span>
        </button>
      </div>

      {/* Info Bar */}
      <div className="flex items-center justify-between text-[12px] text-zinc-500 px-1">
        <span>
          {orderSubTab === 'active'
            ? `Menampilkan ${currentDisplayedOrders.length} toko menunggu diproses`
            : `Menampilkan ${currentDisplayedOrders.length} riwayat toko di arsip`}
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-zinc-600 hover:text-zinc-900 underline font-medium"
          >
            Reset cari
          </button>
        )}
      </div>

      {/* Daftar Order Cards */}
      {currentDisplayedOrders.length > 0 ? (
        <div className="space-y-3.5">
          {currentDisplayedOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onToggleStatus={handleToggleStatusWithToast}
              onEditOrder={onOpenEditOrder}
              onDeleteOrder={onDeleteOrder}
              onCopyPN={handleCopyPN}
              onCopyFormatText={handleCopyFormatText}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200/80 p-8 shadow-2xs">
          <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-400">
            {orderSubTab === 'active' ? (
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            )}
          </div>

          <h4 className="text-[16px] font-bold text-zinc-900">
            {orderSubTab === 'active'
              ? (searchQuery ? 'Order tidak ditemukan' : 'Semua Order Sudah Selesai Diproses 🎉')
              : (searchQuery ? 'Arsip tidak ditemukan' : 'Belum Ada Order di Arsip')}
          </h4>

          <p className="text-[13px] text-zinc-500 mt-1 max-w-xs mx-auto">
            {orderSubTab === 'active'
              ? (searchQuery
                ? `Tidak ada toko atau PN yang cocok dengan "${searchQuery}"`
                : 'Bagus! Semua pesanan toko saat ini sudah selesai dicentang.')
              : (searchQuery
                ? `Tidak ada riwayat arsip dengan kata kunci "${searchQuery}"`
                : 'Order toko yang sudah selesai akan otomatis tersimpan di sini.')}
          </p>

          <div className="mt-5 flex justify-center gap-2">
            {orderSubTab === 'active' ? (
              <button
                onClick={onOpenAddOrder}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-[13px] rounded-xl transition-all shadow-xs"
              >
                + Catat Order Toko Baru
              </button>
            ) : (
              <button
                onClick={() => setOrderSubTab('active')}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[13px] rounded-xl transition-all"
              >
                Lihat Order Aktif
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-full text-[12.5px] font-semibold shadow-xl border border-zinc-700/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

export default DraftTab;
