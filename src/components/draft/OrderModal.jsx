import React, { useState, useEffect, useRef, useMemo } from 'react';

// Helper format ISO YYYY-MM-DD ke format tampilan ringkas DD/MM
const formatDateDisplay = (isoStr) => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return isoStr;
};

// Helper mendapatkan tanggal hari ini format YYYY-MM-DD secara real-time
const getTodayIso = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

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
        setRouteCode(modalOrder.routeCode || '');
        setDateIso(modalOrder.dateIso || getTodayIso());
        setOrderItems(modalOrder.items ? [...modalOrder.items] : []);
      } else {
        // Tanggal real-time hari ini
        setDateIso(getTodayIso());
        setStoreName('');
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

  // Autocomplete pencarian barang dari katalog
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lower = searchQuery.toLowerCase().trim();
    return catalogItems.filter(item => 
      item.pn.toLowerCase().includes(lower) || 
      item.description.toLowerCase().includes(lower)
    ).slice(0, 6);
  }, [searchQuery, catalogItems]);

  if (!isOpen) return null;

  // Handler ubah nama toko (jika cocok dengan toko terdaftar, auto-fill kode rute)
  const handleStoreNameChange = (val) => {
    setStoreName(val);
    const matched = stores.find(s => s.name.toLowerCase() === val.trim().toLowerCase());
    if (matched && matched.routeCode) {
      setRouteCode(matched.routeCode);
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
      storeName: storeName.trim(),
      routeCode: routeCode.trim(),
      date: formatDateDisplay(dateIso),
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
          <div className={`w-14 h-1.5 rounded-full transition-all duration-150 ${
            isDragging ? 'bg-zinc-600 w-16 scale-y-125' : 'bg-zinc-300 group-hover:bg-zinc-400'
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
              
              {/* Input Nama Toko dengan Datalist Otomatis (Mendukung 160+ Toko tanpa makan tempat) */}
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
                    {s.routeCode ? `[${s.routeCode}]` : ''} {s.owner ? `(${s.owner})` : ''}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  Tanggal Order
                </label>
                {/* Real-time HTML5 Date Picker */}
                <input 
                  type="date" 
                  required
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[13px] font-medium text-zinc-800 focus:outline-none focus:border-zinc-400"
                  value={dateIso}
                  onChange={e => setDateIso(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">Kode Rute (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="R01 - BOGOR"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[13px] font-medium uppercase text-orange-600 focus:outline-none focus:border-zinc-400"
                  value={routeCode}
                  onChange={e => setRouteCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>

          {/* Bagian Tambah Item Barang */}
          <div className="border border-zinc-200 rounded-2xl p-3.5 space-y-3 bg-white">
            <label className="block text-[12.5px] font-bold text-zinc-800">
              Tambah Item Pesanan Toko
            </label>

            {/* Input Pencarian Part / Bahasa Motor */}
            <div className="relative">
              <input 
                type="text"
                placeholder="Cari part: ketik 'beat', 'busi', 'roller', atau PN..."
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:border-zinc-400 text-[13.5px] font-medium"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSelectedCatalogItem(null);
                  setShowItemSuggestions(true);
                }}
                onFocus={() => setShowItemSuggestions(true)}
              />

              {/* Dropdown Hasil Pencarian */}
              {showItemSuggestions && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto">
                  {searchResults.map(item => (
                    <button
                      key={item.pn}
                      type="button"
                      onClick={() => {
                        setSelectedCatalogItem(item);
                        setSearchQuery(`PN: ${item.pn} - ${item.description.slice(0, 32)}...`);
                        setShowItemSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-zinc-50 border-b border-zinc-100 last:border-0 flex items-center justify-between text-[12.5px]"
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono font-bold text-[#EA580C] mr-1.5">{item.pn}</span>
                        <span className="text-zinc-700">{item.description}</span>
                      </div>
                      <span className="text-zinc-400 text-[11px] shrink-0">{item.category}</span>
                    </button>
                  ))}

                  {/* Opsi Gunakan PN Manual Langsung */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCatalogItem(null);
                      setShowItemSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 bg-orange-50/50 hover:bg-orange-50 text-orange-700 font-semibold text-[12px]"
                  >
                    + Gunakan PN "{searchQuery.trim()}" langsung
                  </button>
                </div>
              )}
            </div>

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
                Daftar Barang ({orderItems.length} Part)
              </span>
              <span className="text-[12px] text-zinc-500 font-medium">
                Total: <strong className="text-zinc-900">{totalQty}</strong> PCS
              </span>
            </div>

            {orderItems.length === 0 ? (
              <div className="p-6 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-zinc-400 text-[13px]">
                Belum ada part ditambahkan ke order ini.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                {orderItems.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl gap-2"
                  >
                    <div className="min-w-0 flex-1 truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#EA580C] text-[14px]">
                          {item.pn}
                        </span>
                        <span className="text-zinc-400 text-[12px]">:</span>
                        <span className="font-bold text-zinc-900 text-[13.5px]">
                          {item.qty} PCS
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[11.5px] text-zinc-500 truncate mt-0.5">
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
