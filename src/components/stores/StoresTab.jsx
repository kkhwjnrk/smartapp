import React, { useRef, useMemo } from 'react';
import StoreCard from './StoreCard';

function StoresTab({
  stores,
  filteredStores,
  searchQuery,
  setSearchQuery,
  selectedRoute,
  setSelectedRoute,
  routeCounts,
  onOpenRouteSheet,
  isEditMode,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteStore
}) {
  const searchInputRef = useRef(null);

  const gpsCount = useMemo(() => {
    return stores.filter(s => s.lat && s.lng).length;
  }, [stores]);

  return (
    <div className="space-y-3.5 animate-in fade-in duration-500">
      
      {/* Sticky Search & Route Control Bar */}
      <div className="sticky top-[58px] z-20 bg-[#FDFDFD] pb-2 pt-1">
        
        {/* Kolom Cari dengan Tombol X */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Cari ID customer (C 3780), nama toko, atau rute..."
            className="w-full pl-12 pr-11 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 text-[15px] font-medium placeholder:font-normal placeholder:text-zinc-400 shadow-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {/* Tombol X untuk reset pencarian */}
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label="Hapus pencarian"
              className="absolute inset-y-0 right-3.5 flex items-center justify-center my-auto w-6 h-6 rounded-full bg-zinc-200/90 hover:bg-zinc-300 text-zinc-600 transition-colors active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Route Selector Bar (Sama persis seperti Selector Kategori di Pricelist) */}
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenRouteSheet}
            className={`flex-1 flex items-center justify-between px-4 py-2.5 rounded-2xl border text-[13px] font-medium transition-all active:scale-[0.99] ${
              selectedRoute !== 'Semua'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <svg className={`w-4 h-4 shrink-0 ${selectedRoute !== 'Semua' ? 'text-zinc-300' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="truncate">
                {selectedRoute === 'Semua' ? 'Semua Kode Rute' : selectedRoute}
              </span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                selectedRoute !== 'Semua' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
              }`}>
                {routeCounts[selectedRoute] || 0}
              </span>
            </div>
            
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <span className="text-[12px] opacity-75">Ganti</span>
              <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {selectedRoute !== 'Semua' && (
            <button
              type="button"
              onClick={() => setSelectedRoute('Semua')}
              className="px-3.5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[13px] font-medium transition-colors shrink-0"
              title="Reset ke Semua Rute"
            >
              Semua
            </button>
          )}
        </div>

        {/* Status Hasil Pencarian & GPS info */}
        <div className="flex items-center justify-between text-[12px] text-zinc-500 font-medium px-1 mt-2">
          <span>
            {searchQuery.trim() ? (
              <>Hasil cari "{searchQuery}" ({filteredStores.length} toko)</>
            ) : (
              <>Menampilkan {filteredStores.length} toko</>
            )}
          </span>
          {(selectedRoute !== 'Semua' || searchQuery.trim().length > 0) ? (
            <button 
              onClick={() => {
                setSelectedRoute('Semua');
                setSearchQuery('');
              }}
              className="text-zinc-500 hover:text-zinc-900 font-medium underline transition-colors"
            >
              Reset Semua
            </button>
          ) : (
            <span className="flex items-center gap-1 text-[11.5px] text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {gpsCount}/{stores.length} ada GPS
            </span>
          )}
        </div>

        {/* Mode Edit Banner (Hanya muncul saat tombol Edit di Header ditekan) */}
        {isEditMode && (
          <div className="mt-2.5 bg-zinc-50 border border-zinc-200 p-3 rounded-2xl flex justify-between items-center animate-in fade-in">
            <span className="text-[13px] text-zinc-600 font-medium px-2">Mode kelola toko aktif</span>
            <button 
              onClick={onOpenAddModal} 
              className="px-4 py-2 bg-zinc-900 text-white font-medium text-[13px] rounded-xl hover:bg-zinc-800 transition-colors shadow-2xs"
            >
              Tambah Toko
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredStores.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200 mt-2">
          <div className="w-12 h-12 mx-auto bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-zinc-900 text-[15px] font-semibold">Toko tidak ditemukan</p>
          <p className="text-zinc-500 text-[13px] mt-1">Coba kata kunci lain atau ubah pilihan kode rute.</p>
          <button 
            onClick={() => { 
              setSelectedRoute('Semua'); 
              setSearchQuery(''); 
            }}
            className="mt-4 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-[13px] font-medium hover:bg-zinc-200 transition-colors"
          >
            Tampilkan Semua Toko
          </button>
        </div>
      )}

      {/* List Container */}
      <div className="space-y-3 pb-6">
        {filteredStores.map(store => (
          <StoreCard 
            key={store.id}
            store={store}
            isEditMode={isEditMode}
            onEdit={onOpenEditModal}
            onDelete={onDeleteStore}
          />
        ))}
      </div>

    </div>
  );
}

export default StoresTab;
