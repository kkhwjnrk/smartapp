import React, { useState, useRef } from 'react';

function MoreTab({
  orders = [],
  setOrders,
  stores = [],
  setStores,
  items = []
}) {
  const [exportCategory, setExportCategory] = useState('all'); // 'all' | 'orders' | 'stores'
  const [importStatus, setImportStatus] = useState(null);
  const [pendingRestoreData, setPendingRestoreData] = useState(null);
  const [copyStatus, setCopyStatus] = useState(false);
  const fileInputRef = useRef(null);

  // 1. Ekspor Data Cadangan ke File JSON sesuai kategori yang dipilih
  const handleExportBackup = () => {
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

      const backupPayload = {
        appName: 'SmartApp Daytona',
        version: '2.0',
        category: exportCategory,
        exportedAt: now.toISOString(),
        exportedDateFormatted: now.toLocaleString('id-ID'),
        summary: {},
        data: {}
      };

      let filename = '';
      let successMsg = '';

      if (exportCategory === 'all') {
        backupPayload.summary = {
          categoryName: 'Semua Data (Order + Toko)',
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === 'pending').length,
          completedOrders: orders.filter(o => o.status === 'completed').length,
          totalStores: stores.length,
          totalItems: items.length
        };
        backupPayload.data = {
          orders: orders,
          stores: stores
        };
        filename = `daytona_backup_semua_${dateStr}_${timeStr}.json`;
        successMsg = `✓ Berhasil mengunduh semua data (${orders.length} order & ${stores.length} toko)`;
      } else if (exportCategory === 'orders') {
        backupPayload.summary = {
          categoryName: 'Catatan Order Saja',
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === 'pending').length,
          completedOrders: orders.filter(o => o.status === 'completed').length
        };
        backupPayload.data = {
          orders: orders
        };
        filename = `daytona_backup_order_${dateStr}_${timeStr}.json`;
        successMsg = `✓ Berhasil mengunduh cadangan order (${orders.length} pesanan)`;
      } else if (exportCategory === 'stores') {
        backupPayload.summary = {
          categoryName: 'Data Toko & Titik GPS Saja',
          totalStores: stores.length
        };
        backupPayload.data = {
          stores: stores
        };
        filename = `daytona_backup_toko_${dateStr}_${timeStr}.json`;
        successMsg = `✓ Berhasil mengunduh master toko & titik GPS (${stores.length} toko)`;
      }

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
        message: successMsg
      });
    } catch (err) {
      setImportStatus({
        type: 'error',
        message: 'Gagal membuat file cadangan: ' + err.message
      });
    }
  };

  // 2. Salin Data Cadangan ke Clipboard sesuai Kategori
  const handleCopyBackupText = () => {
    try {
      const now = new Date();
      const backupPayload = {
        appName: 'SmartApp Daytona',
        version: '2.0',
        category: exportCategory,
        exportedAt: now.toISOString(),
        data: {}
      };

      if (exportCategory === 'all') {
        backupPayload.data = { orders, stores };
      } else if (exportCategory === 'orders') {
        backupPayload.data = { orders };
      } else if (exportCategory === 'stores') {
        backupPayload.data = { stores };
      }

      navigator.clipboard.writeText(JSON.stringify(backupPayload));
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    } catch (e) {
      alert('Gagal menyalin teks data');
    }
  };

  // 3. Baca File Cadangan yang Diunggah Pengguna
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);

        const restoredOrders = parsed.data?.orders ?? (Array.isArray(parsed.orders) ? parsed.orders : null);
        const restoredStores = parsed.data?.stores ?? (Array.isArray(parsed.stores) ? parsed.stores : null);

        const hasOrders = Array.isArray(restoredOrders) && restoredOrders.length >= 0;
        const hasStores = Array.isArray(restoredStores) && restoredStores.length >= 0;

        if (!hasOrders && !hasStores) {
          throw new Error('Format file tidak valid: tidak ditemukan data pesanan (order) maupun data toko.');
        }

        setPendingRestoreData({
          orders: hasOrders ? restoredOrders : null,
          stores: hasStores ? restoredStores : null,
          selectedTypes: {
            orders: hasOrders,
            stores: hasStores
          },
          exportedAt: parsed.exportedDateFormatted || parsed.exportedAt || 'Tidak diketahui',
          appName: parsed.appName || 'Cadangan Daytona',
          fileCategory: parsed.category || (hasOrders && hasStores ? 'all' : hasOrders ? 'orders' : 'stores')
        });
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

  // Toggle pilihan jenis data yang akan dipulihkan
  const toggleRestoreType = (type) => {
    setPendingRestoreData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        selectedTypes: {
          ...prev.selectedTypes,
          [type]: !prev.selectedTypes[type]
        }
      };
    });
  };

  // 4. Eksekusi Pemulihan Data Selektif
  const handleConfirmRestore = () => {
    if (!pendingRestoreData) return;

    const { orders: fileOrders, stores: fileStores, selectedTypes } = pendingRestoreData;

    try {
      const restoredItems = [];

      // Pulihkan Catatan Order jika dipilih
      if (selectedTypes.orders && fileOrders) {
        localStorage.setItem('daytona_orders', JSON.stringify(fileOrders));
        setOrders(fileOrders);
        restoredItems.push(`${fileOrders.length} order`);
      }

      // Pulihkan Data Toko jika dipilih
      if (selectedTypes.stores && fileStores && setStores) {
        localStorage.setItem('daytona_stores', JSON.stringify(fileStores));
        setStores(fileStores);
        restoredItems.push(`${fileStores.length} toko`);
      }

      setPendingRestoreData(null);
      setImportStatus({
        type: 'success',
        message: `✓ Berhasil memulihkan: ${restoredItems.join(' & ')}!`
      });
    } catch (err) {
      setImportStatus({
        type: 'error',
        message: 'Gagal memulihkan data: ' + err.message
      });
    }
  };

  const isRestoreButtonDisabled = !pendingRestoreData?.selectedTypes?.orders && !pendingRestoreData?.selectedTypes?.stores;

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-10">

      {/* Header Info Aplikasi */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-black italic text-[24px] shrink-0 shadow-md">
          D
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-zinc-900 leading-tight flex items-center gap-2">
            <span>SmartApp Daytona</span>
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">
              PWA V2.0
            </span>
          </h2>
          <p className="text-[12.5px] text-zinc-500 mt-1">
            Aplikasi pencatatan pesanan & pricelist resmi Daytona
          </p>
        </div>
      </div>

      {/* Notifikasi Status Pesan */}
      {importStatus && (
        <div className={`p-4 rounded-2xl text-[13px] font-medium border animate-in fade-in duration-200 ${
          importStatus.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {importStatus.message}
        </div>
      )}

      {/* SECTION 1: CADANGAN & KEAMANAN DATA */}
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
              Simpan & pulihkan data secara fleksibel per kategori
            </p>
          </div>
        </div>

        {/* Ringkasan Status Data Terkini */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
            <span className="text-[11.5px] text-zinc-500 font-medium block">Total Catatan Order</span>
            <span className="text-[20px] font-black text-zinc-900">{orders.length}</span>
            <span className="text-[11px] text-zinc-400 block mt-0.5">
              {orders.filter(o => o.status === 'pending').length} aktif · {orders.filter(o => o.status === 'completed').length} arsip
            </span>
          </div>
          <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100">
            <span className="text-[11.5px] text-zinc-500 font-medium block">Total Toko Terdaftar</span>
            <span className="text-[20px] font-black text-zinc-900">{stores.length}</span>
            <span className="text-[11px] text-zinc-400 block mt-0.5">
              Data Master Toko & GPS
            </span>
          </div>
        </div>

        {/* Pemilih Kategori Ekspor Cadangan */}
        <div className="space-y-2.5 pt-2">
          <label className="text-[12px] font-bold text-zinc-700 block">
            Pilih Jenis Data yang Ingin Dicadangkan:
          </label>
          
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100/80 rounded-2xl border border-zinc-200/60">
            <button
              type="button"
              onClick={() => setExportCategory('all')}
              className={`py-2 text-[12px] font-bold rounded-xl transition-all ${
                exportCategory === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Semua Data
            </button>
            <button
              type="button"
              onClick={() => setExportCategory('orders')}
              className={`py-2 text-[12px] font-bold rounded-xl transition-all ${
                exportCategory === 'orders'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Order Saja
            </button>
            <button
              type="button"
              onClick={() => setExportCategory('stores')}
              className={`py-2 text-[12px] font-bold rounded-xl transition-all ${
                exportCategory === 'stores'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Toko Saja
            </button>
          </div>

          {/* Keterangan Kategori Ekspor */}
          <div className="p-3 bg-orange-50/60 border border-orange-100 rounded-2xl text-[12px] text-orange-950 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="leading-relaxed">
              {exportCategory === 'all' && (
                <span>
                  <strong>Semua Data:</strong> Mencakup seluruh catatan pesanan ({orders.length} order) dan master pelanggan toko ({stores.length} toko beserta titik GPS). Cocok saat berpindah perangkat baru.
                </span>
              )}
              {exportCategory === 'orders' && (
                <span>
                  <strong>Hanya Catatan Order:</strong> Mencakup riwayat pesanan aktif & arsip ({orders.length} order) tanpa mengubah data toko. Cocok untuk laporan harian atau arsip rutin.
                </span>
              )}
              {exportCategory === 'stores' && (
                <span>
                  <strong>Hanya Data Toko & GPS:</strong> Mencakup daftar pelanggan ({stores.length} toko) dan titik koordinat GPS tersimpan. Cocok untuk berbagi data rute ke sales lain tanpa membagikan riwayat pesanan.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tombol Ekspor Cadangan */}
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex-1 py-3 bg-[#EA580C] hover:bg-orange-700 active:scale-98 text-white font-bold text-[13px] rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Unduh Cadangan (.json)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyBackupText}
              className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[12.5px] rounded-2xl transition-colors shrink-0"
              title="Salin teks JSON"
            >
              {copyStatus ? 'Tersalin!' : 'Salin Teks'}
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Tombol Pulihkan Data */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 active:scale-98 text-white font-bold text-[13px] rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Pulihkan Data dari File Cadangan</span>
          </button>
        </div>

      </div>

      {/* SECTION 2: FITUR & INFORMASI SISTEM LAINNYA */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/80 shadow-xs space-y-4">
        
        <h3 className="text-[15px] font-bold text-zinc-900 leading-tight">
          Informasi & Fitur Tambahan
        </h3>

        <div className="divide-y divide-zinc-100 text-[13px]">
          
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-zinc-800 block">Katalog Resmi Daytona</span>
              <span className="text-[11.5px] text-zinc-400">Pricelist PDF V2 (568 part number)</span>
            </div>
            <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-xl text-[11px] font-mono font-bold">
              568 Part
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-zinc-800 block">Skema Diskon Otomatis</span>
              <span className="text-[11.5px] text-zinc-400">Dihitung per item pesanan</span>
            </div>
            <span className="px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200/70 rounded-xl text-[11px] font-bold">
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

        </div>

      </div>

      {/* Dialog Konfirmasi Pulihkan Data Selektif */}
      {pendingRestoreData && (
        <div className="fixed inset-0 z-60 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-150 space-y-4">
            
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 text-[#EA580C] flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-[17px] font-bold text-zinc-900 mb-1">
                Pilih Data yang Akan Dipulihkan
              </h3>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                File dibuat pada: <span className="font-semibold text-zinc-700">{pendingRestoreData.exportedAt}</span>
              </p>
            </div>

            {/* Pilihan Checkbox Selektif */}
            <div className="space-y-2">
              
              {/* Checkbox Order */}
              {pendingRestoreData.orders !== null ? (
                <button
                  type="button"
                  onClick={() => toggleRestoreType('orders')}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                    pendingRestoreData.selectedTypes.orders
                      ? 'bg-orange-50/60 border-orange-300 ring-1 ring-orange-200'
                      : 'bg-zinc-50 border-zinc-200 opacity-60'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                    pendingRestoreData.selectedTypes.orders
                      ? 'bg-[#EA580C] border-[#EA580C] text-white'
                      : 'border-zinc-300 bg-white'
                  }`}>
                    {pendingRestoreData.selectedTypes.orders && (
                      <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-zinc-900">Catatan Order</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                        {pendingRestoreData.orders.length} pesanan
                      </span>
                    </div>
                    <p className="text-[11.5px] text-zinc-500 mt-0.5">
                      Pulihkan riwayat pesanan aktif & arsip
                    </p>
                  </div>
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/60 text-[12px] text-zinc-400 italic">
                  File ini tidak memuat data catatan order
                </div>
              )}

              {/* Checkbox Toko */}
              {pendingRestoreData.stores !== null ? (
                <button
                  type="button"
                  onClick={() => toggleRestoreType('stores')}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                    pendingRestoreData.selectedTypes.stores
                      ? 'bg-orange-50/60 border-orange-300 ring-1 ring-orange-200'
                      : 'bg-zinc-50 border-zinc-200 opacity-60'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                    pendingRestoreData.selectedTypes.stores
                      ? 'bg-[#EA580C] border-[#EA580C] text-white'
                      : 'border-zinc-300 bg-white'
                  }`}>
                    {pendingRestoreData.selectedTypes.stores && (
                      <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-zinc-900">Data Toko & Titik GPS</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                        {pendingRestoreData.stores.length} toko
                      </span>
                    </div>
                    <p className="text-[11.5px] text-zinc-500 mt-0.5">
                      Pulihkan master toko & lokasi rute pelanggan
                    </p>
                  </div>
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/60 text-[12px] text-zinc-400 italic">
                  File ini tidak memuat data master toko
                </div>
              )}

            </div>

            <p className="text-[11px] text-zinc-400 text-center leading-normal">
              * Data yang tidak dicentang tidak akan diganti atau ditimpa
            </p>

            {/* Aksi Tombol */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingRestoreData(null)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[13px] rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isRestoreButtonDisabled}
                onClick={handleConfirmRestore}
                className={`flex-1 py-2.5 text-white font-semibold text-[13px] rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                  isRestoreButtonDisabled
                    ? 'bg-zinc-300 cursor-not-allowed text-zinc-500'
                    : 'bg-[#EA580C] hover:bg-orange-700 active:scale-95'
                }`}
              >
                <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Pulihkan Sekarang</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default MoreTab;
