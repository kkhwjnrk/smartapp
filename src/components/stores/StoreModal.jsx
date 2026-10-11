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
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);

  // Reset status saat modal dibuka/tutup
  useEffect(() => {
    if (isOpen) {
      setGpsStatus('');
      setGpsLoading(false);
      setDragY(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Fitur Ambil Titik GPS Saat Ini via Geolocation Browser
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Browser tidak mendukung pendeteksian GPS.');
      return;
    }

    setGpsLoading(true);
    setGpsStatus('Mencari sinyal GPS...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);

        setFormData(prev => ({
          ...prev,
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6)
        }));

        setGpsLoading(false);
        setGpsStatus(`GPS berhasil didapat! (Akurasi: ±${accuracy}m)`);
      },
      (error) => {
        setGpsLoading(false);
        let msg = 'Gagal mengambil GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Izin lokasi ditolak. Mohon aktifkan izin GPS browser Anda.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Informasi lokasi tidak tersedia.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Waktu pencarian GPS habis.';
        }
        setGpsStatus(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  // Helper untuk parsing otomatis jika user paste format "-6.123, 106.123" atau link Google Maps
  const handleCoordinatePasteOrChange = (value) => {
    if (!value) {
      setFormData(prev => ({ ...prev, lat: '', lng: '' }));
      return;
    }

    // Cek jika format "lat, lng" e.g. "-6.595038, 106.816635"
    const coordMatch = value.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (coordMatch) {
      setFormData(prev => ({
        ...prev,
        lat: coordMatch[1],
        lng: coordMatch[2]
      }));
      setGpsStatus('Format koordinat terdeteksi & terisi otomatis');
      return;
    }

    // Cek jika format URL Google Maps e.g. ?q=-6.595,106.816 atau @-6.595,106.816
    const urlMatch = value.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || value.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (urlMatch) {
      setFormData(prev => ({
        ...prev,
        lat: urlMatch[1],
        lng: urlMatch[2]
      }));
      setGpsStatus('Koordinat berhasil diekstrak dari link Google Maps');
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
          {/* Nama Toko */}
          <div>
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

          {/* Kode Rute */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12.5px] font-semibold text-zinc-700">
                Kode Rute <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-zinc-400">Untuk pengelompokan rute</span>
            </div>
            <input 
              type="text" 
              required
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
          <div className="bg-zinc-50/80 rounded-2xl p-3.5 border border-zinc-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[12.5px] font-bold text-zinc-800">Titik Google Maps / GPS</span>
              </div>

              {/* Tombol Ambil GPS Saat Ini */}
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={gpsLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-zinc-300 hover:border-zinc-400 text-zinc-700 text-[11.5px] font-semibold rounded-lg shadow-2xs hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                {gpsLoading ? (
                  <>
                    <svg className="animate-spin w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Mencari GPS...</span>
                  </>
                ) : (
                  <>
                    <span>📍 Ambil Lokasi Sekarang</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Pesan GPS */}
            {gpsStatus && (
              <p className={`text-[11px] font-medium px-2 py-1 rounded-md ${
                gpsStatus.includes('berhasil') || gpsStatus.includes('terisi') || gpsStatus.includes('terekstrak')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {gpsStatus}
              </p>
            )}

            {/* Input Latitude & Longitude */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-0.5">Latitude</label>
                <input 
                  type="text"
                  placeholder="-6.595038"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-zinc-400"
                  value={formData.lat || ''}
                  onChange={e => {
                    handleCoordinatePasteOrChange(e.target.value);
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
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[13px] font-mono focus:outline-none focus:border-zinc-400"
                  value={formData.lng || ''}
                  onChange={e => setFormData({ ...formData, lng: e.target.value })}
                />
              </div>
            </div>

            {/* Preview di Google Maps jika koordinat sudah ada */}
            {hasCoordinates && (
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-medium">✓ Titik koordinat terpasang</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${formData.lat},${formData.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11.5px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <span>Cek di Google Maps</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
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
