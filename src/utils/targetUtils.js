import { getOrderMonthKey } from './date';
import { calculateOrderSummary } from './formatters';

export const DEFAULT_DAYTONA_TARGET = 50000000; // Rp 50.000.000
export const DEFAULT_OSRAM_TARGET = 25000000;   // Rp 25.000.000

export const DAYTONA_TARGET_KEY = 'daytona_order_target_nominal';
export const OSRAM_TARGET_KEY = 'osram_order_target_nominal';

export const DAYTONA_PRESETS = [
  { label: '25 Jt', value: 25000000 },
  { label: '50 Jt', value: 50000000 },
  { label: '75 Jt', value: 75000000 },
  { label: '100 Jt', value: 100000000 },
  { label: '150 Jt', value: 150000000 }
];

export const OSRAM_PRESETS = [
  { label: '10 Jt', value: 10000000 },
  { label: '20 Jt', value: 20000000 },
  { label: '30 Jt', value: 30000000 },
  { label: '50 Jt', value: 50000000 },
  { label: '75 Jt', value: 75000000 }
];

/**
 * Ambil nilai target nominal brand dari localStorage
 */
export function getStoredBrandTarget(brand = 'daytona') {
  const isOsram = brand === 'osram';
  const key = isOsram ? OSRAM_TARGET_KEY : DAYTONA_TARGET_KEY;
  const fallback = isOsram ? DEFAULT_OSRAM_TARGET : DEFAULT_DAYTONA_TARGET;

  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {}
  return fallback;
}

/**
 * Simpan nilai target nominal brand ke localStorage
 */
export function saveStoredBrandTarget(brand = 'daytona', value) {
  const isOsram = brand === 'osram';
  const key = isOsram ? OSRAM_TARGET_KEY : DAYTONA_TARGET_KEY;
  const cleanNum = parseInt(String(value).replace(/\D/g, ''), 10);

  if (!isNaN(cleanNum) && cleanNum > 0) {
    try {
      localStorage.setItem(key, String(cleanNum));
    } catch {}
    return cleanNum;
  }
  return null;
}

/**
 * Hitung capaian penjualan untuk Daytona (+ Dura) dan Osram secara terpisah.
 * Hanya menghitung draft order yang SUDAH DISELESAIKAN (status === 'completed')
 * pada bulan yang ditentukan (monthKey).
 */
export function calculateCompletedBrandStats(orders = [], catalogItems = [], monthKey) {
  let daytonaNet = 0;
  let osramNet = 0;
  let daytonaOrdersCount = 0;
  let osramOrdersCount = 0;
  let daytonaPcs = 0;
  let osramPcs = 0;

  orders.forEach(order => {
    if (!order || order.status !== 'completed') return;
    if (monthKey && monthKey !== 'all' && getOrderMonthKey(order) !== monthKey) return;

    const orderBrand = (order.brand || '').toLowerCase();
    const resolvedItems = (order.items || []).map(it => {
      if (!it.brand && orderBrand) {
        return { ...it, brand: orderBrand };
      }
      return it;
    });

    const summary = calculateOrderSummary(resolvedItems, catalogItems);

    if (summary.hasDaytonaGroup || summary.daytonaGroupNet > 0) {
      daytonaNet += summary.daytonaGroupNet || 0;
      daytonaOrdersCount += 1;
      daytonaPcs += summary.daytonaQty || 0;
    }

    if (summary.hasOsram || summary.osramNet > 0) {
      osramNet += summary.osramNet || 0;
      osramOrdersCount += 1;
      osramPcs += summary.osramQty || 0;
    }
  });

  return {
    daytonaNet,
    osramNet,
    daytonaOrdersCount,
    osramOrdersCount,
    daytonaPcs,
    osramPcs
  };
}

/**
 * Hitung metrik progres dari nilai capaian dan nilai target
 */
export function computeTargetProgress(netAmount = 0, targetAmount = 1) {
  const safeTarget = targetAmount > 0 ? targetAmount : 1;
  const percent = Math.round((netAmount / safeTarget) * 100);
  const cappedPercent = Math.min(100, Math.max(0, percent));
  const remaining = Math.max(0, targetAmount - netAmount);
  const surplus = Math.max(0, netAmount - targetAmount);
  const isAchieved = netAmount >= targetAmount;

  return {
    percent,
    cappedPercent,
    remaining,
    surplus,
    isAchieved
  };
}

