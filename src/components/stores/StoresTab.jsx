import React, { useMemo } from 'react';
import StoreCard from './StoreCard';

function StoresTab({
  stores,
  searchQuery,
  setSearchQuery,
  selectedRoute,
  setSelectedRoute,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteStore
}) {
  // Dapatkan daftar kode rute unik & jumlah toko per rute
  const { routesList, routeCounts, gpsCount } = useMemo(() => {
    const counts = { 'Semua': stores.length };
    let gps = 0;

    stores.forEach(s => {
      const route = s.routeCode?.trim() || 'TANPA RUTE';
      counts[route] = (counts[route] || 0) + 1;
      if (s.lat && s.lng) gps += 1;
    });

    const uniqueRoutes = Object.keys(counts).filter(r => r !== 'Semua');
    uniqueRoutes.sort();

    return {
      routesList: ['Semua', ...uniqueRoutes],
      routeCounts: counts,
      gpsCount: gps
    };
  }, [stores]);

  // Filter toko berdasarkan pencarian dan rute
  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      // Filter Rute
      if (selectedRoute !== 'Semua') {
        const storeRoute = store.routeCode?.trim() || 'TANPA RUTE';
        if (storeRoute !== selectedRoute) return false;
      }

      // Filter Pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = store.name?.toLowerCase().includes(q);
        const matchRoute = store.routeCode?.toLowerCase().includes(q);
        const matchOwner = store.owner?.toLowerCase().includes(q);
        const matchAddress = store.address?.toLowerCase().includes(q);
        if (!matchName && !matchRoute && !matchOwner && !matchAddress) {
          return false;
        }
      }

      return true;
    });
  }, [stores, selectedRoute, searchQuery]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Bar: Search & Add Button */}
      <div className="flex gap-2.5 items-center">
        {/* Search Input dengan Tombol X */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Cari toko, rute, atau PIC..." 
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-zinc-200/80 rounded-2xl text-[14px] focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all shadow-2xs placeholder:text-zinc-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
              title="Hapus pencarian"
            >
              <svg className="w-4 h-4 bg-zinc-200/70 hover:bg-zinc-300/80 rounded-full p-0.5 text-zinc-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tombol Tambah Toko */}
        <button
          onClick={onOpenAddModal}
          className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-[13.5px] font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Tambah</span>
        </button>
      </div>

      {/* Horizontal Route Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none no-scrollbar">
        {routesList.map(route => {
          const isSelected = selectedRoute === route;
          const count = routeCounts[route] || 0;
          return (
            <button
              key={route}
              onClick={() => setSelectedRoute(route)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <span>{route}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSelected ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-100 text-zinc-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Info & GPS Status Bar */}
      <div className="flex items-center justify-between text-[12px] text-zinc-500 px-1 pt-0.5">
        <span>Menampilkan <strong className="text-zinc-800">{filteredStores.length}</strong> toko</span>
        <span className="flex items-center gap-1 text-[11.5px] text-zinc-500">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span><strong>{gpsCount}</strong>/<strong>{stores.length}</strong> ada titik Maps</span>
        </span>
      </div>

      {/* Stores List */}
      {filteredStores.length > 0 ? (
        <div className="space-y-3 pb-8">
          {filteredStores.map(store => (
            <StoreCard
              key={store.id}
              store={store}
              onEdit={onOpenEditModal}
              onDelete={onDeleteStore}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-zinc-200/80 p-8 shadow-2xs">
          <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h4 className="text-[15px] font-semibold text-zinc-800">Tidak ada toko yang cocok</h4>
          <p className="text-[12.5px] text-zinc-500 mt-1 max-w-xs mx-auto">
            {searchQuery 
              ? `Tidak ditemukan toko dengan kata kunci "${searchQuery}"`
              : `Belum ada toko yang terdaftar di rute ${selectedRoute}`}
          </p>
          {(searchQuery || selectedRoute !== 'Semua') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRoute('Semua');
              }}
              className="mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[12.5px] font-semibold rounded-xl transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default StoresTab;
