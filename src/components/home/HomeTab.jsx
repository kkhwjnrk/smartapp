import React, { useState, useMemo } from 'react';
import { INDO_MONTHS } from '../../utils/date';

function HomeTab({ 
  cartCount = 0, 
  itemsCount = 0, 
  categoriesCount = 0, 
  storesCount = 0,
  routesCount = 0,
  orders = [],
  stores = [],
  items = [],
  routesList = [],
  routeCounts = {},
  onOpenDraft, 
  onOpenPricelist, 
  onOpenStores,
  onOpenCategories,
  onOpenAddOrder,
  onOpenAddStore,
  onOpenEditOrder,
  onToggleOrderStatus,
  onSelectRoute,
  onSelectCategory,
  onSelectStore,
  onSelectItem
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Ucapan Waktu & Tanggal Real-time
  const { greeting, todayFormatted } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    let greet = 'Selamat Datang';
    if (hour >= 4 && hour < 11) greet = 'Selamat Pagi';
    else if (hour >= 11 && hour < 15) greet = 'Selamat Siang';
    else if (hour >= 15 && hour < 18) greet = 'Selamat Sore';
    else greet = 'Selamat Malam';

    const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const day = INDO_DAYS[now.getDay()];
    const date = now.getDate();
    const month = INDO_MONTHS[now.getMonth()];
    const year = now.getFullYear();

    return {
      greeting: greet,
      todayFormatted: `${day}, ${date} ${month} ${year}`
    };
  }, []);

  // 2. Statistik Toko & GPS
  const { withGpsCount, gpsPercent } = useMemo(() => {
    const gps = stores.filter(s => s.lat && s.lng).length;
    const total = stores.length || 1;
    return {
      withGpsCount: gps,
      gpsPercent: Math.round((gps / total) * 100)
    };
  }, [stores]);

  // 3. Statistik Order Pending & Selesai
  const { pendingOrders, completedOrders, totalPendingPcs } = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending');
    const completed = orders.filter(o => o.status === 'completed');
    const totalPcs = pending.reduce((acc, curr) => {
      const pcs = (curr.items || []).reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
      return acc + pcs;
    }, 0);

    return {
      pendingOrders: pending,
      completedOrders: completed,
      totalPendingPcs: totalPcs
    };
  }, [orders]);

  // 4. Omni Search Cepat (Cari Toko atau Part Number langsung dari Home)
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q.length < 2) return null;

    const matchedStores = stores.filter(s => {
      const text = `${s.customerId || ''} ${s.name || ''} ${s.routeCode || ''}`.toLowerCase();
      return text.includes(q);
    }).slice(0, 3);

    const matchedItems = items.filter(i => {
      const text = `${i.pn || ''} ${i.description || ''} ${i.category || ''}`.toLowerCase();
      return text.includes(q);
    }).slice(0, 3);

    return {
      stores: matchedStores,
      items: matchedItems,
      totalCount: matchedStores.length + matchedItems.length
    };
  }, [searchQuery, stores, items]);

  // 5. Daftar Rute Pilihan Populer
  const quickRoutes = useMemo(() => {
    return routesList.filter(r => r !== 'Semua').slice(0, 8);
  }, [routesList]);

  // Kategori Unggulan Daytona
  const popularCategories = [
    { name: 'Busi', icon: '⚡', label: 'Busi Ignimax & Tapered' },
    { name: 'Kampas Rem', icon: '🛑', label: 'Kampas Cakram & Tromol' },
    { name: 'Roller & Per CVT', icon: '⚙️', label: 'CVT & Roller Racing' },
    { name: 'Vanbelt & Filter', icon: '🌀', label: 'Vanbelt & Filter Udara' }
  ];

  return (
    <div className="space-y-4.5 pb-6 animate-in fade-in duration-300">
      
      {/* 1. Header Hero & Greeting */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              Sistem Aktif • Offline PWA
            </span>
          </div>
          <h2 className="text-[20px] font-extrabold text-zinc-900 tracking-tight leading-tight">
            {greeting}, Sales Team 👋
          </h2>
          <p className="text-[12px] font-medium text-zinc-500">
            {todayFormatted} • Daytona Productivity
          </p>
        </div>

        {/* Quick Shortcut Catat Order Baru */}
        {onOpenAddOrder && (
          <button
            type="button"
            onClick={onOpenAddOrder}
            className="shrink-0 p-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5 text-[12.5px] font-bold"
            title="Catat Order Toko Baru"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Order</span>
          </button>
        )}
      </div>

      {/* 2. Interactive Omni Search Bar (Pencarian Cepat Toko / Part Number) */}
      <div className="relative">
        <div className="relative flex items-center">
          <svg className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari toko, customer ID, atau part number Daytona..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-zinc-200/90 rounded-2xl text-[13px] shadow-2xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-zinc-400 hover:text-zinc-600 text-[14px] w-5 h-5 flex items-center justify-center rounded-full bg-zinc-100"
            >
              ✕
            </button>
          )}
        </div>

        {/* Live Search Popup Dropdown */}
        {searchResults && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-zinc-200 rounded-2xl shadow-xl z-40 p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            {searchResults.totalCount === 0 ? (
              <p className="text-[12px] text-zinc-400 py-3 text-center">
                Tidak ada toko atau part number yang cocok dengan "{searchQuery}"
              </p>
            ) : (
              <>
                {/* Toko Matches */}
                {searchResults.stores.length > 0 && (
                  <div>
                    <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider px-2 block mb-1">
                      Toko Pelanggan
                    </span>
                    <div className="space-y-1">
                      {searchResults.stores.map(store => (
                        <div
                          key={store.id || store.name}
                          onClick={() => {
                            if (onSelectStore) onSelectStore(store);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-orange-50/70 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {store.customerId && (
                              <span className="px-1.5 py-0.5 bg-zinc-900 text-white rounded text-[10px] font-mono font-bold shrink-0">
                                {store.customerId}
                              </span>
                            )}
                            <span className="text-[13px] font-bold text-zinc-800 truncate group-hover:text-orange-600">
                              {store.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400 font-medium shrink-0 ml-2">
                            {store.routeCode || 'TANPA RUTE'} →
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items Matches */}
                {searchResults.items.length > 0 && (
                  <div className={searchResults.stores.length > 0 ? "pt-1.5 border-t border-zinc-100" : ""}>
                    <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider px-2 block mb-1">
                      Part Number Daytona
                    </span>
                    <div className="space-y-1">
                      {searchResults.items.map(item => (
                        <div
                          key={item.pn}
                          onClick={() => {
                            if (onSelectItem) onSelectItem(item);
                            setSearchQuery('');
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-orange-50/70 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded text-[11px] font-mono font-bold shrink-0">
                              {item.pn}
                            </span>
                            <span className="text-[13px] font-medium text-zinc-800 truncate group-hover:text-orange-600">
                              {item.description}
                            </span>
                          </div>
                          <span className="text-[11.5px] font-bold text-zinc-700 shrink-0 ml-2">
                            {item.price ? `Rp ${Number(item.price).toLocaleString('id-ID')}` : 'HET'} →
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Hero Order Card (Modern Dark Gradient with Orange Glow) */}
      <div className="bg-linear-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden border border-zinc-800">
        {/* Glowing Orange Neon Radial Accent */}
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-orange-500/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${cartCount > 0 ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-300">
                {cartCount > 0 ? 'Order Aktif Perlu Diproses' : 'Semua Order Selesai'}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-xs">
              Bulan Ini
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{cartCount}</span>
                <span className="text-[15px] font-medium text-zinc-400">Toko</span>
              </div>
              <p className="text-[12.5px] text-zinc-400 mt-1">
                {cartCount > 0 
                  ? `${totalPendingPcs} pcs barang siap diproses ke faktur / pengiriman` 
                  : "Tidak ada antrean pesanan pending saat ini"}
              </p>
            </div>
          </div>

          {/* Action Buttons on Hero Card */}
          <div className="pt-1 flex gap-2.5">
            {onOpenAddOrder && (
              <button 
                type="button"
                onClick={onOpenAddOrder}
                className="flex-1 py-2.5 px-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-[13px] font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>+ Catat Order Toko</span>
              </button>
            )}
            <button 
              type="button"
              onClick={onOpenDraft}
              className="flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl text-[13px] font-semibold transition-all backdrop-blur-md active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>Buka Catatan</span>
              <svg className="w-3.5 h-3.5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Prioritas Order Hari Ini (Interactive Mini-cards jika ada pending orders) */}
      {pendingOrders.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[13px] font-bold text-zinc-900 flex items-center gap-1.5">
              <span>⚡ Order Prioritas</span>
              <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
                {pendingOrders.length} Menunggu
              </span>
            </h3>
            <button
              type="button"
              onClick={onOpenDraft}
              className="text-[11.5px] font-semibold text-orange-600 hover:text-orange-700"
            >
              Lihat Semua →
            </button>
          </div>

          <div className="space-y-2">
            {pendingOrders.slice(0, 3).map(order => {
              const totalItems = order.items?.length || 0;
              const totalQty = (order.items || []).reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
              const previewNames = (order.items || []).slice(0, 2).map(it => it.description || it.pn).join(', ');

              return (
                <div
                  key={order.id}
                  onClick={() => onOpenEditOrder && onOpenEditOrder(order)}
                  className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-[14px] font-bold text-zinc-900 group-hover:text-orange-600 transition-colors truncate">
                        {order.storeName}
                      </span>
                      {order.routeCode && (
                        <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200/70 rounded text-[10px] font-semibold">
                          {order.routeCode.split('-')[0].trim()}
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-zinc-500 truncate">
                      {totalItems} item ({totalQty} pcs): {previewNames}{totalItems > 2 ? '...' : ''}
                    </p>
                  </div>

                  {/* Tombol Cepat Selesai */}
                  {onToggleOrderStatus && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleOrderStatus(order.id);
                      }}
                      className="shrink-0 px-2.5 py-1.5 bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 text-zinc-600 rounded-xl text-[11px] font-bold border border-zinc-200/80 transition-colors flex items-center gap-1 active:scale-95"
                      title="Tandai pesanan selesai"
                    >
                      <span>✓</span>
                      <span>Selesai</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Quick Speed Dial Action Grid (4 Tombol Aksi Cepat) */}
      <div className="grid grid-cols-4 gap-2 pt-0.5">
        <button
          type="button"
          onClick={onOpenAddOrder}
          className="bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all flex flex-col items-center justify-center gap-1.5 text-center group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-zinc-800 leading-tight">Order Baru</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddStore}
          className="bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all flex flex-col items-center justify-center gap-1.5 text-center group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-zinc-800 leading-tight">+ Toko</span>
        </button>

        <button
          type="button"
          onClick={onOpenStores}
          className="bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col items-center justify-center gap-1.5 text-center group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-zinc-800 leading-tight">Peta & Rute</span>
        </button>

        <button
          type="button"
          onClick={onOpenPricelist}
          className="bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col items-center justify-center gap-1.5 text-center group active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-zinc-800 leading-tight">Pricelist</span>
        </button>
      </div>

      {/* 6. Dashboard KPI Grid (4 Metrik Interaktif) */}
      <div className="space-y-1.5">
        <h3 className="text-[13px] font-bold text-zinc-900 px-1">
          📊 Ringkasan Data & Progres
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Data Toko & GPS Coverage */}
          <button 
            type="button"
            onClick={onOpenStores}
            className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-2xs hover:border-orange-300 transition-all text-left group active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Toko Pelanggan
                </span>
                <span className="text-orange-500 font-bold text-[11px]">
                  {gpsPercent}% GPS
                </span>
              </div>
              <div className="text-2xl font-black text-zinc-900 tracking-tight">
                {storesCount}
              </div>
              <p className="text-[11.5px] text-zinc-500 mt-0.5">
                {withGpsCount} toko ada titik maps
              </p>
            </div>

            {/* Mini Progress Bar GPS */}
            <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-3 overflow-hidden">
              <div 
                className="bg-linear-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${gpsPercent}%` }}
              ></div>
            </div>
          </button>

          {/* Card 2: Katalog Pricelist */}
          <button 
            type="button"
            onClick={onOpenPricelist}
            className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-2xs hover:border-blue-300 transition-all text-left group active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Katalog Daytona
                </span>
                <span className="text-blue-500 font-bold text-[11px]">
                  Resmi
                </span>
              </div>
              <div className="text-2xl font-black text-zinc-900 tracking-tight">
                {itemsCount}
              </div>
              <p className="text-[11.5px] text-zinc-500 mt-0.5">
                Part Number & Tier Diskon
              </p>
            </div>

            <div className="flex items-center gap-1 mt-3">
              <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[9.5px] font-bold font-mono">HET</span>
              <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[9.5px] font-bold font-mono">D24</span>
              <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[9.5px] font-bold font-mono">D27</span>
              <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[9.5px] font-bold font-mono">D29</span>
            </div>
          </button>

          {/* Card 3: Rute Kunjungan */}
          <button 
            type="button"
            onClick={onOpenStores}
            className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-2xs hover:border-emerald-300 transition-all text-left group active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Jalur Rute
              </span>
              <span className="text-emerald-500 font-bold text-[11px]">
                Aktif
              </span>
            </div>
            <div className="text-2xl font-black text-zinc-900 tracking-tight">
              {routesCount}
            </div>
            <p className="text-[11.5px] text-zinc-500 mt-0.5">
              Wilayah Bogor & Sekitarnya
            </p>
          </button>

          {/* Card 4: Order Selesai */}
          <button 
            type="button"
            onClick={onOpenDraft}
            className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-2xs hover:border-violet-300 transition-all text-left group active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Order Selesai
              </span>
              <span className="text-violet-500 font-bold text-[11px]">
                Arsip
              </span>
            </div>
            <div className="text-2xl font-black text-zinc-900 tracking-tight">
              {completedOrders.length}
            </div>
            <p className="text-[11.5px] text-zinc-500 mt-0.5">
              Total catatan order selesai
            </p>
          </button>
        </div>
      </div>

      {/* 7. Pilihan Rute Cepat (Quick Route Filter Chips) */}
      {quickRoutes.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[13px] font-bold text-zinc-900">
              📍 Rute Kunjungan Cepat
            </h3>
            <button
              type="button"
              onClick={onOpenStores}
              className="text-[11.5px] font-semibold text-orange-600 hover:text-orange-700"
            >
              Semua Rute →
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-1 px-1">
            {quickRoutes.map(route => {
              const count = routeCounts[route] || 0;
              return (
                <button
                  key={route}
                  type="button"
                  onClick={() => onSelectRoute && onSelectRoute(route)}
                  className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:border-orange-300 border border-zinc-200/80 rounded-xl text-[12px] font-bold text-zinc-700 hover:text-orange-700 transition-all shadow-2xs shrink-0 flex items-center gap-1.5 active:scale-95"
                >
                  <span>{route}</span>
                  <span className="text-[10.5px] font-mono px-1.5 py-0.2 bg-zinc-100 rounded-md text-zinc-500 font-normal">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Kategori Unggulan Daytona (Quick Category Shortcuts) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[13px] font-bold text-zinc-900">
            📦 Kategori Terpopuler
          </h3>
          <button
            type="button"
            onClick={onOpenCategories}
            className="text-[11.5px] font-semibold text-orange-600 hover:text-orange-700"
          >
            Semua ({categoriesCount}) →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {popularCategories.map(cat => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory && onSelectCategory(cat.name)}
              className="bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all text-left flex items-center gap-2.5 group active:scale-95"
            >
              <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                {cat.icon}
              </span>
              <div className="min-w-0">
                <span className="block font-bold text-zinc-900 text-[13px] truncate group-hover:text-orange-600">
                  {cat.name}
                </span>
                <span className="text-[11px] text-zinc-400 truncate block">
                  {cat.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

export default HomeTab;
