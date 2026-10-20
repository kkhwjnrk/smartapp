import React, { useState, useEffect, useMemo } from 'react';
import initialPricelist from './data/pricelist.json';
import initialStores from './data/stores.json';
import initialOrders from './data/orders.json';
import { ensureValidCategory } from './constants/categories';
import { getCurrentMonthKey, getOrderMonthKey } from './utils/date';

// Layout Components
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import IosInstallPrompt from './components/layout/IosInstallPrompt';

// Tab Views
import HomeTab from './components/home/HomeTab';
import PricelistTab from './components/pricelist/PricelistTab';
import StoresTab from './components/stores/StoresTab';
import DraftTab from './components/draft/DraftTab';
import MoreTab from './components/more/MoreTab';

// Modals & Sheets
import DiscountSheet from './components/pricelist/DiscountSheet';
import CategorySheet from './components/pricelist/CategorySheet';
import ItemModal from './components/pricelist/ItemModal';
import StoreModal from './components/stores/StoreModal';
import RouteSheet from './components/stores/RouteSheet';
import OrderModal from './components/draft/OrderModal';
import VisitRecapModal from './components/stores/VisitRecapModal';
import SadixScheduleModal from './components/stores/SadixScheduleModal';
import { getTodayIso } from './utils/date';
import { isStoreMatch } from './utils/visitUtils';

const PRICELIST_DATA_VERSION = 'v2_568_official_pdf';

const STORES_DATA_VERSION = 'v2_168_stores';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [moreSubView, setMoreSubView] = useState('menu'); // 'menu' | 'visits'

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'more') {
      setMoreSubView('menu');
    }
  };

  // Storage for Pricelist dengan pemeliharaan data tersimpan & normalisasi aman
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('daytona_pricelist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(item => {
            const rawHet = item.het !== undefined && item.het !== null
              ? Number(item.het)
              : (parseFloat(String(item.price || 0).replace(/[^0-9]/g, '')) || 0);
            return {
              ...item,
              het: rawHet,
              d24: item.d24 ?? Math.round(rawHet * 0.76),
              d27: item.d27 ?? Math.round(rawHet * 0.73),
              d29: item.d29 ?? Math.round(rawHet * 0.71),
              price: item.price || (rawHet > 0 ? rawHet.toLocaleString('id-ID') : '0'),
              category: ensureValidCategory(item)
            };
          });
        }
      } catch {}
    }

    // Default ke dataset katalog resmi jika localStorage belum memiliki data
    localStorage.setItem('daytona_pricelist_version', PRICELIST_DATA_VERSION);
    return initialPricelist.map(item => ({
      ...item,
      category: ensureValidCategory(item)
    }));
  });

  useEffect(() => {
    localStorage.setItem('daytona_pricelist', JSON.stringify(items));
    localStorage.setItem('daytona_pricelist_version', PRICELIST_DATA_VERSION);
  }, [items]);

  // Storage for Stores dengan pemeliharaan data tersimpan & normalisasi aman
  const [stores, setStores] = useState(() => {
    const saved = localStorage.getItem('daytona_stores');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
    localStorage.setItem('daytona_stores_version', STORES_DATA_VERSION);
    return initialStores;
  });

  useEffect(() => {
    localStorage.setItem('daytona_stores', JSON.stringify(stores));
    localStorage.setItem('daytona_stores_version', STORES_DATA_VERSION);
  }, [stores]);

  // Stores State
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('Semua');
  const [isStoreEditMode, setIsStoreEditMode] = useState(false);
  const [showRouteSheet, setShowRouteSheet] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [modalStore, setModalStore] = useState(null);
  const [storeFormData, setStoreFormData] = useState({
    customerId: '',
    name: '',
    routeCode: '',
    owner: '',
    address: '',
    lat: '',
    lng: '',
    notes: ''
  });

  // Queries, SubCategories & Discount Tiers State
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Semua');
  const [selectedDiscountTier, setSelectedDiscountTier] = useState('het'); // 'het' | '24' | '27' | '29'
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  // Ganti kategori dengan auto-reset subkategori
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubCategory('Semua');
  };

  // Orders State (Disimpan per toko, terpisah Aktif & Arsip)
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('daytona_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialOrders;
      }
    }
    return initialOrders;
  });

  useEffect(() => {
    localStorage.setItem('daytona_orders', JSON.stringify(orders));
  }, [orders]);

  // Visits State (Tracking Kunjungan Toko: Min 2x/Bulan per Toko, Min 12 Toko/Hari)
  const [visits, setVisits] = useState(() => {
    const saved = localStorage.getItem('daytona_visits');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('daytona_visits', JSON.stringify(visits));
  }, [visits]);

  // Modal Rekap Kunjungan Malam & Jadwal SPV
  const [showVisitRecapModal, setShowVisitRecapModal] = useState(false);
  const [recapInitialDateIso, setRecapInitialDateIso] = useState(null);
  const [showSadixScheduleModal, setShowSadixScheduleModal] = useState(false);

  const openVisitRecap = (dateIso) => {
    setRecapInitialDateIso(dateIso || getTodayIso());
    setShowVisitRecapModal(true);
  };

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

  const openAddOrder = (initialStore = null) => {
    if (initialStore && initialStore.name) {
      setModalOrder({
        storeName: initialStore.name,
        customerId: initialStore.customerId || '',
        routeCode: initialStore.routeCode || ''
      });
    } else {
      setModalOrder(null);
    }
    setShowOrderModal(true);
  };

  const openEditOrder = (order) => {
    setModalOrder(order);
    setShowOrderModal(true);
  };

  const saveOrder = (orderData) => {
    // 1. Simpan atau perbarui catatan order
    if (modalOrder && modalOrder.id) {
      setOrders(prev => prev.map(o => o.id === modalOrder.id ? orderData : o));
    } else {
      setOrders(prev => [orderData, ...prev]);
    }

    // 2. Otomatis sinkronkan rute ke data toko master jika rute diinput
    if (orderData.routeCode?.trim() && (orderData.customerId || orderData.storeName)) {
      setStores(prevStores => {
        let storeUpdated = false;
        const normalizedRoute = orderData.routeCode.trim().toUpperCase();

        const updated = prevStores.map(s => {
          const matchById = orderData.customerId && s.customerId && s.customerId.trim().toLowerCase() === orderData.customerId.trim().toLowerCase();
          const matchByName = orderData.storeName && s.name && s.name.trim().toLowerCase() === orderData.storeName.trim().toLowerCase();

          if (matchById || matchByName) {
            if (s.routeCode?.trim() !== normalizedRoute) {
              storeUpdated = true;
              return {
                ...s,
                routeCode: normalizedRoute
              };
            }
          }
          return s;
        });

        return storeUpdated ? updated : prevStores;
      });
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

  // Simpan rekap kunjungan dari checklist modal malam hari
  const saveDayVisits = ({ dateIso, selectedStores }) => {
    setVisits(prev => {
      const otherDaysVisits = prev.filter(v => v.dateIso !== dateIso);
      const newVisitsForDay = selectedStores.map(store => ({
        id: `visit_${dateIso}_${store.id || store.customerId || Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        storeId: store.id || null,
        customerId: store.customerId || '',
        storeName: store.name,
        routeCode: store.routeCode || '',
        dateIso: dateIso,
        monthKey: dateIso.substring(0, 7),
        createdAt: Date.now()
      }));
      return [...otherDaysVisits, ...newVisitsForDay];
    });
  };

  // Toggle tanda kunjungan toko hari ini dari StoreCard atau Peta
  const toggleVisitToday = (store) => {
    const todayIso = getTodayIso();
    setVisits(prev => {
      const existingIndex = prev.findIndex(v => v.dateIso === todayIso && isStoreMatch(v, store));
      if (existingIndex >= 0) {
        return prev.filter((_, idx) => idx !== existingIndex);
      } else {
        const newVisit = {
          id: `visit_${todayIso}_${store.id || store.customerId || Date.now()}`,
          storeId: store.id || null,
          customerId: store.customerId || '',
          storeName: store.name,
          routeCode: store.routeCode || '',
          dateIso: todayIso,
          monthKey: todayIso.substring(0, 7),
          createdAt: Date.now()
        };
        return [...prev, newVisit];
      }
    });
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

  // Subkategori yang tersedia untuk kategori yang dipilih
  const availableSubCategories = useMemo(() => {
    if (selectedCategory === 'Semua') return [];
    const subs = new Set();
    items.forEach(item => {
      if (item.category === selectedCategory && item.subCategory) {
        subs.add(item.subCategory);
      }
    });
    return Array.from(subs);
  }, [items, selectedCategory]);

  // Filter items berdasarkan Kategori, Subkategori, dan Smart Multi-token Search
  const filteredItems = useMemo(() => {
    const queryTokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

    return items.filter(item => {
      if (selectedCategory !== 'Semua' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedSubCategory !== 'Semua' && item.subCategory !== selectedSubCategory) {
        return false;
      }
      if (queryTokens.length > 0) {
        const combined = `${item.pn} ${item.description} ${item.category || ''} ${item.subCategory || ''}`.toLowerCase();
        const allMatch = queryTokens.every(token => combined.includes(token));
        if (!allMatch) return false;
      }
      return true;
    });
  }, [items, selectedCategory, selectedSubCategory, query]);

  // CRUD Logic
  const openAddModal = () => {
    setFormData({
      pn: '',
      description: '',
      price: '',
      qty: '1',
      category: selectedCategory !== 'Semua' ? selectedCategory : 'Busi',
      subCategory: ''
    });
    setModalItem(null);
    setShowItemModal(true);
  };

  const openEditModal = (item) => {
    setFormData({
      ...item,
      category: item.category || 'Busi',
      subCategory: item.subCategory || ''
    });
    setModalItem(item);
    setShowItemModal(true);
  };

  const saveItem = (e) => {
    e.preventDefault();
    if (!formData.pn.trim() || !formData.description.trim()) return;

    // Normalisasi harga HET dan hitung diskon resmi otomatis
    const rawNumeric = parseFloat(String(formData.price).replace(/[^0-9]/g, '')) || 0;
    const formattedPrice = rawNumeric > 0 ? rawNumeric.toLocaleString('id-ID') : (formData.price || '0');

    const itemToSave = {
      ...formData,
      pn: formData.pn.trim(),
      description: formData.description.trim(),
      price: formattedPrice,
      het: rawNumeric,
      d24: Math.round(rawNumeric * 0.76),
      d27: Math.round(rawNumeric * 0.73),
      d29: Math.round(rawNumeric * 0.71),
      qty: String(formData.qty || '1'),
      category: formData.category || 'Busi',
      subCategory: formData.subCategory || modalItem?.subCategory || ''
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

  // Filter toko berdasarkan Kode Rute dan Smart Multi-token Search (Customer ID, Nama, Rute, Alamat, PIC)
  const filteredStores = useMemo(() => {
    const queryTokens = storeSearchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    return stores.filter(store => {
      if (selectedRoute !== 'Semua') {
        const storeRoute = store.routeCode?.trim() || 'TANPA RUTE';
        if (storeRoute !== selectedRoute) return false;
      }
      if (queryTokens.length > 0) {
        const combined = `${store.customerId || ''} ${store.name || ''} ${store.routeCode || ''} ${store.owner || ''} ${store.address || ''} ${store.notes || ''}`.toLowerCase();
        const allMatch = queryTokens.every(token => combined.includes(token));
        if (!allMatch) return false;
      }
      return true;
    });
  }, [stores, selectedRoute, storeSearchQuery]);

  // CRUD Toko Handlers
  const openAddStore = () => {
    setStoreFormData({
      customerId: '',
      name: '',
      routeCode: selectedRoute !== 'Semua' && selectedRoute !== 'TANPA RUTE' ? selectedRoute : '',
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
      customerId: store.customerId || '',
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
    if (!storeFormData.name.trim()) return;

    const latVal = storeFormData.lat ? parseFloat(storeFormData.lat) : null;
    const lngVal = storeFormData.lng ? parseFloat(storeFormData.lng) : null;

    const storeToSave = {
      id: modalStore ? modalStore.id : `store_${Date.now()}`,
      customerId: storeFormData.customerId.trim().toUpperCase(),
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
        onOpenAddOrder={openAddOrder}
      />

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-5 pt-4 relative">
        {activeTab === 'home' && (
          <HomeTab
            orders={orders}
            stores={stores}
            items={items}
            routesList={routesList}
            routeCounts={routeCounts}
            onOpenDraft={() => setActiveTab('draft')}
            onOpenPricelist={(category, queryText) => {
              if (category) setSelectedCategory(category);
              if (queryText !== undefined) setQuery(queryText);
              setActiveTab('pricelist');
            }}
            onOpenStores={(routeFilter, searchFilter) => {
              if (routeFilter) setSelectedRoute(routeFilter);
              if (searchFilter !== undefined) setStoreSearchQuery(searchFilter);
              setActiveTab('stores');
            }}
            onOpenAddOrder={openAddOrder}
            onOpenEditOrder={openEditOrder}
            onOpenCategories={() => {
              setActiveTab('pricelist');
              setShowCategorySheet(true);
            }}
            onOpenMore={() => setActiveTab('more')}
            visits={visits}
            onOpenVisitRecap={() => openVisitRecap(getTodayIso())}
            onOpenSadixSchedule={() => setShowSadixScheduleModal(true)}
            onOpenVisitsPage={() => {
              setActiveTab('more');
              setMoreSubView('visits');
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
            setSelectedCategory={handleSelectCategory}
            selectedSubCategory={selectedSubCategory}
            setSelectedSubCategory={setSelectedSubCategory}
            availableSubCategories={availableSubCategories}
            selectedDiscountTier={selectedDiscountTier}
            setSelectedDiscountTier={setSelectedDiscountTier}
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
            onOpenAddOrder={openAddOrder}
          />
        )}

        {activeTab === 'draft' && (
          <DraftTab
            orders={orders}
            stores={stores}
            catalogItems={items}
            onToggleOrderStatus={toggleOrderStatus}
            onOpenAddOrder={openAddOrder}
            onOpenEditOrder={openEditOrder}
            onDeleteOrder={deleteOrder}
            selectedMonthKey={selectedMonthKey}
            currentMonthKey={currentMonthKey}
          />
        )}

        {activeTab === 'more' && (
          <MoreTab
            orders={orders}
            setOrders={setOrders}
            stores={stores}
            setStores={setStores}
            items={items}
            visits={visits}
            setVisits={setVisits}
            routesList={routesList}
            onOpenVisitRecap={openVisitRecap}
            onOpenSadixSchedule={() => setShowSadixScheduleModal(true)}
            onToggleVisitToday={toggleVisitToday}
            subView={moreSubView}
            setSubView={setMoreSubView}
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
      {showOrderModal && (
        <OrderModal
          key={modalOrder?.id || 'new-order'}
          isOpen={showOrderModal}
          modalOrder={modalOrder}
          catalogItems={items}
          stores={stores}
          onSave={saveOrder}
          onDelete={deleteOrder}
          onClose={() => setShowOrderModal(false)}
        />
      )}

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
        setActiveTab={handleTabChange}
        cartCount={pendingOrdersCount}
      />

      {/* Modal Rekap Kunjungan Harian Malam Hari */}
      {showVisitRecapModal && (
        <VisitRecapModal
          key={recapInitialDateIso || 'today'}
          isOpen={showVisitRecapModal}
          initialDateIso={recapInitialDateIso}
          onClose={() => {
            setShowVisitRecapModal(false);
            setRecapInitialDateIso(null);
          }}
          stores={stores}
          visits={visits}
          onSaveDayVisits={saveDayVisits}
          routesList={routesList}
        />
      )}

      {/* Modal Perencana Jadwal Kunjungan (SPV) */}
      {showSadixScheduleModal && (
        <SadixScheduleModal
          isOpen={showSadixScheduleModal}
          onClose={() => setShowSadixScheduleModal(false)}
          stores={stores}
          visits={visits}
          routesList={routesList}
        />
      )}

      {/* iOS Home Screen Install Helper Banner */}
      <IosInstallPrompt />

    </div>
  );
}

export default App;
