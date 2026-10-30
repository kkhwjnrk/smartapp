import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  getTodayIso,
  getCurrentMonthKey,
  formatDateWithDay,
  INDO_MONTHS
} from '../../utils/date';
import {
  getDailyVisitCount,
  getMonthlyVisitStats,
  getStoreVisitsForMonth,
  getStoreVisitStatus,
  isStoreMatch
} from '../../utils/visitUtils';
import useSwipeBack from '../../hooks/useSwipeBack';

function VisitsManagementView({
  stores = [],
  visits = [],
  setVisits,
  routesList = [],
  onOpenVisitRecap,
  onOpenWeeklySchedule,
  onToggleVisitToday,
  onBack
}) {
  const todayIso = useMemo(() => getTodayIso(), []);
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);
  const todayVisitCount = useMemo(() => getDailyVisitCount(visits, todayIso), [visits, todayIso]);
  const monthlyStats = useMemo(() => getMonthlyVisitStats(stores, visits, currentMonthKey), [stores, visits, currentMonthKey]);

  const handleOpenSchedule = onOpenWeeklySchedule;

  const {
    containerRef,
    dragX,
    isSwiping,
    isExiting,
    containerStyle,
    backdropOpacity,
    handlers: swipeHandlers
  } = useSwipeBack({
    onBack,
    edgeWidth: 90,
    threshold: 70,
    enabled: true
  });

  // Tab Tampilan: 'dates' (Kalender & Riwayat) | 'stores' (Pantau Target Toko)
  const [activeTab, setActiveTab] = useState('dates');

  // ==========================================
  // STATE KALENDER INTERAKTIF
  // ==========================================
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth()); // 0-indexed (0 = Jan, 9 = Okt)
  const [selectedCalendarDateIso, setSelectedCalendarDateIso] = useState(todayIso);

  // Navigasi Bulan Kalender
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleJumpToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedCalendarDateIso(todayIso);
  };

  // Peta Kunjungan per Tanggal (dateIso -> array of visits)
  const visitsMapByDate = useMemo(() => {
    const map = {};
    visits.forEach(v => {
      if (!v.dateIso) return;
      if (!map[v.dateIso]) {
        map[v.dateIso] = [];
      }
      map[v.dateIso].push(v);
    });
    return map;
  }, [visits]);

  // Matrix Tanggal Kalender (Senin s/d Minggu)
  const calendarMatrix = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const startOffset = (firstDayOfWeek + 6) % 7; // 0 = Senin, 6 = Minggu
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    // Hari dari bulan sebelumnya
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 12 : viewMonth;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateIso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNum: d,
        dateIso,
        isCurrentMonth: false,
        monthOffset: -1
      });
    }

    // Hari bulan berjalan
    for (let d = 1; d <= daysInMonth; d++) {
      const dateIso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNum: d,
        dateIso,
        isCurrentMonth: true,
        monthOffset: 0
      });
    }

    // Hari bulan berikutnya untuk melengkapi baris (kelipatan 7)
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const m = viewMonth === 11 ? 1 : viewMonth + 2;
        const y = viewMonth === 11 ? viewYear + 1 : viewYear;
        const dateIso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({
          dayNum: d,
          dateIso,
          isCurrentMonth: false,
          monthOffset: 1
        });
      }
    }

    return cells;
  }, [viewYear, viewMonth]);

  // Daftar toko yang dikunjungi pada tanggal terpilih di kalender
  const selectedDateVisits = useMemo(() => {
    return visitsMapByDate[selectedCalendarDateIso] || [];
  }, [visitsMapByDate, selectedCalendarDateIso]);

  // Klik tanggal di kalender
  const handleSelectDateCell = (cell) => {
    setSelectedCalendarDateIso(cell.dateIso);
    if (cell.monthOffset === -1) {
      handlePrevMonth();
    } else if (cell.monthOffset === 1) {
      handleNextMonth();
    }
  };

  // State untuk Modal "Ganti Tanggal Kunjungan"
  const [moveModalData, setMoveModalData] = useState(null); // { fromDateIso, count }
  const [newTargetDateIso, setNewTargetDateIso] = useState(todayIso);

  // State untuk Tab Pantau Target Toko
  const [visitStatusFilter, setVisitStatusFilter] = useState('all'); // 'all' | 'unvisited' | 'partial' | 'completed'
  const [selectedVisitRoute, setSelectedVisitRoute] = useState('Semua');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  // Search untuk daftar riwayat
  const [dateSearchQuery, setDateSearchQuery] = useState('');

  // Kelompokkan seluruh kunjungan berdasarkan tanggal untuk riwayat daftar
  const visitsByDate = useMemo(() => {
    return Object.entries(visitsMapByDate)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(([dateIso, dateVisits]) => ({
        dateIso,
        visits: dateVisits,
        count: dateVisits.length
      }));
  }, [visitsMapByDate]);

  // Filter toko untuk tab Pantau Status Target Toko
  // ATURAN USER: URUTKAN SESUAI ABJAD A-Z (TIDAK BERUBAH PER STATUS)
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

      if (storeSearchQuery.trim()) {
        const q = storeSearchQuery.toLowerCase();
        const match = (store.name && store.name.toLowerCase().includes(q)) ||
          (store.customerId && store.customerId.toLowerCase().includes(q)) ||
          (store.routeCode && store.routeCode.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      // Urutkan toko murni sesuai abjad A-Z
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [stores, visits, currentMonthKey, visitStatusFilter, selectedVisitRoute, storeSearchQuery]);

  // Handler Hapus Seluruh Kunjungan pada Tanggal Tertentu
  const handleDeleteDate = (dateIso, count) => {
    const formatted = formatDateWithDay(dateIso);
    if (window.confirm(`Hapus seluruh rekap (${count} toko) pada ${formatted}?\n\nData kunjungan untuk tanggal ini akan dihapus permanen.`)) {
      if (setVisits) {
        setVisits(prev => prev.filter(v => v.dateIso !== dateIso));
      }
    }
  };

  // Handler Hapus 1 Toko Spesifik dari Tanggal Tertentu
  const handleDeleteSingleStoreVisit = (visitId, storeName) => {
    if (window.confirm(`Hapus kunjungan toko "${storeName}" dari tanggal ini?`)) {
      if (setVisits) {
        setVisits(prev => prev.filter(v => v.id !== visitId));
      }
    }
  };

  // Buka Modal Ganti Tanggal Kunjungan
  const handleOpenMoveModal = (dateIso, count) => {
    setMoveModalData({ fromDateIso: dateIso, count });
    setNewTargetDateIso(todayIso);
  };

  // Eksekusi Pindahkan Seluruh Kunjungan ke Tanggal Baru
  const handleExecuteMoveDate = () => {
    if (!moveModalData || !newTargetDateIso || moveModalData.fromDateIso === newTargetDateIso) {
      setMoveModalData(null);
      return;
    }

    const fromIso = moveModalData.fromDateIso;
    const toIso = newTargetDateIso;

    if (setVisits) {
      setVisits(prev => {
        const toMove = prev.filter(v => v.dateIso === fromIso);
        const remaining = prev.filter(v => v.dateIso !== fromIso);

        const existingKeysInTarget = new Set(
          remaining.filter(v => v.dateIso === toIso).map(v => v.storeId || v.customerId || v.storeName?.toLowerCase())
        );

        const movedVisits = toMove
          .filter(v => {
            const key = v.storeId || v.customerId || v.storeName?.toLowerCase();
            return !existingKeysInTarget.has(key);
          })
          .map(v => ({
            ...v,
            dateIso: toIso,
            monthKey: toIso.substring(0, 7)
          }));

        return [...remaining, ...movedVisits];
      });
    }

    setSelectedCalendarDateIso(toIso);
    setMoveModalData(null);
  };

  const pageContent = (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-center">
      {/* Dimmed Backdrop Scrim */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity"
        style={{
          opacity: backdropOpacity,
          transition: isSwiping ? 'none' : 'opacity 0.25s ease',
          pointerEvents: isSwiping ? 'none' : 'auto'
        }}
        onClick={onBack}
      />

      <div 
        ref={containerRef}
        {...swipeHandlers}
        style={containerStyle}
        className={`relative w-full h-full max-w-lg mx-auto bg-zinc-50 flex flex-col shadow-2xl ${
          dragX === 0 && !isExiting ? 'animate-in slide-in-from-right duration-250' : ''
        }`}
      >
        {/* HEADER NAVIGASI RINGKAS */}
        <div className="bg-white border-b border-zinc-200/80 px-4 py-3 shrink-0 flex items-center justify-between gap-2.5 shadow-2xs pt-safe">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 font-semibold text-[14px] px-2 py-1 -ml-2 rounded-xl hover:bg-zinc-100 transition-colors active:scale-95 shrink-0"
              title="Kembali ke Menu Lainnya"
            >
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Kembali</span>
            </button>
            <div className="h-4 w-px bg-zinc-200 shrink-0" />
            <h2 className="text-[15px] font-black text-zinc-900 leading-tight truncate">
              Target & Jadwal Kunjungan
            </h2>
          </div>

          {/* Tombol Atur Jadwal Mingguan (Senin - Sabtu) */}
          <button
            type="button"
            onClick={handleOpenSchedule}
            className="text-[12px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-3 py-1.5 rounded-xl transition-all active:scale-95 shrink-0 flex items-center gap-1 shadow-2xs"
            title="Buka Jadwal Kunjungan Mingguan"
          >
            <span>📋</span>
            <span>Jadwal Mingguan</span>
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5 pb-24 touch-pan-y">

          {/* CARD CAPAIAN HARI INI */}
          <div className="p-4 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200/90 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]"></span>
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Kunjungan Hari Ini
                </span>
              </div>

              <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full border ${todayVisitCount >= 12
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-orange-50 text-orange-800 border-orange-200'
                }`}>
                {todayVisitCount >= 12 ? '✓ Target 12 Tercapai' : `Kurang ${Math.max(0, 12 - todayVisitCount)} Toko`}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3 pt-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[26px] font-black text-zinc-900 leading-none">{todayVisitCount}</span>
                <span className="text-[12.5px] font-bold text-zinc-400">/ 12 Toko Target</span>
              </div>

              <button
                type="button"
                onClick={() => onOpenVisitRecap?.(todayIso)}
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[12px] font-bold transition-all active:scale-95 shadow-2xs flex items-center gap-1.5 shrink-0"
              >
                <span>🌙</span>
                <span>{todayVisitCount > 0 ? 'Edit Rekap Hari Ini' : '+ Rekap Hari Ini'}</span>
              </button>
            </div>

            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/60">
              <div
                className={`h-full transition-all duration-500 rounded-full ${todayVisitCount >= 12 ? 'bg-emerald-500' : 'bg-[#EA580C]'
                  }`}
                style={{ width: `${Math.min(100, Math.round((todayVisitCount / 12) * 100))}%` }}
              />
            </div>
          </div>

          {/* SEGMENTED SWITCHER: KALENDER & RIWAYAT VS STATUS TARGET TOKO */}
          <div className="bg-zinc-200/80 p-1 rounded-2xl flex items-center shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('dates')}
              className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'dates'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
                }`}
            >
              <span>📅 Kalender Kunjungan</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'dates' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-300/70 text-zinc-700'
                }`}>
                {visitsByDate.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stores')}
              className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'stores'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
                }`}
            >
              <span>🎯 Status Target Toko</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'stores' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-300/70 text-zinc-700'
                }`}>
                {stores.length}
              </span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: KALENDER KUNJUNGAN & DETAIL REKAP TANGGAL TERPILIH */}
          {/* ======================================================== */}
          {activeTab === 'dates' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">

              {/* WIDGET KALENDER BULANAN INTERAKTIF */}
              <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-4 space-y-3">
                {/* Header Navigasi Bulan */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[16px] font-black text-zinc-900 tracking-tight">
                      {INDO_MONTHS[viewMonth]} {viewYear}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      Klik tanggal untuk merekap atau melihat toko yang dikunjungi
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleJumpToday}
                      className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-[11px] rounded-lg transition-colors mr-1"
                      title="Kembali ke hari ini"
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-colors"
                      title="Bulan sebelumnya"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-colors"
                      title="Bulan berikutnya"
                    >
                      ›
                    </button>
                  </div>
                </div>

                {/* Header Nama Hari (Sen s/d Min) */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-zinc-400 py-1 border-b border-zinc-100">
                  <span>Sen</span>
                  <span>Sel</span>
                  <span>Rab</span>
                  <span>Kam</span>
                  <span>Jum</span>
                  <span>Sab</span>
                  <span className="text-red-400">Min</span>
                </div>

                {/* Grid Tanggal Kalender */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {calendarMatrix.map(cell => {
                    const cellVisits = visitsMapByDate[cell.dateIso] || [];
                    const visitCount = cellVisits.length;
                    const isSelected = selectedCalendarDateIso === cell.dateIso;
                    const isToday = todayIso === cell.dateIso;
                    const isTargetAchieved = visitCount >= 12;

                    return (
                      <button
                        key={cell.dateIso}
                        type="button"
                        onClick={() => handleSelectDateCell(cell)}
                        className={`min-h-[50px] p-1 rounded-2xl flex flex-col items-center justify-between transition-all relative ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                            : isToday
                              ? 'bg-orange-50 border border-orange-300 text-orange-900 font-black'
                              : cell.isCurrentMonth
                                ? 'bg-zinc-50 hover:bg-zinc-100/90 text-zinc-800'
                                : 'bg-transparent text-zinc-300 hover:bg-zinc-50'
                        }`}
                      >
                        {/* Angka Tanggal */}
                        <span className={`text-[12px] font-bold leading-tight ${
                          isSelected
                            ? 'text-white'
                            : isToday
                              ? 'text-orange-700 font-black'
                              : cell.isCurrentMonth
                                ? 'text-zinc-800'
                                : 'text-zinc-300'
                        }`}>
                          {cell.dayNum}
                        </span>

                        {/* Indikator Kunjungan Toko */}
                        <div className="w-full flex justify-center pb-0.5">
                          {visitCount > 0 ? (
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full leading-tight truncate ${
                              isSelected
                                ? 'bg-white text-blue-700'
                                : isTargetAchieved
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#EA580C] text-white'
                            }`}>
                              {visitCount}
                            </span>
                          ) : (
                            <span className="h-1.5" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legenda Singkat Kalender */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[10.5px] text-zinc-500 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>Target Tercapai (≥12)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]"></span>
                    <span>Kunjungan (&lt;12)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>Tanggal Terpilih</span>
                  </div>
                </div>
              </div>

              {/* DETAIL TANGGAL TERPILIH DI KALENDER (KLIK UNTUK REKAP / LIHAT TOKO) */}
              <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-4 space-y-3.5">
                <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        Tanggal Terpilih
                      </span>
                      {selectedCalendarDateIso === todayIso && (
                        <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md">
                          Hari Ini
                        </span>
                      )}
                    </div>
                    <h3 className="text-[16px] font-black text-zinc-900 mt-1">
                      {formatDateWithDay(selectedCalendarDateIso)}
                    </h3>
                  </div>

                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl border ${
                    selectedDateVisits.length >= 12
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : selectedDateVisits.length > 0
                        ? 'bg-orange-50 text-orange-800 border-orange-200'
                        : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                  }`}>
                    {selectedDateVisits.length > 0
                      ? `${selectedDateVisits.length} Toko Dikunjungi`
                      : 'Belum Ada Rekap'}
                  </span>
                </div>

                {/* Tombol Utama: Rekap / Edit Tanggal Ini */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onOpenVisitRecap?.(selectedCalendarDateIso)}
                    className="flex-1 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white rounded-2xl text-[12.5px] font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>🌙</span>
                    <span>
                      {selectedDateVisits.length > 0
                        ? `Edit Rekap (${selectedDateVisits.length} Toko)`
                        : '+ Rekap Kunjungan Tanggal Ini'}
                    </span>
                  </button>

                  {selectedDateVisits.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenMoveModal(selectedCalendarDateIso, selectedDateVisits.length)}
                        className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 border border-blue-200/80 rounded-2xl text-[11.5px] font-bold transition-all shrink-0"
                        title="Pindahkan semua toko ke tanggal lain"
                      >
                        Ganti Tanggal
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDate(selectedCalendarDateIso, selectedDateVisits.length)}
                        className="py-2.5 px-3 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 border border-red-200/80 rounded-2xl text-[11.5px] font-bold transition-all shrink-0"
                        title="Hapus seluruh rekap tanggal ini"
                      >
                        Hapus
                      </button>
                    </>
                  )}
                </div>

                {/* List Toko yang Dikunjungi pada Tanggal Terpilih */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Daftar Toko Dikunjungi ({selectedDateVisits.length}):
                  </span>

                  {selectedDateVisits.length === 0 ? (
                    <div className="p-4 bg-zinc-50 rounded-2xl text-center text-zinc-400 text-[12px] italic">
                      Belum ada catatan rekap toko pada tanggal ini. Klik tombol di atas untuk merekap.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100 max-h-[300px] overflow-y-auto pr-1">
                      {selectedDateVisits.map((v, idx) => (
                        <div
                          key={v.id || idx}
                          className="py-2 flex items-center justify-between gap-2 hover:bg-zinc-50 px-1 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-mono text-zinc-400 font-bold text-[11px] w-5 shrink-0 text-center">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12.5px] font-bold text-zinc-900 truncate">
                                {v.storeName}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                {v.customerId && (
                                  <span className="font-mono font-bold text-zinc-700 bg-zinc-100 px-1 rounded">
                                    {v.customerId}
                                  </span>
                                )}
                                {v.routeCode && (
                                  <span className="bg-zinc-100 px-1 rounded">
                                    {v.routeCode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteSingleStoreVisit(v.id, v.storeName)}
                            className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus toko ini dari rekap"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* PENCARIAN & DAFTAR REKAP LAINNYA */}
              <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-zinc-900">
                    Daftar Semua Tanggal Terekap ({visitsByDate.length})
                  </h4>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari riwayat tanggal atau toko..."
                    value={dateSearchQuery}
                    onChange={e => setDateSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[12px] placeholder:text-zinc-400 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                  />
                  {dateSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDateSearchQuery('')}
                      className="absolute inset-y-0 right-2.5 my-auto w-4 h-4 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 flex items-center justify-center text-[10px] font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto divide-y divide-zinc-100 pr-1">
                  {visitsByDate
                    .filter(g => {
                      if (!dateSearchQuery.trim()) return true;
                      const q = dateSearchQuery.toLowerCase().trim();
                      const dateText = formatDateWithDay(g.dateIso).toLowerCase();
                      if (dateText.includes(q) || g.dateIso.includes(q)) return true;
                      return g.visits.some(v => v.storeName?.toLowerCase().includes(q) || v.customerId?.toLowerCase().includes(q));
                    })
                    .map(group => {
                      const isCurrentSelected = selectedCalendarDateIso === group.dateIso;
                      return (
                        <div
                          key={group.dateIso}
                          onClick={() => {
                            setSelectedCalendarDateIso(group.dateIso);
                            const [y, m] = group.dateIso.split('-');
                            setViewYear(parseInt(y, 10));
                            setViewMonth(parseInt(m, 10) - 1);
                          }}
                          className={`py-2 px-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                            isCurrentSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-zinc-50'
                          }`}
                        >
                          <div>
                            <span className="text-[12px] font-bold text-zinc-800 block">
                              {formatDateWithDay(group.dateIso)}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {group.count} Toko Dikunjungi
                            </span>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            group.count >= 12 ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {group.count >= 12 ? '✓ Target' : `${group.count}/12`}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PANTAU STATUS TARGET TOKO (SELALU DIURUTKAN SESUAI ABJAD) */}
          {/* ======================================================== */}
          {activeTab === 'stores' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">

              {/* Ringkasan Capaian Bulanan */}
              <div className="p-4 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Target 2x Kunjungan Sebulan
                  </span>
                  <span className="text-[12px] font-bold text-zinc-900">
                    {monthlyStats.completedCount} / {monthlyStats.totalStores} Toko ({monthlyStats.completionPercent}%)
                  </span>
                </div>

                <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/70">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${monthlyStats.completionPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1.5 text-center">
                  <div className="p-2 bg-zinc-50 rounded-xl border border-zinc-100">
                    <span className="block text-[14px] font-black text-red-600">{monthlyStats.unvisitedCount}</span>
                    <span className="text-[10px] font-semibold text-zinc-500">Belum (0x)</span>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded-xl border border-zinc-100">
                    <span className="block text-[14px] font-black text-amber-600">{monthlyStats.partialCount}</span>
                    <span className="text-[10px] font-semibold text-zinc-500">Kurang 1x</span>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded-xl border border-zinc-100">
                    <span className="block text-[14px] font-black text-emerald-600">{monthlyStats.completedCount}</span>
                    <span className="text-[10px] font-semibold text-zinc-500">Target Selesai</span>
                  </div>
                </div>
              </div>

              {/* Filter Status Kunjungan & Rute */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Status Target
                  </label>
                  <select
                    value={visitStatusFilter}
                    onChange={e => setVisitStatusFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[11.5px] font-bold text-zinc-800 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all shadow-2xs"
                  >
                    <option value="all">Semua Status ({stores.length})</option>
                    <option value="unvisited">Belum Dikunjungi (0x) ({monthlyStats.unvisitedCount})</option>
                    <option value="partial">Kurang 1x Kunjungan (1x) ({monthlyStats.partialCount})</option>
                    <option value="completed">Target Tercapai (≥2x) ({monthlyStats.completedCount})</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Kode Rute
                  </label>
                  <select
                    value={selectedVisitRoute}
                    onChange={e => setSelectedVisitRoute(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[11.5px] font-bold text-zinc-800 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all shadow-2xs"
                  >
                    <option value="Semua">Semua Rute</option>
                    {routesList.filter(r => r !== 'Semua').map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kolom Cari Toko */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari toko sesuai abjad (nama, ID customer, rute)..."
                  value={storeSearchQuery}
                  onChange={e => setStoreSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[12px] placeholder:text-zinc-400 text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all font-medium"
                />
                {storeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStoreSearchQuery('')}
                    className="absolute inset-y-0 right-2.5 my-auto w-4 h-4 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 flex items-center justify-center text-[11px] font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Daftar Toko - DIURUTKAN SESUAI ABJAD A-Z & TAMPILKAN JUMLAH AKTUAL (3x, 4x, DST) */}
              <div className="space-y-2 pt-1 max-h-[480px] overflow-y-auto pr-1">
                {filteredVisitStores.length === 0 ? (
                  <div className="py-8 text-center bg-white rounded-2xl border border-zinc-200/70 text-zinc-500">
                    <p className="text-[13px] font-semibold text-zinc-800">Tidak ada toko pada filter ini</p>
                    <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
                      Semua toko pada filter ini telah memenuhi target atau silakan ubah pilihan rute.
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
                        className="p-3 bg-white hover:bg-zinc-50 rounded-2xl border border-zinc-200/80 transition-all flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {store.customerId && (
                              <span className="font-mono font-bold text-[9.5px] text-zinc-900 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200">
                                {store.customerId}
                              </span>
                            )}
                            <span className="text-[9.5px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded">
                              {store.routeCode || 'TANPA RUTE'}
                            </span>
                            
                            {/* BADGE AKTUAL: TAMPILKAN 3x, 4x, DST TANPA DICAP HANYA 2X */}
                            <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-md border ${status.bgClass}`}>
                              {visitCount >= 2 ? `${visitCount}x Dikunjungi` : status.shortLabel}
                            </span>
                          </div>

                          <p className="text-[13px] font-bold text-zinc-900 truncate mt-1">
                            {store.name}
                          </p>
                          {store.address && (
                            <p className="text-[10.5px] text-zinc-500 truncate mt-0.5">
                              {store.address}
                            </p>
                          )}
                        </div>

                        {/* Tombol Cepat Kunjungan Hari Ini */}
                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={() => onToggleVisitToday?.(store)}
                            className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold transition-all active:scale-95 border ${isVisitedToday
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200 shadow-2xs'
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
          )}

        </div>

        {/* ======================================================== */}
        {/* MODAL GANTI TANGGAL KUNJUNGAN                            */}
        {/* ======================================================== */}
        {moveModalData && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setMoveModalData(null); }}
            className="fixed inset-0 z-100 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            style={{ zIndex: 100 }}
          >
            <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200 space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center text-[22px] mb-2 shadow-xs">
                  📅
                </div>
                <h3 className="text-[16px] font-bold text-zinc-900">
                  Ganti Tanggal Kunjungan
                </h3>
                <p className="text-[12px] text-zinc-500 mt-1">
                  Pindahkan seluruh <strong className="text-zinc-800">{moveModalData.count} toko</strong> dari tanggal lama ke tanggal baru sekaligus.
                </p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2">
                <div>
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Tanggal Asal:
                  </span>
                  <span className="text-[13px] font-bold text-zinc-800">
                    {formatDateWithDay(moveModalData.fromDateIso)}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">
                    Pilih Tanggal Baru Tujuan:
                  </label>
                  <input
                    type="date"
                    value={newTargetDateIso}
                    onChange={e => setNewTargetDateIso(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-[13px] font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setMoveModalData(null)}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[13px] rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteMoveDate}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Simpan & Pindahkan
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  return createPortal(pageContent, document.body);
}

export default VisitsManagementView;
