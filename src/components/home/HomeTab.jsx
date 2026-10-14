import React, { useState, useMemo } from 'react';

function HomeTab({ 
  orders = [], 
  stores = [], 
  items = [], 
  routesList = [], 
  routeCounts = {}, 
  onOpenDraft, 
  onOpenPricelist, 
  onOpenStores, 
  onOpenAddOrder, 
  onOpenEditOrder,
  onOpenCategories 
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Sapaan Waktu Otomatis
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  // Format Tanggal Hari Ini (Indonesia)
  const todayText = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  // Order Aktif / Pending
  const pendingOrders = useMemo(() => {
    return orders.filter(o => o.status === 'pending');
  }, [orders]);

  const pendingOrdersCount = pendingOrders.length;

  // Total Quantity Barang Dipesan pada Order Pending
  const totalPendingQty = useMemo(() => {
    return pendingOrders.reduce((sum, o) => {
      const itemsQty = o.items ? o.items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0) : 0;
      return sum + itemsQty;
    }, 0);
  }, [pendingOrders]);

  // Statistik Titik GPS Toko
  const { gpsCount, gpsPercent } = useMemo(() => {
    const count = stores.filter(s => s.lat && s.lng).length;
    const percent = stores.length > 0 ? Math.round((count / stores.length) * 100) : 0;
    return { gpsCount: count, gpsPercent: percent };
  }, [stores]);

  // Handler Submit Pencarian Cepat
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
    { name: 'Kampas Ganda Matic', icon: '🏍️' },
    { name: 'Filter Udara', icon: '💨' }
  ];

  // Rute Kunjungan Populer (Kecuali 'Semua')
  const availableRoutes = useMemo(() => {
    return routesList.filter(r => r !== 'Semua');
  }, [routesList]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-4">
      
      {/* 1. HERO GREETING & DATE BANNER */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] text-zinc-500 font-medium">{greeting},</span>
            <span className="text-[14px] font-bold text-zinc-900">Sales Daytona 👋</span>
          </div>
          <p className="text-[12px] text-zinc-500">
            {pendingOrdersCount > 0 
              ? `${pendingOrdersCount} toko menunggu diproses` 
              : 'Semua order hari ini telah rapi'}
          </p>
        </div>
        <div className="bg-zinc-100/80 border border-zinc-200/70 px-2.5 py-1 rounded-xl text-right">
          <span className="text-[11px] font-semibold text-zinc-600 block">
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
            placeholder="Cari toko, kode rute, atau part number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-20 py-2.5 bg-white border border-zinc-200/90 rounded-2xl text-[13px] font-medium placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 shadow-2xs transition-all"
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
            className="absolute right-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[11.5px] font-semibold rounded-xl transition-colors"
          >
            Cari
          </button>
        </div>
      </form>

      {/* 3. BENTO GRID STATISTIK UTAMA */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* CARD UTAMA: Order Aktif (Pending) */}
        <div className="col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-emerald-500/15 rounded-full blur-xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-zinc-400 tracking-wide uppercase">
                Pesanan Berjalan (Draft)
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                pendingOrdersCount > 0 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pendingOrdersCount > 0 ? 'bg-orange-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                {pendingOrdersCount > 0 ? `${pendingOrdersCount} Toko Pending` : 'Semua Beres'}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-white">
                {pendingOrdersCount}
              </span>
              <span className="text-[13px] text-zinc-300 font-medium">
                Toko · {totalPendingQty} Pcs Barang
              </span>
            </div>
            <p className="text-[12px] text-zinc-400 mt-1">
              {pendingOrdersCount > 0 
                ? 'Segera proses pesanan sebelum batas waktu kirim rute'
                : 'Belum ada antrean order, siap untuk kunjungan baru'}
            </p>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-700/60">
            <button
              type="button"
              onClick={onOpenAddOrder}
              className="py-2.5 px-3 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white rounded-xl text-[12.5px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Buat Order</span>
            </button>
            <button
              type="button"
              onClick={onOpenDraft}
              className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white rounded-xl text-[12.5px] font-medium transition-all flex items-center justify-center gap-1"
            >
              <span>Buka Draft</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* CARD DATA TOKO & TITIK GOOGLE MAPS */}
        <div 
          onClick={() => onOpenStores && onOpenStores()}
          className="bg-white rounded-3xl p-4.5 border border-zinc-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-zinc-300 hover:shadow-sm transition-all group active:scale-98"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-[11px] font-bold font-mono text-zinc-500">
                {availableRoutes.length} Rute
              </span>
            </div>

            <span className="block font-bold text-zinc-900 text-[15px] leading-tight">
              {stores.length} Toko
            </span>
            <span className="text-[11.5px] font-medium text-zinc-500 mt-0.5 block">
              📍 {gpsCount} Terpasang Maps ({gpsPercent}%)
            </span>

            {/* Progress Bar Titik Maps */}
            <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${gpsPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-[11px] font-semibold text-orange-600 group-hover:text-orange-700">
            <span>Kelola Toko & Maps</span>
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* CARD KATALOG PRICELIST & DISKON */}
        <div 
          onClick={() => onOpenPricelist && onOpenPricelist()}
          className="bg-white rounded-3xl p-4.5 border border-zinc-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-zinc-300 hover:shadow-sm transition-all group active:scale-98"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 bg-zinc-100 text-zinc-800 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <span className="text-[10px] font-mono font-bold bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
                PDF V2
              </span>
            </div>

            <span className="block font-bold text-zinc-900 text-[15px] leading-tight">
              {items.length} Part
            </span>
            <span className="text-[11.5px] font-medium text-zinc-500 mt-0.5 block">
              Tier HET · 24 · 27 · 29
            </span>

            {/* Sub-badge Info */}
            <div className="flex items-center gap-1 mt-2.5">
              <span className="text-[10.5px] px-1.5 py-0.5 bg-zinc-50 border border-zinc-200/80 rounded-md text-zinc-600 font-medium">
                Pricelist Lengkap
              </span>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-[11px] font-semibold text-zinc-700 group-hover:text-zinc-900">
            <span>Buka Katalog Part</span>
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

      </div>

      {/* 4. SHORTCUT KATEGORI POPULER */}
      <div className="bg-white rounded-3xl p-4 border border-zinc-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[12.5px] font-bold text-zinc-800">
            Kategori Part Cepat
          </span>
          <button 
            type="button"
            onClick={onOpenCategories}
            className="text-[11.5px] font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            Semua Kategori →
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {popularCategories.map(cat => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onOpenPricelist && onOpenPricelist(cat.name)}
              className="p-2.5 bg-zinc-50 hover:bg-orange-50/70 border border-zinc-200/60 hover:border-orange-200 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all text-center group active:scale-95"
            >
              <span className="text-base group-hover:scale-110 transition-transform">
                {cat.icon}
              </span>
              <span className="text-[11.5px] font-semibold text-zinc-700 group-hover:text-orange-700 leading-tight">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. PREVIEW ORDER BERJALAN TERKINI */}
      {pendingOrdersCount > 0 && (
        <div className="bg-white rounded-3xl p-4 border border-zinc-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="text-[12.5px] font-bold text-zinc-900">
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

              return (
                <div 
                  key={order.id}
                  onClick={() => onOpenEditOrder ? onOpenEditOrder(order) : onOpenDraft()}
                  className="p-3 bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/70 rounded-2xl flex items-center justify-between gap-2.5 transition-all cursor-pointer group active:scale-98"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {order.routeCode && (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold rounded">
                          {order.routeCode}
                        </span>
                      )}
                      <h4 className="font-bold text-zinc-900 text-[13px] truncate">
                        {order.storeName}
                      </h4>
                    </div>
                    <p className="text-[11.5px] text-zinc-500 mt-0.5">
                      {orderItemsCount} Jenis Part · {orderQty} Pcs Barang
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenEditOrder) onOpenEditOrder(order);
                      else onOpenDraft();
                    }}
                    className="px-2.5 py-1 bg-white border border-zinc-300 hover:border-zinc-400 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 text-zinc-700 rounded-xl text-[11px] font-bold transition-all shrink-0 shadow-2xs"
                  >
                    Buka
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. PILIH RUTE KUNJUNGAN CEPAT (HORIZONTAL CHIPS) */}
      {availableRoutes.length > 0 && (
        <div className="bg-white rounded-3xl p-4 border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12.5px] font-bold text-zinc-800">
              Pilih Rute Toko
            </span>
            <span className="text-[11px] text-zinc-400">
              Langsung filter toko
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => onOpenStores && onOpenStores('Semua')}
              className="px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-[11.5px] font-semibold shrink-0 shadow-2xs hover:bg-zinc-800 transition-colors"
            >
              Semua Toko ({stores.length})
            </button>
            {availableRoutes.slice(0, 8).map(route => {
              const count = routeCounts[route] || 0;
              return (
                <button
                  key={route}
                  type="button"
                  onClick={() => onOpenStores && onOpenStores(route)}
                  className="px-3 py-1.5 bg-zinc-50 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-zinc-200/70 rounded-xl text-[11.5px] font-semibold text-zinc-700 shrink-0 transition-colors"
                >
                  {route} <span className="text-zinc-400 font-normal">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

export default HomeTab;
