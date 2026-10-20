import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getTodayIso, getCurrentMonthKey } from '../../utils/date';
import { getStoreVisitsForMonth, isStoreMatch } from '../../utils/visitUtils';
import useSwipeBack from '../../hooks/useSwipeBack';
import SwipeBackHint from '../common/SwipeBackHint';

function getInitialCheckedStores(dateIso, visits = [], stores = []) {
  const dayVisits = visits.filter(v => v.dateIso === dateIso);
  const initialChecked = new Set();
  dayVisits.forEach(v => {
    const matched = stores.find(s => isStoreMatch(v, s));
    if (matched) {
      initialChecked.add(matched.id || matched.customerId || matched.name);
    }
  });
  return initialChecked;
}

function VisitRecapModal({
  isOpen,
  initialDateIso,
  onClose,
  stores = [],
  visits = [],
  onSaveDayVisits,
  routesList = []
}) {
  const [selectedDateIso, setSelectedDateIso] = useState(() => initialDateIso || getTodayIso());
  const [selectedRoute, setSelectedRoute] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedStoreIds, setCheckedStoreIds] = useState(() => 
    getInitialCheckedStores(initialDateIso || getTodayIso(), visits, stores)
  );
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  const {
    containerRef,
    isSwiping,
    dragX,
    dragDirection,
    dragProgress,
    isExiting,
    containerStyle,
    backdropOpacity,
    handlers: swipeHandlers
  } = useSwipeBack({
    onBack: onClose,
    edgeWidth: 100,
    threshold: 75,
    enabled: isOpen,
    direction: 'both'
  });

  // Filter rute unik (tanpa 'Semua')
  const availableRoutes = useMemo(() => {
    return routesList.filter(r => r !== 'Semua');
  }, [routesList]);

  // Daftar toko yang terfilter
  const displayedStores = useMemo(() => {
    let result = stores;
    if (selectedRoute !== 'Semua') {
      result = result.filter(s => s.routeCode && s.routeCode.trim().toUpperCase() === selectedRoute.toUpperCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.customerId && s.customerId.toLowerCase().includes(q)) ||
        (s.routeCode && s.routeCode.toLowerCase().includes(q))
      );
    }
    return result;
  }, [stores, selectedRoute, searchQuery]);

  // Hitung jumlah toko terpilih hari ini
  const checkedCount = checkedStoreIds.size;
  const isTargetAchieved = checkedCount >= 12;

  // Handler toggle checklist toko
  const handleToggleStore = (storeKey) => {
    setCheckedStoreIds(prev => {
      const next = new Set(prev);
      if (next.has(storeKey)) {
        next.delete(storeKey);
      } else {
        next.add(storeKey);
      }
      return next;
    });
  };

  // Pilih semua toko yang sedang tampil
  const handleSelectAllDisplayed = () => {
    setCheckedStoreIds(prev => {
      const next = new Set(prev);
      displayedStores.forEach(s => {
        const key = s.id || s.customerId || s.name;
        next.add(key);
      });
      return next;
    });
  };

  // Batal pilih semua yang tampil
  const handleDeselectAllDisplayed = () => {
    setCheckedStoreIds(prev => {
      const next = new Set(prev);
      displayedStores.forEach(s => {
        const key = s.id || s.customerId || s.name;
        next.delete(key);
      });
      return next;
    });
  };

  // Eksekusi penyimpanan rekap kunjungan tanggal ini
  const handleSave = () => {
    // Ambil object toko lengkap dari ID yang dicentang
    const selectedStoresList = stores.filter(s => {
      const key = s.id || s.customerId || s.name;
      return checkedStoreIds.has(key);
    });

    onSaveDayVisits({
      dateIso: selectedDateIso,
      selectedStores: selectedStoresList
    });

    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-5 overflow-hidden">
      {/* Backdrop Dimmed */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        style={{
          opacity: backdropOpacity,
          transition: isSwiping ? 'none' : 'opacity 0.25s ease'
        }}
      />

      {/* Modal Dialog Card with Edge Swipe-Back */}
      <div 
        ref={containerRef}
        {...swipeHandlers}
        style={containerStyle}
        className={`relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:rounded-3xl rounded-none bg-white shadow-2xl flex flex-col overflow-hidden border-0 sm:border border-zinc-200 ${
          dragX === 0 && !isExiting ? 'animate-in zoom-in-95 duration-200' : ''
        }`}
      >
        {/* Left & Right Edge Gesture Strips for instant touch response */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-12 z-40 touch-none pointer-events-auto"
          {...swipeHandlers}
        />
        <div 
          className="absolute right-0 top-0 bottom-0 w-12 z-40 touch-none pointer-events-auto"
          {...swipeHandlers}
        />

        {/* Dynamic Bidirectional Swipe Hint Indicator */}
        <SwipeBackHint
          dragX={dragX}
          dragProgress={dragProgress}
          dragDirection={dragDirection}
          accent="orange"
        />

        {/* HEADER: Judul & Tanggal Rekap */}
        <div className="p-4 bg-zinc-900 text-white flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              <h2 className="text-[17px] font-black tracking-tight text-white">
                Rekap Kunjungan Harian
              </h2>
            </div>
            <p className="text-[12px] text-zinc-300 mt-0.5">
              Centang toko-toko yang Anda kunjungi hari ini untuk catatan target.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-[18px] font-bold transition-colors shrink-0"
          >
            ×
          </button>
        </div>

        {/* BAR INDIKATOR TARGET 12 TOKO */}
        <div className={`px-4 py-3 shrink-0 border-b flex items-center justify-between gap-3 ${
          isTargetAchieved ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50/70 border-orange-200/80'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-[15px] shrink-0 ${
              isTargetAchieved ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#EA580C] text-white shadow-sm'
            }`}>
              {checkedCount}
            </div>
            <div className="min-w-0">
              <p className={`text-[12.5px] font-bold truncate ${
                isTargetAchieved ? 'text-emerald-900' : 'text-zinc-900'
              }`}>
                {isTargetAchieved 
                  ? 'Target Harian 12 Toko Tercapai! 🎉' 
                  : `${checkedCount} / 12 Toko Terpilih`}
              </p>
              <p className="text-[11px] text-zinc-500 font-medium">
                {isTargetAchieved 
                  ? 'Luar biasa, capaian harian sudah memenuhi target.' 
                  : `Kurang ${Math.max(0, 12 - checkedCount)} toko lagi untuk mencapai target harian.`}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isTargetAchieved ? 'bg-emerald-200/80 text-emerald-900' : 'bg-orange-200/80 text-orange-950'
            }`}>
              Min. 12 Toko
            </span>
          </div>
        </div>

        {/* KONTROL TANGGAL, FILTER RUTE & CARI */}
        <div className="p-3 bg-zinc-50 border-b border-zinc-200/80 space-y-2 shrink-0">
          
          <div className="flex gap-2">
            {/* Input Pemilih Tanggal */}
            <div className="flex-1">
              <label className="block text-[10.5px] font-bold text-zinc-500 mb-1">
                TANGGAL KUNJUNGAN:
              </label>
              <input
                type="date"
                value={selectedDateIso}
                onChange={e => {
                  const newDate = e.target.value;
                  setSelectedDateIso(newDate);
                  setCheckedStoreIds(getInitialCheckedStores(newDate, visits, stores));
                }}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-[12.5px] font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 shadow-2xs"
              />
            </div>

            {/* Filter Rute Cepat */}
            <div className="flex-1">
              <label className="block text-[10.5px] font-bold text-zinc-500 mb-1">
                FILTER RUTE:
              </label>
              <select
                value={selectedRoute}
                onChange={e => setSelectedRoute(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-[12.5px] font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 shadow-2xs"
              >
                <option value="Semua">Semua Rute ({stores.length})</option>
                {availableRoutes.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kolom Pencarian Toko */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari toko atau customer ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-xl text-[12.5px] focus:outline-none focus:border-zinc-500 shadow-2xs"
            />
            <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Tombol Cepat: Pilih Semua / Batal */}
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-zinc-500 font-medium">
              Menampilkan {displayedStores.length} toko
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllDisplayed}
                className="text-[#EA580C] font-bold hover:underline"
              >
                + Pilih Semua Tampil
              </button>
              <span className="text-zinc-300">•</span>
              <button
                type="button"
                onClick={handleDeselectAllDisplayed}
                className="text-zinc-500 hover:text-zinc-700 font-medium"
              >
                Hapus Pilihan
              </button>
            </div>
          </div>

        </div>

        {/* LIST TOKO UNTUK DICENTANG */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-zinc-100">
          {displayedStores.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-[13px]">
              Tidak ada toko yang cocok dengan pencarian / rute ini.
            </div>
          ) : (
            displayedStores.map(store => {
              const key = store.id || store.customerId || store.name;
              const isChecked = checkedStoreIds.has(key);
              
              // Status kunjungan bulan ini sebelum rekap ini
              const storeMonthVisits = getStoreVisitsForMonth(store, visits, currentMonthKey);
              const monthCount = storeMonthVisits.length;

              return (
                <div
                  key={key}
                  onClick={() => handleToggleStore(key)}
                  className={`pt-2 first:pt-0 flex items-center justify-between gap-3 p-2.5 rounded-2xl cursor-pointer transition-colors ${
                    isChecked ? 'bg-orange-50/70 border border-orange-200/80 shadow-2xs' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Custom Checkbox */}
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                      isChecked 
                        ? 'bg-[#EA580C] border-[#EA580C] text-white' 
                        : 'border-zinc-300 bg-white'
                    }`}>
                      {isChecked && (
                        <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Informasi Toko */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {store.customerId && (
                          <span className="font-mono font-bold text-[11px] text-zinc-900 bg-zinc-100 px-1.5 py-0.2 rounded">
                            {store.customerId}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded">
                          {store.routeCode || 'TANPA RUTE'}
                        </span>
                      </div>
                      <p className="text-[13.5px] font-bold text-zinc-900 truncate mt-0.5">
                        {store.name}
                      </p>
                      {store.address && (
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {store.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badge Status Kunjungan Bulan Ini */}
                  <div className="text-right shrink-0">
                    <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md border ${
                      monthCount >= 2
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : monthCount === 1
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {monthCount >= 2 ? 'Target 2x Selesai' : `${monthCount}/2 Bln Ini`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER: TOMBOL SIMPAN REKAP */}
        <div className="p-4 bg-white border-t border-zinc-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            <p className="text-[11px] text-zinc-500 font-medium">
              Total dikunjungi tanggal ini:
            </p>
            <p className="text-[14px] font-black text-zinc-900">
              {checkedCount} Toko {isTargetAchieved && '✅'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[12.5px] font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white text-[13px] font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Simpan Rekap</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default VisitRecapModal;
