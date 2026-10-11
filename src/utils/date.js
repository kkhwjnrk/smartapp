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
