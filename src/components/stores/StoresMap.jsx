import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateDistanceKm, formatDistance, getNavigationUrl } from '../../utils/geoUtils';

function StoresMap({
  filteredStores = [],
  selectedRoute = 'Semua',
  onOpenRouteSheet,
  onOpenAddOrder,
  onOpenEditModal,
  onSwitchToList
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [selectedStore, setSelectedStore] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Ambil toko-toko yang memiliki koordinat GPS valid
  const storesWithGps = useMemo(() => {
    return filteredStores.filter(s => {
      const lat = parseFloat(s.lat);
      const lng = parseFloat(s.lng);
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    });
  }, [filteredStores]);

  const totalStoresInFilter = filteredStores.length;
  const noGpsCount = totalStoresInFilter - storesWithGps.length;

  // 1. Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center (Jakarta / Jabodetabek area)
    const defaultCenter = [-6.2088, 106.8456];
    const defaultZoom = 11;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Tambahkan layer OpenStreetMap tile
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Tambahkan kontrol attribution di pojok kanan bawah yang ringkas
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    // Layer group untuk pin toko
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Deselect store jika user klik peta di area kosong
    map.on('click', () => {
      setSelectedStore(null);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render / Perbarui Pin Toko di Peta saat data atau filter rute berubah
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (storesWithGps.length === 0) return;

    const bounds = [];

    storesWithGps.forEach((store) => {
      const lat = parseFloat(store.lat);
      const lng = parseFloat(store.lng);
      bounds.push([lat, lng]);

      const isSelected = selectedStore?.id === store.id;

      // Custom HTML Pin Marker bernuansa Daytona Racing Orange
      const customPin = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div style="transform: translate(-50%, -100%);" class="relative group cursor-pointer transition-all duration-200 ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-110'
          }">
            <div class="w-9 h-9 rounded-2xl ${
              isSelected 
                ? 'bg-zinc-900 ring-3 ring-orange-500 shadow-xl' 
                : 'bg-[#EA580C] shadow-md'
            } text-white flex items-center justify-center border-2 border-white transition-colors">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 2a6 6 0 00-6 6c0 4.5 6 10 6 10s6-5.5 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z" clip-rule="evenodd"/>
              </svg>
            </div>
            ${store.customerId ? `
              <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-zinc-900 border border-zinc-200/90 px-1.5 py-0.2 rounded-md text-[9px] font-black font-mono shadow-xs whitespace-nowrap pointer-events-none">
                ${store.customerId}
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [0, 0]
      });

      const marker = L.marker([lat, lng], { icon: customPin });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedStore(store);

        // Geser peta agar pin tidak tertutup kartu bawah
        map.panTo([lat - 0.003, lng], { animate: true, duration: 0.5 });
      });

      markersLayer.addLayer(marker);
    });

    // Auto-fit zoom kamera agar semua pin terlihat nyaman
    if (bounds.length > 0 && !selectedStore) {
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15,
        animate: true
      });
    }
  }, [storesWithGps, selectedStore]);

  // 3. Deteksi Lokasi Sales Lapangan (Live GPS)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Perangkat Anda tidak mendukung fitur lokasi GPS.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude, accuracy });

        const map = mapInstanceRef.current;
        if (!map) return;

        // Perbarui Marker Lokasi User (Titik biru pulsing)
        if (userMarkerRef.current) {
          map.removeLayer(userMarkerRef.current);
        }

        const userPin = L.divIcon({
          className: 'user-location-pin',
          html: `
            <div style="transform: translate(-50%, -50%);" class="relative flex items-center justify-center w-7 h-7">
              <div class="absolute w-7 h-7 bg-blue-500/30 rounded-full animate-ping"></div>
              <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md z-10"></div>
            </div>
          `,
          iconSize: [0, 0]
        });

        const marker = L.marker([latitude, longitude], { icon: userPin }).addTo(map);
        userMarkerRef.current = marker;

        map.setView([latitude, longitude], 14, { animate: true });
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Gagal mendeteksi lokasi GPS.';
        if (err.code === 1) msg = 'Izin akses lokasi ditolak. Aktifkan izin lokasi di pengaturan browser.';
        else if (err.code === 2) msg = 'Sinyal GPS tidak tersedia.';
        else if (err.code === 3) msg = 'Waktu deteksi GPS habis.';
        setLocationError(msg);
        setTimeout(() => setLocationError(null), 4000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  // 4. Hitung Jarak Toko Terpilih ke Lokasi Sales
  const distanceToSelected = useMemo(() => {
    if (!userLocation || !selectedStore?.lat || !selectedStore?.lng) return null;
    const km = calculateDistanceKm(
      userLocation.lat,
      userLocation.lng,
      selectedStore.lat,
      selectedStore.lng
    );
    return formatDistance(km);
  }, [userLocation, selectedStore]);

  // Tombol Reset Zoom ke Seluruh Toko
  const handleFitAllStores = () => {
    const map = mapInstanceRef.current;
    if (!map || storesWithGps.length === 0) return;
    const bounds = storesWithGps.map(s => [parseFloat(s.lat), parseFloat(s.lng)]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true });
    setSelectedStore(null);
  };

  return (
    <div className="relative w-full h-[calc(100vh-215px)] min-h-[440px] rounded-3xl overflow-hidden border border-zinc-200/80 shadow-xs bg-zinc-100 flex flex-col">
      
      {/* MAP CANVAS CONTAINER */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* FLOATING HEADER INFO: FILTER RUTE & JUMLAH PIN */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        
        {/* Tombol Filter Rute Cepat */}
        <button
          type="button"
          onClick={onOpenRouteSheet}
          className="pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-zinc-200/80 shadow-md text-zinc-800 text-[12.5px] font-bold flex items-center gap-1.5 active:scale-95 transition-all truncate max-w-[210px]"
        >
          <span className="w-2 h-2 rounded-full bg-orange-600 shrink-0"></span>
          <span className="truncate">{selectedRoute === 'Semua' ? 'Semua Rute' : selectedRoute}</span>
          <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Badge Jumlah Toko di Peta */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-zinc-200/80 shadow-md text-[11.5px] font-bold text-zinc-700 flex items-center gap-1.5 shrink-0">
          <span className="text-[#EA580C] font-black">{storesWithGps.length}</span>
          <span className="text-zinc-500 font-medium">Toko Aktif</span>
        </div>

      </div>

      {/* FLOATING BUTTONS: LOKASI SAYA & RESET VIEW (POJOK KANAN) */}
      <div className="absolute right-3 top-16 z-10 flex flex-col gap-2">
        
        {/* Tombol Lokasi Saya (GPS) */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="w-11 h-11 bg-white hover:bg-zinc-50 active:scale-90 rounded-2xl border border-zinc-200 shadow-md text-zinc-700 flex items-center justify-center transition-all disabled:opacity-50"
          title="Pusatkan ke Posisi Saya"
        >
          {isLocating ? (
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className={`w-5 h-5 ${userLocation ? 'text-blue-600' : 'text-zinc-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <circle cx="12" cy="12" r="3" strokeWidth="2"/>
            </svg>
          )}
        </button>

        {/* Tombol Fit Semua Pin */}
        {storesWithGps.length > 0 && (
          <button
            type="button"
            onClick={handleFitAllStores}
            className="w-11 h-11 bg-white hover:bg-zinc-50 active:scale-90 rounded-2xl border border-zinc-200 shadow-md text-zinc-700 flex items-center justify-center transition-all"
            title="Tampilkan Semua Toko"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        )}

      </div>

      {/* NOTIFIKASI ERROR LOKASI GPS */}
      {locationError && (
        <div className="absolute top-16 left-3 right-16 z-20 bg-red-600 text-white text-[12px] p-2.5 rounded-2xl shadow-lg animate-in fade-in">
          {locationError}
        </div>
      )}

      {/* BANNER JIKA TIDAK ADA TOKO BERKOORDINAT GPS */}
      {storesWithGps.length === 0 && (
        <div className="absolute inset-x-4 top-20 z-10 bg-white/95 backdrop-blur-md p-5 rounded-3xl border border-zinc-200 shadow-xl text-center space-y-2.5 animate-in zoom-in-95">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#EA580C] flex items-center justify-center mx-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <h4 className="font-bold text-[14px] text-zinc-900">
            Belum Ada Titik GPS di Rute Ini
          </h4>
          <p className="text-[12px] text-zinc-500 leading-relaxed max-w-xs mx-auto">
            Ada {totalStoresInFilter} toko pada rute ini tetapi belum memiliki titik koordinat GPS.
          </p>
          <button
            type="button"
            onClick={onSwitchToList}
            className="px-4 py-2 bg-zinc-900 text-white text-[12px] font-bold rounded-xl active:scale-95 transition-all shadow-sm"
          >
            Buka Daftar Toko untuk Tambah GPS
          </button>
        </div>
      )}

      {/* KARTU AKSI CEPAT TOKO YANG DIPILIH (SLIDE UP BOTTOM CARD) */}
      {selectedStore && (
        <div className="absolute bottom-3 left-3 right-3 z-20 animate-in slide-in-from-bottom-6 duration-200">
          <div className="bg-white rounded-3xl p-4 border border-zinc-200 shadow-2xl space-y-3">
            
            {/* Header Toko */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  {selectedStore.customerId && (
                    <span className="px-2 py-0.5 bg-zinc-900 text-white rounded-lg text-[10px] font-bold font-mono tracking-tight">
                      {selectedStore.customerId}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200/80 rounded-lg text-[10px] font-bold">
                    {selectedStore.routeCode || 'TANPA RUTE'}
                  </span>
                  {distanceToSelected && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      {distanceToSelected}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-[15px] text-zinc-900 truncate leading-snug">
                  {selectedStore.name}
                </h3>
                {selectedStore.address && (
                  <p className="text-[11.5px] text-zinc-500 truncate mt-0.5">
                    {selectedStore.address}
                  </p>
                )}
              </div>

              {/* Tombol Tutup Kartu */}
              <button
                type="button"
                onClick={() => setSelectedStore(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center text-[16px] font-bold shrink-0 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Tombol Aksi Lapangan */}
            <div className="flex items-center gap-2 pt-1">
              
              {/* Tombol Petunjuk Arah / Rute Navigasi Google Maps */}
              <a
                href={getNavigationUrl(selectedStore.lat, selectedStore.lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 active:scale-95 rounded-2xl text-zinc-800 text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Petunjuk Arah</span>
              </a>

              {/* Tombol Catat Order Langsung untuk Toko Ini */}
              {onOpenAddOrder && (
                <button
                  type="button"
                  onClick={() => onOpenAddOrder(selectedStore)}
                  className="flex-1 py-2.5 bg-[#EA580C] hover:bg-orange-700 active:scale-95 rounded-2xl text-white text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Catat Order</span>
                </button>
              )}

              {/* Tombol Edit Info Toko */}
              {onOpenEditModal && (
                <button
                  type="button"
                  onClick={() => onOpenEditModal(selectedStore)}
                  className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl shrink-0"
                  title="Edit Data Toko"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}

            </div>

          </div>
        </div>
      )}

      {/* FOOTER INFO KECIL DI ATAS PETA JIKA TIDAK ADA TOKO YANG DIPILIH */}
      {!selectedStore && noGpsCount > 0 && (
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-zinc-200 text-[11px] text-zinc-500 shadow-xs flex items-center gap-1.5 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>{noGpsCount} toko belum ada titik GPS</span>
        </div>
      )}

    </div>
  );
}

export default StoresMap;
