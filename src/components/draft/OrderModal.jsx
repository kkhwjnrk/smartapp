import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatFullIndonesianDate, getTodayIso } from '../../utils/date';

function OrderModal({
  isOpen,
  modalOrder,
  catalogItems = [],
  stores = [],
  onSave,
  onDelete,
  onClose
}) {
  const [storeName, setStoreName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [routeCode, setRouteCode] = useState('');
  const [dateIso, setDateIso] = useState(getTodayIso());
  const [orderItems, setOrderItems] = useState([]);

  // Input tambah item
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
  const [itemQty, setItemQty] = useState(''); // Tidak default 10
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);

  // Drag to dismiss
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);

  // Inisialisasi form saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      if (modalOrder) {
        setStoreName(modalOrder.storeName || '');
        setCustomerId(modalOrder.customerId || '');
        setRouteCode(modalOrder.routeCode || '');
        setDateIso(modalOrder.dateIso || getTodayIso());
        setOrderItems(modalOrder.items ? [...modalOrder.items] : []);
      } else {
        // Tanggal real-time hari ini
        setDateIso(getTodayIso());
        setStoreName('');
        setCustomerId('');
        setRouteCode('');
        setOrderItems([]);
      }
      setSearchQuery('');
      setSelectedCatalogItem(null);
      setItemQty('');
      setShowItemSuggestions(false);
      setDragY(0);
    }
  }, [isOpen, modalOrder]);

  // Autocomplete pencarian barang dari katalog dengan smart multi-token search (hingga 30 item)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return catalogItems.filter(item => {
      const combined = `${item.pn} ${item.description} ${item.category || ''} ${item.subCategory || ''}`.toLowerCase();
      return tokens.every(t => combined.includes(t));
    }).slice(0, 30);
  }, [searchQuery, catalogItems]);

  if (!isOpen) return null;

  // Handler ubah nama toko (jika cocok dengan toko terdaftar, auto-fill kode rute & ID customer)
  const handleStoreNameChange = (val) => {
    setStoreName(val);
    const cleanVal = val.trim().toLowerCase();
    const matched = stores.find(s => 
      s.name?.toLowerCase() === cleanVal || 
      (s.customerId && s.customerId.toLowerCase() === cleanVal) ||
      (s.customerId && s.customerId.replace(/\s+/g, '').toLowerCase() === cleanVal.replace(/\s+/g, ''))
    );
    if (matched) {
      if (matched.routeCode) {
        setRouteCode(matched.routeCode);
      }
      if (matched.customerId) {
        setCustomerId(matched.customerId);
      }
      // Jika user mengetik nomor customerId saja, otomatis ganti dengan nama toko
      if (matched.customerId && (cleanVal === matched.customerId.toLowerCase() || cleanVal.replace(/\s+/g, '') === matched.customerId.replace(/\s+/g, '').toLowerCase())) {
        setStoreName(matched.name);
      }
    }
  };


  // Tambah item ke daftar pesanan toko
  const handleAddItem = (e) => {
    e?.preventDefault();
    const qty = parseInt(itemQty, 10) || 1;

    let newItem = null;
    if (selectedCatalogItem) {
      newItem = {
        pn: selectedCatalogItem.pn,
        description: selectedCatalogItem.description,
        qty: qty
      };
    } else if (searchQuery.trim()) {
      // Jika user mengetik nomor PN langsung secara manual
      newItem = {
        pn: searchQuery.trim(),
        description: '',
        qty: qty
      };
    }

    if (!newItem) return;

    // Cek jika PN sudah ada di list, update qty
    setOrderItems(prev => {
      const idx = prev.findIndex(i => i.pn.toLowerCase() === newItem.pn.toLowerCase());
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + newItem.qty };
        return updated;
      }
      return [newItem, ...prev];
    });

    // Reset input
    setSearchQuery('');
    setSelectedCatalogItem(null);
    setItemQty('');
    setShowItemSuggestions(false);
  };

  // Hapus item dari daftar
  const handleRemoveItem = (index) => {
    setOrderItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Ubah qty item dalam list
  const handleUpdateItemQty = (index, delta) => {
    setOrderItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const nextQty = Math.max(1, (Number(item.qty) || 1) + delta);
        return { ...item, qty: nextQty };
      }
      return item;
    }));
  };

  // Simpan seluruh order
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!storeName.trim()) {
      alert('Mohon masukkan nama toko / pemesan.');
      return;
    }
    if (orderItems.length === 0) {
      alert('Mohon tambahkan minimal 1 item barang pesanan.');
      return;
    }

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
      items: orderItems
    };

    onSave(orderToSave);
  };

  // Drag down to dismiss handle logic
  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStartY.current = e.clientY;
    currentDragY.current = 0;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) { }
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
    } catch (err) { }

    setIsDragging(false);
    const finalDelta = currentDragY.current;
    if (finalDelta > 75 || finalDelta === 0) {
      onClose();
    }
    setDragY(0);
    dragStartY.current = 0;
    currentDragY.current = 0;
  };

  const totalQty = orderItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

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
          <div className={`w-14 h-1.5 rounded-full transition-all duration-150 ${isDragging ? 'bg-zinc-600 w-16 scale-y-125' : 'bg-zinc-300 group-hover:bg-zinc-400'
            }`}></div>
        </div>

        {/* Modal Title */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <h2 className="text-[18px] font-bold text-zinc-900 tracking-tight">
              {modalOrder ? 'Edit Catatan Order' : 'Catat Order Toko Baru'}
            </h2>
            <p className="text-[12px] text-zinc-500">
              Rangkum pesanan toko secara rapi
            </p>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto pr-1 pb-4 flex-1 space-y-4">

          {/* Toko & Tanggal */}
          <div className="space-y-3 bg-zinc-50/80 p-3.5 rounded-2xl border border-zinc-200/80">
            <div>
              <label className="block text-[12px] font-semibold text-zinc-700 mb-1">
                Nama Toko / Pemesan <span className="text-red-500">*</span>
              </label>

              {/* Input Nama Toko dengan Datalist Otomatis */}
              <input
                type="text"
                required
                list="stores-datalist"
                placeholder="Ketik atau pilih nama toko..."
                className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 font-bold text-zinc-900 text-[14.5px]"
                value={storeName}
                onChange={e => handleStoreNameChange(e.target.value)}
              />

              <datalist id="stores-datalist">
                {stores.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.customerId ? `[ID: ${s.customerId}] ` : ''}{s.routeCode ? `[${s.routeCode}] ` : ''}{s.owner ? `(${s.owner})` : ''}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  ID Customer
                </label>
                <input
                  type="text"
                  placeholder="C 3780"
                  className="w-full px-2.5 py-2 bg-white border border-zinc-200 rounded-lg text-[12.5px] font-mono font-bold text-blue-700 focus:outline-none focus:border-zinc-400 uppercase"
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  Tanggal Order
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-2 py-2 bg-white border border-zinc-200 rounded-lg text-[12px] font-medium text-zinc-800 focus:outline-none focus:border-zinc-400"
                  value={dateIso}
                  onChange={e => setDateIso(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  Kode Rute
                </label>
                <input
                  type="text"
                  placeholder="R01"
                  className="w-full px-2 py-2 bg-white border border-zinc-200 rounded-lg text-[12px] font-medium uppercase text-orange-600 focus:outline-none focus:border-zinc-400"
                  value={routeCode}
                  onChange={e => setRouteCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>

          {/* Bagian Tambah Item Barang */}
          <div className="border border-zinc-200 rounded-2xl p-3.5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <label className="block text-[12.5px] font-bold text-zinc-800">
                Tambah Item Pesanan Toko
              </label>
              <span className="text-[11px] text-zinc-400">
                {catalogItems.length} item katalog
              </span>
            </div>

            {/* Input Pencarian Part / Bahasa Motor */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari item: ketik 'beat', 'busi', 'roller', atau PN..."
                  className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-400 text-[13.5px] font-medium text-zinc-900"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowItemSuggestions(true);
                  }}
                  onFocus={() => setShowItemSuggestions(true)}
                />
                <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
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

              {/* Dropdown Hasil Pencarian: Multi-line Tanpa Truncate */}
              {showItemSuggestions && searchQuery.trim() && (
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
                        }}
                        className="w-full text-left p-3 hover:bg-orange-50/70 active:bg-orange-100 transition-colors flex flex-col gap-1 group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-[#EA580C] text-[13.5px]">
                            PN: {item.pn}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.category && (
                              <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-medium">
                                {item.category}
                              </span>
                            )}
                            {item.price && (
                              <span className="text-emerald-700 font-bold text-[10.5px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                                HET Rp {item.price}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Deskripsi Barang Lengkap (Wrap bebas & jelas) */}
                        <p className="text-[13px] font-semibold text-zinc-900 group-hover:text-orange-950 leading-snug break-words whitespace-normal">
                          {item.description}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-zinc-400 text-[12px]">
                      Tidak ada part yang cocok dengan "{searchQuery}"
                    </div>
                  )}

                  {/* Opsi Gunakan PN Manual Langsung */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCatalogItem(null);
                      setShowItemSuggestions(false);
                    }}
                    className="w-full text-left p-3 bg-orange-50/60 hover:bg-orange-100 text-orange-800 font-semibold text-[12px] border-t border-orange-100 flex items-center justify-between"
                  >
                    <span>+ Gunakan nomor PN "{searchQuery.trim()}" langsung</span>
                    <span className="text-[10.5px] text-orange-600 font-normal">Tekan untuk pakai</span>
                  </button>
                </div>
              )}
            </div>

            {/* Kotak Konfirmasi Item Terpilih (Mencegah salah pilih barang) */}
            {selectedCatalogItem && (
              <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-2xl flex items-start justify-between gap-3 animate-in fade-in duration-150">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="px-2 py-0.5 bg-[#EA580C] text-white rounded-md font-mono font-bold text-[12px]">
                      PN {selectedCatalogItem.pn}
                    </span>
                    {selectedCatalogItem.category && (
                      <span className="px-2 py-0.5 bg-white text-zinc-700 border border-zinc-200/80 rounded-md text-[10.5px] font-medium">
                        {selectedCatalogItem.category}
                      </span>
                    )}
                    {selectedCatalogItem.price && (
                      <span className="text-emerald-700 font-bold text-[10.5px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                        HET: Rp {selectedCatalogItem.price}
                      </span>
                    )}
                  </div>
                  {/* Deskripsi Lengkap Item Terpilih */}
                  <p className="text-[13.5px] font-bold text-zinc-900 leading-snug break-words whitespace-normal">
                    {selectedCatalogItem.description}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                    ✓ Item sudah benar, masukkan jumlah PCS di bawah
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCatalogItem(null);
                    setSearchQuery('');
                  }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-orange-100/80 rounded-lg transition-colors shrink-0"
                  title="Ganti Item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Baris Qty & Tombol Tambah */}
            <div className="flex gap-2">
              <div className="w-28">
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-center font-bold text-[14px] focus:outline-none focus:border-zinc-400"
                  value={itemQty}
                  onChange={e => setItemQty(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-[13px] rounded-xl transition-colors shadow-2xs"
              >
                + Tambah ke Daftar
              </button>
            </div>
          </div>

          {/* Daftar Item Pesanan dalam Order Ini */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[13px] font-bold text-zinc-800">
                Daftar Item ({orderItems.length} item)
              </span>
            </div>

            {orderItems.length === 0 ? (
              <div className="p-6 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-zinc-400 text-[13px]">
                Belum ada item ditambahkan ke order ini.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                {orderItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl gap-2"
                  >
                    {/* Item Info Lengkap Tanpa Truncate */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-[#EA580C] text-[14px]">
                          {item.pn}
                        </span>
                        <span className="text-zinc-400 text-[12px]">:</span>
                        <span className="font-bold text-zinc-900 text-[13.5px]">
                          {item.qty} PCS
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[12px] text-zinc-600 font-medium mt-0.5 leading-snug break-words whitespace-normal">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(idx, -5)}
                        className="w-6 h-6 rounded-md bg-white border border-zinc-200 text-zinc-600 font-bold text-[12px] flex items-center justify-center hover:bg-zinc-100"
                        title="-5 PCS"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(idx, 5)}
                        className="w-6 h-6 rounded-md bg-white border border-zinc-200 text-zinc-600 font-bold text-[12px] flex items-center justify-center hover:bg-zinc-100"
                        title="+5 PCS"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="w-6 h-6 rounded-md text-red-500 hover:bg-red-50 flex items-center justify-center ml-1"
                        title="Hapus item"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-2.5 border-t border-zinc-100">
            {modalOrder && (
              <button
                type="button"
                onClick={() => onDelete(modalOrder.id)}
                className="px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-semibold text-[13.5px] transition-colors"
              >
                Hapus
              </button>
            )}
            <div className="flex-1 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl font-semibold text-[13.5px] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleFormSubmit}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold text-[13.5px] transition-colors shadow-sm"
              >
                Simpan Order
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default OrderModal;
