import { useState, useEffect, useMemo } from 'react';
import initialOrders from '../data/orders.json';
import initialPricelist from '../data/pricelist.json';
import initialDuraPricelist from '../data/duraPricelist.json';
import initialOsramPricelist from '../data/osramPricelist.json';
import { getCurrentMonthKey, getOrderMonthKey } from '../utils/date';
import { groupOrderItemsByBrand } from '../utils/formatters';

export default function useOrdersData({ allCatalogItems = [], onSyncStoreRoute }) {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('daytona_orders');
    let raw = initialOrders;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          raw = parsed;
        }
      } catch {}
    }

    const allCatalog = [...initialPricelist, ...initialDuraPricelist, ...initialOsramPricelist];
    const splitList = [];
    raw.forEach(o => {
      const grouped = groupOrderItemsByBrand(o.items || [], allCatalog);
      if (grouped.hasDaytonaGroup && grouped.hasOsram) {
        splitList.push({
          ...o,
          id: `${o.id}_daytona`,
          brand: 'daytona',
          items: grouped.daytonaGroupItems
        });
        splitList.push({
          ...o,
          id: `${o.id}_osram`,
          brand: 'osram',
          items: grouped.osramItems
        });
      } else {
        splitList.push({
          ...o,
          brand: grouped.hasOsram ? 'osram' : 'daytona'
        });
      }
    });

    return splitList;
  });

  useEffect(() => {
    try {
      localStorage.setItem('daytona_orders', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [modalOrder, setModalOrder] = useState(null);

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

  const pendingOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'pending').length;
  }, [orders]);

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
    const grouped = groupOrderItemsByBrand(orderData.items || [], allCatalogItems);

    if (grouped.hasDaytonaGroup && grouped.hasOsram) {
      const baseId = modalOrder?.id ? String(modalOrder.id).replace(/_(daytona|osram)$/, '') : `order_${Date.now()}`;

      const daytonaOrder = {
        ...orderData,
        id: `${baseId}_daytona`,
        brand: 'daytona',
        items: grouped.daytonaGroupItems
      };

      const osramOrder = {
        ...orderData,
        id: `${baseId}_osram`,
        brand: 'osram',
        items: grouped.osramItems
      };

      setOrders(prev => {
        const withoutOld = modalOrder
          ? prev.filter(o => o.id !== modalOrder.id && o.id !== `${baseId}_daytona` && o.id !== `${baseId}_osram`)
          : prev;
        return [daytonaOrder, osramOrder, ...withoutOld];
      });
    } else {
      const targetBrand = grouped.hasOsram ? 'osram' : 'daytona';
      const orderToSave = {
        ...orderData,
        brand: targetBrand,
        items: orderData.items || []
      };

      if (modalOrder && modalOrder.id) {
        setOrders(prev => prev.map(o => o.id === modalOrder.id ? orderToSave : o));
      } else {
        setOrders(prev => [orderToSave, ...prev]);
      }
    }

    if (onSyncStoreRoute) {
      onSyncStoreRoute(orderData);
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

  return {
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
  };
}

