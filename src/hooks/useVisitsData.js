import { useState, useEffect } from 'react';
import { getTodayIso } from '../utils/date';
import { isStoreMatch } from '../utils/visitUtils';

export default function useVisitsData() {
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
    try {
      localStorage.setItem('daytona_visits', JSON.stringify(visits));
    } catch {}
  }, [visits]);

  const [showVisitRecapModal, setShowVisitRecapModal] = useState(false);
  const [recapInitialDateIso, setRecapInitialDateIso] = useState(null);
  const [showWeeklyScheduleModal, setShowWeeklyScheduleModal] = useState(false);

  const openVisitRecap = (dateIso) => {
    setRecapInitialDateIso(dateIso || getTodayIso());
    setShowVisitRecapModal(true);
  };

  const saveDayVisits = ({ dateIso, selectedStores }) => {
    const targetDate = dateIso || getTodayIso();
    const storesArray = Array.isArray(selectedStores) ? selectedStores : [];

    setVisits(prev => {
      const otherDaysVisits = prev.filter(v => v.dateIso !== targetDate);
      const newVisitsForDay = storesArray.map(store => ({
        id: `visit_${targetDate}_${store.id || store.customerId || Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        storeId: store.id || null,
        customerId: store.customerId || '',
        storeName: store.name || store.storeName || '',
        routeCode: store.routeCode || '',
        dateIso: targetDate,
        monthKey: targetDate.substring(0, 7),
        createdAt: Date.now()
      }));
      return [...otherDaysVisits, ...newVisitsForDay];
    });
  };

  const toggleVisitToday = (store) => {
    const todayIso = getTodayIso();
    setVisits(prev => {
      const existingIndex = prev.findIndex(v => v.dateIso === todayIso && isStoreMatch(v, store));
      if (existingIndex >= 0) {
        return prev.filter((_, idx) => idx !== existingIndex);
      }
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
    });
  };

  return {
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
  };
}

