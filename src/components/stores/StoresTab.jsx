import React, { useRef, useMemo, useState } from 'react';
import StoreCard from './StoreCard';
import StoresMap from './StoresMap';
import { getTodayIso, getCurrentMonthKey } from '../../utils/date';
import { getDailyVisitCount, getStoreVisitsForMonth, getMonthlyVisitStats } from '../../utils/visitUtils';

function StoresTab({
  stores = [],
  filteredStores = [],
  searchQuery,
  setSearchQuery,
  selectedRoute,
  setSelectedRoute,
  routeCounts = {},
  onOpenRouteSheet,
  isEditMode,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteStore,
  onOpenAddOrder,
  visits = [],
  onOpenVisitRecap,
  onOpenSadixSchedule,
  onToggleVisitToday
}) {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [visitStatusFilter, setVisitStatusFilter] = useState('all'); // 'all' | 'unvisited' | 'partial' | 'completed'
  const searchInputRef = useRef(null);

  const todayIso = useMemo(() => getTodayIso(), []);
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  // Hitung jumlah toko yang sudah dikunjungi hari ini
  const todayVisitCount = useMemo(() => {
    return getDailyVisitCount(visits, todayIso);
  }, [visits, todayIso]);

  // Statistik pencapaian target bulanan
  const monthlyStats = useMemo(() => {
    return getMonthlyVisitStats(stores, visits, currentMonthKey);
  }, [stores, visits, currentMonthKey]);

  const gpsCount = useMemo(() => {
    return stores.filter(s => s.lat && s.lng).length;
  }, [stores]);

  // Filter toko berdasarkan pencarian, rute, dan status target kunjungan bulanan (2x)
  const storesToRender = useMemo(() => {
    if (visitStatusFilter === 'all') return filteredStores;
    return filteredStores.filter(store => {
      const storeMonthVisits = getStoreVisitsForMonth(store, visits, currentMonthKey);
      const count = storeMonthVisits.length;
      if (visitStatusFilter === 'unvisited') return count === 0;
      if (visitStatusFilter === 'partial') return count === 1;
      if (visitStatusFilter === 'completed') return count >= 2;
      return true;
    });
  }, [filteredStores, visitStatusFilter, visits, currentMonthKey]);

  return (
    <div className="space-y-3 animate-in fade-in duration-300">
      
      {/* SEGMENTED CONTROL: PENGALIH TAMPILAN DAFTAR | PETA TOKO */}
      <div className="bg-zinc-200/70 p-1 rounded-2xl flex items-center shadow-2xs">
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`flex-1 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            viewMode === 'list'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span>Daftar Toko</span>
          <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-bold ${
            viewMode === 'list' ? 'bg-zinc-100 text-zinc-800' : 'bg-zinc-300/70 text-zinc-600'
          }`}>
            {filteredStores.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('map')}
          className={`flex-1 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            viewMode === 'map'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <svg className="w-4 h-4 text-[#EA580C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>Peta Toko</span>
          <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-bold ${
            viewMode === 'map' ? 'bg-orange-100 text-orange-700' : 'bg-zinc-300/70 text-zinc-600'
          }`}>
            {gpsCount} Pin
          </span>
        </button>
      </div>

      {/* KARTU AKSI CEPAT KUNJUNGAN: REKAP MALAM HARI & ATUR JADWAL SPV */}
      <div className="grid grid-cols-2 gap-2">
        {/* Tombol Rekap Malam Hari */}
        <button
          type="button"
          onClick={onOpenVisitRecap}
          className="p-3 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white rounded-2xl border border-zinc-700/80 shadow-sm flex items-center justify-between gap-2 active:scale-98 transition-all hover:border-zinc-500"
        >
          <div className="flex items-center gap-2.5 text-left min-w-0">
            <span className="w-8 h-8 rounded-xl bg-[#EA580C] text-white flex items-center justify-center font-bold text-[14px] shrink-0 shadow-2xs">
              🌙
            </span>
            <div className="min-w-0">
              <p className="text-[12.5px] font-black leading-tight truncate">Rekap Kunjungan</p>
              <p className="text-[10.5px] text-zinc-300 font-medium">Hari ini: {todayVisitCount}/12 Toko</p>
            </div>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
            todayVisitCount >= 12 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
              : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
          }`}>
            {todayVisitCount >= 12 ? '✓ 12 Selesai' : `${todayVisitCount}/12`}
          </span>
        </button>

        {/* Tombol Atur Jadwal SPV (Sadix) */}
        <button
          type="button"
          onClick={onOpenSadixSchedule}
          className="p-3 bg-white hover:bg-zinc-50 text-zinc-900 rounded-2xl border border-zinc-200/90 shadow-sm flex items-center justify-between gap-2 active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2.5 text-left min-w-0">
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center font-bold text-[14px] shrink-0 shadow-2xs">
              📋
            </span>
            <div className="min-w-0">
              <p className="text-[12.5px] font-black leading-tight truncate">Jadwal SPV (Sadix)</p>
              <p className="text-[10.5px] text-zinc-500 font-medium">Buat rencana harian</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* KONDISIONAL: TAMPILAN PETA ATAU TAMPILAN DAFTAR */}
      {viewMode === 'map' ? (
        <StoresMap
          filteredStores={filteredStores}
          selectedRoute={selectedRoute}
          onOpenRouteSheet={onOpenRouteSheet}
          onOpenAddOrder={onOpenAddOrder}
          onOpenEditModal={onOpenEditModal}
          onSwitchToList={() => setViewMode('list')}
          visits={visits}
          onToggleVisitToday={onToggleVisitToday}
        />
      ) : (
        <>
          {/* Sticky Search, Route & Visit Filter Bar */}
          <div className="sticky top-[58px] z-20 bg-[#FDFDFD] pb-2 pt-1 space-y-2">
            
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
                className="w-full pl-12 pr-11 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 text-[14px] font-medium placeholder:font-normal placeholder:text-zinc-400 shadow-sm transition-all"
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

            {/* Route Selector Bar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenRouteSheet}
                className={`flex-1 flex items-center justify-between px-3.5 py-2 rounded-2xl border text-[12.5px] font-medium transition-all active:scale-[0.99] ${
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
                  <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-semibold ${
                    selectedRoute !== 'Semua' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {routeCounts[selectedRoute] || 0}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-[11.5px] opacity-75">Ganti</span>
                  <svg className="w-3.5 h-3.5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {selectedRoute !== 'Semua' && (
                <button
                  type="button"
                  onClick={() => setSelectedRoute('Semua')}
                  className="px-3 py-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[12px] font-medium transition-colors shrink-0"
                  title="Reset ke Semua Rute"
                >
                  Semua
                </button>
              )}
            </div>

            {/* Filter Chips Status Target Kunjungan Bulanan (Minimal 2x) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
              <button
                type="button"
                onClick={() => setVisitStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold whitespace-nowrap transition-all ${
                  visitStatusFilter === 'all'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                }`}
              >
                Semua Status ({filteredStores.length})
              </button>
              <button
                type="button"
                onClick={() => setVisitStatusFilter('unvisited')}
                className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  visitStatusFilter === 'unvisited'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/70'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span>Belum Dikunjungi (0/2)</span>
              </button>
              <button
                type="button"
                onClick={() => setVisitStatusFilter('partial')}
                className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  visitStatusFilter === 'partial'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Kurang 1x (1/2)</span>
              </button>
              <button
                type="button"
                onClick={() => setVisitStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  visitStatusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Target 2x Selesai</span>
              </button>
            </div>

            {/* Mode Edit Banner (Hanya muncul saat tombol Edit di Header ditekan) */}
            {isEditMode && (
              <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-2xl flex justify-between items-center animate-in fade-in">
                <span className="text-[12.5px] text-zinc-600 font-medium px-1">Mode kelola toko aktif</span>
                <button 
                  onClick={onOpenAddModal} 
                  className="px-3 py-1.5 bg-zinc-900 text-white font-medium text-[12px] rounded-xl hover:bg-zinc-800 transition-colors shadow-2xs"
                >
                  Tambah Toko
                </button>
              </div>
            )}
          </div>

          {/* Empty State */}
          {storesToRender.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 mt-2">
              <div className="w-12 h-12 mx-auto bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-zinc-900 text-[15px] font-semibold">Toko tidak ditemukan</p>
              <p className="text-zinc-500 text-[12.5px] mt-1 max-w-xs mx-auto">
                {visitStatusFilter !== 'all' 
                  ? 'Tidak ada toko dengan status kunjungan yang dipilih pada filter ini.' 
                  : 'Coba kata kunci lain atau ubah pilihan kode rute.'}
              </p>
              <button 
                onClick={() => { 
                  setSelectedRoute('Semua'); 
                  setSearchQuery(''); 
                  setVisitStatusFilter('all');
                }}
                className="mt-3.5 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-[12.5px] font-bold hover:bg-zinc-200 transition-colors"
              >
                Reset Semua Filter
              </button>
            </div>
          )}

          {/* List Container */}
          <div className="space-y-3 pb-6">
            {storesToRender.map(store => (
              <StoreCard 
                key={store.id}
                store={store}
                isEditMode={isEditMode}
                onEdit={onOpenEditModal}
                onDelete={onDeleteStore}
                visits={visits}
                onToggleVisitToday={onToggleVisitToday}
              />
            ))}
          </div>
        </>
      )}

    </div>
  );
}

export default StoresTab;
