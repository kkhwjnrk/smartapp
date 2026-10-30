import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import OrderCard from './OrderCard';
import OrderDetailModal from './OrderDetailModal';
import StatusConfirmModal from './StatusConfirmModal';
import { 
  getCurrentMonthKey, 
  formatMonthKeyDisplay, 
  getOrderMonthKey 
} from '../../utils/date';
import { 
  groupOrderItemsByBrand, 
  formatOrderNotesText 
} from '../../utils/formatters';

function DraftTab({
  orders = [],
  stores = [],
  catalogItems = [],
  onToggleOrderStatus,
  onOpenAddOrder,
  onOpenEditOrder,
  onDeleteOrder,
  selectedMonthKey: propSelectedMonthKey,
  currentMonthKey: propCurrentMonthKey
}) {
  const [orderSubTab, setOrderSubTab] = useState('active'); // 'active' | 'archive'
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('all'); // 'all' | 'daytona' | 'osram'
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Gunakan bulan dari props (dikelola di Header) dengan fallback aman
  const currentMonthKey = propCurrentMonthKey || getCurrentMonthKey();
  const selectedMonthKey = propSelectedMonthKey || currentMonthKey;

  // State untuk Modal Halaman Penuh Rincian Order
  const [selectedDetailOrderId, setSelectedDetailOrderId] = useState(null);

  // State untuk Dialog Konfirmasi Ceklis / Status
  const [orderToConfirmStatus, setOrderToConfirmStatus] = useState(null);

  const isViewingCurrentMonth = selectedMonthKey === currentMonthKey;
  const isViewingAllMonths = selectedMonthKey === 'all';

  // Dapatkan order yang sedang dibuka di modal detail secara reaktif dari list orders
  const selectedDetailOrder = useMemo(() => {
    if (!selectedDetailOrderId) return null;
    return orders.find(o => o.id === selectedDetailOrderId) || null;
  }, [selectedDetailOrderId, orders]);

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

  // Salin seluruh format catatan toko dengan pemisah brand yang rapi (mirip Notes HP)
  const handleCopyFormatText = (order) => {
    const text = formatOrderNotesText(order, stores, 'all', catalogItems);
    navigator.clipboard.writeText(text);
    showToast(`Format catatan ${order.storeName} tersalin!`);
  };

  // Salin "[ID Customer] [Nama Toko]"
  const handleCopyStoreHeader = (formattedText) => {
    navigator.clipboard.writeText(formattedText);
    showToast(`✓ "${formattedText}" tersalin!`);
  };

  // Buka konfirmasi sebelum mengubah status
  const handleRequestToggleStatus = (order) => {
    setOrderToConfirmStatus(order);
  };

  // Eksekusi perubahan status setelah dikonfirmasi pengguna
  const handleConfirmToggleStatus = (orderId) => {
    const target = orders.find(o => o.id === orderId);
    if (!target) return;
    const willComplete = target.status === 'pending';
    onToggleOrderStatus(orderId);
    setOrderToConfirmStatus(null);

    if (willComplete) {
      showToast(`✓ Order ${target.storeName} dipindahkan ke Arsip`);
    } else {
      showToast(`Order ${target.storeName} dikembalikan ke Aktif`);
    }
  };

  // Filter orders berdasarkan periode bulan terpilih dan tab Aktif / Arsip
  const { activeOrders, archivedOrders, currentDisplayedOrders, carryOverCount } = useMemo(() => {
    // 1. Order Aktif
    const active = orders.filter(order => {
      if (order.status !== 'pending') return false;
      if (isViewingAllMonths) return true;
      const orderMonth = getOrderMonthKey(order);
      if (isViewingCurrentMonth) {
        // Tampilkan order bulan ini + order bulan lalu yang masih pending (carry-over otomatis)
        return orderMonth <= currentMonthKey;
      }
      return orderMonth === selectedMonthKey;
    });

    // Urutkan order aktif dari TERLAMA dulu mulai dari atas (FIFO agar orderan lama bisa terinput duluan)
    active.sort((a, b) => {
      const timeA = a.createdAt || (a.dateIso ? new Date(a.dateIso).getTime() : 0);
      const timeB = b.createdAt || (b.dateIso ? new Date(b.dateIso).getTime() : 0);
      return timeA - timeB;
    });

    // Hitung berapa order carry-over yang aktif di bulan ini
    let carryCount = 0;
    if (isViewingCurrentMonth) {
      carryCount = active.filter(o => getOrderMonthKey(o) < currentMonthKey).length;
    }

    // 2. Order Arsip (Terbaru selesai di atas)
    const archive = orders.filter(order => {
      if (order.status !== 'completed') return false;
      if (isViewingAllMonths) return true;
      const orderMonth = getOrderMonthKey(order);
      return orderMonth === selectedMonthKey;
    });

    archive.sort((a, b) => {
      const timeA = b.completedAt || b.createdAt || 0;
      const timeB = a.completedAt || a.createdAt || 0;
      return timeA - timeB;
    });

    const listToFilter = orderSubTab === 'active' ? active : archive;

    // Hitung jumlah order per brand filter untuk subtab saat ini
    let daytonaOrdersCount = 0;
    let osramOrdersCount = 0;
    listToFilter.forEach(order => {
      const grouped = groupOrderItemsByBrand(order.items || [], catalogItems);
      if (grouped.hasDaytonaGroup) daytonaOrdersCount++;
      if (grouped.hasOsram) osramOrdersCount++;
    });

    // Filter berdasarkan Brand (Daytona / Osram / Semua)
    const brandFiltered = listToFilter.filter(order => {
      if (selectedBrandFilter === 'daytona') {
        const grouped = groupOrderItemsByBrand(order.items || [], catalogItems);
        return grouped.hasDaytonaGroup;
      }
      if (selectedBrandFilter === 'osram') {
        const grouped = groupOrderItemsByBrand(order.items || [], catalogItems);
        return grouped.hasOsram;
      }
      return true;
    });

    // 3. Pencarian Teks
    const filtered = brandFiltered.filter(order => {
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
      currentDisplayedOrders: filtered,
      carryOverCount: carryCount,
      brandCounts: {
        all: listToFilter.length,
        daytona: daytonaOrdersCount,
        osram: osramOrdersCount
      }
    };
  }, [orders, orderSubTab, selectedBrandFilter, searchQuery, selectedMonthKey, isViewingCurrentMonth, isViewingAllMonths, currentMonthKey, catalogItems]);

  return (
    <div className="space-y-3.5 pb-12 animate-in fade-in duration-300">

      {/* Informasi Bawaan / Carry-Over jika ada order bulan lalu yang belum selesai (Slim & Rapi) */}
      {isViewingCurrentMonth && carryOverCount > 0 && (
        <div className="flex items-center justify-between text-[12px] px-3.5 py-2.5 text-amber-800 bg-amber-50/80 border border-amber-200/70 rounded-2xl shadow-2xs">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span><strong>{carryOverCount} toko</strong> memiliki order lanjutan dari bulan lalu</span>
          </span>
          <span className="text-[10.5px] font-bold bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-lg shrink-0">
            Perlu Diproses
          </span>
        </div>
      )}

      {/* Top Segmented Control: Aktif vs Arsip */}
      <div className="flex bg-zinc-100 p-1 rounded-2xl shadow-2xs">
        <button
          type="button"
          onClick={() => setOrderSubTab('active')}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            orderSubTab === 'active'
              ? 'bg-white text-zinc-900 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span>Order Aktif</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
            orderSubTab === 'active' ? 'bg-orange-50 text-orange-700' : 'bg-zinc-200 text-zinc-600'
          }`}>
            {activeOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOrderSubTab('archive')}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            orderSubTab === 'archive'
              ? 'bg-white text-zinc-900 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span>Arsip</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
            orderSubTab === 'archive' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-200 text-zinc-600'
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
            placeholder={orderSubTab === 'active' ? "Cari toko, PN, atau tanggal..." : "Cari di arsip..."}
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

      {/* Brand Filter Pills: Pembeda Order Daytona vs Osram */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedBrandFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            selectedBrandFilter === 'all'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'bg-white border border-zinc-200/90 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
          }`}
        >
          <span>Semua Brand</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            selectedBrandFilter === 'all' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
          }`}>
            {brandCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedBrandFilter('daytona')}
          className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            selectedBrandFilter === 'daytona'
              ? 'bg-[#EA580C] text-white shadow-xs'
              : 'bg-white border border-zinc-200/90 text-zinc-700 hover:text-orange-700 hover:border-orange-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#EA580C] shrink-0" style={{ display: selectedBrandFilter === 'daytona' ? 'none' : 'inline-block' }}></span>
          <span>Daytona</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            selectedBrandFilter === 'daytona' ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-700'
          }`}>
            {brandCounts.daytona}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedBrandFilter('osram')}
          className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            selectedBrandFilter === 'osram'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-zinc-200/90 text-zinc-700 hover:text-amber-800 hover:border-amber-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" style={{ display: selectedBrandFilter === 'osram' ? 'none' : 'inline-block' }}></span>
          <span>Osram</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            selectedBrandFilter === 'osram' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-800'
          }`}>
            {brandCounts.osram}
          </span>
        </button>
      </div>

      {/* Info Bar Jumlah Tampilan */}
      <div className="flex items-center justify-between text-[12px] text-zinc-500 px-1">
        <span>
          Menampilkan <strong>{currentDisplayedOrders.length} toko</strong>
          {selectedBrandFilter !== 'all' ? ` (${selectedBrandFilter === 'daytona' ? 'Order Daytona' : 'Order Osram'})` : ''} 
          {' '}&bull; {orderSubTab === 'active' ? 'Perlu Diproses' : 'Riwayat Arsip'} ({formatMonthKeyDisplay(selectedMonthKey)})
        </span>
        {(searchQuery || selectedBrandFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedBrandFilter('all');
            }}
            className="text-zinc-600 hover:text-zinc-900 underline font-medium text-[11.5px]"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Daftar Order Cards */}
      {currentDisplayedOrders.length > 0 ? (
        <div className="space-y-3.5">
          {currentDisplayedOrders.map(order => {
            const orderMonth = getOrderMonthKey(order);
            const isCarryOver = isViewingCurrentMonth && order.status === 'pending' && orderMonth < currentMonthKey;
            const carryOverMonthText = isCarryOver ? formatMonthKeyDisplay(orderMonth) : null;

            return (
              <OrderCard
                key={order.id}
                order={order}
                stores={stores}
                catalogItems={catalogItems}
                carryOverMonthText={carryOverMonthText}
                onRequestToggleStatus={handleRequestToggleStatus}
                onOpenDetail={(o) => setSelectedDetailOrderId(o.id)}
                onEditOrder={onOpenEditOrder}
                onDeleteOrder={onDeleteOrder}
                onCopyPN={handleCopyPN}
                onCopyFormatText={handleCopyFormatText}
                onCopyStoreHeader={handleCopyStoreHeader}
              />
            );
          })}
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
              ? (searchQuery 
                  ? 'Order tidak ditemukan' 
                  : (isViewingCurrentMonth 
                      ? 'Semua Order Sudah Selesai Diproses 🎉' 
                      : `Catatan Bersih - ${formatMonthKeyDisplay(selectedMonthKey)}`))
              : (searchQuery 
                  ? 'Arsip tidak ditemukan' 
                  : `Belum Ada Riwayat di ${formatMonthKeyDisplay(selectedMonthKey)}`)}
          </h4>

          <p className="text-[13px] text-zinc-500 mt-1 max-w-xs mx-auto">
            {orderSubTab === 'active'
              ? (searchQuery
                ? `Tidak ada toko atau PN yang cocok dengan "${searchQuery}"`
                : (isViewingCurrentMonth
                    ? 'Bagus! Semua pesanan toko saat ini sudah selesai dicentang.'
                    : `Lembaran catatan untuk ${formatMonthKeyDisplay(selectedMonthKey)} masih kosong.`))
              : (searchQuery
                ? `Tidak ada riwayat arsip dengan kata kunci "${searchQuery}"`
                : 'Pesanan toko yang telah selesai di bulan ini akan tersimpan di sini.')}
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

      {/* Modal Halaman Penuh Rincian Order */}
      {selectedDetailOrder && (
        <OrderDetailModal
          isOpen={!!selectedDetailOrder}
          order={selectedDetailOrder}
          onClose={() => setSelectedDetailOrderId(null)}
          onRequestToggleStatus={(order) => {
            handleRequestToggleStatus(order);
          }}
          onEditOrder={onOpenEditOrder}
          onDeleteOrder={onDeleteOrder}
          onCopyPN={handleCopyPN}
          onCopyFormatText={handleCopyFormatText}
          onCopyStoreHeader={handleCopyStoreHeader}
          stores={stores}
          catalogItems={catalogItems}
        />
      )}

      {/* Modal Dialog Konfirmasi Ceklis Status */}
      <StatusConfirmModal
        isOpen={!!orderToConfirmStatus}
        order={orderToConfirmStatus}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => setOrderToConfirmStatus(null)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-100 bg-zinc-900 text-white px-4 py-2.5 rounded-full text-[12.5px] font-semibold shadow-xl border border-zinc-700/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none"
          style={{ zIndex: 110 }}
        >
          <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>,
        document.body
      )}

    </div>
  );
}

export default DraftTab;
