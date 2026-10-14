import React, { useState, useMemo } from 'react';
import { formatFullIndonesianDate } from '../../utils/date';

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Kategori Terpopuler Daytona untuk Quick Access
const POPULAR_CATEGORIES = [
  { name: 'Busi', icon: '⚡', desc: 'Ignimax & Double Iridium' },
  { name: 'Vanbelt', icon: '⚙️', desc: 'Ultra Drive & Kevlar' },
  { name: 'Kampas Rem', icon: '🛑', desc: 'Lapiston & Super Stock' },
  { name: 'Kampas Ganda Matic', icon: '🛵', desc: 'Clutch Shoe Racing' },
  { name: 'Roller', icon: '🌀', desc: 'Weight Roller CVT' },
  { name: 'Filter Udara', icon: '🌪️', desc: 'Hi-Flow Element' },
  { name: 'Per CVT', icon: '🔧', desc: '1000 - 1500 RPM' },
  { name: 'Disc Rotor', icon: '💿', desc: 'Floating & Wave' }
];

function HomeTab({ 
  orders = [],
  stores = [],
  items = [],
  cartCount = 0, 
  itemsCount = 568, 
  categoriesCount = 30, 
  storesCount = 168,
  routesCount = 0,
  routesList = [],
  onOpenDraft, 
  onOpenPricelist, 
  onOpenCategories,
  onOpenStores,
  onAddOrder,
  onEditOrder,
  onToggleOrderStatus,
  onSelectCategory,
  onSelectRoute,
  onSelectDiscountTier
}) {
  const [showTips, setShowTips] = useState(false);

  // Waktu & Sapaan Dinamis
  const { greetingText, greetingIcon, formattedDate } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    let text = 'Selamat Datang';
    let icon = '👋';

    if (hour >= 4 && hour < 11) {
      text = 'Selamat Pagi';
      icon = '🌅';
    } else if (hour >= 11 && hour < 15) {
      text = 'Selamat Siang';
      icon = '☀️';
    } else if (hour >= 15 && hour < 18) {
      text = 'Selamat Sore';
      icon = '🌤️';
    } else {
      text = 'Selamat Malam';
      icon = '🌙';
    }

    const dayName = INDO_DAYS[now.getDay()];
    const dateFormatted = formatFullIndonesianDate(now.getTime());
    return {
      greetingText: text,
      greetingIcon: icon,
      formattedDate: `${dayName}, ${dateFormatted}`
    };
  }, []);

  // Statistik Toko & GPS
  const { storesWithGps, storesWithoutGps, gpsCoveragePercent } = useMemo(() => {
    const withGps = stores.filter(s => s.lat && s.lng).length;
    const withoutGps = stores.length - withGps;
    const pct = stores.length > 0 ? Math.round((withGps / stores.length) * 100) : 0;
    return {
      storesWithGps: withGps,
      storesWithoutGps: withoutGps,
      gpsCoveragePercent: pct
    };
  }, [stores]);

  // Statistik Order
  const { pendingOrders, completedOrdersCount, totalPendingPcs } = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending');
    const completed = orders.filter(o => o.status === 'completed');
    
    let pcs = 0;
    pending.forEach(o => {
      (o.items || []).forEach(it => {
        pcs += Number(it.qty || 0);
      });
    });

    return {
      pendingOrders: pending,
      completedOrdersCount: completed.length,
      totalPendingPcs: pcs
    };
  }, [orders]);

  // Top Rute Toko untuk Pill Navigasi
  const topRoutes = useMemo(() => {
    return routesList.filter(r => r !== 'Semua').slice(0, 6);
  }, [routesList]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-4">

      {/* 1. Header Ucapan & Status Sistem */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-1.5 text-zinc-500 text-[12px] font-medium">
            <span>{greetingIcon}</span>
            <span>{greetingText}, Sales Daytona</span>
          </div>
          <h2 className="text-[17px] font-extrabold text-zinc-900 tracking-tight">
            Ringkasan Penjualan
          </h2>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100/90 border border-zinc-200/60 rounded-full text-[11px] font-semibold text-zinc-600 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{formattedDate}</span>
          </span>
        </div>
      </div>

      {/* 2. Hero Performance Card (Dark Obsidian & Daytona Orange Glow) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-5 border border-zinc-800 shadow-xl shadow-zinc-900/10">
        {/* Ambient Glow Background Accent */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-orange-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Top Tagline */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold tracking-widest text-orange-400 uppercase flex items-center gap-1">
            <span className="w-1 h-3 bg-orange-500 rounded-full"></span>
            Aktivitas Order Toko
          </span>
          <span className="text-[11px] text-zinc-400 font-medium">
            Bulan Ini
          </span>
        </div>

        {/* Metric Counters Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-3 pb-4">
          {/* Order Aktif / Perlu Diproses */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] text-zinc-400 font-medium">Order Aktif</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded text-[10px] font-bold">
                  Proses Segera
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {cartCount}
              </span>
              <span className="text-[12.5px] text-zinc-400 font-medium">Toko</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 truncate">
              {cartCount > 0 ? `${totalPendingPcs} pcs pesanan tertunda` : 'Semua order beres'}
            </p>
          </div>

          {/* Selesai Diproses */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] text-zinc-400 font-medium">Selesai</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {completedOrdersCount}
              </span>
              <span className="text-[12.5px] text-zinc-400 font-medium">Toko</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 truncate">
              Total {orders.length} riwayat tercatat
            </p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="relative z-10 flex gap-2.5 pt-1">
          <button 
            type="button"
            onClick={onAddOrder}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] text-white rounded-xl text-[13px] font-bold shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Catat Order Baru</span>
          </button>

          <button 
            type="button"
            onClick={onOpenDraft}
            className="py-2.5 px-3.5 bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white/90 hover:text-white rounded-xl text-[13px] font-semibold backdrop-blur-sm transition-all flex items-center justify-center gap-1"
          >
            <span>Daftar Order</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 3. Grid 4 Menu Cepat Lapangan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Catat Order */}
        <button
          type="button"
          onClick={onAddOrder}
          className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs hover:border-orange-300 hover:shadow-sm active:scale-[0.98] transition-all text-left group flex flex-col justify-between h-24"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <span className="block text-[13px] font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
              + Order Baru
            </span>
            <span className="block text-[11px] text-zinc-400">Pilih toko & item</span>
          </div>
        </button>

        {/* Katalog Pricelist */}
        <button
          type="button"
          onClick={onOpenPricelist}
          className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 hover:shadow-sm active:scale-[0.98] transition-all text-left group flex flex-col justify-between h-24"
        >
          <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <span className="block text-[13px] font-bold text-zinc-900">
              Pricelist 568
            </span>
            <span className="block text-[11px] text-zinc-400">Cek PN & HET Netto</span>
          </div>
        </button>

        {/* 168 Toko & Rute */}
        <button
          type="button"
          onClick={onOpenStores}
          className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 hover:shadow-sm active:scale-[0.98] transition-all text-left group flex flex-col justify-between h-24"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <span className="block text-[13px] font-bold text-zinc-900">
              {storesCount} Toko
            </span>
            <span className="block text-[11px] text-zinc-400">{routesCount} Kode Rute</span>
          </div>
        </button>

        {/* Diskon Bertingkat */}
        <button
          type="button"
          onClick={() => onSelectDiscountTier && onSelectDiscountTier('24')}
          className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 hover:shadow-sm active:scale-[0.98] transition-all text-left group flex flex-col justify-between h-24"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-[13px] font-black">%</span>
          </div>
          <div>
            <span className="block text-[13px] font-bold text-zinc-900">
              Level Diskon
            </span>
            <span className="block text-[11px] text-zinc-400">24% · 27% · 29%</span>
          </div>
        </button>
      </div>

      {/* 4. Cakupan Toko & Status Titik Google Maps */}
      <div className="bg-white rounded-3xl p-4.5 border border-zinc-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              🗺️
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-zinc-900 leading-tight">
                Cakupan Rute & Titik Maps
              </h3>
              <p className="text-[11.5px] text-zinc-500">
                168 Toko Resmi · {routesCount} Wilayah Rute
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenStores}
            className="text-[11.5px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
          >
            <span>Semua Toko</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* GPS Progress Bar */}
        <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 space-y-2">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{storesWithGps} Toko Berkoordinat Maps</span>
            </span>
            <span className="font-mono font-bold text-zinc-900">{gpsCoveragePercent}%</span>
          </div>
          <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${gpsCoveragePercent}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
            <span>Sisa {storesWithoutGps} toko belum ada titik</span>
            <span className="text-orange-600 font-medium">Bisa tempel link Google Maps</span>
          </div>
        </div>

        {/* Quick Route Pills */}
        {topRoutes.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Pilih Cepat Rute:
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {topRoutes.map(route => (
                <button
                  key={route}
                  type="button"
                  onClick={() => onSelectRoute && onSelectRoute(route)}
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-zinc-200/70 rounded-xl text-[11.5px] font-semibold text-zinc-700 whitespace-nowrap active:scale-95 transition-all shrink-0"
                >
                  {route}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Daftar Order Aktif yang Perlu Diproses (Snapshot) */}
      <div className="bg-white rounded-3xl p-4.5 border border-zinc-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100/70 text-orange-700 flex items-center justify-center font-bold text-[14px]">
              📝
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-zinc-900 leading-tight">
                Order Menunggu Diproses
              </h3>
              <p className="text-[11.5px] text-zinc-500">
                {cartCount > 0 ? `${cartCount} toko pesanan aktif` : 'Tidak ada antrean pesanan'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenDraft}
            className="text-[11.5px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
          >
            <span>Semua Order</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Content Pending Orders List */}
        {pendingOrders.length > 0 ? (
          <div className="space-y-2 pt-1">
            {pendingOrders.slice(0, 3).map(order => {
              const totalItemsCount = (order.items || []).length;
              let totalQty = 0;
              (order.items || []).forEach(it => { totalQty += Number(it.qty || 0); });

              return (
                <div 
                  key={order.id}
                  className="p-3 bg-zinc-50/70 hover:bg-zinc-50 border border-zinc-200/80 rounded-2xl transition-all flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {order.customerId && (
                        <span className="px-1.5 py-0.2 bg-zinc-900 text-white rounded font-mono font-bold text-[10px]">
                          {order.customerId}
                        </span>
                      )}
                      <span className="text-[13.5px] font-bold text-zinc-900 truncate">
                        {order.storeName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="text-orange-700 font-medium">{order.routeCode || 'TANPA RUTE'}</span>
                      <span>•</span>
                      <span>{totalItemsCount} item ({totalQty} pcs)</span>
                    </div>
                  </div>

                  {/* Action Quick Toggle */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleOrderStatus && onToggleOrderStatus(order.id)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-[11px] font-bold transition-colors active:scale-95 flex items-center gap-1"
                      title="Tandai pesanan selesai diproses"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Selesai</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditOrder && onEditOrder(order)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-lg transition-colors"
                      title="Lihat rincian order"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 px-3 text-center bg-zinc-50/60 rounded-2xl border border-dashed border-zinc-200">
            <span className="text-2xl mb-1 block">✨</span>
            <p className="text-[13px] font-bold text-zinc-800">Semua Order Selesai Diproses</p>
            <p className="text-[11.5px] text-zinc-500 mt-0.5">
              Tidak ada catatan order yang tertunda. Siap untuk kunjungan toko berikutnya!
            </p>
            <button
              type="button"
              onClick={onAddOrder}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-[12px] font-medium hover:bg-zinc-800 transition-colors shadow-2xs"
            >
              <span>+ Catat Order Toko Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. Katalog Part & Kategori Populer Daytona */}
      <div className="bg-white rounded-3xl p-4.5 border border-zinc-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold text-[14px]">
              📦
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-zinc-900 leading-tight">
                Katalog Produk Daytona
              </h3>
              <p className="text-[11.5px] text-zinc-500">
                {itemsCount} Part Number Resmi · {categoriesCount} Kategori
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenCategories}
            className="text-[11.5px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
          >
            <span>Semua Kategori</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Tier Diskon Cepat */}
        <div className="grid grid-cols-4 gap-1.5 bg-zinc-100/70 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => onSelectDiscountTier && onSelectDiscountTier('het')}
            className="py-1.5 px-1 bg-white hover:bg-orange-50 hover:text-orange-700 border border-zinc-200/60 rounded-xl text-center active:scale-95 transition-all"
          >
            <span className="block text-[11px] font-bold text-zinc-900">HET</span>
            <span className="block text-[9.5px] text-zinc-500">Eceran</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectDiscountTier && onSelectDiscountTier('24')}
            className="py-1.5 px-1 bg-white hover:bg-orange-50 hover:text-orange-700 border border-zinc-200/60 rounded-xl text-center active:scale-95 transition-all"
          >
            <span className="block text-[11px] font-bold text-orange-600">D 24%</span>
            <span className="block text-[9.5px] text-zinc-500">Reguler</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectDiscountTier && onSelectDiscountTier('27')}
            className="py-1.5 px-1 bg-white hover:bg-orange-50 hover:text-orange-700 border border-zinc-200/60 rounded-xl text-center active:scale-95 transition-all"
          >
            <span className="block text-[11px] font-bold text-orange-600">D 27%</span>
            <span className="block text-[9.5px] text-zinc-500">Grosir</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectDiscountTier && onSelectDiscountTier('29')}
            className="py-1.5 px-1 bg-white hover:bg-orange-50 hover:text-orange-700 border border-zinc-200/60 rounded-xl text-center active:scale-95 transition-all"
          >
            <span className="block text-[11px] font-bold text-orange-600">D 29%</span>
            <span className="block text-[9.5px] text-zinc-500">Maks</span>
          </button>
        </div>

        {/* Kategori Populer Daytona Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {POPULAR_CATEGORIES.map(cat => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory && onSelectCategory(cat.name)}
              className="p-2.5 bg-zinc-50 hover:bg-orange-50/60 hover:border-orange-200 border border-zinc-200/60 rounded-2xl text-left transition-all active:scale-[0.98] group flex items-start gap-2.5"
            >
              <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">{cat.icon}</span>
              <div className="min-w-0">
                <span className="block text-[12.5px] font-bold text-zinc-900 group-hover:text-orange-700 transition-colors truncate">
                  {cat.name}
                </span>
                <span className="block text-[10.5px] text-zinc-500 truncate">
                  {cat.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 7. Tips Produktivitas & Panduan Ringkas (Collapsible) */}
      <div className="bg-zinc-50/80 rounded-2xl p-3.5 border border-zinc-200/80">
        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[13px]">💡</span>
            <span className="text-[12px] font-bold text-zinc-800">
              Tips Efisiensi Kunjungan & Fitur Baru
            </span>
          </div>
          <span className="text-[11px] text-orange-600 font-semibold">
            {showTips ? 'Tutup' : 'Lihat Tips'}
          </span>
        </button>

        {showTips && (
          <div className="mt-3 pt-3 border-t border-zinc-200/80 space-y-2 text-[11.5px] text-zinc-600 animate-in fade-in duration-200">
            <div className="flex items-start gap-2">
              <span className="font-bold text-orange-600 shrink-0">1.</span>
              <p>
                <strong>Isi Titik Maps Tanpa ke Toko:</strong> Buka Google Maps, tahan titik toko untuk salin koordinat, lalu gunakan tombol <em>Tempel</em> di detail toko.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-orange-600 shrink-0">2.</span>
              <p>
                <strong>Pencarian Multi-Kata:</strong> Di Pricelist, ketik <em>"beat vbelt"</em> atau <em>"vario ganda"</em> untuk menemukan barang secara instan tanpa perlu scroll panjang.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-orange-600 shrink-0">3.</span>
              <p>
                <strong>Offline Ready (PWA):</strong> Aplikasi ini bekerja langsung dari memori HP sehingga tetap cepat dan hemat kuota selama perjalanan rute.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default HomeTab;
