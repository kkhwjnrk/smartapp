import { useState, useEffect, useMemo } from 'react';
import initialStores from '../data/stores.json';

const STORES_DATA_VERSION = 'v2_168_stores';

export default function useStoresData() {
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
    try {
      localStorage.setItem('daytona_stores_version', STORES_DATA_VERSION);
    } catch {}
    return initialStores;
  });

  useEffect(() => {
    try {
      localStorage.setItem('daytona_stores', JSON.stringify(stores));
      localStorage.setItem('daytona_stores_version', STORES_DATA_VERSION);
    } catch {}
  }, [stores]);

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

  const { routesList, routeCounts } = useMemo(() => {
    const counts = { Semua: stores.length };
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

  const syncStoreRouteFromOrder = (orderData) => {
    if (!orderData.routeCode?.trim() || (!orderData.customerId && !orderData.storeName)) return;

    setStores(prevStores => {
      let storeUpdated = false;
      const normalizedRoute = orderData.routeCode.trim().toUpperCase();

      const updated = prevStores.map(s => {
        const matchById = orderData.customerId && s.customerId && s.customerId.trim().toLowerCase() === orderData.customerId.trim().toLowerCase();
        const matchByName = orderData.storeName && s.name && s.name.trim().toLowerCase() === orderData.storeName.trim().toLowerCase();

        if (matchById || matchByName) {
          if (s.routeCode?.trim() !== normalizedRoute) {
            storeUpdated = true;
            return { ...s, routeCode: normalizedRoute };
          }
        }
        return s;
      });

      return storeUpdated ? updated : prevStores;
    });
  };

  return {
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
  };
}

