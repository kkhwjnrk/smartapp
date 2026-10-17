import React, { useState, useMemo } from 'react';
import { getTodayIso, getCurrentMonthKey } from '../../utils/date';
import { 
  getDailyVisitCount, 
  getMonthlyVisitStats, 
  getStoreVisitsForMonth, 
  getStoreVisitStatus, 
  isStoreMatch 
} from '../../utils/visitUtils';

function VisitsManagementView({
  stores = [],
  visits = [],
  routesList = [],
  onOpenVisitRecap,
  onOpenSadixSchedule,
  onToggleVisitToday,
  onBack
}) {
  const todayIso = useMemo(() => getTodayIso(), []);
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);
  const todayVisitCount = useMemo(() => getDailyVisitCount(visits, todayIso), [visits, todayIso]);
  const monthlyStats = useMemo(() => getMonthlyVisitStats(stores, visits, currentMonthKey), [stores, visits, currentMonthKey]);

  const [visitStatusFilter, setVisitStatusFilter] = useState('all'); // 'all' | 'unvisited' | 'partial' | 'completed'
  const [selectedVisitRoute, setSelectedVisitRoute] = useState('Semua');
  const [visitSearchQuery, setVisitSearchQuery] = useState('');

  // Filter toko berdasarkan status target, rute, dan pencarian kata kunci
  const filteredVisitStores = useMemo(() => {
    return stores.filter(store => {
      const storeMonthVisits = getStoreVisitsForMonth(store, visits, currentMonthKey);
      const count = storeMonthVisits.length;

      if (visitStatusFilter === 'unvisited' && count !== 0) return false;
      if (visitStatusFilter === 'partial' && count !== 1) return false;
      if (visitStatusFilter === 'completed' && count < 2) return false;

      if (selectedVisitRoute !== 'Semua') {
        const route = store.routeCode?.trim() || 'TANPA RUTE';
        if (route.toUpperCase() !== selectedVisitRoute.toUpperCase()) return false;
      }

      if (visitSearchQuery.trim()) {
        const q = visitSearchQuery.toLowerCase();
        const match = (store.name && store.name.toLowerCase().includes(q)) ||
                      (store.customerId && store.customerId.toLowerCase().includes(q)) ||
                      (store.routeCode && store.routeCode.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      const visitsA = getStoreVisitsForMonth(a, visits, currentMonthKey).length;
      const visitsB = getStoreVisitsForMonth(b, visits, currentMonthKey).length;
      if (visitsA !== visitsB) return visitsA - visitsB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [stores, visits, currentMonthKey, visitStatusFilter, selectedVisitRoute, visitSearchQuery]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* HEADER NAVIGASI HALAMAN TERSENDIRI */}
      <div className="bg-white p-4 rounded-3xl border border-zinc-200/90 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-2xl bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 flex items-center justify-center font-bold text-[18px] transition-all shrink-0 shadow-2xs"
            title="Kembali ke Menu Lainnya"
          >
            ←
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-[16px] font-black text-zinc-900 leading-tight truncate">
                Target & Jadwal Kunjungan
              </h2>
              <span className="text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-md shrink-0">
                Sadix
              </span>
            </div>
            <p className="text-[11.5px] text-zinc-500 mt-0.5 truncate">
              Halaman khusus kelola rekap & jadwal toko sejalur
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-[12px] font-bold text-zinc-600 hover:text-zinc-900 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors shrink-0"
        >
          Kembali
        </button>
      </div>

      {/* CARD 1: KPI STATUS HARIAN & BULANAN */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Box 1: Hari Ini */}
        <div className="p-4 bg-white rounded-3xl border border-zinc-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              Hari Ini
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              todayVisitCount >= 12 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {todayVisitCount >= 12 ? '✓ Tercapai' : 'Target 12'}
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[26px] font-black text-zinc-900 leading-none">{todayVisitCount}</span>
              <span className="text-[13px] font-bold text-zinc-500">/ 12 Toko</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              {todayVisitCount >= 12 
                ? 'Target minimal 12 toko terpenuhi! 🎉' 
                : `Masih kurang ${12 - todayVisitCount} toko lagi`}
            </p>
          </div>
        </div>

        {/* Box 2: Target Bulanan 2x */}
        <div className="p-4 bg-white rounded-3xl border border-zinc-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              Target 2x Bulan Ini
            </span>
            <span className="text-[10.5px] font-black text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200/60">
              {monthlyStats.completionPercent}%
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[26px] font-black text-zinc-900 leading-none">{monthlyStats.completedCount}</span>
              <span className="text-[13px] font-bold text-zinc-500">/ {monthlyStats.totalStores} Toko</span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full mt-2 overflow-hidden border border-zinc-200/60">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${monthlyStats.completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: DUA TOMBOL AKSI UTAMA (REKAP MALAM HARI & BUAT JADWAL SADIX) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Tombol Rekap Malam Hari */}
        <button
          type="button"
          onClick={onOpenVisitRecap}
          className="p-4 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white rounded-3xl border border-zinc-800 shadow-md flex flex-col justify-between text-left active:scale-[0.98] transition-all hover:border-zinc-600 group"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <span className="w-8 h-8 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-bold text-[15px] shadow-sm group-hover:scale-105 transition-transform">
              🌙
            </span>
            <span className="text-[10px] font-bold text-zinc-400 bg-white/10 px-2 py-0.5 rounded-full">
              Malam Hari
            </span>
          </div>
          <div>
            <p className="text-[13.5px] font-black text-white leading-tight">
              Rekap Kunjungan
            </p>
            <p className="text-[11px] text-zinc-300 mt-0.5">
              Checklist toko yang didatangi hari ini
            </p>
          </div>
        </button>

        {/* Tombol Buat Jadwal SPV (Sadix) */}
        <button
          type="button"
          onClick={onOpenSadixSchedule}
          className="p-4 bg-white hover:bg-zinc-50 text-zinc-900 rounded-3xl border border-zinc-200/90 shadow-sm flex flex-col justify-between text-left active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <span className="w-8 h-8 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center font-bold text-[15px] shadow-sm group-hover:scale-105 transition-transform">
              📋
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              SPV Sadix
            </span>
          </div>
          <div>
            <p className="text-[13.5px] font-black text-zinc-900 leading-tight">
              Buat Jadwal (Sadix)
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Pilih 12 toko sejalur & salin list ringkas
            </p>
          </div>
        </button>
      </div>

      {/* CARD 3: PANTAU & FILTER STATUS KUNJUNGAN SELURUH TOKO */}
      <div className="bg-white p-4.5 rounded-3xl border border-zinc-200/90 shadow-xs space-y-3">
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-zinc-900 leading-tight">
              Pantau Status Target Toko
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Cek toko yang belum atau sudah mencapai target 2x
            </p>
          </div>
          <span className="text-[11.5px] font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-xl">
            {filteredVisitStores.length} Toko
          </span>
        </div>

        {/* Filter Chips Status Target 2x */}
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
            Semua ({stores.length})
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
            <span>Belum (0/2)</span>
            <span className="opacity-75">({monthlyStats.unvisitedCount})</span>
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
            <span className="opacity-75">({monthlyStats.partialCount})</span>
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
            <span className="opacity-75">({monthlyStats.completedCount})</span>
          </button>
        </div>

        {/* Kontrol Tambahan: Dropdown Rute & Input Pencarian */}
        <div className="flex gap-2 pt-0.5">
          <select
            value={selectedVisitRoute}
            onChange={e => setSelectedVisitRoute(e.target.value)}
            className="px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[11.5px] font-bold text-zinc-800 focus:outline-none focus:border-zinc-400 shrink-0"
          >
            <option value="Semua">Semua Rute</option>
            {routesList.filter(r => r !== 'Semua').map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Cari toko / ID customer..."
            value={visitSearchQuery}
            onChange={e => setVisitSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[11.5px] placeholder:text-zinc-400 text-zinc-900 focus:outline-none focus:border-zinc-400"
          />
        </div>

        {/* DAFTAR TOKO DENGAN STATUS TARGET KUNJUNGAN */}
        <div className="space-y-2 pt-1 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredVisitStores.length === 0 ? (
            <div className="py-10 text-center bg-zinc-50 rounded-2xl border border-zinc-200/70 text-zinc-500">
              <p className="text-[13px] font-semibold text-zinc-800">Tidak ada toko pada filter ini</p>
              <p className="text-[11.5px] text-zinc-400 mt-1 max-w-xs mx-auto">
                Semua toko pada filter ini telah memenuhi target atau silakan ubah pilihan kode rute.
              </p>
            </div>
          ) : (
            filteredVisitStores.map(store => {
              const storeVisits = getStoreVisitsForMonth(store, visits, currentMonthKey);
              const visitCount = storeVisits.length;
              const status = getStoreVisitStatus(visitCount);
              const isVisitedToday = visits.some(v => v.dateIso === todayIso && isStoreMatch(v, store));

              return (
                <div
                  key={store.id || store.customerId || store.name}
                  className="p-3.5 bg-zinc-50/90 hover:bg-zinc-100/90 rounded-2xl border border-zinc-200/80 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {store.customerId && (
                        <span className="font-mono font-bold text-[10px] text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200 shadow-2xs">
                          {store.customerId}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-zinc-500 bg-zinc-200/70 px-1.5 py-0.5 rounded">
                        {store.routeCode || 'TANPA RUTE'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${status.bgClass}`}>
                        {status.shortLabel}
                      </span>
                    </div>
                    <p className="text-[13.5px] font-bold text-zinc-900 truncate mt-1">
                      {store.name}
                    </p>
                    {store.address && (
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {store.address}
                      </p>
                    )}
                  </div>

                  {/* Tombol Cepat Kunjungan Hari Ini */}
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleVisitToday?.(store)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 border ${
                        isVisitedToday
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 shadow-2xs'
                      }`}
                      title={isVisitedToday ? 'Batalkan tanda kunjungan hari ini' : 'Tandai kunjungan hari ini'}
                    >
                      {isVisitedToday ? '✓ Dikunjungi' : '+ Kunjungan'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* FOOTER TOMBOL KEMBALI */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-2xl font-bold text-[12.5px] transition-colors"
        >
          ← Kembali ke Menu Halaman Lainnya
        </button>
      </div>

    </div>
  );
}

export default VisitsManagementView;
