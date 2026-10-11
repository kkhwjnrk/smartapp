import React, { useState, useEffect, useMemo, useRef } from 'react';
import initialPricelist from './data/pricelist.json';

// Daftar 29 Kategori Utama + Lainnya
export const CATEGORIES = [
  'Semua',
  'Busi',
  'Kampas Rem',
  'Vanbelt',
  'Roller',
  'Kampas Ganda Matic',
  'Kampas Ganda Bebek',
  'Kampas Kopling',
  'Per CVT',
  'Per Sentrik',
  'Filter Udara',
  'Gas Spontan',
  'Handgrip',
  'Disc Rotor',
  'Komstir',
  'Mangkok Kampas Ganda',
  'Bearing',
  'Pulley',
  'Per Kopling',
  'Slider Pulley',
  'Selang Rem',
  'Velg',
  'Rantai',
  'Kaliper',
  'Bracket Kaliper',
  'Master Rem',
  'Bushing Pulley',
  'Injector',
  'Klep',
  'Mesin',
  'Lainnya'
];

// Helper otomatisasi kategorisasi jika ada data lama/baru tanpa kategori
export const categorizeItem = (item) => {
  const d = ((item.description || '') + ' ' + (item.pn || '')).toLowerCase();

  // 1. Busi
  if (d.includes('spark plug') || d.includes('splug') || d.includes('busi')) {
    return 'Busi';
  }

  // 2. Per Sentrik (Clutch shoe spring / per sentrik)
  if (d.includes('per sentrik') || d.includes('clutch shoe spring') || d.includes('spring set(5pcs), clutch shoe') || d.includes('spring set (3pcs), clutch shoe') || d.includes('per ganda') || d.includes('centrifugal spring')) {
    return 'Per Sentrik';
  }

  // 3. Per CVT
  if (d.includes('cvt spring') || d.includes('spring cvt') || d.includes('per cvt') || d.includes('driven spring')) {
    return 'Per CVT';
  }

  // 4. Per Kopling
  if (d.includes('clutch spring') || d.includes('per kopling')) {
    return 'Per Kopling';
  }

  // 5. Mangkok Kampas Ganda
  if (d.includes('clutch housing') || d.includes('ctlutch housing') || d.includes('clutch bell') || d.includes('mangkok kampas ganda') || d.includes('mangkok ganda')) {
    return 'Mangkok Kampas Ganda';
  }

  // 6. Kampas Ganda Bebek (Primary Clutch)
  if (d.includes('primary clutch') || (d.includes('kampas ganda') && (d.includes('bebek') || d.includes('jupiter') || d.includes('vega') || d.includes('supra') || d.includes('grand') || d.includes('blade') || d.includes('revo')))) {
    return 'Kampas Ganda Bebek';
  }

  // 7. Kampas Ganda Matic (Clutch Shoe matic)
  if (d.includes('clutch shoe') || d.includes('kampas ganda') || d.includes('weight set clutch')) {
    return 'Kampas Ganda Matic';
  }

  // 8. Kampas Kopling
  if (d.includes('clutch disc') || d.includes('lining clutch') || d.includes('friction disc') || d.includes('plat kopling') || d.includes('kampas kopling')) {
    return 'Kampas Kopling';
  }

  // 9. Slider Pulley
  if (d.includes('slider pulley') || d.includes('piece slide') || d.includes('slider piece') || d.includes('slider plate') || d.includes('slide piece')) {
    return 'Slider Pulley';
  }

  // 10. Bushing Pulley
  if (d.includes('bushing pulley') || d.includes('collar') || (d.includes('bushing') && !d.includes('swing arm'))) {
    return 'Bushing Pulley';
  }

  // 11. Pulley
  if (d.includes('pulley') || d.includes('pully') || d.includes('face comp') || d.includes('drive face') || d.includes('sheave')) {
    return 'Pulley';
  }

  // 12. Vanbelt
  if (d.includes('drive belt') || d.includes('ultra drive belt') || d.includes('v-belt') || d.includes('vanbelt') || d.includes('belt')) {
    return 'Vanbelt';
  }

  // 13. Roller
  if (d.includes('weight roller') || d.includes('weightroller') || d.includes('roller')) {
    return 'Roller';
  }

  // 14. Bracket Kaliper
  if (d.includes('bracket kaliper') || d.includes('bracket caliper') || d.includes('breket kaliper') || d.includes('caliper bracket') || (d.includes('bracket') && d.includes('kaliper'))) {
    return 'Bracket Kaliper';
  }

  // 15. Master Rem
  if (d.includes('brake pump') || d.includes('master rem') || d.includes('master cylinder') || d.includes('brake master') || d.includes('clutch/brake lever')) {
    return 'Master Rem';
  }

  // 16. Kaliper
  if (d.includes('kaliper') || d.includes('caliper')) {
    return 'Kaliper';
  }

  // 17. Selang Rem
  if (d.includes('selang rem') || d.includes('brake hose')) {
    return 'Selang Rem';
  }

  // 18. Disc Rotor
  if (d.includes('disc rotor') || d.includes('brake disc') || d.includes('disc brake') || d.includes('piringan cakram') || d.includes('rotor disc') || d.includes('piringan') || d.includes('rotor') || (d.includes('disc') && !d.includes('clutch'))) {
    return 'Disc Rotor';
  }

  // 19. Kampas Rem
  if (d.includes('brake pad') || d.includes('brake shoe') || d.includes('pad set') || d.includes('shoe set') || d.includes('kampas rem') || d.includes('kampas tromol')) {
    return 'Kampas Rem';
  }

  // 20. Filter Udara
  if (d.includes('filter udara') || d.includes('air filter') || d.includes('hi-flow filter') || d.includes('element comp')) {
    return 'Filter Udara';
  }

  // 21. Gas Spontan
  if (d.includes('gas spontan') || d.includes('quick throttle') || d.includes('throttle kit')) {
    return 'Gas Spontan';
  }

  // 22. Handgrip
  if (d.includes('handgrip') || d.includes('handle grip') || d.includes('grip') || d.includes('bar end')) {
    return 'Handgrip';
  }

  // 23. Komstir
  if (d.includes('steering stem') || d.includes('komstir') || d.includes('cone race') || d.includes('steering cone')) {
    return 'Komstir';
  }

  // 24. Bearing
  if (d.includes('bearing') || d.includes('laher') || d.includes('ball bearing')) {
    return 'Bearing';
  }

  // 25. Velg
  if (d.includes('velg') || d.includes('wheel') || d.includes('rim') || d.includes('pelek')) {
    return 'Velg';
  }

  // 26. Rantai
  if (d.includes('rantai') || d.includes('chain')) {
    return 'Rantai';
  }

  // 27. Injector
  if (d.includes('injector') || d.includes('injektor')) {
    return 'Injector';
  }

  // 28. Klep
  if (d.includes('klep') || d.includes('valve')) {
    return 'Klep';
  }

  // 29. Mesin
  if (d.includes('oil filter') || d.includes('exhaust') || d.includes('knalpot') || d.includes('engine') || d.includes('piston') || d.includes('cylinder block') || d.includes('blok seher') || d.includes('noken as') || d.includes('camshaft') || d.includes('crankshaft') || d.includes('kruk as') || d.includes('mesin') || d.includes('muffler') || d.includes('gasket') || d.includes('packing') || d.includes('silinder') || d.includes('ignition coil') || d.includes('koil')) {
    return 'Mesin';
  }

  return 'Lainnya';
};

const ensureValidCategory = (item) => {
  if (item.category && CATEGORIES.includes(item.category) && item.category !== 'Semua') {
    return item.category;
  }
  return categorizeItem(item);
};

// Helper kalkulasi diskon grosir
const calculateDiscount = (priceStr, percentage) => {
  if (!priceStr || priceStr === "0") return "-";
  const numericPrice = parseFloat(priceStr.replace(/\./g, '').replace(/,/g, ''));
  if (isNaN(numericPrice)) return "-";
  
  const discounted = numericPrice * (1 - (percentage / 100));
  return Math.round(discounted).toLocaleString('id-ID').replace(/,/g, '.');
};

function App() {
  const [activeTab, setActiveTab] = useState('pricelist'); 
  const searchInputRef = useRef(null);

  // Storage for Pricelist
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('daytona_pricelist');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return parsed.map(item => ({
          ...item,
          category: ensureValidCategory(item)
        }));
      } catch (e) { 
        return initialPricelist.map(item => ({
          ...item,
          category: ensureValidCategory(item)
        })); 
      }
    }
    return initialPricelist.map(item => ({
      ...item,
      category: ensureValidCategory(item)
    }));
  });

  useEffect(() => {
    localStorage.setItem('daytona_pricelist', JSON.stringify(items));
  }, [items]);

  // Queries & Categories
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [catSearchQuery, setCatSearchQuery] = useState('');
  const [draftQuery, setDraftQuery] = useState('');
  const [showDraftDropdown, setShowDraftDropdown] = useState(false);

  // Cart / Draft
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('order_draft');
    return saved ? JSON.parse(saved) : [];
  });
  const [qtyInput, setQtyInput] = useState('1');
  const [selectedDraftItem, setSelectedDraftItem] = useState(null);

  useEffect(() => {
    localStorage.setItem('order_draft', JSON.stringify(cart));
  }, [cart]);

  // Modals & States
  const [isEditMode, setIsEditMode] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalItem, setModalItem] = useState(null); 
  const [discountItem, setDiscountItem] = useState(null);

  // Drag-to-Dismiss State untuk Modal Diskon
  const [discountDragY, setDiscountDragY] = useState(0);
  const [isDiscountDragging, setIsDiscountDragging] = useState(false);
  const discountDragStartY = useRef(0);
  const discountCurrentDragY = useRef(0);

  // Drag-to-Dismiss State untuk Modal Kategori
  const [catDragY, setCatDragY] = useState(0);
  const [isCatDragging, setIsCatDragging] = useState(false);
  const catDragStartY = useRef(0);
  const catCurrentDragY = useRef(0);

  // Kunci scroll halaman belakang saat modal terbuka
  useEffect(() => {
    if (discountItem || showCategorySheet || showItemModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [discountItem, showCategorySheet, showItemModal]);

  // Pointer Handlers untuk Drag-to-Dismiss Modal Diskon
  const handleDiscountPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    discountDragStartY.current = e.clientY;
    discountCurrentDragY.current = 0;
    setIsDiscountDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleDiscountPointerMove = (e) => {
    if (!discountDragStartY.current) return;
    const deltaY = e.clientY - discountDragStartY.current;
    if (deltaY > 0) {
      discountCurrentDragY.current = deltaY;
      setDiscountDragY(deltaY);
    } else {
      discountCurrentDragY.current = 0;
      setDiscountDragY(deltaY * 0.15); // Hambatan saat ditarik ke atas
    }
  };

  const handleDiscountPointerUp = (e) => {
    if (!discountDragStartY.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    setIsDiscountDragging(false);
    const finalDelta = discountCurrentDragY.current;

    // Jika di-drag ke bawah > 60px atau di-tap tanpa geser -> Tutup modal
    if (finalDelta > 60 || finalDelta === 0) {
      setDiscountItem(null);
    }

    setDiscountDragY(0);
    discountDragStartY.current = 0;
    discountCurrentDragY.current = 0;
  };

  // Pointer Handlers untuk Drag-to-Dismiss Modal Kategori
  const handleCatPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    catDragStartY.current = e.clientY;
    catCurrentDragY.current = 0;
    setIsCatDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleCatPointerMove = (e) => {
    if (!catDragStartY.current) return;
    const deltaY = e.clientY - catDragStartY.current;
    if (deltaY > 0) {
      catCurrentDragY.current = deltaY;
      setCatDragY(deltaY);
    } else {
      catCurrentDragY.current = 0;
      setCatDragY(deltaY * 0.15);
    }
  };

  const handleCatPointerUp = (e) => {
    if (!catDragStartY.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    setIsCatDragging(false);
    const finalDelta = catCurrentDragY.current;

    if (finalDelta > 60 || finalDelta === 0) {
      setShowCategorySheet(false);
    }

    setCatDragY(0);
    catDragStartY.current = 0;
    catCurrentDragY.current = 0;
  };

  // Form State
  const [formData, setFormData] = useState({ 
    pn: '', 
    description: '', 
    price: '', 
    qty: '1', 
    category: 'Busi' 
  });

  // Hitung jumlah item per kategori
  const categoryCounts = useMemo(() => {
    const counts = { 'Semua': items.length };
    items.forEach(item => {
      const cat = item.category || 'Lainnya';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Kategori terfilter untuk modal pencarian kategori
  const filteredCategories = useMemo(() => {
    if (!catSearchQuery.trim()) return CATEGORIES;
    const lower = catSearchQuery.toLowerCase().trim();
    return CATEGORIES.filter(cat => cat.toLowerCase().includes(lower));
  }, [catSearchQuery]);

  // Filter items berdasarkan Kategori dan Search Query
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Filter Kategori
      if (selectedCategory !== 'Semua' && item.category !== selectedCategory) {
        return false;
      }
      // Filter Pencarian
      if (query.trim()) {
        const lower = query.toLowerCase().trim();
        const matchPn = item.pn.toLowerCase().includes(lower);
        const matchDesc = item.description.toLowerCase().includes(lower);
        if (!matchPn && !matchDesc) return false;
      }
      return true;
    });
  }, [items, selectedCategory, query]);

  const draftSearchItems = useMemo(() => {
    if (!draftQuery) return [];
    const lowerQuery = draftQuery.toLowerCase().trim();
    return items.filter(item => 
      item.pn.toLowerCase().includes(lowerQuery) || 
      item.description.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  }, [draftQuery, items]);

  // Draft Logic
  const handleAddToCart = (itemObj) => {
    if (!itemObj) return;
    const qty = parseInt(qtyInput, 10);
    if (qty <= 0) return;

    setCart(prev => {
      const existing = prev.find(i => i.pn === itemObj.pn);
      if (existing) {
        return prev.map(i => i.pn === itemObj.pn ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { ...itemObj, qty }];
    });

    setDraftQuery('');
    setQtyInput('1');
    setShowDraftDropdown(false);
    setSelectedDraftItem(null);
  };

  const removeFromCart = (pn) => {
    setCart(prev => prev.filter(i => i.pn !== pn));
  };

  const clearDraft = () => {
    if (window.confirm('Bersihkan semua daftar order saat ini?')) {
      setCart([]);
    }
  };

  // CRUD Logic
  const openAddModal = () => {
    setFormData({ 
      pn: '', 
      description: '', 
      price: '', 
      qty: '1',
      category: selectedCategory !== 'Semua' ? selectedCategory : 'Busi'
    });
    setModalItem(null);
    setShowItemModal(true);
  };

  const openEditModal = (item) => {
    setFormData({ 
      ...item,
      category: item.category || 'Busi'
    });
    setModalItem(item);
    setShowItemModal(true);
  };

  const saveItem = (e) => {
    e.preventDefault();
    if (!formData.pn.trim() || !formData.description.trim()) return;

    const itemToSave = {
      ...formData,
      category: formData.category || 'Busi'
    };

    if (modalItem) {
      setItems(prev => prev.map(i => i.pn === modalItem.pn ? itemToSave : i));
    } else {
      if (items.some(i => i.pn === formData.pn.trim())) {
        alert('Part Number sudah terdaftar!');
        return;
      }
      setItems(prev => [itemToSave, ...prev]);
    }
    setShowItemModal(false);
  };

  const deleteItem = () => {
    if (window.confirm(`Hapus barang ini secara permanen?\n\nPN: ${modalItem.pn}\nNama: ${modalItem.description}`)) {
      setItems(prev => prev.filter(i => i.pn !== modalItem.pn));
      setShowItemModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-28 font-sans text-zinc-900 selection:bg-zinc-200">
      
      {/* Top Header - Apple Minimalist Aesthetic */}
      <header className="bg-[#FDFDFD]/90 sticky top-0 z-30 backdrop-blur-xl border-b border-zinc-200/50">
        <div className="max-w-md mx-auto px-5 py-3.5 flex justify-between items-center">
          <div>
            <h1 className="text-[20px] font-bold text-zinc-900 tracking-tight">
              {activeTab === 'home' && "Dashboard"}
              {activeTab === 'pricelist' && "Pricelist"}
              {activeTab === 'draft' && "Draft Order"}
            </h1>
          </div>
          {activeTab === 'pricelist' && (
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${isEditMode ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
            >
              {isEditMode ? 'Selesai' : 'Edit'}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-4 relative">
        
        {/* TAB: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex flex-col justify-between h-48">
              <div>
                <p className="text-[13px] font-medium text-zinc-500 mb-1">Status Draft Saat Ini</p>
                <div className="text-5xl font-semibold tracking-tight text-zinc-900">{cart.length}</div>
                <p className="text-[13px] text-zinc-500 mt-1">Item siap diproses</p>
              </div>
              <button 
                onClick={() => setActiveTab('draft')}
                className="w-full py-3 bg-zinc-900 text-white rounded-xl text-[14px] font-medium hover:bg-zinc-800 transition-colors"
              >
                Buka Daftar Order
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveTab('pricelist')}
                className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-start gap-4 hover:border-zinc-300 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <div>
                  <span className="block font-semibold text-zinc-900 text-[15px]">Katalog</span>
                  <span className="text-[13px] font-medium text-zinc-500 mt-0.5">{items.length} Item</span>
                </div>
              </button>

              <button 
                onClick={() => {
                  setActiveTab('pricelist');
                  setShowCategorySheet(true);
                }}
                className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-start gap-4 hover:border-zinc-300 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <div>
                  <span className="block font-semibold text-zinc-900 text-[15px]">Kategori</span>
                  <span className="text-[13px] font-medium text-zinc-500 mt-0.5">{CATEGORIES.length - 1} Kategori</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TAB: PRICELIST */}
        {activeTab === 'pricelist' && (
          <div className="space-y-3.5 animate-in fade-in duration-500">
            
            {/* Sticky Search & Category Control Bar */}
            <div className="sticky top-[58px] z-20 bg-[#FDFDFD] pb-2 pt-1">
              
              {/* Kolom Cari dengan Tombol X */}
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Cari nama atau part number..."
                  className="w-full pl-12 pr-11 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 text-[15px] font-medium placeholder:font-normal placeholder:text-zinc-400 shadow-sm transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                
                {/* Tombol X untuk reset pencarian */}
                {query.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Hapus pencarian"
                    className="absolute inset-y-0 right-3.5 flex items-center justify-center my-auto w-6 h-6 rounded-full bg-zinc-200/90 hover:bg-zinc-300 text-zinc-600 transition-colors active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Category Selector Bar */}
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCatSearchQuery('');
                    setShowCategorySheet(true);
                  }}
                  className={`flex-1 flex items-center justify-between px-4 py-2.5 rounded-2xl border text-[13px] font-medium transition-all active:scale-[0.99] ${
                    selectedCategory !== 'Semua'
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <svg className={`w-4 h-4 shrink-0 ${selectedCategory !== 'Semua' ? 'text-zinc-300' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="truncate">
                      {selectedCategory === 'Semua' ? 'Semua Kategori' : selectedCategory}
                    </span>
                    <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                      selectedCategory !== 'Semua' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {categoryCounts[selectedCategory] || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className="text-[12px] opacity-75">Ganti</span>
                    <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {selectedCategory !== 'Semua' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('Semua')}
                    className="px-3.5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[13px] font-medium transition-colors shrink-0"
                    title="Reset ke Semua Kategori"
                  >
                    Semua
                  </button>
                )}
              </div>

              {/* Status Hasil Pencarian */}
              <div className="flex items-center justify-between text-[12px] text-zinc-500 font-medium px-1 mt-2">
                <span>
                  {query.trim() ? (
                    <>Hasil cari "{query}" ({filteredItems.length} item)</>
                  ) : (
                    <>Menampilkan {filteredItems.length} item</>
                  )}
                </span>
                {(selectedCategory !== 'Semua' || query.trim().length > 0) && (
                  <button 
                    onClick={() => {
                      setSelectedCategory('Semua');
                      setQuery('');
                    }}
                    className="text-zinc-500 hover:text-zinc-900 font-medium underline transition-colors"
                  >
                    Reset Semua
                  </button>
                )}
              </div>

              {/* Mode Edit Banner */}
              {isEditMode && (
                <div className="mt-2.5 bg-zinc-50 border border-zinc-200 p-3 rounded-2xl flex justify-between items-center animate-in fade-in">
                  <span className="text-[13px] text-zinc-600 font-medium px-2">Mode kelola aktif</span>
                  <button onClick={openAddModal} className="px-4 py-2 bg-zinc-900 text-white font-medium text-[13px] rounded-xl hover:bg-zinc-800 transition-colors">
                    Tambah Barang
                  </button>
                </div>
              )}
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200 mt-2">
                <div className="w-12 h-12 mx-auto bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <p className="text-zinc-900 text-[15px] font-semibold">Data tidak ditemukan</p>
                <p className="text-zinc-500 text-[13px] mt-1">Coba kata kunci lain atau ubah pilihan kategori.</p>
                <button 
                  onClick={() => { setSelectedCategory('Semua'); setQuery(''); }}
                  className="mt-4 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-[13px] font-medium hover:bg-zinc-200 transition-colors"
                >
                  Tampilkan Semua Barang
                </button>
              </div>
            )}

            {/* List Container */}
            <div className="space-y-3 pb-6">
              {filteredItems.map(item => (
                <div 
                  key={item.pn} 
                  onClick={() => !isEditMode && setDiscountItem(item)}
                  className={`bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm transition-all duration-200 flex flex-col gap-2.5 ${!isEditMode ? 'cursor-pointer hover:shadow-md hover:border-zinc-300 active:scale-[0.98]' : ''}`}
                >
                  {/* Bagian Atas Card: PN di Kiri, Kategori di Pojok Kanan Atas */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      
                      {/* PN Berwarna Oranye Daytona khas racing, tegas & jelas */}
                      <div className="mb-1.5">
                        <span className="inline-block text-[14px] font-bold text-[#EA580C] font-mono tracking-tight bg-orange-50/90 px-2.5 py-0.5 rounded-lg border border-orange-200/70 shadow-[0_1px_2px_rgba(234,88,12,0.06)]">
                          PN: {item.pn}
                        </span>
                      </div>

                      {/* Nama / Deskripsi Barang */}
                      <h3 className="font-medium text-[15px] text-zinc-900 leading-snug break-words pr-1">
                        {item.description}
                      </h3>
                    </div>

                    {/* Pojok Kanan Atas: Kategori Badge & Tombol Edit */}
                    <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200/60 max-w-[140px] truncate text-right">
                        {item.category || 'Lainnya'}
                      </span>
                      {isEditMode && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                          className="text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors"
                          aria-label="Edit Barang"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bagian Bawah Card: Isi per Dus/Karton & Harga HET */}
                  <div className="pt-2.5 border-t border-zinc-100 flex justify-between items-center">
                    <div className="text-[13px] text-zinc-500 font-medium flex items-center gap-1.5">
                      <span className="text-zinc-400">Isi/Dus:</span>
                      <span className="font-semibold text-zinc-700">{item.qty} PCS</span>
                    </div>
                    <div className="text-[15px] font-semibold text-zinc-900">
                      {item.price === "0" || !item.price ? "-" : item.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: DRAFT ORDER */}
        {activeTab === 'draft' && (
          <div className="space-y-6 pb-6 animate-in fade-in duration-500">
            <div className="relative z-30">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <input 
                type="text" 
                placeholder="Cari part untuk ditambahkan..."
                className="w-full px-5 py-4 pl-12 pr-11 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[15px] font-medium placeholder:font-normal placeholder:text-zinc-400 shadow-sm"
                value={draftQuery}
                onChange={(e) => {
                  setDraftQuery(e.target.value);
                  setShowDraftDropdown(true);
                }}
                onFocus={() => setShowDraftDropdown(true)}
              />
              {draftQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraftQuery('')}
                  aria-label="Hapus pencarian draft"
                  className="absolute inset-y-0 right-3.5 flex items-center justify-center my-auto w-6 h-6 rounded-full bg-zinc-200/90 hover:bg-zinc-300 text-zinc-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {showDraftDropdown && draftQuery && draftSearchItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-200 z-50 max-h-[60vh] overflow-y-auto">
                  {draftSearchItems.map(item => (
                    <div key={item.pn} className="w-full text-left px-5 py-4 border-b border-zinc-100 last:border-0 flex flex-col gap-3">
                      <div>
                        <div className="text-[14px] font-semibold text-zinc-900 leading-snug">{item.description}</div>
                        <div className="text-[12px] font-medium text-zinc-500 mt-0.5 flex items-center gap-1.5">
                          <span className="text-[#EA580C] font-semibold font-mono">PN: {item.pn}</span>
                          <span>·</span>
                          <span>{item.category}</span>
                          <span>·</span>
                          <span className="text-zinc-400">{item.qty} pcs/dus</span>
                        </div>
                      </div>
                      {selectedDraftItem?.pn === item.pn ? (
                        <div className="flex gap-2 mt-1">
                          <input 
                            type="number" min="1" autoFocus
                            className="w-20 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-center font-semibold text-[14px] focus:outline-none focus:border-zinc-400"
                            value={qtyInput} onChange={(e) => setQtyInput(e.target.value)}
                          />
                          <button onClick={() => handleAddToCart(item)} className="px-4 py-2 bg-zinc-900 text-white text-[13px] font-medium rounded-xl flex-1 hover:bg-zinc-800 transition-colors">Tambah</button>
                          <button onClick={() => setSelectedDraftItem(null)} className="px-4 py-2 bg-zinc-100 text-zinc-600 text-[13px] font-medium rounded-xl hover:bg-zinc-200 transition-colors">Batal</button>
                        </div>
                      ) : (
                        <button onClick={() => { setSelectedDraftItem(item); setQtyInput('1'); }} className="w-fit px-4 py-2 bg-zinc-50 border border-zinc-200 text-zinc-700 text-[12px] font-medium rounded-xl hover:bg-zinc-100 transition-colors">
                          Pilih Barang
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {showDraftDropdown && draftQuery && (
              <div className="fixed inset-0 z-20 bg-zinc-900/10 backdrop-blur-sm" onClick={() => setShowDraftDropdown(false)}></div>
            )}

            <div className="flex justify-between items-end mb-2 px-1">
              <h2 className="text-[14px] font-semibold text-zinc-900">Daftar Item ({cart.length})</h2>
              {cart.length > 0 && (
                <button onClick={clearDraft} className="text-[13px] font-medium text-red-500 hover:text-red-600 transition-colors">
                  Hapus Semua
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200">
                <p className="text-zinc-900 text-[15px] font-medium">Belum ada pesanan</p>
                <p className="text-zinc-500 text-[13px] mt-1">Cari barang di atas untuk menambahkan ke order.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={item.pn} className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-200 flex items-center justify-between gap-4">
                    <div className="w-8 h-8 shrink-0 bg-zinc-50 text-zinc-500 rounded-full flex items-center justify-center text-[12px] font-semibold border border-zinc-100">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-semibold text-zinc-900 text-[14px] leading-snug break-words line-clamp-2 mb-0.5">{item.description}</div>
                      <div className="text-[12px] font-medium text-zinc-500 flex items-center gap-1.5">
                        <span className="text-[#EA580C] font-semibold font-mono">PN: {item.pn}</span>
                        <span>·</span>
                        <span className="text-zinc-400">{item.qty} pcs/dus</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <div className="text-[15px] font-semibold text-zinc-900 bg-zinc-50 px-3 py-1 rounded-lg border border-zinc-100">
                        {item.qty} <span className="text-[11px] text-zinc-400 ml-1">PCS</span>
                      </div>
                      <button onClick={() => removeFromCart(item.pn)} className="text-[12px] font-medium text-red-500 hover:text-red-600">
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* CATEGORY PICKER BOTTOM SHEET */}
      {showCategorySheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" 
            style={{
              opacity: catDragY > 0 ? Math.max(0.1, 1 - catDragY / 250) : undefined
            }}
            onClick={() => setShowCategorySheet(false)}
          ></div>
          <div 
            style={{
              transform: catDragY !== 0 ? `translateY(${catDragY}px)` : undefined,
              transition: isCatDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="relative bg-white w-full max-w-md rounded-t-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-[100%] duration-300 max-h-[82vh] flex flex-col"
          >
            
            {/* Garis Handle Interaktif Drag-down to Dismiss */}
            <div
              onPointerDown={handleCatPointerDown}
              onPointerMove={handleCatPointerMove}
              onPointerUp={handleCatPointerUp}
              onPointerCancel={handleCatPointerUp}
              className="w-full flex justify-center items-center pt-1 pb-3 -mt-4 mb-2 cursor-grab active:cursor-grabbing touch-none select-none group"
              aria-label="Tarik ke bawah untuk menutup"
            >
              <div className={`w-14 h-1.5 rounded-full transition-all duration-150 ${
                isCatDragging ? 'bg-zinc-600 w-16 scale-y-125' : 'bg-zinc-300 group-hover:bg-zinc-400'
              }`}></div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center mb-3 shrink-0">
              <div>
                <h3 className="text-[18px] font-bold text-zinc-900">Pilih Kategori</h3>
                <p className="text-[13px] text-zinc-500">Pilih untuk menyaring barang secara instan</p>
              </div>
              {selectedCategory !== 'Semua' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('Semua');
                    setShowCategorySheet(false);
                  }}
                  className="text-[13px] font-semibold text-zinc-600 hover:text-zinc-900 underline"
                >
                  Tampilkan Semua
                </button>
              )}
            </div>

            {/* Mini Search Kategori */}
            <div className="relative mb-3 shrink-0">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari nama kategori..."
                className="w-full pl-10 pr-9 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-[14px] focus:outline-none focus:border-zinc-400 focus:bg-white transition-all font-medium placeholder:font-normal"
                value={catSearchQuery}
                onChange={e => setCatSearchQuery(e.target.value)}
              />
              {catSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCatSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-600"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Category List */}
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 -mr-1">
              {filteredCategories.map(cat => {
                const count = categoryCounts[cat] || 0;
                if (count === 0 && cat !== 'Semua') return null;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowCategorySheet(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-zinc-900 text-white font-semibold shadow-sm'
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-medium'
                    }`}
                  >
                    <span className="text-[14px]">{cat}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-white border border-zinc-200 text-zinc-600'
                      }`}>
                        {count} item
                      </span>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DISCOUNT BOTTOM SHEET MODAL (Interaktif Drag-to-Dismiss Seperti Native App, Tanpa Tombol X) */}
      {discountItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" 
            style={{
              opacity: discountDragY > 0 ? Math.max(0.1, 1 - discountDragY / 250) : undefined
            }}
            onClick={() => setDiscountItem(null)}
          ></div>
          <div 
            style={{
              transform: discountDragY !== 0 ? `translateY(${discountDragY}px)` : undefined,
              transition: isDiscountDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="relative bg-white w-full max-w-md rounded-t-[2.5rem] p-7 pt-4 shadow-2xl animate-in slide-in-from-bottom-[100%] duration-300"
          >
            
            {/* Garis Handle Interaktif: Drag ke Bawah Menutup Modal, Touch-none Mencegah Background Scroll */}
            <div
              onPointerDown={handleDiscountPointerDown}
              onPointerMove={handleDiscountPointerMove}
              onPointerUp={handleDiscountPointerUp}
              onPointerCancel={handleDiscountPointerUp}
              className="w-full flex justify-center items-center pt-1 pb-4 -mt-2 cursor-grab active:cursor-grabbing touch-none select-none group"
              aria-label="Tarik ke bawah untuk menutup"
            >
              <div className={`w-14 h-1.5 rounded-full transition-all duration-150 ${
                isDiscountDragging ? 'bg-zinc-600 w-16 scale-y-125' : 'bg-zinc-300 group-hover:bg-zinc-400'
              }`}></div>
            </div>
            
            {/* Header Rincian Barang: PN di Kiri, Kategori di Pojok Kanan Atas (Tanpa Tombol X) */}
            <div className="flex justify-between items-start mb-5">
              <div className="flex-1 pr-3">
                <div className="mb-1.5">
                  <span className="inline-block text-[14px] font-bold text-[#EA580C] font-mono tracking-tight bg-orange-50/90 px-2.5 py-0.5 rounded-lg border border-orange-200/70">
                    PN: {discountItem.pn}
                  </span>
                </div>
                <div className="text-[18px] font-bold text-zinc-900 leading-snug">{discountItem.description}</div>
              </div>
              <div className="shrink-0 pt-0.5">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
                  {discountItem.category || 'Lainnya'}
                </span>
              </div>
            </div>
            
            {/* Harga HET & Qty per Dus */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 mb-5 flex justify-between items-center">
              <div>
                <span className="block text-[12px] font-medium text-zinc-500">Harga (HET)</span>
                <span className="text-[20px] font-bold text-zinc-900">{discountItem.price === "0" || !discountItem.price ? "-" : `Rp ${discountItem.price}`}</span>
              </div>
              <div className="text-right">
                <span className="block text-[12px] font-medium text-zinc-500">Isi per Dus</span>
                <span className="text-[15px] font-semibold text-zinc-800">{discountItem.qty} PCS</span>
              </div>
            </div>

            {/* Skema Diskon Grosir */}
            <div className="space-y-1 pb-2">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Skema Diskon Grosir</h4>
              
              <div className="flex justify-between items-center py-2.5 px-1 border-b border-zinc-100">
                <span className="text-[15px] font-medium text-zinc-700">Diskon 24%</span>
                <span className="text-[16px] font-semibold text-zinc-900">Rp {calculateDiscount(discountItem.price, 24)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 px-1 border-b border-zinc-100">
                <span className="text-[15px] font-medium text-zinc-700">Diskon 27%</span>
                <span className="text-[16px] font-semibold text-zinc-900">Rp {calculateDiscount(discountItem.price, 27)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 px-1">
                <span className="text-[15px] font-medium text-zinc-700">Diskon 29%</span>
                <span className="text-[16px] font-semibold text-zinc-900">Rp {calculateDiscount(discountItem.price, 29)}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CRUD MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowItemModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-8">
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-5">{modalItem ? 'Edit Informasi Barang' : 'Tambah Barang Baru'}</h2>
            
            <form onSubmit={saveItem} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Part Number</label>
                <input 
                  type="text" required
                  disabled={!!modalItem}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px] disabled:bg-zinc-50 disabled:text-zinc-500 font-mono font-bold text-[#EA580C]"
                  value={formData.pn} onChange={e => setFormData({...formData, pn: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Kategori</label>
                <select
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px]"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {CATEGORIES.filter(c => c !== 'Semua').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Deskripsi Lengkap</label>
                <textarea 
                  required rows="3"
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px] resize-none"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Harga (HET)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px]"
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Isi per Dus/Karton</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px]"
                    value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 mt-2 flex gap-3">
                {modalItem && (
                  <button type="button" onClick={deleteItem} className="px-4 py-3 text-red-600 bg-red-50 rounded-xl font-medium text-[14px] hover:bg-red-100 transition-colors">
                    Hapus
                  </button>
                )}
                <div className="flex-1 flex gap-3">
                  <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 py-3 text-zinc-600 bg-zinc-100 rounded-xl font-medium text-[14px] hover:bg-zinc-200 transition-colors">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-medium text-[14px] hover:bg-zinc-800 transition-colors">Simpan</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Minimalist */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#FDFDFD]/90 border-t border-zinc-200/60 pb-safe pt-2 backdrop-blur-xl z-40">
        <div className="max-w-md mx-auto flex justify-around items-center px-2 pb-5 pt-1">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 w-16 p-2 rounded-xl transition-all ${activeTab === 'home' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <svg className="w-[22px] h-[22px]" fill={activeTab === 'home' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'home' ? "0" : "2"} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span className="text-[11px] font-medium">Home</span>
          </button>

          <button onClick={() => setActiveTab('pricelist')} className={`flex flex-col items-center gap-1 w-16 p-2 rounded-xl transition-all ${activeTab === 'pricelist' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <svg className="w-[22px] h-[22px]" fill={activeTab === 'pricelist' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'pricelist' ? "0" : "2"} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            <span className="text-[11px] font-medium">Pricelist</span>
          </button>

          <button onClick={() => setActiveTab('draft')} className={`flex flex-col items-center gap-1 w-16 p-2 rounded-xl relative transition-all ${activeTab === 'draft' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <div className="relative">
              <svg className="w-[22px] h-[22px]" fill={activeTab === 'draft' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'draft' ? "0" : "2"} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-semibold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                  {cart.length}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium">Order</span>
          </button>
        </div>
      </nav>

    </div>
  );
}

export default App;
