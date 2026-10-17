import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getTodayIso, formatFullIndonesianDate, getCurrentMonthKey } from '../../utils/date';
import { getStoreVisitsForMonth, generateSadixScheduleText } from '../../utils/visitUtils';

function SadixScheduleModal({
  isOpen,
  onClose,
  stores = [],
  visits = [],
  routesList = []
}) {
  // Default tanggal: besok (atau hari ini)
  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [scheduleDateIso, setScheduleDateIso] = useState(defaultDate);
  const [selectedRoute, setSelectedRoute] = useState(routesList.find(r => r !== 'Semua') || 'Semua');
  const [selectedStoreIds, setSelectedStoreIds] = useState(new Set());
  const [copyFeedback, setCopyFeedback] = useState(false);
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  // Filter rute unik (tanpa 'Semua')
  const availableRoutes = useMemo(() => {
    return routesList.filter(r => r !== 'Semua');
  }, [routesList]);

  // Toko-toko di rute terpilih yang diurutkan berdasarkan prioritas kunjungan
  // Prioritas 1: Kunjungan 0x
  // Prioritas 2: Kunjungan 1x
  // Prioritas 3: Kunjungan >= 2x
  const prioritizedStoresInRoute = useMemo(() => {
    let list = stores;
    if (selectedRoute !== 'Semua') {
      list = list.filter(s => s.routeCode && s.routeCode.trim().toUpperCase() === selectedRoute.toUpperCase());
    }

    return [...list].sort((a, b) => {
      const visitsA = getStoreVisitsForMonth(a, visits, currentMonthKey).length;
      const visitsB = getStoreVisitsForMonth(b, visits, currentMonthKey).length;
      // Urutkan dari yang kunjungannya paling sedikit
      if (visitsA !== visitsB) return visitsA - visitsB;
      // Jika sama, urutkan berdasarkan nama
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [stores, selectedRoute, visits, currentMonthKey]);

  // Toggle toko
  const handleToggleStore = (storeKey) => {
    setSelectedStoreIds(prev => {
      const next = new Set(prev);
      if (next.has(storeKey)) {
        next.delete(storeKey);
      } else {
        next.add(storeKey);
      }
      return next;
    });
  };

  // Pilih otomatis 12 toko rekomendasi teratas (paling butuh dikunjungi)
  const handleAutoSelect12 = () => {
    const next = new Set();
    const countToPick = Math.min(12, prioritizedStoresInRoute.length);
    for (let i = 0; i < countToPick; i++) {
      const store = prioritizedStoresInRoute[i];
      const key = store.id || store.customerId || store.name;
      next.add(key);
    }
    setSelectedStoreIds(next);
  };

  // Pilih semua toko di rute ini
  const handleSelectAllRoute = () => {
    const next = new Set();
    prioritizedStoresInRoute.forEach(s => {
      const key = s.id || s.customerId || s.name;
      next.add(key);
    });
    setSelectedStoreIds(next);
  };

  // Bersihkan pilihan
  const handleClearSelection = () => {
    setSelectedStoreIds(new Set());
  };

  // Daftar toko terpilih
  const selectedStoresList = useMemo(() => {
    return prioritizedStoresInRoute.filter(s => {
      const key = s.id || s.customerId || s.name;
      return selectedStoreIds.has(key);
    });
  }, [prioritizedStoresInRoute, selectedStoreIds]);

  const selectedCount = selectedStoresList.length;
  const isTargetMet = selectedCount >= 12;

  // Teks format ringkas daftar toko & ID customer untuk SPV
  const generatedText = useMemo(() => {
    return generateSadixScheduleText({
      selectedStores: selectedStoresList
    });
  }, [selectedStoresList]);

  // Salin teks ke Clipboard untuk dikirim ke WA SPV
  const handleCopyText = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedText);
      } else {
        // Fallback untuk browser yang tidak mendukung clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = generatedText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch {
      alert('Gagal menyalin otomatis. Silakan salin teks dari kotak pratinjau.');
    }
  };

  // Unduh teks jadwal sebagai file .txt
  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Jadwal_Kunjungan_${selectedRoute.replace(/\s+/g, '_')}_${scheduleDateIso}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      {/* Backdrop Dimmed */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-zinc-200 animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-4 bg-zinc-900 text-white flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <h2 className="text-[17px] font-black tracking-tight text-white">
                Atur Jadwal Kunjungan (Sadix)
              </h2>
            </div>
            <p className="text-[12px] text-zinc-300 mt-0.5">
              Pilih minimal 12 toko sejalur untuk diserahkan ke SPV di akun Sadix.
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

        {/* BAR KONTROL PARAMETER JADWAL: TANGGAL & RUTE */}
        <div className="p-3 bg-zinc-50 border-b border-zinc-200/80 space-y-2 shrink-0">
          <div className="flex gap-2">
            {/* Input Tanggal Kunjungan */}
            <div className="flex-1">
              <label className="block text-[10.5px] font-bold text-zinc-500 mb-1">
                TANGGAL RENCANA:
              </label>
              <input
                type="date"
                value={scheduleDateIso}
                onChange={e => setScheduleDateIso(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-[12.5px] font-bold text-zinc-900 focus:outline-none focus:border-zinc-500 shadow-2xs"
              />
            </div>

            {/* Pemilih Rute */}
            <div className="flex-1">
              <label className="block text-[10.5px] font-bold text-zinc-500 mb-1">
                PILIH RUTE KUNJUNGAN:
              </label>
              <select
                value={selectedRoute}
                onChange={e => {
                  setSelectedRoute(e.target.value);
                  setSelectedStoreIds(new Set()); // Reset saat rute berganti
                }}
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

          {/* COUNTER TARGET & QUICK SELECTOR */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-[12px] font-black px-2 py-0.5 rounded-lg ${
                isTargetMet ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
              }`}>
                {selectedCount} / 12 Toko
              </span>
              <span className="text-[11px] text-zinc-500 font-medium">
                {isTargetMet ? 'Target 12 toko terpenuhi ✅' : `Pilih min. 12 toko (${Math.max(0, 12 - selectedCount)} lagi)`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAutoSelect12}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200/80 transition-colors"
            >
              ⚡ Rekomendasi 12 Toko
            </button>
          </div>
        </div>

        {/* LIST TOKO PRIORITAS DALAM RUTE INI */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] px-1 text-zinc-400 font-bold uppercase tracking-wider">
            <span>Daftar Toko ({prioritizedStoresInRoute.length})</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllRoute}
                className="text-zinc-600 hover:underline capitalize"
              >
                Pilih Semua
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-zinc-400 hover:underline capitalize"
              >
                Bersihkan
              </button>
            </div>
          </div>

          {prioritizedStoresInRoute.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-[13px]">
              Tidak ada toko pada rute ini.
            </div>
          ) : (
            prioritizedStoresInRoute.map((store, idx) => {
              const key = store.id || store.customerId || store.name;
              const isSelected = selectedStoreIds.has(key);
              const storeMonthVisits = getStoreVisitsForMonth(store, visits, currentMonthKey);
              const count = storeMonthVisits.length;

              return (
                <div
                  key={key}
                  onClick={() => handleToggleStore(key)}
                  className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 shadow-2xs'
                      : 'bg-white border-zinc-200/90 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'border-zinc-300 bg-white'
                    }`}>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {store.customerId && (
                          <span className="font-mono font-bold text-[10.5px] text-zinc-800 bg-zinc-100 px-1.5 py-0.2 rounded">
                            {store.customerId}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-bold">
                          {store.routeCode || 'TANPA RUTE'}
                        </span>
                      </div>
                      <p className="text-[13px] font-bold text-zinc-900 truncate leading-snug mt-0.5">
                        {store.name}
                      </p>
                      {store.address && (
                        <p className="text-[11px] text-zinc-500 truncate">
                          {store.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badge Prioritas Kunjungan */}
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      count === 0
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : count === 1
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {count === 0 ? 'Prioritas: 0x' : count === 1 ? 'Butuh 1x lagi' : 'Target 2x Selesai'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PRATINJAU TEKS RINGKAS UNTUK SPV */}
        {selectedCount > 0 && (
          <div className="p-3 bg-zinc-100 border-t border-zinc-200 shrink-0 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-zinc-700 flex items-center gap-1">
                <span>📋 Pratinjau Daftar Toko & ID:</span>
                <span className="text-zinc-500 font-normal">({selectedCount} Toko)</span>
              </span>
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="text-zinc-500 hover:text-zinc-900 underline text-[11px]"
              >
                Unduh .TXT
              </button>
            </div>
            <div className="p-2.5 bg-white border border-zinc-200/90 rounded-xl font-mono text-[11.5px] text-zinc-800 max-h-28 overflow-y-auto leading-relaxed select-all">
              {generatedText}
            </div>
          </div>
        )}

        {/* FOOTER: TOMBOL SALIN UNTUK SPV */}
        <div className="p-4 bg-white border-t border-zinc-200 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <span className="text-[11px] text-zinc-500 font-medium block">
              Jadwal: {formatFullIndonesianDate(scheduleDateIso)}
            </span>
            <span className="text-[13px] font-bold text-zinc-900">
              {selectedCount} Toko Terpilih
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[12.5px] font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleCopyText}
              className={`px-5 py-2.5 font-bold text-[13px] rounded-xl transition-all shadow-md flex items-center gap-1.5 ${
                copyFeedback 
                  ? 'bg-emerald-600 text-white' 
                  : selectedCount === 0 
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    : 'bg-[#EA580C] hover:bg-orange-700 text-white active:scale-95 cursor-pointer'
              }`}
            >
              {copyFeedback ? (
                <>
                  <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Tersalin ke WhatsApp!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>Salin List Toko</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default SadixScheduleModal;
