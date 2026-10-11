import React, { useState, useEffect, useMemo } from 'react';
import initialPricelist from './data/pricelist.json';
import { CATEGORIES, ensureValidCategory } from './constants/categories';

// Layout Components
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';

// Tab Views
import HomeTab from './components/home/HomeTab';
import PricelistTab from './components/pricelist/PricelistTab';
import DraftTab from './components/draft/DraftTab';

// Modals & Sheets
import DiscountSheet from './components/pricelist/DiscountSheet';
import CategorySheet from './components/pricelist/CategorySheet';
import ItemModal from './components/pricelist/ItemModal';

function App() {
  const [activeTab, setActiveTab] = useState('pricelist'); 

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

  // Queries & Categories State
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  // Cart / Draft State
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('order_draft');
    return saved ? JSON.parse(saved) : [];
  });
  const [draftQuery, setDraftQuery] = useState('');
  const [showDraftDropdown, setShowDraftDropdown] = useState(false);
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

  // Form State untuk CRUD
  const [formData, setFormData] = useState({ 
    pn: '', 
    description: '', 
    price: '', 
    qty: '1', 
    category: 'Busi' 
  });

  // Kunci scroll halaman belakang saat modal/sheet terbuka
  useEffect(() => {
    if (discountItem || showCategorySheet || showItemModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [discountItem, showCategorySheet, showItemModal]);

  // Hitung jumlah item per kategori
  const categoryCounts = useMemo(() => {
    const counts = { 'Semua': items.length };
    items.forEach(item => {
      const cat = item.category || 'Lainnya';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Filter items berdasarkan Kategori dan Search Query
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedCategory !== 'Semua' && item.category !== selectedCategory) {
        return false;
      }
      if (query.trim()) {
        const lower = query.toLowerCase().trim();
        const matchPn = item.pn.toLowerCase().includes(lower);
        const matchDesc = item.description.toLowerCase().includes(lower);
        if (!matchPn && !matchDesc) return false;
      }
      return true;
    });
  }, [items, selectedCategory, query]);

  // Items untuk autocomplete pencarian Draft
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
      
      {/* Top Header */}
      <Header 
        activeTab={activeTab} 
        isEditMode={isEditMode} 
        setIsEditMode={setIsEditMode} 
      />

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-5 pt-4 relative">
        {activeTab === 'home' && (
          <HomeTab 
            cartCount={cart.length}
            itemsCount={items.length}
            categoriesCount={CATEGORIES.length - 1}
            onOpenDraft={() => setActiveTab('draft')}
            onOpenPricelist={() => setActiveTab('pricelist')}
            onOpenCategories={() => {
              setActiveTab('pricelist');
              setShowCategorySheet(true);
            }}
          />
        )}

        {activeTab === 'pricelist' && (
          <PricelistTab 
            items={items}
            filteredItems={filteredItems}
            query={query}
            setQuery={setQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
            onOpenCategorySheet={() => setShowCategorySheet(true)}
            isEditMode={isEditMode}
            onOpenAddModal={openAddModal}
            onOpenEditModal={openEditModal}
            onOpenDiscountSheet={(item) => setDiscountItem(item)}
          />
        )}

        {activeTab === 'draft' && (
          <DraftTab 
            cart={cart}
            draftQuery={draftQuery}
            setDraftQuery={setDraftQuery}
            showDraftDropdown={showDraftDropdown}
            setShowDraftDropdown={setShowDraftDropdown}
            draftSearchItems={draftSearchItems}
            selectedDraftItem={selectedDraftItem}
            setSelectedDraftItem={setSelectedDraftItem}
            qtyInput={qtyInput}
            setQtyInput={setQtyInput}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={removeFromCart}
            onClearDraft={clearDraft}
          />
        )}
      </main>

      {/* Category Picker Bottom Sheet */}
      <CategorySheet 
        isOpen={showCategorySheet}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
        onClose={() => setShowCategorySheet(false)}
      />

      {/* Discount Bottom Sheet */}
      <DiscountSheet 
        item={discountItem}
        onClose={() => setDiscountItem(null)}
      />

      {/* CRUD Item Modal */}
      <ItemModal 
        isOpen={showItemModal}
        modalItem={modalItem}
        formData={formData}
        setFormData={setFormData}
        onSave={saveItem}
        onDelete={deleteItem}
        onClose={() => setShowItemModal(false)}
      />

      {/* Bottom Navigation Bar */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        cartCount={cart.length} 
      />

    </div>
  );
}

export default App;
