import React, { useState, useRef, useMemo } from 'react';
import { getTodayIso, getCurrentMonthKey } from '../../utils/date';
import { 
  getDailyVisitCount, 
  getMonthlyVisitStats, 
  getStoreVisitsForMonth, 
  getStoreVisitStatus, 
  isStoreMatch 
} from '../../utils/visitUtils';

function MoreTab({
  orders = [],
  setOrders,
  stores = [],
  setStores,
  items = [],
  visits = [],
  setVisits,
  routesList = [],
  onOpenVisitRecap,
  onOpenSadixSchedule,
  onToggleVisitToday
}) {
  const [importStatus, setImportStatus] = useState(null);
  const [pendingExportType, setPendingExportType] = useState(null); // 'all' | 'orders' | 'stores' | null
  const [pendingRestoreData, setPendingRestoreData] = useState(null);
  const [restoreOrdersChecked, setRestoreOrdersChecked] = useState(true);
  const [restoreStoresChecked, setRestoreStoresChecked] = useState(true);
  const [copyStatus, setCopyStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Kunjungan State & Filter di Halaman Lainnya
  const todayIso = useMemo(() => getTodayIso(), []);
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);
  const todayVisitCount = useMemo(() => getDailyVisitCount(visits, todayIso), [visits, todayIso]);
  const monthlyStats = useMemo(() => getMonthlyVisitStats(stores, visits, currentMonthKey), [stores, visits, currentMonthKey]);

  const [visitStatusFilter, setVisitStatusFilter] = useState('all'); // 'all' | 'unvisited' | 'partial' | 'completed'
  const [selectedVisitRoute, setSelectedVisitRoute] = useState('Semua');
  const [visitSearchQuery, setVisitSearchQuery] = useState('');

  // Filter daftar toko untuk pemantauan target kunjungan
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

  // Hitung statistik toko dengan koordinat GPS
  const storesWithGpsCount = stores.filter(s => s.lat && s.lng).length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const completedOrdersCount = orders.filter(o => o.status === 'completed').length;

  // 1. Ekspor Data Cadangan Modular ke File JSON
  const handleExportBackup = (type = 'all') => {
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

      let dataToExport = {};
      let filename = '';
      let typeLabel = '';

      if (type === 'orders') {
        dataToExport = { orders };
        filename = `daytona_orders_${dateStr}_${timeStr}.json`;
        typeLabel = `Data Order (${orders.length} order)`;
      } else if (type === 'stores') {
        dataToExport = { stores };
        filename = `daytona_stores_gps_${dateStr}_${timeStr}.json`;
        typeLabel = `Data Toko & GPS (${stores.length} toko, ${storesWithGpsCount} GPS)`;
      } else {
        // all
        dataToExport = { orders, stores, visits };
        filename = `daytona_backup_semua_${dateStr}_${timeStr}.json`;
        typeLabel = `Semua Data (${orders.length} order, ${stores.length} toko, ${visits.length} riwayat kunjungan)`;
      }

      const backupPayload = {
        appName: 'SmartApp Daytona',
        version: '2.0',
        backupType: type, // 'all' | 'orders' | 'stores'
        exportedAt: now.toISOString(),
        exportedDateFormatted: now.toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }),
        summary: {
          totalOrders: type === 'stores' ? 0 : orders.length,
          pendingOrders: type === 'stores' ? 0 : pendingOrdersCount,
          completedOrders: type === 'stores' ? 0 : completedOrdersCount,
          totalStores: type === 'orders' ? 0 : stores.length,
          storesWithGps: type === 'orders' ? 0 : storesWithGpsCount,
          totalItems: items.length
        },
        data: dataToExport
      };

      const jsonString = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      setImportStatus({
        type: 'success',
        message: `✓ Berhasil mengunduh file cadangan: ${typeLabel}`
      });
      setShowExportMenu(false);
    } catch (err) {
      setImportStatus({
        type: 'error',
        message: 'Gagal membuat file cadangan: ' + err.message
      });
    }
  };

  // 2. Salin Data Cadangan ke Clipboard
  const handleCopyBackupText = (type = 'all') => {
    try {
      let dataToCopy = {};
      if (type === 'orders') dataToCopy = { orders };
      else if (type === 'stores') dataToCopy = { stores };
      else dataToCopy = { orders, stores, visits };

      const backupPayload = {
        appName: 'SmartApp Daytona',
        version: '2.0',
        backupType: type,
        exportedAt: new Date().toISOString(),
        data: dataToCopy
      };

      navigator.clipboard.writeText(JSON.stringify(backupPayload, null, 2));
      setCopyStatus(type);
      setTimeout(() => setCopyStatus(null), 2500);

      setImportStatus({
        type: 'success',
        message: '✓ Teks data cadangan berhasil disalin ke clipboard!'
      });
    } catch (e) {
      alert('Gagal menyalin teks data: ' + e.message);
    }
  };

  // 3. Baca & Analisis File Cadangan yang Diunggah Pengguna
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);

        // Dukung beberapa format cadangan:
        // 1. Format baru: { data: { orders, stores }, backupType, ... }
        // 2. Format langsung: { orders, stores }
        // 3. Format legacy: array orders langsung [...]
        let extractedOrders = null;
        let extractedStores = null;

        if (Array.isArray(parsed)) {
          // Cadangan lama berupa array order langsung
          extractedOrders = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.data?.orders)) {
            extractedOrders = parsed.data.orders;
          } else if (Array.isArray(parsed.orders)) {
            extractedOrders = parsed.orders;
          }

          if (Array.isArray(parsed.data?.stores)) {
            extractedStores = parsed.data.stores;
          } else if (Array.isArray(parsed.stores)) {
            extractedStores = parsed.stores;
          }
        }

        const hasOrders = Array.isArray(extractedOrders) && extractedOrders.length > 0;
        const hasStores = Array.isArray(extractedStores) && extractedStores.length > 0;

        if (!hasOrders && !hasStores) {
          throw new Error('File tidak memuat data order maupun data toko Daytona yang valid.');
        }

        const detectedType = parsed.backupType || (hasOrders && hasStores ? 'all' : hasOrders ? 'orders' : 'stores');

        setPendingRestoreData({
          fileName: file.name,
          appName: parsed.appName || 'Cadangan Daytona',
          exportedAt: parsed.exportedDateFormatted || parsed.exportedAt || 'Waktu tidak tercatat',
          backupType: detectedType,
          hasOrders,
          hasStores,
          orders: hasOrders ? extractedOrders : [],
          stores: hasStores ? extractedStores : []
        });

        // Set default centang untuk data yang tersedia di file
        setRestoreOrdersChecked(hasOrders);
        setRestoreStoresChecked(hasStores);
        setImportStatus(null);
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: 'Gagal membaca file: ' + err.message
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 4. Eksekusi Pemulihan Data Selektif Sesuai Pilihan Checkbox
  const handleConfirmRestore = () => {
    if (!pendingRestoreData) return;

    const shouldRestoreOrders = restoreOrdersChecked && pendingRestoreData.hasOrders;
    const shouldRestoreStores = restoreStoresChecked && pendingRestoreData.hasStores;

    if (!shouldRestoreOrders && !shouldRestoreStores) {
      alert('Pilih minimal salah satu jenis data yang ingin dipulihkan.');
      return;
    }

    try {
      const summaryRestored = [];

      // Pulihkan Data Order jika dicentang
      if (shouldRestoreOrders) {
        localStorage.setItem('daytona_orders', JSON.stringify(pendingRestoreData.orders));
        setOrders(pendingRestoreData.orders);
        summaryRestored.push(`${pendingRestoreData.orders.length} Order`);
      }

      // Pulihkan Data Toko jika dicentang
      if (shouldRestoreStores && setStores) {
        localStorage.setItem('daytona_stores', JSON.stringify(pendingRestoreData.stores));
        setStores(pendingRestoreData.stores);
        summaryRestored.push(`${pendingRestoreData.stores.length} Toko & GPS`);
      }

      // Pulihkan Data Riwayat Kunjungan jika tersedia
      if (pendingRestoreData.visits && Array.isArray(pendingRestoreData.visits) && setVisits) {
        localStorage.setItem('daytona_visits', JSON.stringify(pendingRestoreData.visits));
        setVisits(pendingRestoreData.visits);
        summaryRestored.push(`${pendingRestoreData.visits.length} Kunjungan`);
      }

      setPendingRestoreData(null);
      setImportStatus({
        type: 'success',
        message: `✓ Berhasil memulihkan: ${summaryRestored.join(' dan ')}!`
      });
    } catch (err) {
      setImportStatus({
        type: 'error',
        message: 'Gagal memulihkan data: ' + err.message
      });
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-12">

      {/* Header Info Aplikasi */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs flex items-center gap-4">
        {/* Logo Resmi Sistem Daytona */}
        <div className="w-14 h-14 shrink-0 rounded-2xl overflow-hidden shadow-xs flex items-center justify-center">
          <svg
            className="w-full h-full"
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="512" height="512" rx="115" fill="#EA580C" />
            <g transform="translate(18, 0)">
              <polygon points="108,384 142,128 172,128 138,384" fill="#FFFFFF" opacity="0.35" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M 160 384 L 210 128 L 305 128 C 375 128 420 168 405 240 C 390 316 335 384 255 384 Z M 225 328 L 260 184 L 295 184 C 335 184 355 204 345 244 C 335 284 305 328 265 328 Z"
                fill="#FFFFFF"
              />
            </g>
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[17px] font-bold text-zinc-900 leading-tight">
              SmartApp
            </h2>
          </div>
          <p className="text-[12px] text-zinc-500 mt-1 leading-snug">
            Aplikasi produktifitas kerja
          </p>
        </div>
      </div>

      {/* Notifikasi Status Pesan */}
      {importStatus && (
        <div className={`p-4 rounded-2xl text-[13px] font-medium border flex items-start justify-between gap-3 animate-in fade-in duration-200 ${importStatus.type === 'success'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-red-50 text-red-800 border-red-200'
          }`}>
          <span>{importStatus.message}</span>
          <button
            type="button"
            onClick={() => setImportStatus(null)}
            className="text-zinc-400 hover:text-zinc-700 text-[15px] font-bold leading-none p-1"
          >
            ×
          </button>
        </div>
      )}

      {/* SECTION UTAMA: TARGET & JADWAL KUNJUNGAN TOKO (SADIX) */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#EA580C] border border-orange-100 flex items-center justify-center shrink-0 shadow-2xs">
              <span className="text-[18px]">🎯</span>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-zinc-900 leading-tight">
                Target & Jadwal Kunjungan (Sadix)
              </h3>
              <p className="text-[11.5px] text-zinc-500 mt-0.5">
                Tracking min. 2x/bulan per toko & rekap harian min. 12 toko
              </p>
            </div>
          </div>
        </div>

        {/* Ringkasan Status Pencapaian Harian & Bulanan */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Box 1: Hari Ini */}
          <div className="p-3.5 bg-gradient-to-br from-zinc-50 to-zinc-100/70 rounded-2xl border border-zinc-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Hari Ini
              </span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                todayVisitCount >= 12 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {todayVisitCount >= 12 ? '✓ Tercapai' : 'Target 12'}
              </span>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[22px] font-black text-zinc-900">{todayVisitCount}</span>
                <span className="text-[12px] font-bold text-zinc-500">/ 12 Toko</span>
              </div>
              <p className="text-[10.5px] text-zinc-500 mt-0.5">
                {todayVisitCount >= 12 
                  ? 'Target harian terpenuhi!' 
                  : `Kurang ${12 - todayVisitCount} toko lagi`}
              </p>
            </div>
          </div>

          {/* Box 2: Target Bulanan 2x */}
          <div className="p-3.5 bg-gradient-to-br from-zinc-50 to-zinc-100/70 rounded-2xl border border-zinc-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Target 2x Bulan Ini
              </span>
              <span className="text-[10px] font-black text-zinc-700 bg-zinc-200/80 px-1.5 py-0.5 rounded-full">
                {monthlyStats.completionPercent}%
              </span>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[22px] font-black text-zinc-900">{monthlyStats.completedCount}</span>
                <span className="text-[12px] font-bold text-zinc-500">/ {monthlyStats.totalStores} Toko</span>
              </div>
              {/* Mini Progress Bar */}
              <div className="w-full h-1.5 bg-zinc-200 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${monthlyStats.completionPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2 Tombol Aksi Utama: Rekap Kunjungan Malam & Buat Jadwal SPV */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Tombol Rekap Malam Hari */}
          <button
            type="button"
            onClick={onOpenVisitRecap}
            className="p-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl border border-zinc-800 shadow-sm flex flex-col justify-between text-left active:scale-98 transition-all"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="w-7 h-7 rounded-xl bg-[#EA580C] text-white flex items-center justify-center font-bold text-[13px] shadow-2xs">
                🌙
              </span>
              <span className="text-[10px] font-bold text-zinc-400">
                Malam Hari
              </span>
            </div>
            <div>
              <p className="text-[12.5px] font-black text-white leading-tight">
                Rekap Kunjungan
              </p>
              <p className="text-[10.5px] text-zinc-300 mt-0.5">
                Centang toko hari ini
              </p>
            </div>
          </button>

          {/* Tombol Buat Jadwal SPV (Sadix) */}
          <button
            type="button"
            onClick={onOpenSadixSchedule}
            className="p-3 bg-white hover:bg-zinc-50 text-zinc-900 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between text-left active:scale-98 transition-all"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center font-bold text-[13px] shadow-2xs">
                📋
              </span>
              <span className="text-[10px] font-bold text-blue-600">
                SPV Sadix
              </span>
            </div>
            <div>
              <p className="text-[12.5px] font-black text-zinc-900 leading-tight">
                Buat Jadwal (Sadix)
              </p>
              <p className="text-[10.5px] text-zinc-500 mt-0.5">
                Pilih 12 toko & salin list
              </p>
            </div>
          </button>
        </div>

        {/* BAGIAN FILTER & PANTAU STATUS TARGET KUNJUNGAN TOKO */}
        <div className="pt-2 border-t border-zinc-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-zinc-800 uppercase tracking-wider block">
              Pantau Status Target Kunjungan
            </span>
            <span className="text-[11px] text-zinc-500 font-medium">
              {filteredVisitStores.length} Toko
            </span>
          </div>

          {/* Filter Chips Status Target 2x */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setVisitStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
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
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
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

          {/* Bar Tambahan: Filter Rute & Pencarian Toko */}
          <div className="flex gap-2">
            {/* Dropdown Rute */}
            <select
              value={selectedVisitRoute}
              onChange={e => setSelectedVisitRoute(e.target.value)}
              className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[11.5px] font-bold text-zinc-800 focus:outline-none focus:border-zinc-400 shrink-0"
            >
              <option value="Semua">Semua Rute</option>
              {routesList.filter(r => r !== 'Semua').map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {/* Input Pencarian */}
            <input
              type="text"
              placeholder="Cari toko / ID customer..."
              value={visitSearchQuery}
              onChange={e => setVisitSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[11.5px] placeholder:text-zinc-400 text-zinc-900 focus:outline-none focus:border-zinc-400"
            />
          </div>

          {/* Daftar Toko dengan Status Kunjungan */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 pt-1 scrollbar-thin">
            {filteredVisitStores.length === 0 ? (
              <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-zinc-200/70 text-zinc-500">
                <p className="text-[12.5px] font-medium">Tidak ada toko pada filter ini</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Semua toko pada filter ini sudah memenuhi target atau coba ubah pilihan rute.</p>
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
                    className="p-3 bg-zinc-50/80 hover:bg-zinc-100/80 rounded-2xl border border-zinc-200/80 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {store.customerId && (
                          <span className="font-mono font-bold text-[10px] text-zinc-900 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                            {store.customerId}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-200/60 px-1.5 py-0.5 rounded">
                          {store.routeCode || 'TANPA RUTE'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${status.bgClass}`}>
                          {status.shortLabel}
                        </span>
                      </div>
                      <p className="text-[13px] font-bold text-zinc-900 truncate mt-1">
                        {store.name}
                      </p>
                      {store.address && (
                        <p className="text-[11px] text-zinc-500 truncate">
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

      </div>

      {/* SECTION 1: CADANGAN & KEAMANAN DATA MODULAR */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#EA580C] border border-orange-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-zinc-900 leading-tight">
              Cadangan & Pemulihan Data
            </h3>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              Simpan dan pulihkan data secara modular (Order / Toko & GPS)
            </p>
          </div>
        </div>

        {/* Ringkasan Status Data di Perangkat Saat Ini */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3.5 bg-zinc-50/90 rounded-2xl border border-zinc-100">
            <span className="text-[11.5px] text-zinc-500 font-medium block">Total Catatan Order</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[20px] font-black text-zinc-900">{orders.length}</span>
              <span className="text-[11.5px] text-zinc-500">order</span>
            </div>
            <span className="text-[11px] text-zinc-400 block mt-1">
              {pendingOrdersCount} aktif · {completedOrdersCount} selesai
            </span>
          </div>

          <div className="p-3.5 bg-zinc-50/90 rounded-2xl border border-zinc-100">
            <span className="text-[11.5px] text-zinc-500 font-medium block">Total Toko Terdaftar</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[20px] font-black text-zinc-900">{stores.length}</span>
              <span className="text-[11.5px] text-zinc-500">toko</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium block mt-1">
              {storesWithGpsCount} toko ada GPS ✓
            </span>
          </div>
        </div>

        {/* OPSI CADANGKAN DATA (EXPORT) */}
        <div className="space-y-2.5 pt-2">
          <span className="text-[12px] font-bold text-zinc-700 block uppercase tracking-wider">
            1. Pilihan Cadangkan Data (Ekspor)
          </span>

          {/* Tombol Utama: Cadangkan Semua Data (Rekomendasi) */}
          <button
            type="button"
            onClick={() => setPendingExportType('all')}
            className="w-full p-3.5 bg-gradient-to-r from-orange-600 to-[#EA580C] hover:from-orange-700 hover:to-orange-600 active:scale-98 text-white rounded-2xl transition-all shadow-sm flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[13.5px]">Cadangkan Semua Data</span>
                  <span className="px-2 py-0.5 bg-white/25 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Lengkap
                  </span>
                </div>
                <p className="text-[11.5px] text-orange-100 mt-0.5">
                  Order ({orders.length}) + Data Toko & GPS ({stores.length})
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-white/80 group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Opsi Cadangkan Parsial (2 Kolom) */}
          <div className="grid grid-cols-2 gap-2">

            {/* Hanya Order */}
            <button
              type="button"
              onClick={() => setPendingExportType('orders')}
              className="p-3 bg-zinc-50 hover:bg-zinc-100 active:scale-98 border border-zinc-200/80 rounded-2xl transition-all text-left flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 text-zinc-800 font-bold text-[12.5px]">
                <svg className="w-4 h-4 text-orange-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Hanya Order</span>
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                {orders.length} riwayat pesanan
              </span>
            </button>

            {/* Hanya Toko & GPS */}
            <button
              type="button"
              onClick={() => setPendingExportType('stores')}
              className="p-3 bg-zinc-50 hover:bg-zinc-100 active:scale-98 border border-zinc-200/80 rounded-2xl transition-all text-left flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 text-zinc-800 font-bold text-[12.5px]">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Hanya Toko & GPS</span>
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                {stores.length} toko ({storesWithGpsCount} GPS)
              </span>
            </button>

          </div>

          {/* Utilitas Salin Teks JSON */}
          <div className="pt-1 flex items-center justify-between text-[11.5px] px-1">
            <span className="text-zinc-500">Kirim tanpa download file:</span>
            <button
              type="button"
              onClick={() => handleCopyBackupText('all')}
              className="font-semibold text-orange-600 hover:text-orange-700 active:scale-95 transition-all flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>{copyStatus === 'all' ? 'Tersalin ke Clipboard!' : 'Salin Teks JSON'}</span>
            </button>
          </div>
        </div>

        {/* OPSI PULIHKAN DATA (RESTORE) */}
        <div className="space-y-2.5 pt-3 border-t border-zinc-100">
          <span className="text-[12px] font-bold text-zinc-700 block uppercase tracking-wider">
            2. Pulihkan Data Cadangan (Impor)
          </span>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 active:scale-98 text-white font-bold text-[13px] rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Pilih File Cadangan (.json)</span>
          </button>

          <p className="text-[11.5px] text-zinc-400 text-center">
            Anda dapat memilih bagian data mana yang ingin dipulihkan setelah file dipilih.
          </p>
        </div>

      </div>

      {/* SECTION 2: INFORMASI SISTEM & KATALOG */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">

        <h3 className="text-[15px] font-bold text-zinc-900 leading-tight">
          Informasi & Spesifikasi Sistem
        </h3>

        <div className="divide-y divide-zinc-100 text-[13px]">

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-zinc-800 block">Katalog Resmi Daytona</span>
              <span className="text-[11.5px] text-zinc-400">Pricelist PDF V2 (568 part number)</span>
            </div>
            <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-xl text-[11px] font-mono font-bold">
              {items.length || 568} Part
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-zinc-800 block">Skema Diskon Otomatis</span>
              <span className="text-[11.5px] text-zinc-400">Dihitung per item pesanan</span>
            </div>
            <span className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200/70 rounded-xl text-[11px] font-bold">
              24% · 27% · 29%
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-zinc-800 block">Mode Aplikasi iPhone</span>
              <span className="text-[11.5px] text-zinc-400">Gestur geser kembali & Safe Area</span>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-semibold">
              Aktif ✓
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-zinc-800 block">Penyimpanan Offline</span>
              <span className="text-[11.5px] text-zinc-400">Data tersimpan aman di browser/HP</span>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-semibold">
              LocalStorage
            </span>
          </div>

        </div>

      </div>

      {/* MODAL DIALOG KONFIRMASI PEMULIHAN PINTAR (SMART SELECTIVE RESTORE) */}
      {pendingRestoreData && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200 space-y-4 max-h-[90vh] overflow-y-auto">

            {/* Header Modal */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 text-[#EA580C] flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="text-[17px] font-bold text-zinc-900">
                Pilih Data yang Akan Dipulihkan
              </h3>
              <p className="text-[12px] text-zinc-500 mt-1">
                File: <span className="font-semibold text-zinc-700">{pendingRestoreData.fileName}</span>
              </p>
              <p className="text-[11px] text-zinc-400">
                Waktu ekspor: {pendingRestoreData.exportedAt}
              </p>
            </div>

            {/* Checkbox Pilihan Data yang Ingin Dipulihkan */}
            <div className="space-y-2.5">
              <span className="text-[11.5px] font-bold text-zinc-700 block uppercase tracking-wider">
                Centang data yang ingin dipulihkan:
              </span>

              {/* Opsi 1: Data Order */}
              <label className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${!pendingRestoreData.hasOrders
                ? 'bg-zinc-50 border-zinc-200 opacity-60 cursor-not-allowed'
                : restoreOrdersChecked
                  ? 'bg-orange-50/70 border-orange-300 ring-1 ring-orange-200'
                  : 'bg-white border-zinc-200 hover:bg-zinc-50'
                }`}>
                <input
                  type="checkbox"
                  disabled={!pendingRestoreData.hasOrders}
                  checked={restoreOrdersChecked && pendingRestoreData.hasOrders}
                  onChange={(e) => setRestoreOrdersChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-orange-600 rounded-md border-zinc-300 focus:ring-orange-500 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[13px] font-bold text-zinc-900">
                      Data Order & Riwayat Pesanan
                    </span>
                    {pendingRestoreData.hasOrders ? (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">
                        {pendingRestoreData.orders.length} Order
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-medium">
                        Tidak ada di file
                      </span>
                    )}
                  </div>
                  {pendingRestoreData.hasOrders && (
                    <div className="text-[11.5px] text-zinc-500 mt-1 leading-snug">
                      Di file: {pendingRestoreData.orders.filter(o => o.status === 'pending').length} aktif, {pendingRestoreData.orders.filter(o => o.status === 'completed').length} selesai
                      <span className="text-zinc-400 block mt-0.5">
                        (Saat ini di HP Anda: {orders.length} order)
                      </span>
                    </div>
                  )}
                </div>
              </label>

              {/* Opsi 2: Data Toko & GPS */}
              <label className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${!pendingRestoreData.hasStores
                ? 'bg-zinc-50 border-zinc-200 opacity-60 cursor-not-allowed'
                : restoreStoresChecked
                  ? 'bg-orange-50/70 border-orange-300 ring-1 ring-orange-200'
                  : 'bg-white border-zinc-200 hover:bg-zinc-50'
                }`}>
                <input
                  type="checkbox"
                  disabled={!pendingRestoreData.hasStores}
                  checked={restoreStoresChecked && pendingRestoreData.hasStores}
                  onChange={(e) => setRestoreStoresChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-orange-600 rounded-md border-zinc-300 focus:ring-orange-500 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[13px] font-bold text-zinc-900">
                      Data Toko & Titik GPS
                    </span>
                    {pendingRestoreData.hasStores ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                        {pendingRestoreData.stores.length} Toko
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 font-medium">
                        Tidak ada di file
                      </span>
                    )}
                  </div>
                  {pendingRestoreData.hasStores && (
                    <div className="text-[11.5px] text-zinc-500 mt-1 leading-snug">
                      Termasuk titik koordinat GPS & nomor pelanggan
                      <span className="text-zinc-400 block mt-0.5">
                        (Saat ini di HP Anda: {stores.length} toko, {storesWithGpsCount} ada GPS)
                      </span>
                    </div>
                  )}
                </div>
              </label>

            </div>

            {/* Tips Keamanan Koordinat GPS */}
            <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200/80 text-[11.5px] text-amber-900 leading-snug">
              <span className="font-bold block mb-0.5">💡 Tips Aman:</span>
              Jika Anda hanya ingin memperbarui riwayat pesanan tanpa mengubah titik GPS toko yang sudah Anda catat di HP saat ini, hilangkan centang pada <b>Data Toko & Titik GPS</b>.
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingRestoreData(null)}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[13px] rounded-2xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={(!restoreOrdersChecked || !pendingRestoreData.hasOrders) && (!restoreStoresChecked || !pendingRestoreData.hasStores)}
                onClick={handleConfirmRestore}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-bold text-[13px] rounded-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4 text-emerald-400 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Pulihkan Terpilih</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DIALOG KONFIRMASI UNDUH CADANGAN */}
      {pendingExportType && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setPendingExportType(null); }}
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200 space-y-4">

            {/* Header Modal */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 text-[#EA580C] flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-[17px] font-bold text-zinc-900">
                Konfirmasi Unduh Cadangan
              </h3>
              <p className="text-[12px] text-zinc-500 mt-1 leading-snug">
                File cadangan akan diunduh ke memori perangkat ini:
              </p>
            </div>

            {/* Rincian Data yang Akan Diunduh */}
            <div className="p-3.5 bg-zinc-50/90 rounded-2xl border border-zinc-200/80 space-y-2 text-[12.5px]">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200/60">
                <span className="text-zinc-500">Tipe Cadangan:</span>
                <span className="font-bold text-zinc-900">
                  {pendingExportType === 'orders'
                    ? 'Hanya Data Order'
                    : pendingExportType === 'stores'
                      ? 'Hanya Toko & GPS'
                      : 'Semua Data (Lengkap)'}
                </span>
              </div>

              {(pendingExportType === 'all' || pendingExportType === 'orders') && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Catatan Order:</span>
                  <span className="font-semibold text-zinc-800">
                    {orders.length} order ({pendingOrdersCount} aktif, {completedOrdersCount} arsip)
                  </span>
                </div>
              )}

              {(pendingExportType === 'all' || pendingExportType === 'stores') && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Data Toko & GPS:</span>
                  <span className="font-semibold text-zinc-800">
                    {stores.length} toko ({storesWithGpsCount} ada GPS)
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-zinc-200/60 text-[11px] text-zinc-400">
                <span>Format File:</span>
                <span className="font-mono text-zinc-600 font-medium">.json</span>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingExportType(null)}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[13px] rounded-2xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const type = pendingExportType;
                  setPendingExportType(null);
                  handleExportBackup(type);
                }}
                className="flex-1 py-3 bg-[#EA580C] hover:bg-orange-700 active:scale-95 text-white font-bold text-[13px] rounded-2xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Ya, Unduh File</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default MoreTab;
