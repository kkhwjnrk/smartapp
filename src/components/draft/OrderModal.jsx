import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { formatFullIndonesianDate, getTodayIso } from '../../utils/date';
import { calculateOrderSummary, comparePartNumbers } from '../../utils/formatters';
import { BRANDS } from '../../constants/brands';
import useSwipeBack from '../../hooks/useSwipeBack';

function OrderModal({
  isOpen,
  modalOrder,
  catalogItems = [],
  brandCatalogs = {},
  stores = [],
  onSave,
  onDelete,
  onClose
}) {
  const [storeName, setStoreName] = useState(() => modalOrder?.storeName || '');
  const [customerId, setCustomerId] = useState(() => {
    if (modalOrder?.customerId) return modalOrder.customerId;
    if (modalOrder?.storeName && Array.isArray(stores)) {
      const cleanName = modalOrder.storeName.toLowerCase().trim();
      const matched = stores.find(s => s.name?.toLowerCase().trim() === cleanName);
      if (matched?.customerId) return matched.customerId;
    }
    return '';
  });
  const [routeCode, setRouteCode] = useState(() => modalOrder?.routeCode || '');
  const [dateIso, setDateIso] = useState(() => modalOrder?.dateIso || getTodayIso());
  const [orderItems, setOrderItems] = useState(() => modalOrder?.items ? [...modalOrder.items] : []);

  // Searchable Select Toko (Popup Picker)
  const [isStorePickerOpen, setIsStorePickerOpen] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const storeSearchInputRef = useRef(null);

  // Input tambah item katalog
  const [activeSearchBrand, setActiveSearchBrand] = useState('daytona');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
  const [itemQty, setItemQty] = useState('');
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const qtyInputRef = useRef(null);

  // Dialog Konfirmasi Simpan Order
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Fokuskan input pencarian toko saat picker dibuka
  useEffect(() => {
    if (isStorePickerOpen && storeSearchInputRef.current) {
      setTimeout(() => storeSearchInputRef.current?.focus(), 80);
    }
  }, [isStorePickerOpen]);

  // Filter daftar toko terdaftar berdasarkan pencarian nama toko atau customer ID
  const filteredStores = useMemo(() => {
    if (!storeSearchQuery.trim()) return stores.slice(0, 80);
    const tokens = storeSearchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return stores.filter(s => {
      const combined = `${s.customerId || ''} ${s.name || ''} ${s.routeCode || ''} ${s.owner || ''}`.toLowerCase();
      return tokens.every(t => combined.includes(t));
    }).slice(0, 80);
  }, [storeSearchQuery, stores]);

  // Daftar rute unik dari data master toko untuk saran autocomplete
  const existingRoutes = useMemo(() => {
    const set = new Set();
    stores.forEach(s => {
      if (s.routeCode && s.routeCode.trim()) {
        set.add(s.routeCode.trim().toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [stores]);

  // Identifikasi toko yang dipilih di data master stores
  const matchedStore = useMemo(() => {
    if (!storeName.trim()) return null;
    return stores.find(s => 
      (customerId && s.customerId && s.customerId.trim().toLowerCase() === customerId.trim().toLowerCase()) ||
      (s.name && s.name.trim().toLowerCase() === storeName.trim().toLowerCase())
    );
  }, [storeName, customerId, stores]);

  const isStoreMissingRoute = Boolean(matchedStore && !matchedStore.routeCode?.trim());
  const isRouteModified = Boolean(matchedStore && matchedStore.routeCode?.trim() && routeCode.trim().toUpperCase() !== matchedStore.routeCode.trim().toUpperCase());

  // Katalog aktif sesuai brand yang dipilih di pencarian
  const currentBrandCatalog = useMemo(() => {
    if (brandCatalogs && brandCatalogs[activeSearchBrand]) {
      return brandCatalogs[activeSearchBrand];
    }
    return catalogItems.filter(item => (item.brand || 'daytona') === activeSearchBrand);
  }, [brandCatalogs, activeSearchBrand, catalogItems]);

  // Autocomplete pencarian barang katalog (multi-token search) sesuai brand aktif
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return currentBrandCatalog.filter(item => {
      const combined = `${item.pn} ${item.description} ${item.category || ''} ${item.subCategory || ''}`.toLowerCase();
      return tokens.every(t => combined.includes(t));
    }).sort(comparePartNumbers).slice(0, 30);
  }, [searchQuery, currentBrandCatalog]);

  // Pilih toko dari searchable select
  const handleSelectStore = (store) => {
    setStoreName(store.name);
    setCustomerId(store.customerId || '');
    // Reset/isi rute sesuai toko yang dipilih (tidak meninggalkan rute sebelumnya)
    setRouteCode(store.routeCode || '');
    setIsStorePickerOpen(false);
    setStoreSearchQuery('');
  };

  // Batalkan / reset toko yang telah dipilih (kolom rute & ID customer otomatis ikut bersih)
  const handleClearStore = () => {
    setStoreName('');
    setCustomerId('');
    setRouteCode('');
    setStoreSearchQuery('');
    setIsStorePickerOpen(false);
  };

  // Mulai proses ganti toko
  const handleStartChangeStore = () => {
    setStoreName('');
    setCustomerId('');
    setRouteCode('');
    setStoreSearchQuery('');
    setIsStorePickerOpen(true);
  };

  // Helper keyboard hanya angka: blokir minus, plus, huruf e/E, koma, titik
  const handleNumericKeyDown = (e) => {
    if (['-', '+', 'e', 'E', '.', ',', '/', '*'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Handler sanitasi input Qty tambah item baru (hanya digit > 0)
  const handleQtyInputChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setItemQty(raw);
  };

  // Tambah item ke daftar pesanan toko (Urutan: PN pertama diinput tetap di atas / FIFO)
  const handleAddItem = (e) => {
    e?.preventDefault();
    if (!storeName.trim()) {
      alert('Silakan pilih toko terlebih dahulu di atas sebelum menambahkan item.');
      return;
    }

    if (!selectedCatalogItem && !searchQuery.trim()) {
      alert('Silakan pilih part number terlebih dahulu.');
      return;
    }

    const parsedQty = parseInt(itemQty, 10);
    if (!itemQty.trim() || isNaN(parsedQty) || parsedQty <= 0) {
      alert('Mohon masukkan jumlah (Qty) terlebih dahulu.');
      qtyInputRef.current?.focus();
      return;
    }

    const qty = parsedQty;

    let newItem = null;
    if (selectedCatalogItem) {
      newItem = {
        pn: selectedCatalogItem.pn,
        description: selectedCatalogItem.description || '',
        qty: qty,
        brand: selectedCatalogItem.brand || activeSearchBrand
      };
    } else if (searchQuery.trim()) {
      newItem = {
        pn: searchQuery.trim(),
        description: '',
        qty: qty,
        brand: activeSearchBrand
      };
    }

    if (!newItem) return;

    // Cek jika PN sudah ada di list, update qty di posisinya (tidak memindahkan urutan)
    setOrderItems(prev => {
      const idx = prev.findIndex(i => i.pn.toLowerCase() === newItem.pn.toLowerCase());
      if (idx >= 0) {
        const updated = [...prev];
        const prevQty = parseInt(updated[idx].qty, 10) || 0;
        updated[idx] = { 
          ...updated[idx], 
          qty: prevQty + newItem.qty,
          description: updated[idx].description || newItem.description
        };
        return updated;
      }
      // Tambahkan ke paling akhir daftar agar PN pertama yang diinput tetap berada di atas
      return [...prev, newItem];
    });

    // Reset input
    setSearchQuery('');
    setSelectedCatalogItem(null);
    setItemQty('');
    setShowItemSuggestions(false);
  };

  // Hapus item dari daftar pesanan
  const handleRemoveItem = (index) => {
    setOrderItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Ubah qty item secara langsung melalui input angka (hanya digit positif)
  const handleDirectQtyChange = (index, rawValue) => {
    const sanitized = String(rawValue).replace(/[^0-9]/g, '');
    setOrderItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { 
          ...item, 
          qty: sanitized === '' ? '' : Math.max(1, parseInt(sanitized, 10) || 1) 
        };
      }
      return item;
    }));
  };

  // Validasi sebelum membuka modal konfirmasi simpan
  const handleRequestSubmit = (e) => {
    e?.preventDefault();
    if (!storeName.trim()) {
      alert('Mohon pilih toko yang terdaftar pada data.');
      return;
    }
    if (orderItems.length === 0) {
      alert('Mohon tambahkan minimal 1 item barang pesanan.');
      return;
    }

    // Buka konfirmasi dialog
    setShowSaveConfirm(true);
  };

  // Eksekusi penyimpanan setelah dikonfirmasi pengguna
  const handleConfirmSave = () => {
    const orderToSave = {
      id: modalOrder ? modalOrder.id : `order_${Date.now()}`,
      customerId: customerId.trim(),
      storeName: storeName.trim(),
      routeCode: routeCode.trim(),
      date: formatFullIndonesianDate(dateIso),
      dateIso: dateIso,
      status: modalOrder ? modalOrder.status : 'pending',
      createdAt: modalOrder ? modalOrder.createdAt : Date.now(),
      completedAt: modalOrder ? modalOrder.completedAt : null,
      items: orderItems.map(item => ({
        ...item,
        qty: Math.max(1, parseInt(item.qty, 10) || 1)
      }))
    };

    setShowSaveConfirm(false);
    onSave(orderToSave);
  };

  const totalQty = orderItems.reduce((sum, item) => sum + (parseInt(item.qty, 10) || 0), 0);
  const orderSummary = useMemo(() => calculateOrderSummary(orderItems, catalogItems), [orderItems, catalogItems]);

  const groupedOrderItems = useMemo(() => {
    const daytonaGroup = [];
    const osram = [];

    orderItems.forEach((item, index) => {
      const itemWithIndex = { ...item, originalIndex: index };
      const b = (item.brand || '').toLowerCase();
      if (b === 'osram') {
        osram.push(itemWithIndex);
      } else {
        daytonaGroup.push(itemWithIndex);
      }
    });

    return {
      daytonaGroup,
      osram,
      hasDaytonaGroup: daytonaGroup.length > 0,
      hasOsram: osram.length > 0,
      isMixed: daytonaGroup.length > 0 && osram.length > 0,
      totalDaytonaQty: daytonaGroup.reduce((s, i) => s + (Number(i.qty) || 0), 0),
      totalOsramQty: osram.reduce((s, i) => s + (Number(i.qty) || 0), 0)
    };
  }, [orderItems]);

  const isStoreSelected = Boolean(storeName.trim());
  const hasPartSelected = Boolean(selectedCatalogItem || searchQuery.trim());
  const parsedItemQty = parseInt(itemQty, 10);
  const isQtyValid = Boolean(itemQty.trim() && !isNaN(parsedItemQty) && parsedItemQty > 0);
  const canAddItem = Boolean(isStoreSelected && hasPartSelected && isQtyValid);

  // Helper render baris item
  const renderItemRow = (item, displayIdx) => (
    <div
      key={`${item.pn}-${item.originalIndex ?? displayIdx}`}
      className="p-3 bg-zinc-50/80 hover:bg-zinc-100/70 border border-zinc-200 rounded-2xl flex items-center justify-between gap-3 transition-colors"
    >
      {/* Info Part Lengkap */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12.5px] font-bold text-zinc-400 select-none">
            {displayIdx}.
          </span>
          <span className={`font-mono font-bold text-[15px] ${
            item.brand === 'osram'
              ? 'text-amber-800'
              : item.brand === 'dura'
              ? 'text-sky-700'
              : 'text-[#EA580C]'
          }`}>
            {item.pn}
          </span>
          {item.brand && (
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
              item.brand === 'dura'
                ? 'bg-sky-100 text-sky-700 border border-sky-200'
                : item.brand === 'osram'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-orange-100 text-[#EA580C] border border-orange-200'
            }`}>
              {item.brand}
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-[12.5px] text-zinc-700 font-medium mt-0.5 leading-snug break-words whitespace-normal">
            {item.description}
          </p>
        )}
      </div>

      {/* Input Qty Langsung (Numeric Keyboard Saja) & Tombol Hapus */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center bg-white border border-zinc-300 rounded-xl px-2 py-1 shadow-2xs focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={item.qty}
            onKeyDown={handleNumericKeyDown}
            onChange={(e) => handleDirectQtyChange(item.originalIndex ?? displayIdx - 1, e.target.value)}
            onBlur={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!val || val < 1) {
                handleDirectQtyChange(item.originalIndex ?? displayIdx - 1, 1);
              }
            }}
            className="w-14 text-center font-bold text-zinc-900 text-[14px] focus:outline-none"
          />
          <span className="text-[11px] font-bold text-zinc-400 select-none pr-1">
            PCS
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleRemoveItem(item.originalIndex ?? displayIdx - 1)}
          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors ml-0.5"
          title="Hapus item dari daftar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );

  const {
    containerRef,
    isSwiping,
    dragX,
    isExiting,
    containerStyle,
    backdropOpacity,
    handlers: swipeHandlers
  } = useSwipeBack({
    onBack: onClose,
    edgeWidth: 90,
    threshold: 70,
    enabled: isOpen && !isStorePickerOpen && !showSaveConfirm
  });

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-center">
      {/* Dimmed Backdrop Scrim */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity"
        style={{
          opacity: backdropOpacity,
          transition: isSwiping ? 'none' : 'opacity 0.25s ease',
          pointerEvents: isSwiping ? 'none' : 'auto'
        }}
        onClick={onClose}
      />

      {/* Main Order Form Screen */}
      <div 
        ref={containerRef}
        {...swipeHandlers}
        style={containerStyle}
        className={`relative w-full h-full max-w-lg mx-auto bg-zinc-50 flex flex-col shadow-2xl ${
          dragX === 0 && !isExiting ? 'animate-in slide-in-from-right duration-200' : ''
        }`}
      >
      
      {/* 1. TOP HEADER BAR (Halaman Penuh) */}
      <div className="bg-white border-b border-zinc-200 px-4 py-3 shrink-0 flex items-center justify-between gap-3 shadow-2xs pt-safe">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 font-semibold text-[14px] px-2 py-1 -ml-2 rounded-xl hover:bg-zinc-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Kembali</span>
        </button>

        <div className="text-center min-w-0">
          <h2 className="text-[16px] font-bold text-zinc-900 tracking-tight leading-none truncate">
            {modalOrder ? 'Edit Catatan Order' : 'Catat Order Toko Baru'}
          </h2>
          <p className="text-[11.5px] text-zinc-500 mt-1 font-medium">
            {orderItems.length} Jenis Part · {totalQty} PCS
          </p>
        </div>

        <div className="w-20 flex justify-end">
          {modalOrder && (
            <button
              type="button"
              onClick={() => onDelete(modalOrder.id)}
              className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Hapus Order"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 2. SCROLLABLE FORM BODY */}
      <div className="flex-1 overflow-y-auto px-4 py-4 touch-pan-y">
        <div className="max-w-2xl mx-auto space-y-4 pb-28">

          {/* SECTION TOKO: Select Rapi Tanpa Menampilkan List Memanjang di Awal */}
          <div className="bg-white p-4 rounded-3xl border border-zinc-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-bold text-zinc-900">
                Toko / Pemesan <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-zinc-400">
                {stores.length} toko terdaftar
              </span>
            </div>

            {/* Tampilan Kondisional: Tombol Pilih Rapi vs Kartu Toko Terpilih */}
            {!isStoreSelected ? (
              /* Tombol Pilih Toko Rapi (Kompak, tidak langsung menampilkan list toko memanjang) */
              <button
                type="button"
                onClick={() => {
                  setStoreSearchQuery('');
                  setIsStorePickerOpen(true);
                }}
                className="w-full p-3.5 bg-zinc-50 hover:bg-orange-50/50 border border-zinc-300 hover:border-orange-400 rounded-2xl flex items-center justify-between text-left transition-all group active:scale-99 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#EA580C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[14px] font-bold text-zinc-700 group-hover:text-zinc-950 truncate">
                      Pilih Toko Pemesan...
                    </span>
                    <span className="block text-[11.5px] text-zinc-400 mt-0.5">
                      Klik untuk mencari dari {stores.length} toko
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-zinc-400 group-hover:text-orange-600 shrink-0">
                  <span className="text-[12px] font-semibold hidden sm:inline">Pilih Toko</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ) : (
              /* Kartu Toko Terpilih: Lengkap dengan tombol Ganti & Tombol Batal/Reset */
              <div className="p-3.5 bg-orange-50/70 border border-orange-200/90 rounded-2xl flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    {customerId && (
                      <span className="font-mono font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-md text-[11px]">
                        ID: {customerId}
                      </span>
                    )}
                    {routeCode && (
                      <span className="font-bold text-orange-800 bg-white border border-orange-200 px-2 py-0.5 rounded-md text-[11px]">
                        {routeCode}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-[16px] text-zinc-900 leading-snug break-words">
                    {storeName}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleStartChangeStore}
                    className="px-3 py-1.5 bg-white hover:bg-orange-100 text-orange-800 border border-orange-300 rounded-xl text-[12px] font-bold transition-all active:scale-95 shadow-2xs"
                  >
                    Ganti Toko
                  </button>
                  <button
                    type="button"
                    onClick={handleClearStore}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Batal pilih toko & bersihkan rute"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Grid Tanggal & Kode Rute */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11.5px] font-semibold text-zinc-600 mb-1">
                  Tanggal Order
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] font-medium text-zinc-800 focus:bg-white focus:outline-none focus:border-zinc-400"
                  value={dateIso}
                  onChange={e => setDateIso(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-semibold text-zinc-600 mb-1 flex items-center justify-between">
                  <span>Kode Rute</span>
                  {isStoreSelected && isStoreMissingRoute && (
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded-md">
                      Belum ada rute
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  list="order-route-suggestions"
                  placeholder={isStoreSelected ? (isStoreMissingRoute ? "Ketik kode rute baru..." : "Rute toko...") : "Otomatis dari toko..."}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] font-bold uppercase text-orange-600 focus:bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 transition-all placeholder:font-normal placeholder:normal-case placeholder:text-zinc-400"
                  value={routeCode}
                  onChange={e => setRouteCode(e.target.value.toUpperCase())}
                />
                <datalist id="order-route-suggestions">
                  {existingRoutes.map(r => (
                    <option key={r} value={r} />
                  ))}
                </datalist>

                {/* Indikator rute otomatis tersimpan ke data toko */}
                {isStoreSelected && routeCode.trim() && (isStoreMissingRoute || isRouteModified) && (
                  <p className="mt-1 flex items-center gap-1 text-[10.5px] text-emerald-700 font-medium leading-tight animate-in fade-in">
                    <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Otomatis disimpan ke data toko</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION TAMBAH ITEM (Terkunci jika belum memilih toko) */}
          <div className={`bg-white p-4 rounded-3xl border transition-all ${
            isStoreSelected 
              ? 'border-zinc-200/90 shadow-xs' 
              : 'border-dashed border-zinc-300 bg-zinc-50/60'
          } space-y-3`}>
            
            <div className="flex items-center justify-between">
              <label className="block text-[13px] font-bold text-zinc-900">
                Tambah Item Pesanan
              </label>
              {isStoreSelected && (
                <span className="text-[11px] text-zinc-400">
                  {currentBrandCatalog.length} part {activeSearchBrand.toUpperCase()}
                </span>
              )}
            </div>

            {/* Pemilih Brand Tab: Daytona, Dura, Osram */}
            {isStoreSelected && (
              <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-2xl border border-zinc-200/70">
                {BRANDS.map(b => {
                  const count = (brandCatalogs[b.id] || []).length;
                  const isActive = activeSearchBrand === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setActiveSearchBrand(b.id);
                        setSelectedCatalogItem(null);
                        setSearchQuery('');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[12px] font-bold transition-all ${
                        isActive
                          ? `${b.theme.activeTab} shadow-xs`
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <span>{b.name}</span>
                      <span className="ml-1 text-[10.5px] opacity-75 font-normal">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Warning banner jika toko belum dipilih */}
            {!isStoreSelected && (
              <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-center gap-2.5 text-[12px] text-amber-900 font-medium animate-in fade-in duration-200">
                <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Mohon pilih toko terlebih dahulu di atas sebelum menambahkan item pesanan.</span>
              </div>
            )}

            {/* Input Pencarian Part */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  disabled={!isStoreSelected}
                  placeholder={isStoreSelected 
                    ? `Cari part ${activeSearchBrand.toUpperCase()}: ketik nama, motor, atau PN...` 
                    : "Pilih toko terlebih dahulu di atas untuk mencari part..."}
                  className={`w-full pl-9 pr-8 py-2.5 border rounded-xl text-[13.5px] font-medium transition-all ${
                    isStoreSelected 
                      ? 'bg-zinc-50 border-zinc-300 focus:bg-white focus:outline-none focus:border-zinc-500 text-zinc-900' 
                      : 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowItemSuggestions(true);
                  }}
                  onFocus={() => {
                    if (isStoreSelected) setShowItemSuggestions(true);
                  }}
                />
                <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && isStoreSelected && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowItemSuggestions(false);
                    }}
                    className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 p-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Dropdown Rekomendasi Part (Tanpa HET) */}
              {isStoreSelected && showItemSuggestions && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-2xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-zinc-100">
                  {searchResults.length > 0 ? (
                    searchResults.map(item => (
                      <button
                        key={item.pn}
                        type="button"
                        onClick={() => {
                          setSelectedCatalogItem(item);
                          setSearchQuery('');
                          setShowItemSuggestions(false);
                          setTimeout(() => {
                            qtyInputRef.current?.focus();
                          }, 50);
                        }}
                        className="w-full text-left p-3 hover:bg-orange-50/70 active:bg-orange-100 transition-colors flex flex-col gap-1 group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-[#EA580C] text-[13.5px]">
                            PN: {item.pn}
                          </span>
                          {item.category && (
                            <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10.5px] font-medium">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {/* Deskripsi Lengkap Tanpa HET */}
                        <p className="text-[13px] font-semibold text-zinc-900 group-hover:text-orange-950 leading-snug break-words whitespace-normal">
                          {item.description}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-zinc-400 text-[12px]">
                      Tidak ada part katalog yang cocok dengan "{searchQuery}"
                    </div>
                  )}

                  {/* Opsi Gunakan PN Manual */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCatalogItem({
                        pn: searchQuery.trim(),
                        description: ''
                      });
                      setSearchQuery('');
                      setShowItemSuggestions(false);
                      setTimeout(() => {
                        qtyInputRef.current?.focus();
                      }, 50);
                    }}
                    className="w-full text-left p-3 bg-orange-50/60 hover:bg-orange-100 text-orange-800 font-semibold text-[12px] border-t border-orange-100 flex items-center justify-between"
                  >
                    <span>+ Gunakan nomor PN "{searchQuery.trim()}" langsung</span>
                    <span className="text-[10.5px] text-orange-600 font-normal">Tekan untuk pakai</span>
                  </button>
                </div>
              )}
            </div>

            {/* Kotak Konfirmasi Item Terpilih (Tanpa HET) */}
            {isStoreSelected && selectedCatalogItem && (
              <div className="p-3 bg-orange-50/90 border border-orange-200/90 rounded-2xl flex items-start justify-between gap-3 animate-in fade-in duration-150">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="px-2 py-0.5 bg-[#EA580C] text-white rounded-md font-mono font-bold text-[12px]">
                      PN {selectedCatalogItem.pn}
                    </span>
                    {selectedCatalogItem.category && (
                      <span className="px-2 py-0.5 bg-white text-zinc-700 border border-zinc-200 rounded-md text-[11px] font-medium">
                        {selectedCatalogItem.category}
                      </span>
                    )}
                  </div>
                  {selectedCatalogItem.description && (
                    <p className="text-[13.5px] font-bold text-zinc-900 leading-snug break-words whitespace-normal">
                      {selectedCatalogItem.description}
                    </p>
                  )}
                  <p className={`text-[11px] mt-1.5 font-medium flex items-center gap-1.5 ${
                    isQtyValid ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {isQtyValid ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Qty: <b>{itemQty} PCS</b> — Siap ditambahkan ke daftar</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Masukkan jumlah (Qty) di bawah sebelum menambah ke daftar</span>
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCatalogItem(null);
                    setSearchQuery('');
                    setItemQty('');
                  }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-orange-100 rounded-lg transition-colors shrink-0"
                  title="Ganti Item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Input Qty (Numeric Keyboard Saja) & Tombol Tambah */}
            <div className="flex gap-2.5">
              <div className="w-32">
                <input
                  ref={qtyInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={!isStoreSelected}
                  placeholder="Qty (PCS)"
                  onKeyDown={(e) => {
                    handleNumericKeyDown(e);
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  className={`w-full px-3 py-2.5 border rounded-xl text-center font-bold text-[14px] transition-all ${
                    isStoreSelected
                      ? hasPartSelected && !isQtyValid
                        ? 'bg-amber-50/60 border-amber-400 text-zinc-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                        : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:bg-white focus:outline-none focus:border-zinc-500'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                  value={itemQty}
                  onChange={handleQtyInputChange}
                />
              </div>
              <button
                type="button"
                disabled={!canAddItem}
                onClick={handleAddItem}
                className={`flex-1 py-2.5 font-semibold text-[13px] rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                  canAddItem
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-white active:scale-98 cursor-pointer'
                    : 'bg-zinc-200 text-zinc-400 border border-zinc-200 cursor-not-allowed select-none'
                }`}
              >
                <span>+ Tambah ke Daftar</span>
              </button>
            </div>
          </div>

          {/* SECTION DAFTAR ITEM PESANAN (Dikelompokkan Berdasarkan Brand Daytona & Dura vs Osram) */}
          <div className="bg-white p-4 rounded-3xl border border-zinc-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-zinc-900">
                Daftar Item Pesanan ({orderItems.length} item)
              </span>
              <span className="text-[12px] font-bold text-zinc-600">
                Total: {totalQty} PCS
              </span>
            </div>

            {orderItems.length === 0 ? (
              <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-zinc-400 text-[13px]">
                Belum ada item ditambahkan ke order ini.
              </div>
            ) : groupedOrderItems.isMixed ? (
              /* PESANAN CAMPURAN (DAYTONA & DURA + OSRAM) */
              <div className="space-y-4">
                {/* SUB-SECTION DAYTONA & DURA */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]"></span>
                      <span className="text-[13px] font-bold text-zinc-900">
                        Daytona & Dura ({groupedOrderItems.daytonaGroup.length} item · {groupedOrderItems.totalDaytonaQty} pcs)
                      </span>
                    </div>
                    <span className="text-[11.5px] font-bold text-orange-950 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-lg">
                      {orderSummary.daytonaGroupFormatted}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {groupedOrderItems.daytonaGroup.map((item, idx) => renderItemRow(item, idx + 1))}
                  </div>
                </div>

                {/* SUB-SECTION OSRAM */}
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span className="text-[13px] font-bold text-zinc-900">
                        Osram ({groupedOrderItems.osram.length} item · {groupedOrderItems.totalOsramQty} pcs)
                      </span>
                    </div>
                    <span className="text-[11.5px] font-bold text-amber-950 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      {orderSummary.osramFormatted}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {groupedOrderItems.osram.map((item, idx) => renderItemRow(item, idx + 1))}
                  </div>
                </div>
              </div>
            ) : (
              /* PESANAN SATU BRAND SAJA */
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 py-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${groupedOrderItems.hasOsram ? 'bg-amber-500' : 'bg-[#EA580C]'}`}></span>
                    <span className="text-[12.5px] font-bold text-zinc-800">
                      {groupedOrderItems.hasOsram ? 'Pesanan Osram' : 'Pesanan Daytona & Dura'}
                    </span>
                  </div>
                  <span className={`text-[11.5px] font-bold px-2 py-0.5 rounded-lg border ${
                    groupedOrderItems.hasOsram 
                      ? 'text-amber-950 bg-amber-50 border-amber-200' 
                      : 'text-orange-950 bg-orange-50 border-orange-200'
                  }`}>
                    {orderSummary.formattedText}
                  </span>
                </div>
                <div className="space-y-2">
                  {orderItems.map((item, idx) => renderItemRow({ ...item, originalIndex: idx }, idx + 1))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. FIXED BOTTOM ACTION BAR */}
      <div className="bg-white border-t border-zinc-200 px-4 py-3 shrink-0 shadow-lg pb-safe">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0 pr-2">
            <span className="font-bold text-zinc-900 text-[14.5px] tracking-tight block truncate">
              {orderSummary.formattedText}
            </span>
            {groupedOrderItems.isMixed && (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium mt-0.5 flex-wrap">
                <span className="text-orange-700 font-semibold">{orderSummary.daytonaGroupFormatted}</span>
                <span>·</span>
                <span className="text-amber-800 font-semibold">{orderSummary.osramFormatted}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[13px] rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleRequestSubmit}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-[13px] rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Simpan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. MODAL DIALOG POPUP PILIH TOKO TERDAFTAR (Hanya muncul saat tombol Pilih/Ganti Toko ditekan) */}
      {isStorePickerOpen && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-zinc-200 animate-in slide-in-from-bottom duration-200 pb-safe">
            
            {/* Header Modal Picker */}
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#EA580C] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-zinc-900 leading-tight">
                    Pilih Toko Terdaftar
                  </h3>
                  <p className="text-[12px] text-zinc-400">
                    Pilih dari {stores.length} toko dalam database
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsStorePickerOpen(false);
                  setStoreSearchQuery('');
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
                title="Tutup pencarian"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Kotak Pencarian Toko */}
            <div className="p-4 pb-2 shrink-0">
              <div className="relative">
                <input
                  ref={storeSearchInputRef}
                  type="text"
                  autoFocus
                  placeholder="Ketik nama atau ID toko (misal C 3780)..."
                  className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-500 text-[14px] font-medium text-zinc-900"
                  value={storeSearchQuery}
                  onChange={e => setStoreSearchQuery(e.target.value)}
                />
                <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {storeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStoreSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 p-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* List Toko (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-4 py-2 divide-y divide-zinc-100">
              {filteredStores.length > 0 ? (
                filteredStores.map(store => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => handleSelectStore(store)}
                    className="w-full text-left py-3 px-2 hover:bg-orange-50/70 active:bg-orange-100 rounded-xl transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {store.customerId && (
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-1.5 py-0.5 rounded text-[11px]">
                            {store.customerId}
                          </span>
                        )}
                        {store.routeCode && (
                          <span className="font-bold text-orange-700 bg-orange-50 border border-orange-200/70 px-1.5 py-0.5 rounded text-[10.5px]">
                            {store.routeCode}
                          </span>
                        )}
                        <h4 className="font-bold text-[14px] text-zinc-900 group-hover:text-orange-950">
                          {store.name}
                        </h4>
                      </div>
                      {store.owner && (
                        <p className="text-[12px] text-zinc-400 mt-0.5">
                          Pemilik: {store.owner}
                        </p>
                      )}
                    </div>
                    <span className="text-[12px] font-semibold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      Pilih →
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-10 text-center text-zinc-400 text-[13px]">
                  Tidak ada toko yang cocok dengan "{storeSearchQuery}".<br />
                  <span className="text-[11.5px] text-zinc-400">Pilih dari data 160+ toko yang tersedia.</span>
                </div>
              )}
            </div>

            {/* Footer Modal Picker */}
            <div className="p-3 border-t border-zinc-100 bg-zinc-50 rounded-b-3xl shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsStorePickerOpen(false);
                  setStoreSearchQuery('');
                }}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-semibold text-[13px] rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODAL DIALOG KONFIRMASI SIMPAN ORDER */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150 space-y-4">
            
            {/* Header Dialog */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-zinc-900 leading-tight">
                  Simpan Catatan Order?
                </h3>
                <p className="text-[12px] text-zinc-500 mt-0.5">
                  Pastikan data pesanan sudah sesuai
                </p>
              </div>
            </div>

            {/* Kotak Rangkuman Ringkas */}
            <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-3.5 space-y-2 text-[12.5px]">
              <div>
                <span className="text-zinc-500 block text-[11px] font-medium">Toko / Pemesan</span>
                <span className="font-bold text-zinc-900 text-[13.5px] leading-tight block">
                  {storeName}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {customerId && (
                    <span className="font-mono font-bold text-[10.5px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                      ID: {customerId}
                    </span>
                  )}
                  {routeCode && (
                    <span className="font-bold text-[10.5px] text-orange-800 bg-orange-50 border border-orange-200 px-1.5 py-0.2 rounded">
                      Rute: {routeCode}
                    </span>
                  )}
                </div>
              </div>

              {/* Catatan otomatisasi penyimpanan rute */}
              {routeCode.trim() && (isStoreMissingRoute || isRouteModified) && (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2 text-[11px] text-emerald-800 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Data rute "{routeCode.trim()}" akan otomatis disimpan ke data toko.</span>
                </div>
              )}

              <div className="border-t border-zinc-200/60 pt-2 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 block text-[11px] font-medium">Tanggal</span>
                  <span className="font-semibold text-zinc-800">
                    {formatFullIndonesianDate(dateIso)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 block text-[11px] font-medium">Total Pesanan</span>
                  <span className="font-bold text-[#EA580C]">
                    {orderSummary.formattedText}
                  </span>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Konfirmasi */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSaveConfirm(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[13px] rounded-xl transition-colors"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-[13px] rounded-xl transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4 text-emerald-400 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Ya, Simpan</span>
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

export default OrderModal;
