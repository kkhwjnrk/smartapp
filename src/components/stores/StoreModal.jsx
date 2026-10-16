import React, { useState, useEffect, useRef } from 'react';
import { parseGoogleMapsInput, isShortGoogleMapsUrl } from '../../utils/geoUtils';

function StoreModal({ 
  isOpen, 
  modalStore, 
  formData, 
  setFormData, 
  existingRoutes = [], 
  onSave, 
  onDelete, 
  onClose 
}) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [mapsInput, setMapsInput] = useState('');
  const [resolvingLink, setResolvingLink] = useState(false);
  const [showGpsHelp, setShowGpsHelp] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);

  // Reset status saat modal dibuka/tutup
  useEffect(() => {
    if (isOpen) {
      setGpsStatus('');
      setGpsLoading(false);
      setMapsInput('');
      setResolvingLink(false);
      setShowGpsHelp(false);
      setDragY(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Fitur Ambil Titik GPS Saat Ini via Geolocation Browser dengan 2-Stage Fallback
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Browser Anda tidak mendukung pendeteksian GPS.');
      return;
    }

    setGpsLoading(true);
    setGpsStatus('Mencari sinyal GPS satelit...');

    const handleSuccess = (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = Math.round(position.coords.accuracy);

      setFormData(prev => ({
        ...prev,
        lat: latitude.toFixed(6),
        lng: longitude.toFixed(6)
      }));

      setGpsLoading(false);
      setGpsStatus(`✓ GPS berhasil didapat! (Akurasi: ±${accuracy}m)`);
    };

    // Percobaan 1: High Accuracy (Satelit HP)
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (error) => {
        // Jika izin ditolak atau master GPS HP mati
        if (error.code === error.PERMISSION_DENIED) {
          setGpsLoading(false);
          setGpsStatus('⚠️ Izin lokasi belum aktif atau tombol "Lokasi" di bar notifikasi HP sedang mati. Mohon nyalakan toggle Lokasi di HP Anda.');
          return;
        }

        // Percobaan 2: Fallback ke jaringan seluler/Wi-Fi (Bisa di dalam ruangan)
        setGpsStatus('Mengalihkan ke sinyal WiFi/Jaringan (Indoor mode)...');
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (fallbackError) => {
            setGpsLoading(false);
            if (fallbackError.code === fallbackError.PERMISSION_DENIED) {
              setGpsStatus('⚠️ Izin lokasi ditolak. Silakan izinkan akses lokasi di setelan browser HP Anda.');
            } else if (fallbackError.code === fallbackError.POSITION_UNAVAILABLE) {
              setGpsStatus('⚠️ Lokasi tidak tersedia. Pastikan ikon "Lokasi" di menu atas HP sudah MENYALA.');
            } else {
              setGpsStatus('⚠️ Waktu pencarian GPS habis. Anda bisa mengisi titik dengan menempelkan link Google Maps di bawah.');
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 30000
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 0
      }
    );
  };

  // Helper untuk memproses input link Google Maps atau format koordinat
  const handleProcessMapsInput = async (rawValue) => {
    const val = (rawValue || '').trim();
    if (!val) return;

    // 1. Coba parse langsung (koordinat langsung, URL lengkap @lat,lng, ?q=lat,lng, !3dlat!4dlng, DMS)
    const parsed = parseGoogleMapsInput(val);
    if (parsed) {
      setFormData(prev => ({
        ...prev,
        lat: parsed.lat,
        lng: parsed.lng
      }));
      setGpsStatus(`✓ Titik lokasi terpasang dari ${parsed.source}! (${parsed.lat}, ${parsed.lng})`);
      setMapsInput('');
      return;
    }

    // 2. Jika link pendek (maps.app.goo.gl atau goo.gl/maps)
    if (isShortGoogleMapsUrl(val)) {
      setResolvingLink(true);
      setGpsStatus('Membaca link Google Maps...');
      try {
        const res = await fetch(`/api/resolve-maps?url=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.finalUrl) {
            const resolvedParsed = parseGoogleMapsInput(data.finalUrl);
            if (resolvedParsed) {
              setFormData(prev => ({
                ...prev,
                lat: resolvedParsed.lat,
                lng: resolvedParsed.lng
              }));
              setGpsStatus(`✓ Berhasil! Koordinat terpasang: ${resolvedParsed.lat}, ${resolvedParsed.lng}`);
              setResolvingLink(false);
              setMapsInput('');
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Gagal resolve link maps:', err);
      }
      setResolvingLink(false);

      setGpsStatus('ℹ️ Link Google Maps terbaca. Buka link tersebut di Google Maps, lalu tahan titik toko di peta untuk salin angka koordinatnya (-6.xxx, 106.xxx).');
      return;
    }

    setGpsStatus('⚠️ Format tidak dikenali. Masukkan contoh: -6.595038, 106.816635 atau link Google Maps.');
  };

  // Helper tombol Tempel dari Clipboard
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setMapsInput(text);
          handleProcessMapsInput(text);
        } else {
          setGpsStatus('Papan klip (clipboard) kosong.');
        }
      } else {
        setGpsStatus('Browser membatasi akses clipboard otomatis. Silakan tekan & tahan kolom input lalu pilih Tempel.');
      }
    } catch {
      setGpsStatus('Izin clipboard ditolak. Silakan tekan & tahan kolom input lalu pilih Tempel.');
    }
  };

  // Drag down to dismiss handle logic
  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStartY.current = e.clientY;
    currentDragY.current = 0;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e) => {
    if (!dragStartY.current) return;
    const deltaY = e.clientY - dragStartY.current;
    if (deltaY > 0) {
      currentDragY.current = deltaY;
      setDragY(deltaY);
    } else {
      currentDragY.current = 0;
      setDragY(deltaY * 0.15);
    }
  };

  const handlePointerUp = (e) => {
    if (!dragStartY.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    setIsDragging(false);
    const finalDelta = currentDragY.current;
    if (finalDelta > 75 || finalDelta === 0) {
      onClose();
    }
    setDragY(0);
    dragStartY.current = 0;
    currentDragY.current = 0;
  };

  const hasCoordinates = formData.lat && formData.lng;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" 
        style={{
          opacity: dragY > 0 ? Math.max(0.1, 1 - dragY / 250) : undefined
        }}
        onClick={onClose}
      ></div>

      {/* Sheet Content Container */}
      <div 
        style={{
          transform: dragY !== 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="relative bg-white w-full max-w-md rounded-t-[2.5rem] p-6 pt-3 shadow-2xl animate-in slide-in-from-bottom-[100%] duration-300 max-h-[92vh] flex flex-col"
      >
        {/* Garis Handle Interaktif Drag-down to Dismiss */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full flex justify-center items-center pt-1 pb-3 cursor-grab active:cursor-grabbing touch-none select-none group shrink-0"
          aria-label="Tarik ke bawah untuk menutup"
        >
          <div className={`w-14 h-1.5 rounded-full transition-all duration-150 ${
            isDragging ? 'bg-zinc-600 w-16 scale-y-125' : 'bg-zinc-300 group-hover:bg-zinc-400'
          }`}></div>
        </div>

        {/* Modal Title */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h2 className="text-[18px] font-bold text-zinc-900 tracking-tight">
              {modalStore ? 'Edit Data Toko' : 'Tambah Toko Baru'}
            </h2>
            <p className="text-[12px] text-zinc-500">
              {modalStore ? 'Perbarui data rute & titik lokasi toko' : 'Tambahkan data pelanggan & koordinat rute'}
            </p>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={onSave} className="space-y-4 overflow-y-auto pr-1 pb-4 flex-1">
          {/* Customer ID & Nama Toko */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[12.5px] font-semibold text-zinc-700 mb-1">
                ID Customer
              </label>
              <input 
                type="text" 
                placeholder="C 3780"
                className="w-full px-3.5 py-2.5 bg-zinc-50/70 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px] font-mono font-bold uppercase text-zinc-900"
                value={formData.customerId || ''} 
                onChange={e => setFormData({ ...formData, customerId: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[12.5px] font-semibold text-zinc-700 mb-1">
                Nama Toko / Bengkel <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="Contoh: Sentosa Motor"
                className="w-full px-4 py-2.5 bg-zinc-50/70 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px] font-medium"
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          {/* Kode Rute */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12.5px] font-semibold text-zinc-700">
                Kode Rute <span className="text-zinc-400 font-normal">(Opsional)</span>
              </label>
              <span className="text-[11px] text-zinc-400">Untuk pengelompokan rute</span>
            </div>
            <input 
              type="text" 
              placeholder="Contoh: R01 - BOGOR KOTA atau R01"
              className="w-full px-4 py-2.5 bg-zinc-50/70 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px] font-semibold text-orange-600 uppercase"
              value={formData.routeCode} 
              onChange={e => setFormData({ ...formData, routeCode: e.target.value.toUpperCase() })}
            />
            {/* Quick Route Suggestions */}
            {existingRoutes.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[11px] text-zinc-400">Pilih cepat:</span>
                {existingRoutes.slice(0, 5).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData({ ...formData, routeCode: r })}
                    className="px-2 py-0.5 bg-zinc-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-zinc-200/60 rounded-md text-[11px] font-medium text-zinc-600 transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nama Pemilik / PIC */}
          <div>
            <label className="block text-[12.5px] font-semibold text-zinc-700 mb-1">
              Nama Pemilik / PIC
            </label>
            <input 
              type="text" 
              placeholder="Contoh: Ko Hendra / Pak Joko"
              className="w-full px-4 py-2.5 bg-zinc-50/70 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px]"
              value={formData.owner || ''} 
              onChange={e => setFormData({ ...formData, owner: e.target.value })}
            />
          </div>

          {/* Alamat Lengkap */}
          <div>
            <label className="block text-[12.5px] font-semibold text-zinc-700 mb-1">
              Alamat Lengkap
            </label>
            <textarea 
              rows="2"
              placeholder="Contoh: Jl. Pajajaran No. 45, Baranangsiang, Bogor"
              className="w-full px-4 py-2.5 bg-zinc-50/70 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[13.5px] resize-none"
              value={formData.address || ''} 
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            ></textarea>
          </div>

          {/* Titik Lokasi Google Maps / GPS */}
          <div className="bg-zinc-50/80 rounded-2xl p-4 border border-zinc-200/90 space-y-3">
            {/* Header Bagian Lokasi */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[13px] font-bold text-zinc-900">Titik Google Maps / GPS</span>
              </div>

              {/* Toggle Bantuan / Petunjuk */}
              <button
                type="button"
                onClick={() => setShowGpsHelp(!showGpsHelp)}
                className="text-[11px] font-medium text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
              >
                <span>{showGpsHelp ? 'Tutup Panduan' : '💡 Panduan Tanpa ke Lokasi'}</span>
              </button>
            </div>

            {/* Petunjuk Cara Isi Tanpa ke Lokasi Toko */}
            {showGpsHelp && (
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-3 text-[11.5px] text-zinc-700 space-y-1.5 animate-in fade-in duration-200">
                <p className="font-bold text-orange-900 flex items-center gap-1">
                  <span>📍 Cara Mengisi Titik Tanpa Berada di Toko:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-600">
                  <li>Buka aplikasi <strong>Google Maps</strong> di HP atau komputer Anda.</li>
                  <li>Cari nama toko / bengkel atau ketik alamatnya di peta.</li>
                  <li><strong>Tekan dan tahan</strong> jari Anda di atas bangunan toko sampai muncul <strong>pin merah (📌)</strong>.</li>
                  <li>Di kotak pencarian atas akan muncul angka koordinat (contoh: <code className="bg-white px-1 py-0.5 rounded text-orange-800 font-mono font-bold">-6.595038, 106.816635</code>). Ketuk untuk <strong>Salin</strong>.</li>
                  <li>Atau ketuk tombol <strong>Bagikan (Share)</strong> &gt; <strong>Salin Link</strong>.</li>
                  <li>Kembali ke sini lalu tekan tombol <strong>Tempel</strong> di bawah. Titik akan otomatis terpasang!</li>
                </ol>
              </div>
            )}

            {/* Input Utama: Tempel Link Google Maps atau Koordinat */}
            <div className="space-y-1.5">
              <label className="block text-[11.5px] font-semibold text-zinc-700">
                Tempel Link Google Maps / Koordinat Toko:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Contoh: https://maps.app.goo.gl/... atau -6.595038, 106.816635"
                    value={mapsInput}
                    onChange={(e) => {
                      setMapsInput(e.target.value);
                      handleProcessMapsInput(e.target.value);
                    }}
                    onPaste={(e) => {
                      const pasteText = e.clipboardData.getData('text');
                      if (pasteText) {
                        setTimeout(() => handleProcessMapsInput(pasteText), 50);
                      }
                    }}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-zinc-200 rounded-xl text-[12.5px] font-mono focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder:text-zinc-400 placeholder:font-sans"
                  />
                  {mapsInput && (
                    <button
                      type="button"
                      onClick={() => setMapsInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-[13px]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Tombol Tempel dari Clipboard */}
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  disabled={resolvingLink}
                  className="px-3 py-2 bg-white border border-zinc-300 hover:border-zinc-400 text-zinc-700 text-[12px] font-semibold rounded-xl shadow-2xs hover:bg-zinc-50 transition-colors flex items-center gap-1 shrink-0"
                  title="Tempel teks yang sudah disalin"
                >
                  <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Tempel</span>
                </button>
              </div>
            </div>

            {/* Tombol Ambil GPS Saat Ini (Jika Berada di Lokasi Toko) */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={gpsLoading || resolvingLink}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-dashed border-zinc-300 hover:border-orange-400 text-zinc-700 hover:text-orange-600 text-[12px] font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {gpsLoading ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5 text-orange-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Mencari Sinyal GPS Ponsel...</span>
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    <span>Ambil Lokasi Ponsel Sekarang (Bila Sedang di Toko)</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Pesan GPS / Link */}
            {gpsStatus && (
              <div className={`text-[11.5px] font-medium px-3 py-2 rounded-xl flex items-start gap-1.5 ${
                gpsStatus.includes('✓') || gpsStatus.includes('berhasil') || gpsStatus.includes('terpasang')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : gpsStatus.includes('⚠️')
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                <span className="shrink-0">{gpsStatus.includes('✓') ? '✅' : gpsStatus.includes('⚠️') ? '⚠️' : 'ℹ️'}</span>
                <span className="flex-1 leading-snug">{gpsStatus}</span>
              </div>
            )}

            {/* Input Manual Latitude & Longitude */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-0.5">Latitude</label>
                <input 
                  type="text"
                  placeholder="-6.595038"
                  className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-zinc-400"
                  value={formData.lat || ''}
                  onChange={e => {
                    handleProcessMapsInput(e.target.value);
                    if (!e.target.value.includes(',')) {
                      setFormData(prev => ({ ...prev, lat: e.target.value }));
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-0.5">Longitude</label>
                <input 
                  type="text"
                  placeholder="106.816635"
                  className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-zinc-400"
                  value={formData.lng || ''}
                  onChange={e => setFormData({ ...formData, lng: e.target.value })}
                />
              </div>
            </div>

            {/* Preview & Verifikasi di Google Maps jika koordinat sudah ada */}
            {hasCoordinates && (
              <div className="pt-1 flex items-center justify-between border-t border-zinc-200/60 mt-1">
                <span className="text-[11.5px] text-emerald-700 font-semibold flex items-center gap-1">
                  <span>✓ Titik koordinat terpasang</span>
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${formData.lat},${formData.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11.5px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <span>🗺️ Cek di Google Maps</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, lat: '', lng: '' }));
                      setGpsStatus('Titik koordinat dihapus.');
                    }}
                    className="text-[11px] font-medium text-red-500 hover:text-red-700 hover:underline"
                  >
                    Hapus Titik
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Patokan / Catatan Rute */}
          <div>
            <label className="block text-[12.5px] font-semibold text-zinc-700 mb-1">
              Patokan Lokasi / Catatan Kunjungan
            </label>
            <input 
              type="text" 
              placeholder="Contoh: Sebelah SPBU Pertamina, ruko warna biru"
              className="w-full px-4 py-2.5 bg-zinc-50/70 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[13.5px]"
              value={formData.notes || ''} 
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-3">
            {modalStore && (
              <button 
                type="button" 
                onClick={onDelete} 
                className="px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-semibold text-[13.5px] transition-colors"
              >
                Hapus
              </button>
            )}
            <div className="flex-1 flex gap-2.5">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-3 text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl font-semibold text-[13.5px] transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold text-[13.5px] transition-colors shadow-sm"
              >
                Simpan Toko
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StoreModal;
