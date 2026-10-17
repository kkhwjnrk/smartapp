import { formatFullIndonesianDate, getCurrentMonthKey } from './date';

/**
 * Normalisasi ID toko atau Customer ID untuk pencocokan yang akurat
 */
export function isStoreMatch(visit, store) {
  if (!visit || !store) return false;
  if (visit.storeId && store.id && String(visit.storeId) === String(store.id)) {
    return true;
  }
  if (visit.customerId && store.customerId && 
      visit.customerId.trim().toLowerCase() === store.customerId.trim().toLowerCase()) {
    return true;
  }
  if (visit.storeName && store.name && 
      visit.storeName.trim().toLowerCase() === store.name.trim().toLowerCase()) {
    return true;
  }
  return false;
}

/**
 * Mengambil daftar kunjungan untuk toko tertentu pada bulan tertentu
 */
export function getStoreVisitsForMonth(store, visits = [], monthKey = getCurrentMonthKey()) {
  if (!store || !Array.isArray(visits)) return [];
  return visits.filter(v => {
    const isTargetMonth = (v.dateIso && v.dateIso.startsWith(monthKey)) || v.monthKey === monthKey;
    return isTargetMonth && isStoreMatch(v, store);
  }).sort((a, b) => (a.dateIso || '').localeCompare(b.dateIso || ''));
}

/**
 * Mengambil status kunjungan toko pada bulan berjalan (Target minimal 2x)
 */
export function getStoreVisitStatus(count = 0) {
  if (count <= 0) {
    return {
      count: 0,
      label: 'Belum Dikunjungi',
      shortLabel: '0/2 Kunjungan',
      badge: '0/2',
      stage: 'none', // 'none' | 'partial' | 'completed'
      color: 'red',
      bgClass: 'bg-red-50 text-red-700 border-red-200/90',
      dotClass: 'bg-red-500'
    };
  }
  if (count === 1) {
    return {
      count: 1,
      label: 'Baru 1x Dikunjungi',
      shortLabel: '1/2 Kunjungan',
      badge: '1/2',
      stage: 'partial',
      color: 'amber',
      bgClass: 'bg-amber-50 text-amber-800 border-amber-200/90',
      dotClass: 'bg-amber-500'
    };
  }
  return {
    count: count,
    label: count === 2 ? 'Target 2x Selesai' : `${count}x Dikunjungi`,
    shortLabel: `${count}/2 Kunjungan`,
    badge: `${count}/2`,
    stage: 'completed',
    color: 'emerald',
    bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
    dotClass: 'bg-emerald-500'
  };
}

/**
 * Menghitung total kunjungan pada tanggal tertentu (misal: hari ini)
 */
export function getDailyVisitCount(visits = [], dateIso) {
  if (!Array.isArray(visits) || !dateIso) return 0;
  return visits.filter(v => v.dateIso === dateIso).length;
}

/**
 * Menghitung statistik kunjungan bulanan untuk seluruh toko
 */
export function getMonthlyVisitStats(stores = [], visits = [], monthKey = getCurrentMonthKey()) {
  const totalStores = stores.length;
  let completedCount = 0;
  let partialCount = 0;
  let unvisitedCount = 0;

  stores.forEach(store => {
    const storeVisits = getStoreVisitsForMonth(store, visits, monthKey);
    const count = storeVisits.length;
    if (count >= 2) completedCount++;
    else if (count === 1) partialCount++;
    else unvisitedCount++;
  });

  const monthVisits = visits.filter(v => (v.dateIso && v.dateIso.startsWith(monthKey)) || v.monthKey === monthKey);
  const totalVisitsCount = monthVisits.length;
  const targetVisits = totalStores * 2;
  const completionPercent = totalStores > 0 ? Math.round((completedCount / totalStores) * 100) : 0;

  return {
    totalStores,
    completedCount,     // >= 2x
    partialCount,       // 1x
    unvisitedCount,     // 0x
    totalVisitsCount,
    targetVisits,
    completionPercent
  };
}

/**
 * Membuat format teks jadwal kunjungan ringkas: list nama toko dan ID customer
 */
export function generateSadixScheduleText({
  selectedStores = []
}) {
  if (!Array.isArray(selectedStores) || selectedStores.length === 0) {
    return '';
  }

  return selectedStores.map((store, idx) => {
    const cid = store.customerId?.trim() ? ` - ${store.customerId.trim()}` : '';
    return `${idx + 1}. ${store.name}${cid}`;
  }).join('\n');
}
