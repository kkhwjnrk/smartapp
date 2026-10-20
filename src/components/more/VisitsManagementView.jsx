import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getTodayIso, getCurrentMonthKey, formatDateWithDay } from '../../utils/date';
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
  onOpenSadixSchedule,
  onToggleVisitToday,
  onBack
}) {
  const todayIso = useMemo(() => getTodayIso(), []);
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);
  const todayVisitCount = useMemo(() => getDailyVisitCount(visits, todayIso), [visits, todayIso]);
  const monthlyStats = useMemo(() => getMonthlyVisitStats(stores, visits, currentMonthKey), [stores, visits, currentMonthKey]);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHasEntered(true), 260);
    return () => clearTimeout(t);
  }, []);

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
    edgeWidth: 85,
    threshold: 70,
    enabled: true
  });

  // Tab Tampilan: 'dates' (Riwayat per Tanggal) | 'stores' (Pantau Target Toko)
  const [activeTab, setActiveTab] = useState('dates');

  // State untuk Tab Riwayat per Tanggal
  const [dateSearchQuery, setDateSearchQuery] = useState('');
  const [expandedDates, setExpandedDates] = useState(() => new Set([todayIso]));

  // State untuk Modal "Ganti Tanggal Kunjungan"
  const [moveModalData, setMoveModalData] = useState(null); // { fromDateIso, count }
  const [newTargetDateIso, setNewTargetDateIso] = useState(todayIso);

  // State untuk Tab Pantau Target Toko
  const [visitStatusFilter, setVisitStatusFilter] = useState('all'); // 'all' | 'unvisited' | 'partial' | 'completed'
  const [selectedVisitRoute, setSelectedVisitRoute] = useState('Semua');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  // 1. Kelompokkan seluruh kunjungan berdasarkan tanggal (dateIso)
  const visitsByDate = useMemo(() => {
    const map = {};
    visits.forEach(v => {
      if (!v.dateIso) return;
      if (!map[v.dateIso]) {
        map[v.dateIso] = [];
      }
      map[v.dateIso].push(v);
    });

    return Object.entries(map)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA)) // Terkini di atas
      .map(([dateIso, dateVisits]) => ({
        dateIso,
        visits: dateVisits,
        count: dateVisits.length
      }));
  }, [visits]);

  // 2. Filter riwayat per tanggal berdasarkan pencarian
  const filteredVisitsByDate = useMemo(() => {
    if (!dateSearchQuery.trim()) return visitsByDate;
    const q = dateSearchQuery.toLowerCase().trim();
    return visitsByDate.filter(group => {
      const dateText = formatDateWithDay(group.dateIso).toLowerCase();
      if (dateText.includes(q) || group.dateIso.includes(q)) return true;
      return group.visits.some(v =>
        (v.storeName && v.storeName.toLowerCase().includes(q)) ||
        (v.customerId && v.customerId.toLowerCase().includes(q)) ||
        (v.routeCode && v.routeCode.toLowerCase().includes(q))
      );
    });
  }, [visitsByDate, dateSearchQuery]);

  // 3. Filter toko untuk tab Pantau Status Target Toko
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
      const visitsA = getStoreVisitsForMonth(a, visits, currentMonthKey).length;
      const visitsB = getStoreVisitsForMonth(b, visits, currentMonthKey).length;
      if (visitsA !== visitsB) return visitsA - visitsB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [stores, visits, currentMonthKey, visitStatusFilter, selectedVisitRoute, storeSearchQuery]);

  // Toggle ekspansi daftar toko per tanggal
  const toggleDateExpanded = (dateIso) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateIso)) {
        next.delete(dateIso);
      } else {
        next.add(dateIso);
      }
      return next;
    });
  };

  // Handler Hapus Seluruh Kunjungan pada Tanggal Tertentu
  const handleDeleteDate = (dateIso, count) => {
    const formatted = formatDateWithDay(dateIso);
    if (window.confirm(`Hapus seluruh catatan (${count} toko) pada ${formatted}?\n\nData kunjungan untuk tanggal ini akan dihapus permanen.`)) {
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

        // Kunci toko yang sudah ada di tanggal tujuan untuk menghindari duplikasi toko
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

    setMoveModalData(null);
  };

  const pageContent = (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-center">
      {/* Dimmed Backdrop Scrim */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity pointer-events-none"
        style={{
          opacity: backdropOpacity,
          transition: isSwiping ? 'none' : 'opacity 0.25s ease'
        }}
      />

      <div 
        ref={containerRef}
        {...swipeHandlers}
        style={containerStyle}
        className={`relative w-full h-full max-w-lg mx-auto bg-zinc-50 flex flex-col shadow-2xl ${
          !hasEntered && dragX === 0 && !isExiting ? 'animate-in slide-in-from-right duration-250' : ''
        }`}
      >
        {/* HEADER NAVIGASI RINGKAS (1 TOMBOL KEMBALI & BUAT JADWAL) */}
        <div className="bg-white border-b border-zinc-200/80 px-4 py-3 shrink-0 flex items-center justify-between gap-2.5 shadow-2xs pt-safe">
          <div className="flex items-center gap-2 min-w-0">
            {/* Tepat 1 Tombol Kembali */}
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
            <div className="h-4 w-px bg-zinc-200 shrink-0"></div>
            <h2 className="text-[15px] font-black text-zinc-900 leading-tight truncate">
              Target & Jadwal Kunjungan
            </h2>
          </div>

          {/* Tombol Buat Jadwal SPV di Kanan Atas */}
          <button
            type="button"
            onClick={onOpenSadixSchedule}
            className="text-[12px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-3 py-1.5 rounded-xl transition-all active:scale-95 shrink-0 flex items-center gap-1 shadow-2xs"
          >
            <span>📋</span>
            <span>Buat Jadwal</span>
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 pb-24">

      {/* CARD CAPAIAN HARI INI (FOKUS & PRAKTIS DENGAN TOMBOL REKAP HARI INI) */}
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
            {todayVisitCount >= 12 ? '✓ Target 12 Tercapai' : `Kurang ${12 - todayVisitCount} Toko`}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-3 pt-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[26px] font-black text-zinc-900 leading-none">{todayVisitCount}</span>
            <span className="text-[12.5px] font-bold text-zinc-400">/ 12 Toko Target</span>
          </div>

          {/* Tombol Rekap Langsung Hari Ini */}
          <button
            type="button"
            onClick={() => onOpenVisitRecap?.(todayIso)}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[12px] font-bold transition-all active:scale-95 shadow-2xs flex items-center gap-1.5 shrink-0"
          >
            <span>🌙</span>
            <span>{todayVisitCount > 0 ? 'Edit Rekap Hari Ini' : '+ Rekap Hari Ini'}</span>
          </button>
        </div>

        {/* Progress Bar Target 12 Toko Hari Ini */}
        <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/60">
          <div
            className={`h-full transition-all duration-500 rounded-full ${todayVisitCount >= 12 ? 'bg-emerald-500' : 'bg-[#EA580C]'
              }`}
            style={{ width: `${Math.min(100, Math.round((todayVisitCount / 12) * 100))}%` }}
          />
        </div>
      </div>

      {/* SEGMENTED SWITCHER: RIWAYAT PER TANGGAL VS STATUS TARGET TOKO */}
      <div className="bg-zinc-200/80 p-1 rounded-2xl flex items-center shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('dates')}
          className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'dates'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-600 hover:text-zinc-900'
            }`}
        >
          <span>📅 Riwayat per Tanggal</span>
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
      {/* TAB 1: RIWAYAT KUNJUNGAN PER TANGGAL (LIHAT, EDIT, PINDAH) */}
      {/* ======================================================== */}
      {activeTab === 'dates' && (
        <div className="space-y-3 animate-in fade-in duration-150">

          {/* Kolom Pencarian Riwayat Tanggal / Toko */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari tanggal (contoh: 19 Oktober) atau nama toko..."
              value={dateSearchQuery}
              onChange={e => setDateSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-zinc-200 rounded-2xl text-[12px] placeholder:text-zinc-400 text-zinc-900 focus:outline-none focus:border-zinc-400 shadow-2xs font-medium"
            />
            {dateSearchQuery && (
              <button
                type="button"
                onClick={() => setDateSearchQuery('')}
                className="absolute inset-y-0 right-2.5 my-auto w-4 h-4 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 flex items-center justify-center text-[11px] font-bold"
                title="Hapus pencarian"
              >
                ×
              </button>
            )}
          </div>

          {/* Daftar Kartu per Tanggal */}
          {filteredVisitsByDate.length === 0 ? (
            <div className="py-10 text-center bg-white rounded-3xl border border-zinc-200/80 shadow-2xs px-4">
              <div className="w-11 h-11 mx-auto bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mb-2.5">
                <span className="text-[20px]">📅</span>
              </div>
              <p className="text-[13.5px] font-bold text-zinc-900">Belum Ada Riwayat Kunjungan</p>
              <p className="text-[11.5px] text-zinc-500 mt-1 max-w-xs mx-auto">
                {dateSearchQuery
                  ? 'Tidak ada tanggal atau toko yang cocok dengan pencarian Anda.'
                  : 'Catat rekap kunjungan malam hari untuk mulai mendokumentasikan kunjungan.'}
              </p>
              <button
                type="button"
                onClick={() => onOpenVisitRecap?.(todayIso)}
                className="mt-3.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-[11.5px] font-bold hover:bg-zinc-800 transition-colors shadow-2xs"
              >
                + Mulai Rekap Hari Ini
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredVisitsByDate.map(group => {
                const isToday = group.dateIso === todayIso;
                const isExpanded = expandedDates.has(group.dateIso);
                const isTargetAchieved = group.count >= 12;

                return (
                  <div
                    key={group.dateIso}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200/90 shadow-2xs overflow-hidden transition-all"
                  >
                    {/* Header Tanggal & Aksi Cepat */}
                    <div className="p-3.5 sm:p-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="text-[13.5px] font-black text-zinc-900">
                            {formatDateWithDay(group.dateIso)}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-2 py-0.2 rounded-full border border-blue-200">
                              Hari Ini
                            </span>
                          )}
                        </div>

                        <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full border ${isTargetAchieved
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-orange-50 text-orange-800 border-orange-200'
                          }`}>
                          {group.count} Toko {isTargetAchieved ? '✓ Target' : ''}
                        </span>
                      </div>

                      {/* Baris Tombol Aksi Tanggal: Edit, Ganti Tanggal, Hapus */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-100 flex-wrap">
                        {/* 1. Edit Checklist Toko */}
                        <button
                          type="button"
                          onClick={() => onOpenVisitRecap?.(group.dateIso)}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1"
                          title="Buka checklist untuk menambah / mengurangi toko pada tanggal ini"
                        >
                          <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Edit Toko</span>
                        </button>

                        {/* 2. Ganti Tanggal (Pindahkan semua kunjungan ke tanggal baru) */}
                        <button
                          type="button"
                          onClick={() => handleOpenMoveModal(group.dateIso, group.count)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1"
                          title="Ubah / pindahkan seluruh data kunjungan ke tanggal lain"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Ganti Tanggal</span>
                        </button>

                        {/* 3. Hapus Seluruh Kunjungan Tanggal Ini */}
                        <button
                          type="button"
                          onClick={() => handleDeleteDate(group.dateIso, group.count)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1 ml-auto"
                          title="Hapus seluruh data kunjungan pada tanggal ini"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Hapus</span>
                        </button>
                      </div>

                      {/* Tombol Expand / Collapse Daftar Toko */}
                      <button
                        type="button"
                        onClick={() => toggleDateExpanded(group.dateIso)}
                        className="mt-2 w-full py-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors border border-zinc-200/60"
                      >
                        <span>{isExpanded ? 'Tutup Daftar Toko' : `Lihat ${group.count} Toko yang Dikunjungi`}</span>
                        <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Rincian Toko yang Dikunjungi (Expandable) */}
                    {isExpanded && (
                      <div className="bg-zinc-50/70 border-t border-zinc-200/80 px-3.5 py-2.5 space-y-1.5 max-h-72 overflow-y-auto">
                        {group.visits.map((v, idx) => (
                          <div
                            key={v.id || `${v.storeName}_${idx}`}
                            className="bg-white p-2.5 rounded-xl border border-zinc-200/70 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-zinc-400">
                                  #{idx + 1}
                                </span>
                                {v.customerId && (
                                  <span className="font-mono font-bold text-[9.5px] text-zinc-800 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200">
                                    {v.customerId}
                                  </span>
                                )}
                                {v.routeCode && (
                                  <span className="text-[9.5px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200/60">
                                    {v.routeCode}
                                  </span>
                                )}
                              </div>
                              <p className="text-[12.5px] font-bold text-zinc-900 truncate mt-0.5">
                                {v.storeName || 'Toko Tanpa Nama'}
                              </p>
                            </div>

                            {/* Tombol Hapus 1 Toko Spesifik */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSingleStoreVisit(v.id, v.storeName)}
                              className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-90 shrink-0"
                              title="Hapus toko ini dari tanggal ini"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PANTAU STATUS TARGET TOKO (2X PER BULAN)           */}
      {/* ======================================================== */}
      {activeTab === 'stores' && (
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-zinc-200/90 shadow-2xs space-y-3 animate-in fade-in duration-150">

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13.5px] font-bold text-zinc-900 leading-tight">
                Status Target Toko (2x Sebulan)
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Cek toko yang belum atau sudah mencapai target
              </p>
            </div>
            <span className="text-[11px] font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-lg">
              {filteredVisitStores.length} Toko
            </span>
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
                <option value="unvisited">Belum Dikunjungi (0/2) ({monthlyStats.unvisitedCount})</option>
                <option value="partial">Kurang 1x Kunjungan (1/2) ({monthlyStats.partialCount})</option>
                <option value="completed">Target 2x Selesai ({monthlyStats.completedCount})</option>
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
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari ID customer, nama toko, alamat..."
              value={storeSearchQuery}
              onChange={e => setStoreSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[12px] placeholder:text-zinc-400 text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all font-medium"
            />
            {storeSearchQuery && (
              <button
                type="button"
                onClick={() => setStoreSearchQuery('')}
                className="absolute inset-y-0 right-2.5 my-auto w-4 h-4 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-600 flex items-center justify-center text-[11px] font-bold"
                title="Hapus pencarian"
              >
                ×
              </button>
            )}
          </div>

          {/* Daftar Toko */}
          <div className="space-y-2 pt-1 max-h-[460px] overflow-y-auto pr-1">
            {filteredVisitStores.length === 0 ? (
              <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-zinc-200/70 text-zinc-500">
                <p className="text-[13px] font-semibold text-zinc-800">Tidak ada toko pada filter ini</p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
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
                    className="p-3 bg-zinc-50/90 hover:bg-zinc-100/90 rounded-2xl border border-zinc-200/80 transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {store.customerId && (
                          <span className="font-mono font-bold text-[9.5px] text-zinc-900 bg-white px-1.5 py-0.2 rounded border border-zinc-200 shadow-2xs">
                            {store.customerId}
                          </span>
                        )}
                        <span className="text-[9.5px] font-bold text-zinc-500 bg-zinc-200/70 px-1.5 py-0.2 rounded">
                          {store.routeCode || 'TANPA RUTE'}
                        </span>
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-md border ${status.bgClass}`}>
                          {status.shortLabel}
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
      )}

      {/* ======================================================== */}
      {/* MODAL GANTI TANGGAL KUNJUNGAN (PINDAHKAN REKAP SEKALIGUS)  */}
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

            <p className="text-[11px] text-zinc-400 leading-tight">
              💡 Berguna jika Anda salah memilih tanggal saat rekap, sehingga tidak perlu menghapus toko satu per satu.
            </p>

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
    </div>
  );

  return createPortal(pageContent, document.body);
}

export default VisitsManagementView;
