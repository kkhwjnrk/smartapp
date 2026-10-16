import React, { useState, useRef } from 'react';

function MoreTab({
  orders = [],
  setOrders,
  stores = [],
  setStores,
  items = []
}) {
  const [importStatus, setImportStatus] = useState(null);
  const [pendingExportType, setPendingExportType] = useState(null); // 'all' | 'orders' | 'stores' | null
  const [pendingRestoreData, setPendingRestoreData] = useState(null);
  const [restoreOrdersChecked, setRestoreOrdersChecked] = useState(true);
  const [restoreStoresChecked, setRestoreStoresChecked] = useState(true);
  const [copyStatus, setCopyStatus] = useState(null);
  const fileInputRef = useRef(null);

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
        dataToExport = { orders, stores };
        filename = `daytona_backup_semua_${dateStr}_${timeStr}.json`;
        typeLabel = `Semua Data (${orders.length} order, ${stores.length} toko)`;
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
      else dataToCopy = { orders, stores };

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
        <div className="w-13 h-13 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-black italic text-[22px] shrink-0 shadow-md">
          D
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[17px] font-bold text-zinc-900 leading-tight">
              SmartApp Daytona
            </h2>
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10.5px] font-bold rounded-full">
              PWA V2.0
            </span>
          </div>
          <p className="text-[12px] text-zinc-500 mt-1 leading-snug">
            Aplikasi pencatatan pesanan & pricelist resmi Daytona
          </p>
        </div>
      </div>

      {/* Notifikasi Status Pesan */}
      {importStatus && (
        <div className={`p-4 rounded-2xl text-[13px] font-medium border flex items-start justify-between gap-3 animate-in fade-in duration-200 ${
          importStatus.type === 'success' 
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
              <label className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                !pendingRestoreData.hasOrders 
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
              <label className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                !pendingRestoreData.hasStores 
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
