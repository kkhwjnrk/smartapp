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

/**
 * Kalkulasi pintar total nominal order dengan penentuan skema diskon otomatis:
 * Kriteria diskon dari total HET:
 * - < Rp 3.000.000  => 24%
 * - Rp 3.000.000 s/d Rp 10.000.000 => 27%
 * - > Rp 10.000.000 => 29%
 */
export const calculateOrderSummary = (orderItems = [], catalogItems = []) => {
  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return {
      totalHet: 0,
      totalNet: 0,
      totalQty: 0,
      discountPercentage: 24,
      formattedText: 'Rp 0 (24%)'
    };
  }

  const catalogMap = new Map();
  if (Array.isArray(catalogItems)) {
    catalogItems.forEach(item => {
      if (item && item.pn) {
        catalogMap.set(String(item.pn).trim().toLowerCase(), item);
      }
    });
  }

  // 1. Hitung total HET kotor
  let totalHet = 0;
  let totalQty = 0;

  const resolvedItems = orderItems.map(orderItem => {
    const pnKey = String(orderItem.pn || '').trim().toLowerCase();
    const catalogItem = catalogMap.get(pnKey);
    const qty = Math.max(0, parseInt(orderItem.qty, 10) || 0);
    totalQty += qty;

    let het = 0;
    if (catalogItem) {
      if (typeof catalogItem.het === 'number') {
        het = catalogItem.het;
      } else if (catalogItem.price) {
        const cleanPrice = String(catalogItem.price).replace(/\./g, '').replace(/,/g, '');
        het = parseFloat(cleanPrice) || 0;
      }
    } else if (orderItem.het) {
      het = typeof orderItem.het === 'number'
        ? orderItem.het
        : parseFloat(String(orderItem.het).replace(/\./g, '')) || 0;
    }

    totalHet += het * qty;
    return { catalogItem, qty, het };
  });

  // 2. Tentukan Persentase Diskon Pintar
  let discountPercentage = 24;
  if (totalHet > 10000000) {
    discountPercentage = 29;
  } else if (totalHet >= 3000000) {
    discountPercentage = 27;
  } else {
    discountPercentage = 24;
  }

  // 3. Hitung Total Net Bersih
  let totalNet = 0;
  resolvedItems.forEach(({ catalogItem, qty, het }) => {
    let itemNetPrice = 0;
    if (catalogItem) {
      if (discountPercentage === 24 && catalogItem.d24) {
        itemNetPrice = catalogItem.d24;
      } else if (discountPercentage === 27 && catalogItem.d27) {
        itemNetPrice = catalogItem.d27;
      } else if (discountPercentage === 29 && catalogItem.d29) {
        itemNetPrice = catalogItem.d29;
      } else {
        itemNetPrice = Math.round(het * (1 - discountPercentage / 100));
      }
    } else {
      itemNetPrice = Math.round(het * (1 - discountPercentage / 100));
    }
    totalNet += itemNetPrice * qty;
  });

  return {
    totalHet,
    totalNet,
    totalQty,
    discountPercentage,
    formattedText: `Rp ${Math.round(totalNet).toLocaleString('id-ID')} (${discountPercentage}%)`
  };
};

