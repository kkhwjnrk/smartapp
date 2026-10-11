import React, { useState, useEffect, useMemo } from 'react';
import initialPricelist from './data/pricelist.json';
import initialStores from './data/stores.json';
import initialOrders from './data/orders.json';
import { CATEGORIES, ensureValidCategory } from './constants/categories';
import { getCurrentMonthKey, getOrderMonthKey } from './utils/date';

// Layout Components
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';

// Tab Views
import HomeTab from './components/home/HomeTab';
import PricelistTab from './components/pricelist/PricelistTab';
import StoresTab from './components/stores/StoresTab';
import DraftTab from './components/draft/DraftTab';

// Modals & Sheets
import DiscountSheet from './components/pricelist/DiscountSheet';
import CategorySheet from './components/pricelist/CategorySheet';
import ItemModal from './components/pricelist/ItemModal';
import StoreModal from './components/stores/StoreModal';
import RouteSheet from './components/stores/RouteSheet';
import OrderModal from './components/draft/OrderModal';

function App() {
  const [activeTab, setActiveTab] = useState('home'); 

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

  // Storage for Stores
  const [stores, setStores] = useState(() => {
    const saved = localStorage.getItem('daytona_stores');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialStores;
      }
    }
    return initialStores;
  });

  useEffect(() => {
    localStorage.setItem('daytona_stores', JSON.stringify(stores));
  }, [stores]);

  // Stores State
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('Semua');
  const [isStoreEditMode, setIsStoreEditMode] = useState(false);
  const [showRouteSheet, setShowRouteSheet] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [modalStore, setModalStore] = useState(null);
  const [storeFormData, setStoreFormData] = useState({
    name: '',
    routeCode: '',
    owner: '',
    address: '',
    lat: '',
    lng: '',
    notes: ''
  });

  // Queries & Categories State
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  // Orders State (Disimpan per toko, terpisah Aktif & Arsip)
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('daytona_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialOrders;
      }
    }
    return initialOrders;
  });

  useEffect(() => {
    localStorage.setItem('daytona_orders', JSON.stringify(orders));
  }, [orders]);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [modalOrder, setModalOrder] = useState(null);

  // Periode Bulan untuk Catatan Order (Pendekatan 1)
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);

  const availableMonths = useMemo(() => {
    const monthSet = new Set();
    monthSet.add(currentMonthKey);
    if (selectedMonthKey !== 'all') {
      monthSet.add(selectedMonthKey);
    }
    orders.forEach(o => {
      const m = getOrderMonthKey(o);
      if (m) monthSet.add(m);
    });
    return Array.from(monthSet).sort().reverse();
  }, [orders, currentMonthKey, selectedMonthKey]);

  // Hitung jumlah order aktif / pending
  const pendingOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'pending').length;
  }, [orders]);

  // Order Handlers
  const toggleOrderStatus = (orderId) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const isCurrentlyPending = o.status === 'pending';
        return {
          ...o,
          status: isCurrentlyPending ? 'completed' : 'pending',
          completedAt: isCurrentlyPending ? Date.now() : null
        };
      }
      return o;
    }));
  };

  const openAddOrder = () => {
    setModalOrder(null);
    setShowOrderModal(true);
  };

  const openEditOrder = (order) => {
    setModalOrder(order);
    setShowOrderModal(true);
  };

  const saveOrder = (orderData) => {
    if (modalOrder) {
      setOrders(prev => prev.map(o => o.id === modalOrder.id ? orderData : o));
    } else {
      setOrders(prev => [orderData, ...prev]);
    }
    setShowOrderModal(false);
  };

  const deleteOrder = (orderId) => {
    const target = orders.find(o => o.id === orderId);
    if (target && window.confirm(`Hapus catatan order toko "${target.storeName}"?`)) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setShowOrderModal(false);
    }
  };

  // Modals & States
  const [isEditMode, setIsEditMode] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalItem, setModalItem] = useState(null); 
  const [discountItem, setDiscountItem] = useState(null);

  // Form State untuk CRUD Item
  const [formData, setFormData] = useState({ 
    pn: '', 
    description: '', 
    price: '', 
    qty: '1', 
    category: 'Busi' 
  });

  // Kunci scroll halaman belakang saat modal/sheet terbuka
  useEffect(() => {
    if (discountItem || showCategorySheet || showItemModal || showStoreModal || showRouteSheet || showOrderModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [discountItem, showCategorySheet, showItemModal, showStoreModal, showRouteSheet, showOrderModal]);

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

  // Daftar Kode Rute & Hitung jumlah toko per rute
  const { routesList, routeCounts } = useMemo(() => {
    const counts = { 'Semua': stores.length };
    stores.forEach(s => {
      const route = s.routeCode?.trim() || 'TANPA RUTE';
      counts[route] = (counts[route] || 0) + 1;
    });
    const unique = Object.keys(counts).filter(r => r !== 'Semua').sort();
    return {
      routesList: ['Semua', ...unique],
      routeCounts: counts
    };
  }, [stores]);

  // Filter toko berdasarkan Kode Rute dan Search Query
  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      if (selectedRoute !== 'Semua') {
        const storeRoute = store.routeCode?.trim() || 'TANPA RUTE';
        if (storeRoute !== selectedRoute) return false;
      }
      if (storeSearchQuery.trim()) {
        const q = storeSearchQuery.toLowerCase().trim();
        const matchName = store.name?.toLowerCase().includes(q);
        const matchRoute = store.routeCode?.toLowerCase().includes(q);
        const matchOwner = store.owner?.toLowerCase().includes(q);
        const matchAddress = store.address?.toLowerCase().includes(q);
        if (!matchName && !matchRoute && !matchOwner && !matchAddress) {
          return false;
        }
      }
      return true;
    });
  }, [stores, selectedRoute, storeSearchQuery]);

  // CRUD Toko Handlers
  const openAddStore = () => {
    const firstRoute = routesList.find(r => r !== 'Semua') || 'R01 - BOGOR KOTA';
    setStoreFormData({
      name: '',
      routeCode: selectedRoute !== 'Semua' ? selectedRoute : firstRoute,
      owner: '',
      address: '',
      lat: '',
      lng: '',
      notes: ''
    });
    setModalStore(null);
    setShowStoreModal(true);
  };

  const openEditStore = (store) => {
    setStoreFormData({
      name: store.name || '',
      routeCode: store.routeCode || '',
      owner: store.owner || '',
      address: store.address || '',
      lat: store.lat !== undefined && store.lat !== null ? String(store.lat) : '',
      lng: store.lng !== undefined && store.lng !== null ? String(store.lng) : '',
      notes: store.notes || ''
    });
    setModalStore(store);
    setShowStoreModal(true);
  };

  const saveStore = (e) => {
    e.preventDefault();
    if (!storeFormData.name.trim() || !storeFormData.routeCode.trim()) return;

    const latVal = storeFormData.lat ? parseFloat(storeFormData.lat) : null;
    const lngVal = storeFormData.lng ? parseFloat(storeFormData.lng) : null;

    const storeToSave = {
      id: modalStore ? modalStore.id : `store_${Date.now()}`,
      name: storeFormData.name.trim(),
      routeCode: storeFormData.routeCode.trim().toUpperCase(),
      owner: storeFormData.owner.trim(),
      address: storeFormData.address.trim(),
      lat: isNaN(latVal) ? null : latVal,
      lng: isNaN(lngVal) ? null : lngVal,
      notes: storeFormData.notes.trim()
    };

    if (modalStore) {
      setStores(prev => prev.map(s => s.id === modalStore.id ? storeToSave : s));
    } else {
      setStores(prev => [storeToSave, ...prev]);
    }
    setShowStoreModal(false);
  };

  const deleteStore = (storeToDelete) => {
    const target = storeToDelete || modalStore;
    if (!target) return;
    if (window.confirm(`Hapus data toko ini secara permanen?\n\nNama: ${target.name}\nRute: ${target.routeCode}`)) {
      setStores(prev => prev.filter(s => s.id !== target.id));
      setShowStoreModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-28 font-sans text-zinc-900 selection:bg-zinc-200">
      
      {/* Top Header */}
      <Header 
        activeTab={activeTab} 
        isEditMode={isEditMode} 
        setIsEditMode={setIsEditMode} 
        isStoreEditMode={isStoreEditMode}
        setIsStoreEditMode={setIsStoreEditMode}
        selectedMonthKey={selectedMonthKey}
        setSelectedMonthKey={setSelectedMonthKey}
        availableMonths={availableMonths}
        currentMonthKey={currentMonthKey}
      />

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-5 pt-4 relative">
        {activeTab === 'home' && (
          <HomeTab 
            cartCount={pendingOrdersCount}
            itemsCount={items.length}
            categoriesCount={CATEGORIES.length - 1}
            storesCount={stores.length}
            routesCount={routesList.length - 1}
            onOpenDraft={() => setActiveTab('draft')}
            onOpenPricelist={() => setActiveTab('pricelist')}
            onOpenStores={() => setActiveTab('stores')}
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

        {activeTab === 'stores' && (
          <StoresTab 
            stores={stores}
            filteredStores={filteredStores}
            searchQuery={storeSearchQuery}
            setSearchQuery={setStoreSearchQuery}
            selectedRoute={selectedRoute}
            setSelectedRoute={setSelectedRoute}
            routeCounts={routeCounts}
            onOpenRouteSheet={() => setShowRouteSheet(true)}
            isEditMode={isStoreEditMode}
            onOpenAddModal={openAddStore}
            onOpenEditModal={openEditStore}
            onDeleteStore={deleteStore}
          />
        )}

        {activeTab === 'draft' && (
          <DraftTab 
            orders={orders}
            onToggleOrderStatus={toggleOrderStatus}
            onOpenAddOrder={openAddOrder}
            onOpenEditOrder={openEditOrder}
            onDeleteOrder={deleteOrder}
            selectedMonthKey={selectedMonthKey}
            setSelectedMonthKey={setSelectedMonthKey}
            currentMonthKey={currentMonthKey}
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

      {/* CRUD Store Modal */}
      <StoreModal 
        isOpen={showStoreModal}
        modalStore={modalStore}
        formData={storeFormData}
        setFormData={setStoreFormData}
        existingRoutes={routesList.filter(r => r !== 'Semua')}
        onSave={saveStore}
        onDelete={deleteStore}
        onClose={() => setShowStoreModal(false)}
      />

      {/* Catat Order Toko Modal */}
      <OrderModal 
        isOpen={showOrderModal}
        modalOrder={modalOrder}
        catalogItems={items}
        stores={stores}
        onSave={saveOrder}
        onDelete={deleteOrder}
        onClose={() => setShowOrderModal(false)}
      />

      {/* Route Picker Bottom Sheet */}
      <RouteSheet 
        isOpen={showRouteSheet}
        selectedRoute={selectedRoute}
        onSelectRoute={setSelectedRoute}
        routesList={routesList}
        routeCounts={routeCounts}
        onClose={() => setShowRouteSheet(false)}
      />

      {/* Bottom Navigation Bar */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        cartCount={pendingOrdersCount} 
      />

    </div>
  );
}

export default App;
