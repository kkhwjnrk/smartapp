import initialPricelist from '../data/pricelist.json';

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
 * Kriteria diskon dihitung dari nominal setelah diskon (bukan dari HET):
 * - Setiap 1 pcs item dihitung dengan diskon 24% terlebih dahulu dikali jumlah pcs
 * - Jika total nominal <= Rp 3.000.000 => Diskon tetap 24%
 * - Jika total nominal tembus > Rp 3.000.000 s/d < Rp 10.000.000 => Naik diskon 27%
 * - Jika total nominal tembus >= Rp 10.000.000 => Naik diskon 29%
 */
export const calculateOrderSummary = (orderItems = [], catalogItems = []) => {
  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    return {
      totalHet: 0,
      totalNet: 0,
      totalQty: 0,
      discountPercentage: 24,
      daytonaGroupNet: 0,
      osramNet: 0,
      formattedText: 'Rp 0 (24%)'
    };
  }

  const activeCatalog = (Array.isArray(catalogItems) && catalogItems.length > 0)
    ? catalogItems
    : initialPricelist;

  const catalogMap = new Map();
  activeCatalog.forEach(item => {
    if (item && item.pn) {
      catalogMap.set(String(item.pn).trim().toLowerCase(), item);
    }
  });

  let totalHet = 0;
  let totalQty = 0;

  // Resolusi data item & tandai grup brand (Daytona + Dura = 1 grup diskon, Osram = mandiri)
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

    const brand = String(orderItem.brand || catalogItem?.brand || 'daytona').toLowerCase();
    const isDaytonaGroup = brand === 'daytona' || brand === 'dura';

    totalHet += het * qty;
    return { catalogItem, orderItem, qty, het, brand, isDaytonaGroup };
  });

  // 1. Hitung total dasar Daytona + Dura dengan diskon 24% terlebih dahulu
  let totalNet24DaytonaGroup = 0;
  resolvedItems.filter(i => i.isDaytonaGroup).forEach(({ catalogItem, qty, het }) => {
    let price24 = 0;
    if (catalogItem && catalogItem.d24) {
      price24 = catalogItem.d24;
    } else {
      price24 = Math.round(het * (1 - 0.24));
    }
    totalNet24DaytonaGroup += price24 * qty;
  });

  // 2. Tentukan persentase diskon gabungan Daytona + Dura berdasarkan nominal akumulasi:
  // <= 3 juta diskon 24%
  // > 3 juta s/d < 10 juta diskon 27%
  // >= 10 juta diskon 29%
  let discountPercentage = 24;
  if (totalNet24DaytonaGroup >= 10000000) {
    discountPercentage = 29;
  } else if (totalNet24DaytonaGroup > 3000000) {
    discountPercentage = 27;
  } else {
    discountPercentage = 24;
  }

  // 3. Hitung Total Net Daytona Group dengan tier diskon gabungan
  let daytonaGroupNet = 0;
  if (discountPercentage === 24) {
    daytonaGroupNet = totalNet24DaytonaGroup;
  } else {
    resolvedItems.filter(i => i.isDaytonaGroup).forEach(({ catalogItem, qty, het }) => {
      let itemNetPrice = 0;
      if (catalogItem) {
        if (discountPercentage === 27 && catalogItem.d27) {
          itemNetPrice = catalogItem.d27;
        } else if (discountPercentage === 29 && catalogItem.d29) {
          itemNetPrice = catalogItem.d29;
        } else {
          itemNetPrice = Math.round(het * (1 - discountPercentage / 100));
        }
      } else {
        itemNetPrice = Math.round(het * (1 - discountPercentage / 100));
      }
      daytonaGroupNet += itemNetPrice * qty;
    });
  }

  // 4. Hitung Total Net Osram dengan Skema Diskon Bertingkat Resmi:
  // < 1jt diskon 35%
  // 1 jt - 3 jt diskon 37%
  // 3 jt - 10 jt diskon 40%
  // > 10 jt diskon 41.5%
  const osramItemList = resolvedItems.filter(i => !i.isDaytonaGroup);
  let totalNet35Osram = 0;
  osramItemList.forEach(({ catalogItem, qty, het }) => {
    let price35 = 0;
    if (catalogItem && catalogItem.d35) {
      price35 = catalogItem.d35;
    } else {
      price35 = Math.round(het * (1 - 0.35));
    }
    totalNet35Osram += price35 * qty;
  });

  // Tentukan persentase diskon Osram berdasarkan nominal akumulasi:
  let osramDiscountPercentage = 35;
  if (totalNet35Osram > 10000000) {
    osramDiscountPercentage = 41.5;
  } else if (totalNet35Osram >= 3000000) {
    osramDiscountPercentage = 40;
  } else if (totalNet35Osram >= 1000000) {
    osramDiscountPercentage = 37;
  } else {
    osramDiscountPercentage = 35;
  }

  // Hitung total net akhir Osram sesuai tier yang didapat
  let osramNet = 0;
  if (osramDiscountPercentage === 35) {
    osramNet = totalNet35Osram;
  } else {
    osramItemList.forEach(({ catalogItem, qty, het }) => {
      let itemPrice = 0;
      if (catalogItem) {
        if (osramDiscountPercentage === 37 && catalogItem.d37) {
          itemPrice = catalogItem.d37;
        } else if (osramDiscountPercentage === 40 && catalogItem.d40) {
          itemPrice = catalogItem.d40;
        } else if (osramDiscountPercentage === 41.5 && catalogItem.d41_5) {
          itemPrice = catalogItem.d41_5;
        } else {
          itemPrice = Math.round(het * (1 - osramDiscountPercentage / 100));
        }
      } else {
        itemPrice = Math.round(het * (1 - osramDiscountPercentage / 100));
      }
      osramNet += itemPrice * qty;
    });
  }

  const totalNet = daytonaGroupNet + osramNet;
  const hasDaytonaGroup = resolvedItems.some(i => i.isDaytonaGroup);
  const hasOsram = osramItemList.length > 0;

  let formattedText = `Rp ${Math.round(totalNet).toLocaleString('id-ID')}`;
  if (hasDaytonaGroup && !hasOsram) {
    formattedText = `Rp ${Math.round(totalNet).toLocaleString('id-ID')} (${discountPercentage}%)`;
  } else if (!hasDaytonaGroup && hasOsram) {
    formattedText = `Rp ${Math.round(totalNet).toLocaleString('id-ID')} (${osramDiscountPercentage}%)`;
  } else if (hasDaytonaGroup && hasOsram) {
    formattedText = `Rp ${Math.round(totalNet).toLocaleString('id-ID')} (Daytona ${discountPercentage}% · Osram ${osramDiscountPercentage}%)`;
  }

  return {
    totalHet,
    totalNet,
    totalQty,
    discountPercentage,
    daytonaGroupNet,
    osramNet,
    osramDiscountPercentage,
    formattedText
  };
};

/**
 * Komparator pengurutan item katalog berdasarkan Part Number terkecil ke terbesar (natural/numeric ascending).
 */
export const comparePartNumbers = (a, b) => {
  const numA = parseInt(String(a?.pn || '').replace(/[^0-9]/g, ''), 10);
  const numB = parseInt(String(b?.pn || '').replace(/[^0-9]/g, ''), 10);
  if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
    return numA - numB;
  }
  return String(a?.pn || '').localeCompare(String(b?.pn || ''), undefined, { numeric: true, sensitivity: 'base' });
};

