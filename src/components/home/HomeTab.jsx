import React, { useState, useMemo } from 'react';
import { formatStoreCustomerHeader } from '../../utils/formatters';
import { getTodayIso } from '../../utils/date';
import { getDailyVisitCount } from '../../utils/visitUtils';

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDO_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function getTodayFormattedText() {
  const now = new Date();
  return `${INDO_DAYS[now.getDay()]}, ${now.getDate()} ${INDO_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

function HomeTab({ 
  orders = [], 
  stores = [], 
  onOpenDraft, 
  onOpenPricelist, 
  onOpenStores, 
  onOpenAddOrder, 
  onOpenEditOrder,
  onOpenCategories,
  visits = [],
  onOpenVisitRecap,
  onOpenWeeklySchedule
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedStore, setCopiedStore] = useState('');

  const [todayIso] = useState(getTodayIso);
  const todayVisitCount = useMemo(() => getDailyVisitCount(visits, todayIso), [visits, todayIso]);
  const handleOpenSchedule = onOpenWeeklySchedule;

  // Sapaan Waktu Otomatis & Tanggal Hari Ini
  const [greeting] = useState(getGreeting);
  const [todayText] = useState(getTodayFormattedText);

  // Order Aktif / Pending (Urut dari terlama dulu di atas)
  const pendingOrders = useMemo(() => {
    return [...orders.filter(o => o.status === 'pending')].sort((a, b) => {
      const timeA = a.createdAt || (a.dateIso ? new Date(a.dateIso).getTime() : 0);
      const timeB = b.createdAt || (b.dateIso ? new Date(b.dateIso).getTime() : 0);
      return timeA - timeB;
    });
  }, [orders]);

  const pendingOrdersCount = pendingOrders.length;

  // Total Quantity Barang Dipesan pada Order Pending
  const totalPendingQty = useMemo(() => {
    return pendingOrders.reduce((sum, o) => {
      const itemsQty = o.items ? o.items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0) : 0;
      return sum + itemsQty;
    }, 0);
  }, [pendingOrders]);

  // Handler Submit Pencarian Cepat (Omnibar)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // Cek apakah query kemungkinan mencari Toko (nama, customerId, rute)
    const isStoreMatch = stores.some(s => 
      (s.name && s.name.toLowerCase().includes(q.toLowerCase())) ||
      (s.customerId && s.customerId.toLowerCase().includes(q.toLowerCase())) ||
      (s.routeCode && s.routeCode.toLowerCase().includes(q.toLowerCase()))
    );

    if (isStoreMatch) {
      if (onOpenStores) onOpenStores(null, q);
    } else {
      if (onOpenPricelist) onOpenPricelist(null, q);
    }
  };

  // Kategori Populer Cepat
  const popularCategories = [
    { name: 'Busi', icon: '⚡' },
    { name: 'Kampas Rem', icon: '🛑' },
    { name: 'Vanbelt', icon: '⚙️' },
    { name: 'Roller', icon: '🔘' },
    { name: 'Kampas Ganda', icon: '🏍️' },
    { name: 'Filter Udara', icon: '💨' }
  ];

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-300 pb-6">
      
      {/* 1. HERO GREETING & DATE BANNER */}
      <div className="flex items-center justify-between pt-0.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13.5px] sm:text-[14px] text-zinc-500 font-medium">{greeting},</span>
            <span className="text-[13.5px] sm:text-[14px] font-bold text-zinc-900">Sales 👋</span>
          </div>
          <p className="text-[11.5px] sm:text-[12px] text-zinc-500 mt-0.5">
            {pendingOrdersCount > 0 
              ? `${pendingOrdersCount} toko menunggu diproses` 
              : 'Semua order telah rapi tercatat'}
          </p>
        </div>
        <div className="bg-zinc-100/90 border border-zinc-200/80 px-2.5 py-1 rounded-xl text-right shrink-0">
          <span className="text-[10.5px] sm:text-[11px] font-semibold text-zinc-600 block">
            {todayText}
          </span>
        </div>
      </div>

      {/* 2. OMNIBAR PENCARIAN CEPAT */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative flex items-center">
          <svg 
            className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text"
            placeholder="Cari toko, rute, atau part number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-20 py-2.5 bg-white border border-zinc-200/90 rounded-2xl text-[12.5px] sm:text-[13px] font-medium placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 shadow-2xs transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-12 text-zinc-400 hover:text-zinc-600 text-[12px] px-1"
            >
              ✕
            </button>
          ) : null}
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] sm:text-[11.5px] font-semibold rounded-xl transition-colors shadow-2xs"
          >
            Cari
          </button>
        </div>
      </form>

      {/* 3. DUA KARTU METRIK ESENSIAL: ORDER AKTIF & KUNJUNGAN HARI INI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* KARTU 1: PESANAN BERJALAN (DRAFT) */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-2xs relative overflow-hidden flex flex-col justify-between">
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-[11.5px] font-bold text-zinc-400 tracking-wider uppercase">
                Pesanan Berjalan
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                pendingOrdersCount > 0 
                  ? 'bg-orange-500/25 text-orange-300 border border-orange-500/35' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pendingOrdersCount > 0 ? 'bg-orange-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                {pendingOrdersCount > 0 ? `${pendingOrdersCount} Toko Pending` : 'Semua Beres'}
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {pendingOrdersCount}
              </span>
              <span className="text-[12px] sm:text-[12.5px] text-zinc-300 font-medium">
                Toko · {totalPendingQty} Pcs Barang
              </span>
            </div>
            <p className="text-[11.5px] text-zinc-400 mt-1">
              {pendingOrdersCount > 0 
                ? 'Segera selesaikan sebelum jadwal kirim' 
                : 'Belum ada antrean, siap untuk order baru'}
            </p>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-zinc-700/60">
            <button
              type="button"
              onClick={onOpenAddOrder}
              className="py-2.5 px-3 bg-[#EA580C] hover:bg-orange-600 active:scale-95 text-white rounded-xl text-[12px] font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Buat Order</span>
            </button>
            <button
              type="button"
              onClick={onOpenDraft}
              className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white rounded-xl text-[12px] font-semibold transition-all flex items-center justify-center gap-1 border border-zinc-700/80"
            >
              <span>Buka Draft</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* KARTU 2: KUNJUNGAN HARI INI */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-zinc-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-[11.5px] font-bold text-zinc-400 tracking-wider uppercase">
                Kunjungan Hari Ini
              </span>
              <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                todayVisitCount >= 12
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-orange-50 text-orange-800 border-orange-200'
              }`}>
                {todayVisitCount >= 12 ? '✓ Target Tercapai' : `Target: 12 Toko`}
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
                {todayVisitCount}
              </span>
              <span className="text-[12px] sm:text-[12.5px] text-zinc-500 font-medium">
                / 12 Toko ({todayVisitCount >= 12 ? '100%' : `${Math.round((todayVisitCount / 12) * 100)}%`})
              </span>
            </div>

            {/* Progress Bar Harian */}
            <div className="w-full bg-zinc-100 rounded-full h-2 mt-2 overflow-hidden border border-zinc-200/60">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  todayVisitCount >= 12 ? 'bg-emerald-500' : 'bg-[#EA580C]'
                }`}
                style={{ width: `${Math.min(100, Math.round((todayVisitCount / 12) * 100))}%` }}
              />
            </div>
            <p className="text-[11.5px] text-zinc-500 mt-1.5">
              {todayVisitCount >= 12 
                ? 'Luar biasa! Target minimal 12 kunjungan telah terpenuhi.' 
                : `Tersisa ${Math.max(0, 12 - todayVisitCount)} toko lagi untuk mencapai target harian.`}
            </p>
          </div>

          {/* Quick Actions: Rekap Hari Ini & Jadwal SPV */}
          <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onOpenVisitRecap}
              className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white rounded-xl text-[12px] font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>🌙 Rekap Hari Ini</span>
            </button>
            <button
              type="button"
              onClick={handleOpenSchedule}
              className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200/80 rounded-xl text-[12px] font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>📋 Jadwal Mingguan</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. SHORTCUT KATEGORI PART CEPAT */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 border border-zinc-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[12px] sm:text-[12.5px] font-bold text-zinc-800">
            Kategori Part Cepat
          </span>
          {onOpenCategories && (
            <button 
              type="button"
              onClick={onOpenCategories}
              className="text-[11.5px] font-semibold text-[#EA580C] hover:text-orange-700 transition-colors"
            >
              Semua Kategori →
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {popularCategories.map(cat => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onOpenPricelist && onOpenPricelist(cat.name)}
              className="p-2.5 bg-zinc-50 hover:bg-orange-50/70 border border-zinc-200/60 hover:border-orange-200 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-1 transition-all text-center group active:scale-95"
            >
              <span className="text-base group-hover:scale-110 transition-transform">
                {cat.icon}
              </span>
              <span className="text-[11px] sm:text-[11.5px] font-semibold text-zinc-700 group-hover:text-orange-700 leading-tight truncate w-full">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. PREVIEW ORDER BERJALAN (Hanya muncul jika ada order pending) */}
      {pendingOrdersCount > 0 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 border border-zinc-200/80 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="text-[12px] sm:text-[12.5px] font-bold text-zinc-900">
                Toko Perlu Diproses ({pendingOrdersCount})
              </span>
            </div>
            <button 
              type="button"
              onClick={onOpenDraft}
              className="text-[11.5px] font-semibold text-zinc-500 hover:text-zinc-800"
            >
              Lihat Semua →
            </button>
          </div>

          <div className="space-y-2">
            {pendingOrders.slice(0, 3).map(order => {
              const orderItemsCount = order.items ? order.items.length : 0;
              const orderQty = order.items ? order.items.reduce((s, it) => s + (Number(it.qty) || 0), 0) : 0;
              const formattedStore = formatStoreCustomerHeader(order, stores);
              const isCopied = copiedStore === formattedStore;

              return (
                <div 
                  key={order.id}
                  onClick={() => onOpenEditOrder ? onOpenEditOrder(order) : onOpenDraft()}
                  className="p-3 bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/70 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2.5 transition-all cursor-pointer group active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {order.routeCode && (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold rounded">
                          {order.routeCode}
                        </span>
                      )}
                      <h4 className="font-bold text-zinc-900 text-[12.5px] sm:text-[13px] truncate">
                        {order.storeName}
                      </h4>
                    </div>
                    <p className="text-[11px] sm:text-[11.5px] text-zinc-500 mt-0.5">
                      {orderItemsCount} Part · {orderQty} Pcs Barang
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(formattedStore);
                        setCopiedStore(formattedStore);
                        setTimeout(() => setCopiedStore(''), 1500);
                      }}
                      className={`p-1.5 rounded-xl border transition-all active:scale-90 shrink-0 ${
                        isCopied 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                          : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200/80'
                      }`}
                      title={`Salin ID & Toko: "${formattedStore}"`}
                    >
                      {isCopied ? (
                        <svg className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenEditOrder) onOpenEditOrder(order);
                        else onOpenDraft();
                      }}
                      className="px-2.5 py-1 bg-white border border-zinc-300 hover:border-zinc-400 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 text-zinc-700 rounded-xl text-[11px] font-bold transition-all shadow-2xs"
                    >
                      Buka
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

export default HomeTab;
