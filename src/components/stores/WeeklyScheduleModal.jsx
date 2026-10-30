import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  generateFullWeeklyScheduleText,
  generateSpvScheduleText,
  getStoreVisitsForMonth
} from '../../utils/visitUtils';
import { getCurrentMonthKey } from '../../utils/date';
import useSwipeBack from '../../hooks/useSwipeBack';

const STORAGE_KEY = 'weekly_visit_schedule';

function getInitialSchedule() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const result = {};
        WEEK_DAYS.forEach(d => {
          result[d] = Array.isArray(parsed[d]) ? parsed[d] : [];
        });
        return result;
      }
    } catch {}
  }

  // Struktur awal kosong untuk Senin s/d Sabtu
  const initial = {};
  WEEK_DAYS.forEach(d => {
    initial[d] = [];
  });
  return initial;
}

function WeeklyScheduleModal({
  isOpen,
  onClose,
  stores = [],
  visits = [],
  routesList = [],
  onApplyScheduleToDayVisits
}) {
  const [weeklySchedule, setWeeklySchedule] = useState(getInitialSchedule);
  const [activeDay, setActiveDay] = useState('senin');
  const [viewMode, setViewMode] = useState('spreadsheet'); // 'spreadsheet' | 'editor'
  
  // Search & Filter State untuk Menambah Toko ke Jadwal
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addSelectedRoute, setAddSelectedRoute] = useState('Semua');
  const [copyFeedback, setCopyFeedback] = useState(null); // 'day' | 'week' | null
  const [isAddingStore, setIsAddingStore] = useState(false);

  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  // Simpan perubahan ke LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(weeklySchedule));
    } catch {}
  }, [weeklySchedule]);

  const {
    containerRef,
    isSwiping,
    dragX,
    isExiting,
    containerStyle,
    backdropOpacity,
    handlers: swipeHandlers
  } = useSwipeBack({
    onBack: onClose,
    edgeWidth: 90,
    threshold: 70,
    enabled: isOpen
  });

  // Filter rute unik (tanpa 'Semua')
  const availableRoutes = useMemo(() => {
    return routesList.filter(r => r !== 'Semua');
  }, [routesList]);

  // Daftar toko pada hari yang sedang aktif
  const currentDayStores = useMemo(() => {
    return weeklySchedule[activeDay] || [];
  }, [weeklySchedule, activeDay]);

  // Hitung total toko terjadwal sepanjang minggu
  const totalWeeklyStoresCount = useMemo(() => {
    return WEEK_DAYS.reduce((total, d) => total + (weeklySchedule[d]?.length || 0), 0);
  }, [weeklySchedule]);

  // Himpunan ID/kunci toko yang sudah ada di hari aktif untuk mencegah duplikasi di hari yang sama
  const existingKeysInActiveDay = useMemo(() => {
    const set = new Set();
    currentDayStores.forEach(s => {
      const key = s.id || s.customerId || s.name;
      set.add(key);
    });
    return set;
  }, [currentDayStores]);

  // Daftar kandidat toko yang bisa ditambahkan ke hari aktif
  const candidateStores = useMemo(() => {
    let result = stores;
    if (addSelectedRoute !== 'Semua') {
      result = result.filter(s => s.routeCode && s.routeCode.trim().toUpperCase() === addSelectedRoute.toUpperCase());
    }
    if (addSearchQuery.trim()) {
      const q = addSearchQuery.toLowerCase().trim();
      result = result.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.customerId && s.customerId.toLowerCase().includes(q)) ||
        (s.routeCode && s.routeCode.toLowerCase().includes(q))
      );
    }
    // Urutkan alfabetis A-Z
    return [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [stores, addSelectedRoute, addSearchQuery]);

  // Handler: Tambah 1 Toko ke Hari Tertentu
  const handleAddStoreToDay = (store, targetDay = activeDay) => {
    setWeeklySchedule(prev => {
      const dayList = prev[targetDay] || [];
      const storeKey = store.id || store.customerId || store.name;
      const alreadyInDay = dayList.some(s => (s.id || s.customerId || s.name) === storeKey);
      if (alreadyInDay) return prev;

      const storeItem = {
        id: store.id || `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        customerId: store.customerId || '',
        name: store.name || '',
        routeCode: store.routeCode || '',
        address: store.address || ''
      };

      return {
        ...prev,
        [targetDay]: [...dayList, storeItem]
      };
    });
  };

  // Handler: Tambah Semua Toko dari Rute Terpilih ke Hari Tertentu
  const handleAddAllFromRoute = (targetDay = activeDay) => {
    if (candidateStores.length === 0) return;
    setWeeklySchedule(prev => {
      const dayList = [...(prev[targetDay] || [])];
      const existingKeys = new Set(dayList.map(s => s.id || s.customerId || s.name));

      candidateStores.forEach(store => {
        const key = store.id || store.customerId || store.name;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          dayList.push({
            id: store.id || `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            customerId: store.customerId || '',
            name: store.name || '',
            routeCode: store.routeCode || '',
            address: store.address || ''
          });
        }
      });

      return {
        ...prev,
        [targetDay]: dayList
      };
    });
    setIsAddingStore(false);
  };

  // Handler: Hapus Toko dari Hari Tertentu
  const handleRemoveStoreFromDay = (index, targetDay = activeDay) => {
    setWeeklySchedule(prev => {
      const dayList = [...(prev[targetDay] || [])];
      dayList.splice(index, 1);
      return {
        ...prev,
        [targetDay]: dayList
      };
    });
  };

  // Handler: Pindahkan Toko ke Hari Lain
  const handleMoveStoreToDay = (storeIndex, fromDay, toDay) => {
    if (fromDay === toDay) return;
    setWeeklySchedule(prev => {
      const fromList = [...(prev[fromDay] || [])];
      const toList = [...(prev[toDay] || [])];
      const [item] = fromList.splice(storeIndex, 1);
      if (!item) return prev;

      // Cek apakah sudah ada di hari tujuan
      const storeKey = item.id || item.customerId || item.name;
      const alreadyExists = toList.some(s => (s.id || s.customerId || s.name) === storeKey);
      if (!alreadyExists) {
        toList.push(item);
      }

      return {
        ...prev,
        [fromDay]: fromList,
        [toDay]: toList
      };
    });
  };

  // Handler: Kosongkan Jadwal Hari Tertentu
  const handleClearDay = (targetDay = activeDay) => {
    const dayLabel = WEEK_DAY_LABELS[targetDay];
    if (window.confirm(`Kosongkan seluruh jadwal kunjungan untuk hari ${dayLabel}?`)) {
      setWeeklySchedule(prev => ({
        ...prev,
        [targetDay]: []
      }));
    }
  };

  // Handler: Salin Jadwal Teks
  const handleCopyText = (type) => {
    let textToCopy = '';
    if (type === 'day') {
      const list = weeklySchedule[activeDay] || [];
      if (list.length === 0) return;
      const dayName = WEEK_DAY_LABELS[activeDay].toUpperCase();
      textToCopy = `📋 *JADWAL KUNJUNGAN ${dayName} (${list.length} Toko)*\n\n${generateSpvScheduleText({ selectedStores: list })}`;
    } else {
      textToCopy = generateFullWeeklyScheduleText(weeklySchedule);
    }

    if (!textToCopy) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyFeedback(type);
        setTimeout(() => setCopyFeedback(null), 2500);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopyFeedback(type);
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  // Handler: Terapkan Jadwal Hari Ini ke Rekap Kunjungan
  const handleApplyToRecap = (dayKey = activeDay) => {
    const list = weeklySchedule[dayKey] || [];
    if (list.length === 0) {
      alert(`Jadwal untuk hari ${WEEK_DAY_LABELS[dayKey]} masih kosong.`);
      return;
    }

    if (onApplyScheduleToDayVisits) {
      onApplyScheduleToDayVisits({
        dayKey,
        storesList: list
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-center">
      {/* Dimmed Backdrop Scrim */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity"
        style={{
          opacity: backdropOpacity,
          transition: isSwiping ? 'none' : 'opacity 0.25s ease',
          pointerEvents: isSwiping ? 'none' : 'auto'
        }}
        onClick={onClose}
      />

      <div
        ref={containerRef}
        {...swipeHandlers}
        style={containerStyle}
        className={`relative w-full h-full max-w-lg mx-auto bg-zinc-50 flex flex-col shadow-2xl ${
          dragX === 0 && !isExiting ? 'animate-in slide-in-from-right duration-200' : ''
        }`}
      >
        {/* HEADER MODAL */}
        <div className="bg-white border-b border-zinc-200 px-4 py-3 shrink-0 flex items-center justify-between gap-3 shadow-2xs pt-safe">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 font-semibold text-[14px] px-2 py-1 -ml-2 rounded-xl hover:bg-zinc-100 transition-colors active:scale-95 shrink-0"
              title="Kembali"
            >
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Kembali</span>
            </button>
            <div className="h-4 w-px bg-zinc-200 shrink-0" />
            <div>
              <h2 className="text-[15px] font-black text-zinc-900 leading-tight truncate">
                Jadwal Kunjungan Mingguan
              </h2>
              <p className="text-[11px] text-zinc-500 font-medium truncate">
                Periode Senin s/d Sabtu &bull; Total {totalWeeklyStoresCount} Toko
              </p>
            </div>
          </div>

          {/* Switcher Mode Tampilan: Spreadsheet vs Editor */}
          <div className="bg-zinc-100 p-0.5 rounded-xl border border-zinc-200/80 flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('spreadsheet')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                viewMode === 'spreadsheet'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
              title="Tampilan Tabel Spreadsheet (Senin-Sabtu)"
            >
              📊 Tabel
            </button>
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                viewMode === 'editor'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
              title="Editor Toko per Hari"
            >
              ✏️ Editor
            </button>
          </div>
        </div>

        {/* FEEDBACK SALIN NOTIFIKASI */}
        {copyFeedback && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-[12px] font-bold text-center animate-in fade-in duration-150 flex items-center justify-center gap-1.5 shadow-sm shrink-0">
            <span>✓</span>
            <span>
              {copyFeedback === 'day'
                ? `Jadwal hari ${WEEK_DAY_LABELS[activeDay]} berhasil disalin!`
                : 'Jadwal 1 minggu penuh berhasil disalin ke clipboard!'}
            </span>
          </div>
        )}

        {/* PILIHAN HARI TAB (SENIN S/D SABTU) */}
        <div className="bg-white border-b border-zinc-200/80 px-2 py-1.5 shrink-0 overflow-x-auto no-scrollbar scrollbar-none flex items-center gap-1">
          {WEEK_DAYS.map(dayKey => {
            const count = weeklySchedule[dayKey]?.length || 0;
            const isActive = activeDay === dayKey;
            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => {
                  setActiveDay(dayKey);
                  setIsAddingStore(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
                }`}
              >
                <span>{WEEK_DAY_LABELS[dayKey]}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-zinc-200 text-zinc-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 touch-pan-y">

          {/* ======================================================== */}
          {/* MODE 1: TAMPILAN SPREADSHEET MINGGUAN (MIRIP GAMBAR SPREADSHEET USER) */}
          {/* ======================================================== */}
          {viewMode === 'spreadsheet' && (
            <div className="space-y-3">
              {/* Petunjuk / Summary Card */}
              <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-between gap-2">
                <div>
                  <span className="text-[12px] font-bold text-zinc-900 block">
                    Tabel Jadwal Kunjungan Mingguan
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Geser ke kanan untuk melihat jadwal Senin s/d Sabtu secara lengkap
                  </span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyText('week')}
                    className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1"
                    title="Salin seluruh jadwal seminggu"
                  >
                    <span>📋</span>
                    <span>Salin Seminggu</span>
                  </button>
                </div>
              </div>

              {/* Multi-Column Spreadsheet Horizontal Scroll Container */}
              <div className="overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
                <div className="flex gap-3 min-w-max">
                  {WEEK_DAYS.map(dayKey => {
                    const list = weeklySchedule[dayKey] || [];
                    const isTodayActive = activeDay === dayKey;
                    return (
                      <div
                        key={dayKey}
                        className={`w-[260px] bg-white rounded-2xl border flex flex-col shadow-xs overflow-hidden transition-all ${
                          isTodayActive ? 'border-blue-400 ring-2 ring-blue-100' : 'border-zinc-200/90'
                        }`}
                      >
                        {/* Header Kolom Hari */}
                        <div className={`p-2.5 border-b flex items-center justify-between ${
                          isTodayActive ? 'bg-blue-50/80 border-blue-200' : 'bg-zinc-50 border-zinc-200'
                        }`}>
                          <div>
                            <span className="text-[12px] font-black text-zinc-900 uppercase tracking-wide block">
                              {WEEK_DAY_LABELS[dayKey]}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-bold">
                              {list.length} Toko Terjadwal
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveDay(dayKey);
                              setViewMode('editor');
                              setIsAddingStore(true);
                            }}
                            className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-zinc-200 rounded-lg text-[10.5px] font-bold transition-colors shadow-2xs"
                            title="Edit atau tambah toko"
                          >
                            + Tambah
                          </button>
                        </div>

                        {/* Tabel Toko: No | Customer Name | Customer ID */}
                        <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-zinc-100 text-[11px]">
                          {list.length === 0 ? (
                            <div className="p-6 text-center text-zinc-400 italic">
                              Belum ada toko
                            </div>
                          ) : (
                            list.map((store, idx) => (
                              <div
                                key={store.id || store.customerId || idx}
                                className="p-2 hover:bg-zinc-50/80 flex items-start gap-1.5 transition-colors group"
                              >
                                <span className="font-mono text-zinc-400 font-bold w-4 shrink-0 text-center text-[10px] pt-0.5">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-zinc-900 truncate leading-tight">
                                    {store.name}
                                  </p>
                                  <div className="flex items-center gap-1 text-[9.5px] text-zinc-500 mt-0.5">
                                    {store.customerId && (
                                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1 rounded">
                                        {store.customerId}
                                      </span>
                                    )}
                                    {store.routeCode && (
                                      <span className="bg-zinc-100 px-1 rounded text-zinc-500 truncate">
                                        {store.routeCode}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStoreFromDay(idx, dayKey)}
                                  className="text-zinc-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Hapus toko ini dari jadwal"
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Footer Kolom: Tombol Cepat */}
                        <div className="p-2 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDay(dayKey);
                              handleCopyText('day');
                            }}
                            className="text-zinc-600 hover:text-zinc-900 font-bold px-1.5 py-0.5 rounded transition-colors"
                          >
                            Salin Hari Ini
                          </button>
                          {list.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleClearDay(dayKey)}
                              className="text-red-500 hover:text-red-700 font-semibold px-1 py-0.5"
                            >
                              Kosongkan
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODE 2: EDITOR HARIAN TERFOKUS (TAMBAH / PINDAH / HAPUS) */}
          {/* ======================================================== */}
          {viewMode === 'editor' && (
            <div className="space-y-3.5">
              {/* Header Editor Hari */}
              <div className="p-3.5 bg-white rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    Jadwal Kunjungan Hari
                  </span>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-[17px] font-black text-zinc-900">
                      {WEEK_DAY_LABELS[activeDay]}
                    </h3>
                    <span className="text-[12px] font-bold text-zinc-500">
                      ({currentDayStores.length} Toko)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyText('day')}
                    className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1"
                    title="Salin jadwal teks hari ini"
                  >
                    <span>📋 Salin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddingStore(!isAddingStore)}
                    className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all shadow-2xs flex items-center gap-1 ${
                      isAddingStore
                        ? 'bg-zinc-800 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <span>{isAddingStore ? '✕ Tutup' : '+ Tambah Toko'}</span>
                  </button>
                </div>
              </div>

              {/* PANEL FORM PENCARIAN & TAMBAH TOKO KE JADWAL HARI INI */}
              {isAddingStore && (
                <div className="p-4 bg-white rounded-3xl border border-blue-200/90 shadow-md space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                    <span className="text-[12.5px] font-black text-zinc-900">
                      Pilih Toko untuk {WEEK_DAY_LABELS[activeDay]}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-500">
                      Tersedia {candidateStores.length} Toko
                    </span>
                  </div>

                  {/* Filter Rute & Cari Toko */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Filter Rute
                      </label>
                      <select
                        value={addSelectedRoute}
                        onChange={e => setAddSelectedRoute(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[11.5px] font-bold text-zinc-800 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all shadow-2xs"
                      >
                        <option value="Semua">Semua Rute</option>
                        {availableRoutes.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Aksi Rute
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddAllFromRoute(activeDay)}
                        disabled={candidateStores.length === 0}
                        className="w-full py-1.5 px-2 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-bold transition-all shadow-2xs text-center truncate"
                      >
                        + Tambah Semua Rute
                      </button>
                    </div>
                  </div>

                  {/* Input Cari Toko */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ketik nama toko atau Customer ID..."
                      value={addSearchQuery}
                      onChange={e => setAddSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[12px] placeholder:text-zinc-400 text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all font-medium"
                    />
                    {addSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setAddSearchQuery('')}
                        className="absolute inset-y-0 right-2.5 my-auto w-4 h-4 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 flex items-center justify-center text-[11px] font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* List Hasil Toko */}
                  <div className="max-h-[260px] overflow-y-auto divide-y divide-zinc-100 pr-1">
                    {candidateStores.length === 0 ? (
                      <p className="text-center py-6 text-[12px] text-zinc-400 italic">
                        Tidak ada toko yang sesuai pencarian
                      </p>
                    ) : (
                      candidateStores.map(store => {
                        const key = store.id || store.customerId || store.name;
                        const isAlreadyAdded = existingKeysInActiveDay.has(key);
                        const storeVisits = getStoreVisitsForMonth(store, visits, currentMonthKey);
                        const countThisMonth = storeVisits.length;

                        return (
                          <div
                            key={key}
                            className="py-2 flex items-center justify-between gap-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {store.customerId && (
                                  <span className="font-mono font-bold text-[9.5px] text-zinc-700 bg-zinc-100 px-1.5 py-0.2 rounded">
                                    {store.customerId}
                                  </span>
                                )}
                                <span className="text-[9.5px] font-semibold text-zinc-500 bg-zinc-100 px-1 rounded truncate">
                                  {store.routeCode || 'TANPA RUTE'}
                                </span>
                                <span className={`text-[9.5px] font-bold px-1 rounded ${
                                  countThisMonth >= 2 ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                                }`}>
                                  {countThisMonth}x Bln Ini
                                </span>
                              </div>
                              <p className="text-[12.5px] font-bold text-zinc-900 truncate mt-0.5">
                                {store.name}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddStoreToDay(store, activeDay)}
                              disabled={isAlreadyAdded}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 ${
                                isAlreadyAdded
                                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs active:scale-95'
                              }`}
                            >
                              {isAlreadyAdded ? '✓ Ada' : '+ Masukkan'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* LIST TOKO TERJADWAL DI HARI AKTIF */}
              <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs overflow-hidden">
                <div className="p-3 bg-zinc-50/80 border-b border-zinc-200/80 flex items-center justify-between text-[11px] font-bold text-zinc-600">
                  <span>Daftar Toko ({currentDayStores.length})</span>
                  {currentDayStores.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleClearDay(activeDay)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Kosongkan Hari Ini
                    </button>
                  )}
                </div>

                <div className="divide-y divide-zinc-100">
                  {currentDayStores.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 space-y-2">
                      <p className="text-[13px] font-semibold text-zinc-700">
                        Belum ada jadwal toko untuk hari {WEEK_DAY_LABELS[activeDay]}
                      </p>
                      <p className="text-[11.5px] max-w-xs mx-auto">
                        Klik tombol <strong>"+ Tambah Toko"</strong> di atas untuk memasukkan toko dari rute atau pencarian.
                      </p>
                    </div>
                  ) : (
                    currentDayStores.map((store, idx) => (
                      <div
                        key={store.id || store.customerId || idx}
                        className="p-3 hover:bg-zinc-50 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-5 text-center font-mono font-bold text-[12px] text-zinc-400 shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {store.customerId && (
                                <span className="font-mono font-bold text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                                  {store.customerId}
                                </span>
                              )}
                              {store.routeCode && (
                                <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded">
                                  {store.routeCode}
                                </span>
                              )}
                            </div>
                            <p className="text-[13px] font-bold text-zinc-900 truncate mt-0.5">
                              {store.name}
                            </p>
                            {store.address && (
                              <p className="text-[11px] text-zinc-500 truncate">
                                {store.address}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Aksi: Pindah Hari / Hapus */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Dropdown Pindah Hari */}
                          <select
                            value={activeDay}
                            onChange={(e) => handleMoveStoreToDay(idx, activeDay, e.target.value)}
                            className="text-[10.5px] font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg px-1.5 py-1 focus:outline-none"
                            title="Pindahkan toko ini ke hari lain"
                          >
                            {WEEK_DAYS.map(d => (
                              <option key={d} value={d}>
                                Ke {WEEK_DAY_LABELS[d]}
                              </option>
                            ))}
                          </select>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => handleRemoveStoreFromDay(idx, activeDay)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus dari jadwal hari ini"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER AKSI */}
        <div className="p-4 bg-white border-t border-zinc-200 flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleCopyText('week')}
            className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[12px] font-bold rounded-xl transition-all active:scale-95 text-center shadow-2xs"
          >
            📋 Salin Seminggu
          </button>

          <button
            type="button"
            onClick={() => handleApplyToRecap(activeDay)}
            disabled={currentDayStores.length === 0}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-[12px] font-bold rounded-xl transition-all active:scale-95 text-center shadow-sm"
          >
            🌙 Terapkan ke Rekap {WEEK_DAY_LABELS[activeDay]}
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default WeeklyScheduleModal;
