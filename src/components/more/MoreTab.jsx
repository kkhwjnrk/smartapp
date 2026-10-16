import React, { useState, useRef } from 'react';

function MoreTab({
  orders = [],
  setOrders,
  stores = [],
  setStores,
  items = []
}) {
  const [importStatus, setImportStatus] = useState(null);
  const [pendingRestoreData, setPendingRestoreData] = useState(null);
  const [copyStatus, setCopyStatus] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef(null);

  // 1. Ekspor Data Cadangan ke File JSON
  const handleExportBackup = () => {
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

      const backupPayload = {
        appName: 'SmartApp Daytona',
        version: '2.0',
        exportedAt: now.toISOString(),
        exportedDateFormatted: now.toLocaleString('id-ID'),
        summary: {
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === 'pending').length,
          completedOrders: orders.filter(o => o.status === 'completed').length,
          totalStores: stores.length,
          totalItems: items.length
        },
        data: {
          orders: orders,
          stores: stores
        }
      };

      const jsonString = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `daytona_backup_${dateStr}_${timeStr}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      setImportStatus({
        type: 'success',
        message: `✓ File cadangan berhasil diunduh (${orders.length} order, ${stores.length} toko)`
      });
    } catch (err) {
      setImportStatus({
        type: 'error',
        message: 'Gagal membuat file cadangan: ' + err.message
      });
    }
  };

  // 2. Salin Data Cadangan ke Clipboard
  const handleCopyBackupText = () => {
    try {
      const backupPayload = {
        appName: 'SmartApp Daytona',
        exportedAt: new Date().toISOString(),
        data: { orders, stores }
      };
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

        const restoredOrders = parsed.data?.orders || parsed.orders;
        const restoredStores = parsed.data?.stores || parsed.stores;

        if (!Array.isArray(restoredOrders)) {
          throw new Error('Format file tidak valid: data order tidak ditemukan.');
        }

        setPendingRestoreData({
          orders: restoredOrders,
          stores: Array.isArray(restoredStores) ? restoredStores : null,
          exportedAt: parsed.exportedDateFormatted || parsed.exportedAt || 'Tidak diketahui',
          appName: parsed.appName || 'Cadangan Daytona'
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

  // 4. Eksekusi Pemulihan Data
  const handleConfirmRestore = () => {
    if (!pendingRestoreData) return;

    try {
      if (pendingRestoreData.orders) {
        localStorage.setItem('daytona_orders', JSON.stringify(pendingRestoreData.orders));
        setOrders(pendingRestoreData.orders);
      }

      if (pendingRestoreData.stores && setStores) {
        localStorage.setItem('daytona_stores_custom', JSON.stringify(pendingRestoreData.stores));
        setStores(pendingRestoreData.stores);
      }

      const totalRestored = pendingRestoreData.orders.length;
      setPendingRestoreData(null);
      setImportStatus({
        type: 'success',
        message: `✓ Berhasil memulihkan ${totalRestored} catatan order!`
      });
    } catch (err) {
      setImportStatus({
        type: 'error',
        message: 'Gagal memulihkan data: ' + err.message
      });
    }
  };

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
              Kelola arsip pesanan agar data tidak hilang saat berganti HP
            </p>
          </div>
        </div>

        {/* Ringkasan Status Data */}
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
              Data Pelanggan
            </span>
          </div>
        </div>

        {/* Tombol Ekspor Cadangan */}
        <div className="space-y-2 pt-2">
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

      {/* Dialog Konfirmasi Pulihkan Data */}
      {pendingRestoreData && (
        <div className="fixed inset-0 z-60 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-150 space-y-4">
            
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-[17px] font-bold text-zinc-900 mb-1">
                Konfirmasi Pulihkan Data?
              </h3>
              <p className="text-[12.5px] text-zinc-500 leading-relaxed">
                Data saat ini akan digantikan dengan data dari file cadangan:
              </p>
            </div>

            <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 text-[12.5px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Jumlah Order:</span>
                <span className="font-bold text-zinc-900">{pendingRestoreData.orders?.length || 0} order</span>
              </div>
              {pendingRestoreData.stores && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Data Toko:</span>
                  <span className="font-bold text-zinc-900">{pendingRestoreData.stores?.length} toko</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Tanggal Cadangan:</span>
                <span className="font-semibold text-zinc-700">{pendingRestoreData.exportedAt}</span>
              </div>
            </div>

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
                onClick={handleConfirmRestore}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-[13px] rounded-xl transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4 text-emerald-400 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Ya, Pulihkan</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default MoreTab;
