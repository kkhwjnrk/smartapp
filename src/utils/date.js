export const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format tanggal ke format lengkap bahasa Indonesia: "11 Oktober 2026"
 */
export function formatFullIndonesianDate(input) {
  if (!input) {
    const now = new Date();
    return `${now.getDate()} ${INDO_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  }

  // Jika input berupa angka timestamp (ms)
  if (typeof input === 'number') {
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      return `${d.getDate()} ${INDO_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
  }

  if (typeof input === 'string') {
    // Sudah dalam format "11 Oktober 2026"
    if (INDO_MONTHS.some(m => input.toLowerCase().includes(m.toLowerCase()))) {
      return input;
    }

    // Format ISO YYYY-MM-DD
    const isoMatch = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const year = isoMatch[1];
      const monthIdx = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${INDO_MONTHS[monthIdx]} ${year}`;
      }
    }

    // Format DD/MM/YYYY atau DD/MM
    const slashMatch = input.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if (slashMatch) {
      const day = parseInt(slashMatch[1], 10);
      const monthIdx = parseInt(slashMatch[2], 10) - 1;
      const year = slashMatch[3] || new Date().getFullYear();
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${INDO_MONTHS[monthIdx]} ${year}`;
      }
    }

    // Date parseable by Date constructor
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getDate()} ${INDO_MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
    }
  }

  return String(input);
}

/**
 * Mengambil tanggal hari ini format ISO YYYY-MM-DD untuk input HTML date
 */
export function getTodayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format month key "YYYY-MM" (contoh: "2026-10")
 */
export function getCurrentMonthKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Format monthKey "2026-10" ke tampilan "Oktober 2026"
 */
export function formatMonthKeyDisplay(monthKey) {
  if (!monthKey) return '';
  const parts = monthKey.split('-');
  if (parts.length === 2) {
    const y = parts[0];
    const mIdx = parseInt(parts[1], 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${INDO_MONTHS[mIdx]} ${y}`;
    }
  }
  return monthKey;
}

/**
 * Mengambil bulan sebelumnya dari "YYYY-MM"
 */
export function getPreviousMonthKey(monthKey) {
  const [yStr, mStr] = monthKey.split('-');
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10) - 1;
  if (m < 1) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

/**
 * Mengambil bulan berikutnya dari "YYYY-MM"
 */
export function getNextMonthKey(monthKey) {
  const [yStr, mStr] = monthKey.split('-');
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10) + 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

/**
 * Mengambil monthKey ("YYYY-MM") dari sebuah objek order
 */
export function getOrderMonthKey(order) {
  if (order.dateIso) {
    return order.dateIso.slice(0, 7);
  }
  if (order.createdAt) {
    const d = new Date(order.createdAt);
    if (!isNaN(d.getTime())) {
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${d.getFullYear()}-${m}`;
    }
  }
  if (typeof order.date === 'string') {
    // Cek nama bulan dalam teks "11 Oktober 2026"
    const parts = order.date.trim().split(/\s+/);
    if (parts.length >= 3) {
      const mIdx = INDO_MONTHS.findIndex(m => m.toLowerCase() === parts[1].toLowerCase());
      const y = parts[2];
      if (mIdx >= 0 && y) {
        return `${y}-${String(mIdx + 1).padStart(2, '0')}`;
      }
    }
    // Cek format slash "11/10"
    const slashMatch = order.date.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
    if (slashMatch) {
      const monthStr = String(slashMatch[2]).padStart(2, '0');
      const yearStr = slashMatch[3] || new Date().getFullYear();
      return `${yearStr}-${monthStr}`;
    }
  }
  return getCurrentMonthKey();
}
