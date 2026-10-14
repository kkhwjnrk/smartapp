import React, { useState, useEffect, useRef } from 'react';

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
  const [gpsStatusType, setGpsStatusType] = useState('info'); // 'info' | 'success' | 'warning'
  const [mapInputText, setMapInputText] = useState('');
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);

  // Reset status saat modal dibuka/tutup
  useEffect(() => {
    if (isOpen) {
      setGpsStatus('');
      setGpsStatusType('info');
      setGpsLoading(false);
      setMapInputText('');
      setShowManualCoords(false);
      setShowGuide(false);
      setDragY(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Parser serbaguna untuk link Maps atau koordinat
  const parseCoordinates = (val) => {
    if (!val) return null;
    const clean = val.trim();

    // 1. Koordinat Desimal e.g. "-6.595038, 106.816635" atau "-6.595038 106.816635"
    const decMatch = clean.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (decMatch) {
      const lat = parseFloat(decMatch[1]);
      const lng = parseFloat(decMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat: lat.toFixed(6), lng: lng.toFixed(6), source: 'koordinat' };
      }
    }

    // 2. Link Google Maps e.g. @lat,lng atau ?q=lat,lng atau ll=lat,lng atau query=lat,lng
    const urlMatch = clean.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || 
                     clean.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (urlMatch) {
      const lat = parseFloat(urlMatch[1]);
      const lng = parseFloat(urlMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat: lat.toFixed(6), lng: lng.toFixed(6), source: 'link Maps' };
      }
    }

    // 3. Format Derajat Menit Detik (DMS) e.g. 6°35'42.1"S 106°49'00.0"E
    const dmsMatch = clean.match(/(\d+)[°\s]+(\d+)['\s]+([\d.]+)"?\s*([NSns])[,\s]+(\d+)[°\s]+(\d+)['\s]+([\d.]+)"?\s*([EWew])/);
    if (dmsMatch) {
      let lat = parseInt(dmsMatch[1], 10) + parseInt(dmsMatch[2], 10)/60 + parseFloat(dmsMatch[3])/3600;
      if (dmsMatch[4].toUpperCase() === 'S') lat = -lat;
      let lng = parseInt(dmsMatch[5], 10) + parseInt(dmsMatch[6], 10)/60 + parseFloat(dmsMatch[7])/3600;
      if (dmsMatch[8].toUpperCase() === 'W') lng = -lng;
      return { lat: lat.toFixed(6), lng: lng.toFixed(6), source: 'derajat DMS' };
    }

    return null;
  };

  // Proses input teks / tempelan link Maps
  const handleProcessMapInput = (value) => {
    setMapInputText(value);
    if (!value || !value.trim()) return;

    const parsed = parseCoordinates(value);
    if (parsed) {
      setFormData(prev => ({
        ...prev,
        lat: parsed.lat,
        lng: parsed.lng
      }));
      setGpsStatusType('success');
      setGpsStatus(`✓ Titik koordinat berhasil terpasang dari ${parsed.source}!`);
      return;
    }

    // Deteksi jika user paste link pendek seperti maps.app.goo.gl atau goo.gl/maps
    if (value.includes('goo.gl') || value.includes('maps.app')) {
      setGpsStatusType('warning');
      setGpsStatus('Link pendek terdeteksi. Buka link tersebut di Google Maps, tahan pin lokasi toko sampai muncul angka koordinat (-6.xxx, 106.xxx), lalu salin angkanya.');
      return;
    }

    setGpsStatusType('warning');
    setGpsStatus('Format belum sesuai. Contoh format yang didukung: -6.595038, 106.816635');
  };

  // Tempel langsung dari Clipboard
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleProcessMapInput(text);
          return;
        }
      }
    } catch (err) {
      // Browser mungkin memblokir auto clipboard read
    }
    setGpsStatusType('info');
    setGpsStatus('Silakan tahan jari di kotak input di atas lalu pilih "Tempel / Paste".');
  };

  // Buka Google Maps langsung untuk mencari toko ini
  const handleOpenGoogleMapsSearch = () => {
    const query = [formData.name, formData.address].filter(Boolean).join(' ');
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'bengkel motor')}`;
    window.open(url, '_blank');
  };

  // Fitur Ambil Titik GPS Saat Ini via Geolocation Browser (Dual-Stage Fallback)
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatusType('warning');
      setGpsStatus('Browser Anda tidak mendukung pendeteksian lokasi GPS.');
      return;
    }

    setGpsLoading(true);
    setGpsStatusType('info');
    setGpsStatus('Mencari sinyal GPS satelit...');

    // Fallback kedua: sinyal jaringan / Wi-Fi (indoor friendly)
    const runNetworkFallback = (alasan) => {
      setGpsStatus(`${alasan} Mencoba via sinyal jaringan/Wi-Fi...`);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latitude = pos.coords.latitude.toFixed(6);
          const longitude = pos.coords.longitude.toFixed(6);
          const accuracy = Math.round(pos.coords.accuracy);

          setFormData(prev => ({
            ...prev,
            lat: latitude,
            lng: longitude
          }));

          setGpsLoading(false);
          setGpsStatusType('success');
          setGpsStatus(`✓ Lokasi didapat via jaringan (Akurasi: ±${accuracy}m).`);
        },
        (err) => {
          setGpsLoading(false);
          setGpsStatusType('warning');
          if (err.code === err.PERMISSION_DENIED) {
            setGpsStatus('Izin lokasi ditolak. Buka Setelan HP > Aplikasi > Daytona/Chrome > Izin > Lokasi.');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setGpsStatus('GPS HP sedang nonaktif. Tarik layar atas HP Anda, lalu nyalakan ikon "Lokasi/GPS".');
          } else {
            setGpsStatus('Gagal membaca GPS. Pastikan toggle Lokasi di HP aktif atau gunakan metode tempel titik di atas.');
          }
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 30000 }
      );
    };

    // Percobaan pertama: GPS Satelit Akurasi Tinggi
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        const accuracy = Math.round(position.coords.accuracy);

        setFormData(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude
        }));

        setGpsLoading(false);
        setGpsStatusType('success');
        setGpsStatus(`✓ GPS akurat berhasil didapat! (Akurasi: ±${accuracy}m)`);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsLoading(false);
          setGpsStatusType('warning');
          setGpsStatus('Izin lokasi ditolak. Silakan aktifkan izin lokasi di Setelan Aplikasi HP Anda.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsLoading(false);
          setGpsStatusType('warning');
          setGpsStatus('GPS HP sedang mati. Tarik bilah atas HP Anda lalu aktifkan ikon "Lokasi/GPS".');
        } else {
          // Timeout pada satelit indoor -> fallback ke jaringan
          runNetworkFallback('Sinyal satelit lemah.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 0
      }
    );
  };

  // Drag down to dismiss handle logic
  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStartY.current = e.clientY;
    currentDragY.current = 0;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
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
    } catch (err) {}

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
          <div className="bg-zinc-50/90 rounded-2xl p-4 border border-zinc-200 space-y-3">
            {/* Header Box */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[13px] font-bold text-zinc-900">Titik Lokasi Google Maps</span>
              </div>

              {/* Status Badge atau Reset Titik */}
              {hasCoordinates ? (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10.5px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Terpasang
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, lat: '', lng: '' }));
                      setMapInputText('');
                      setGpsStatusType('info');
                      setGpsStatus('Titik koordinat berhasil dihapus.');
                    }}
                    className="text-[11px] text-red-500 hover:text-red-700 underline font-medium"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-zinc-400 font-medium">Opsional</span>
              )}
            </div>

            {/* Pilihan 1: Input Cerdas (Tempel Link atau Koordinat) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11.5px] font-semibold text-zinc-700">
                  Cara 1: Tempel Link / Koordinat Maps <span className="text-zinc-400 font-normal">(Dari Jarak Jauh)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-[11px] text-orange-600 hover:text-orange-700 font-medium inline-flex items-center gap-0.5"
                >
                  <span>{showGuide ? 'Tutup Panduan' : '💡 Cara Ambil Titik'}</span>
                </button>
              </div>

              {/* Panduan Mini jika diklik */}
              {showGuide && (
                <div className="p-3 bg-orange-50/70 border border-orange-200/60 rounded-xl text-[11.5px] text-orange-950 space-y-1.5 animate-in fade-in duration-200">
                  <p className="font-bold text-orange-900 flex items-center gap-1">
                    <span>📌 Cara mengisi titik tanpa harus ke toko:</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-700">
                    <li>Klik tombol <b className="text-zinc-900">"🔍 Cari di Google Maps"</b> di bawah.</li>
                    <li>Pada aplikasi Google Maps, cari nama/daerah toko tersebut.</li>
                    <li><b className="text-zinc-900">Tekan & tahan</b> jari Anda pada titik toko sampai muncul pin merah.</li>
                    <li>Google Maps akan menampilkan angka koordinat (contoh: <code className="bg-white px-1 py-0.5 rounded border border-zinc-200 font-mono text-[10.5px]">-6.595038, 106.816635</code>). Ketuk untuk menyalinnya.</li>
                    <li>Kembali ke aplikasi ini dan klik tombol <b className="text-zinc-900">"📋 Tempel"</b>.</li>
                  </ol>
                </div>
              )}

              {/* Kotak Input dan Tombol Paste */}
              <div className="relative flex items-center">
                <input 
                  type="text"
                  placeholder="Tempel link Google Maps atau angka: -6.595038, 106.816635"
                  className="w-full pl-3.5 pr-20 py-2.5 bg-white border border-zinc-200 rounded-xl text-[12.5px] font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 shadow-2xs"
                  value={mapInputText}
                  onChange={e => handleProcessMapInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="absolute right-1.5 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Tempel</span>
                </button>
              </div>

              {/* Tombol Pintasan Buka Maps */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={handleOpenGoogleMapsSearch}
                  className="w-full py-2 px-3 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 rounded-xl text-[11.5px] font-semibold transition-all inline-flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>🔍 Buka Google Maps untuk Cari Lokasi Toko Ini</span>
                </button>
              </div>
            </div>

            {/* Pemisah visual Atau */}
            <div className="relative flex items-center justify-center py-0.5">
              <div className="border-t border-zinc-200 w-full"></div>
              <span className="bg-zinc-50 px-2 text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wider absolute">
                atau jika di toko
              </span>
            </div>

            {/* Pilihan 2: Ambil Lokasi GPS Saat Ini */}
            <div>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={gpsLoading}
                className="w-full py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[12px] font-semibold transition-all inline-flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {gpsLoading ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5 text-zinc-300" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Mendeteksi Lokasi HP...</span>
                  </>
                ) : (
                  <>
                    <span>📍 Ambil Titik GPS Saat Ini (Sedang di Toko)</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Pesan GPS / Input */}
            {gpsStatus && (
              <div className={`text-[11.5px] font-medium p-2.5 rounded-xl flex items-start gap-2 ${
                gpsStatusType === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : gpsStatusType === 'warning'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                <span className="text-[13px] shrink-0 mt-0.5">
                  {gpsStatusType === 'success' ? '✅' : gpsStatusType === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div className="flex-1 leading-snug">
                  {gpsStatus}
                </div>
              </div>
            )}

            {/* Ringkasan Koordinat Terpasang & Preview Maps */}
            {hasCoordinates ? (
              <div className="bg-white p-3 rounded-xl border border-zinc-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Koordinat:</span>
                    <span className="text-[12px] font-mono font-bold text-zinc-900">
                      {formData.lat}, {formData.lng}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualCoords(!showManualCoords)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-800 underline"
                  >
                    {showManualCoords ? 'Tutup Detail' : 'Koreksi Angka'}
                  </button>
                </div>

                {/* Input Manual Lat/Lng (hanya jika ingin koreksi) */}
                {showManualCoords && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-100">
                    <div>
                      <label className="block text-[10.5px] font-medium text-zinc-500 mb-0.5">Latitude</label>
                      <input 
                        type="text"
                        className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-[12px] font-mono focus:outline-none focus:border-zinc-400"
                        value={formData.lat || ''}
                        onChange={e => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-medium text-zinc-500 mb-0.5">Longitude</label>
                      <input 
                        type="text"
                        className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-[12px] font-mono focus:outline-none focus:border-zinc-400"
                        value={formData.lng || ''}
                        onChange={e => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* Tombol Preview Google Maps */}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 font-medium">✓ Siap digunakan navigasi rute</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${formData.lat},${formData.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11.5px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    <span>Buka Preview Maps</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ) : null}
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
