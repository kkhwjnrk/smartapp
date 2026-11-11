import React, { useState, useEffect } from 'react';
import { getTodayIso } from './utils/date';
import { getBrandName } from './constants/brands';

// Custom Domain Hooks
import useCatalogData from './hooks/useCatalogData';
import useStoresData from './hooks/useStoresData';
import useOrdersData from './hooks/useOrdersData';
import useVisitsData from './hooks/useVisitsData';

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
import WeeklyScheduleModal from './components/stores/WeeklyScheduleModal';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [moreSubView, setMoreSubView] = useState('menu'); // 'menu' | 'visits'

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'more') {
      setMoreSubView('menu');
    }
  };

  // 1. Katalog Brand (Daytona, Dura, Osram)
  const {
    selectedBrandId,
    setSelectedBrandId,
    currentBrandItems,
    allCatalogItems,
    brandCatalogs,
    brandCounts,
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    handleSelectCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    availableSubCategories,
    selectedDiscountTier,
    setSelectedDiscountTier,
    categoryCounts,
    filteredItems,
    showCategorySheet,
    setShowCategorySheet,
    isEditMode,
    setIsEditMode,
    showItemModal,
    setShowItemModal,
    modalItem,
    discountItem,
    setDiscountItem,
    formData,
    setFormData,
    openAddModal,
    openEditModal,
    saveItem,
    deleteItem
  } = useCatalogData();

  // 2. Data Toko & Rute
  const {
    stores,
    setStores,
    storeSearchQuery,
    setStoreSearchQuery,
    selectedRoute,
    setSelectedRoute,
    isStoreEditMode,
    setIsStoreEditMode,
    showRouteSheet,
    setShowRouteSheet,
    showStoreModal,
    setShowStoreModal,
    modalStore,
    storeFormData,
    setStoreFormData,
    routesList,
    routeCounts,
    filteredStores,
    openAddStore,
    openEditStore,
    saveStore,
    deleteStore,
    syncStoreRouteFromOrder
  } = useStoresData();

  // 3. Catatan Order (Terpisah Daytona vs Osram, Aktif vs Arsip)
  const {
    orders,
    setOrders,
    showOrderModal,
    setShowOrderModal,
    modalOrder,
    currentMonthKey,
    selectedMonthKey,
    setSelectedMonthKey,
    availableMonths,
    pendingOrdersCount,
    toggleOrderStatus,
    openAddOrder,
    openEditOrder,
    saveOrder,
    deleteOrder
  } = useOrdersData({
    allCatalogItems,
    onSyncStoreRoute: syncStoreRouteFromOrder
  });

  // 4. Kunjungan & Jadwal Mingguan
  const {
    visits,
    setVisits,
    showVisitRecapModal,
    setShowVisitRecapModal,
    recapInitialDateIso,
    setRecapInitialDateIso,
    showWeeklyScheduleModal,
    setShowWeeklyScheduleModal,
    openVisitRecap,
    saveDayVisits,
    toggleVisitToday
  } = useVisitsData();

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

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-28 font-sans text-zinc-900 selection:bg-zinc-200">
      <Header
        activeTab={activeTab}
        selectedBrandName={selectedBrandId ? getBrandName(selectedBrandId) : null}
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

      <main className="max-w-md mx-auto px-4 pt-3.5 relative">
        {activeTab === 'home' && (
          <HomeTab
            orders={orders}
            stores={stores}
            items={allCatalogItems}
            routesList={routesList}
            routeCounts={routeCounts}
            onOpenDraft={() => setActiveTab('draft')}
            onOpenPricelist={(category, queryText) => {
              setSelectedBrandId('daytona');
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
              setSelectedBrandId('daytona');
              setActiveTab('pricelist');
              setShowCategorySheet(true);
            }}
            onOpenMore={() => setActiveTab('more')}
            visits={visits}
            onOpenVisitRecap={() => openVisitRecap(getTodayIso())}
            onOpenWeeklySchedule={() => setShowWeeklyScheduleModal(true)}
            onOpenVisitsPage={() => {
              setActiveTab('more');
              setMoreSubView('visits');
            }}
          />
        )}

        {activeTab === 'pricelist' && (
          <PricelistTab
            selectedBrandId={selectedBrandId}
            setSelectedBrandId={setSelectedBrandId}
            brandCounts={brandCounts}
            items={currentBrandItems}
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
            catalogItems={allCatalogItems}
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
            items={allCatalogItems}
            visits={visits}
            setVisits={setVisits}
            routesList={routesList}
            onOpenVisitRecap={openVisitRecap}
            onOpenWeeklySchedule={() => setShowWeeklyScheduleModal(true)}
            onToggleVisitToday={toggleVisitToday}
            subView={moreSubView}
            setSubView={setMoreSubView}
            selectedMonthKey={selectedMonthKey}
            currentMonthKey={currentMonthKey}
          />
        )}
      </main>

      <CategorySheet
        isOpen={showCategorySheet}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
        onClose={() => setShowCategorySheet(false)}
      />

      <DiscountSheet
        item={discountItem}
        onClose={() => setDiscountItem(null)}
      />

      <ItemModal
        isOpen={showItemModal}
        modalItem={modalItem}
        formData={formData}
        setFormData={setFormData}
        currentBrandId={selectedBrandId || 'daytona'}
        onSave={saveItem}
        onDelete={deleteItem}
        onClose={() => setShowItemModal(false)}
      />

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

      {showOrderModal && (
        <OrderModal
          key={modalOrder?.id || 'new-order'}
          isOpen={showOrderModal}
          modalOrder={modalOrder}
          catalogItems={allCatalogItems}
          brandCatalogs={brandCatalogs}
          stores={stores}
          onSave={saveOrder}
          onDelete={deleteOrder}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      <RouteSheet
        isOpen={showRouteSheet}
        selectedRoute={selectedRoute}
        onSelectRoute={setSelectedRoute}
        routesList={routesList}
        routeCounts={routeCounts}
        onClose={() => setShowRouteSheet(false)}
      />

      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        cartCount={pendingOrdersCount}
      />

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

      {showWeeklyScheduleModal && (
        <WeeklyScheduleModal
          isOpen={showWeeklyScheduleModal}
          onClose={() => setShowWeeklyScheduleModal(false)}
          stores={stores}
          visits={visits}
          routesList={routesList}
          onApplyScheduleToDayVisits={({ dateIso, storesList, selectedStores }) => {
            saveDayVisits({
              dateIso: dateIso || getTodayIso(),
              selectedStores: storesList || selectedStores || []
            });
          }}
        />
      )}

      <IosInstallPrompt />
    </div>
  );
}

export default App;
