// Helper kalkulasi diskon grosir dari string harga Indonesia (e.g. "18.204")
export const calculateDiscount = (priceStr, percentage) => {
  if (!priceStr || priceStr === "0") return "-";
  const numericPrice = parseFloat(priceStr.replace(/\./g, '').replace(/,/g, ''));
  if (isNaN(numericPrice)) return "-";
  
  const discounted = numericPrice * (1 - (percentage / 100));
  return Math.round(discounted).toLocaleString('id-ID').replace(/,/g, '.');
};

/**
 * Format string untuk salin "[ID Customer] [Nama toko]"
 * Contoh: "C 3780 Matic Power"
 */
export const formatStoreCustomerHeader = (order, stores = []) => {
  if (!order) return '';

  let customerId = (order.customerId || '').trim();
  const rawStoreName = (order.storeName || '').trim();

  // Jika order belum memiliki customerId, cari di daftar stores
  if (!customerId && stores.length > 0 && rawStoreName) {
    const cleanOrderName = rawStoreName.toLowerCase();

    // 1. Coba pencocokan langsung
    let matched = stores.find(s => s.name?.toLowerCase().trim() === cleanOrderName);

    // 2. Coba pencocokan tanpa kurung awal/akhir
    if (!matched) {
      const strippedOrder = cleanOrderName
        .replace(/^\s*\([^)]*\)\s*/g, '')
        .replace(/\s*\([^)]*\)\s*$/g, '')
        .trim();

      matched = stores.find(s => {
        const sName = (s.name || '').toLowerCase().trim();
        const strippedStore = sName
          .replace(/^\s*\([^)]*\)\s*/g, '')
          .replace(/\s*\([^)]*\)\s*$/g, '')
          .trim();

        return (
          sName === cleanOrderName ||
          (strippedStore && strippedOrder && (
            strippedStore === strippedOrder ||
            strippedStore.includes(strippedOrder) ||
            strippedOrder.includes(strippedStore)
          ))
        );
      });
    }

    if (matched && matched.customerId) {
      customerId = matched.customerId.trim();
    }
  }

  // Bersihkan prefix kode singkatan kurung di awal jika ada, contoh: "(MP) Matic Power" -> "Matic Power"
  const cleanDisplayName = rawStoreName.replace(/^\s*\([^)]*\)\s*/g, '').trim();
  const storeDisplay = cleanDisplayName || rawStoreName;

  if (customerId) {
    return `${customerId} ${storeDisplay}`;
  }
  return storeDisplay;
};

