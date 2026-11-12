import { useState, useEffect, useMemo } from 'react';
import initialPricelist from '../data/pricelist.json';
import initialDuraPricelist from '../data/duraPricelist.json';
import initialOsramPricelist from '../data/osramPricelist.json';
import { ensureValidCategory } from '../constants/categories';
import { comparePartNumbers } from '../utils/formatters';

const PRICELIST_DATA_VERSION = 'v4_612_official_pdf_names';
const DURA_DATA_VERSION = 'v1_319_official_pdf';
const OSRAM_DATA_VERSION = 'v1_30_official_pdf';

function normalizeCatalogItem(item, brand) {
  const rawHet = item.het !== undefined && item.het !== null
    ? Number(item.het)
    : (parseFloat(String(item.price || 0).replace(/[^0-9]/g, '')) || 0);

  const normalized = {
    ...item,
    brand,
    het: rawHet,
    price: item.price || (rawHet > 0 ? rawHet.toLocaleString('id-ID') : '0'),
    category: ensureValidCategory(item)
  };

  if (brand !== 'osram') {
    normalized.d24 = item.d24 ?? Math.round(rawHet * 0.76);
    normalized.d27 = item.d27 ?? Math.round(rawHet * 0.73);
    normalized.d29 = item.d29 ?? Math.round(rawHet * 0.71);
  }

  return normalized;
}

function loadSyncedCatalog(storageKey, versionKey, currentVersion, initialData, brand) {
  const saved = localStorage.getItem(storageKey);
  const savedVersion = localStorage.getItem(versionKey);

  if (saved && savedVersion === currentVersion) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => normalizeCatalogItem(item, brand)).sort(comparePartNumbers);
      }
    } catch {}
  }

  let merged = initialData.map(item => normalizeCatalogItem(item, brand));
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const officialPns = new Set(initialData.map(x => String(x.pn)));
        const userCustomItems = parsed.filter(x => !officialPns.has(String(x.pn)));
        if (userCustomItems.length > 0) {
          merged = [...merged, ...userCustomItems.map(item => normalizeCatalogItem(item, brand))];
        }
      }
    } catch {}
  }

  try {
    localStorage.setItem(versionKey, currentVersion);
    localStorage.setItem(storageKey, JSON.stringify(merged));
  } catch {}

  return merged.sort(comparePartNumbers);
}

export default function useCatalogData() {
  const [selectedBrandId, setSelectedBrandId] = useState(null); // null = Brand Hub; 'daytona' | 'dura' | 'osram'

  const [daytonaItems, setDaytonaItems] = useState(() =>
    loadSyncedCatalog('daytona_pricelist', 'daytona_pricelist_version', PRICELIST_DATA_VERSION, initialPricelist, 'daytona')
  );

  const [duraItems, setDuraItems] = useState(() =>
    loadSyncedCatalog('dura_pricelist', 'dura_pricelist_version', DURA_DATA_VERSION, initialDuraPricelist, 'dura')
  );

  const [osramItems, setOsramItems] = useState(() =>
    loadSyncedCatalog('osram_pricelist', 'osram_pricelist_version', OSRAM_DATA_VERSION, initialOsramPricelist, 'osram')
  );

  useEffect(() => {
    try {
      localStorage.setItem('daytona_pricelist', JSON.stringify(daytonaItems));
      localStorage.setItem('daytona_pricelist_version', PRICELIST_DATA_VERSION);
    } catch {}
  }, [daytonaItems]);

  useEffect(() => {
    try {
      localStorage.setItem('dura_pricelist', JSON.stringify(duraItems));
      localStorage.setItem('dura_pricelist_version', DURA_DATA_VERSION);
    } catch {}
  }, [duraItems]);

  useEffect(() => {
    try {
      localStorage.setItem('osram_pricelist', JSON.stringify(osramItems));
      localStorage.setItem('osram_pricelist_version', OSRAM_DATA_VERSION);
    } catch {}
  }, [osramItems]);

  // Filter & Search States
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Semua');
  const [selectedDiscountTier, setSelectedDiscountTier] = useState('het');
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  // Modal & Edit States
  const [isEditMode, setIsEditMode] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [discountItem, setDiscountItem] = useState(null);
  const [formData, setFormData] = useState({
    pn: '',
    description: '',
    price: '',
    qty: '1',
    category: 'Busi'
  });

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubCategory('Semua');
  };

  const currentBrandItems = useMemo(() => {
    if (selectedBrandId === 'dura') return duraItems;
    if (selectedBrandId === 'osram') return osramItems;
    return daytonaItems;
  }, [selectedBrandId, daytonaItems, duraItems, osramItems]);

  const allCatalogItems = useMemo(() => {
    return [...daytonaItems, ...duraItems, ...osramItems];
  }, [daytonaItems, duraItems, osramItems]);

  const brandCatalogs = useMemo(() => ({
    daytona: daytonaItems,
    dura: duraItems,
    osram: osramItems
  }), [daytonaItems, duraItems, osramItems]);

  const brandCounts = useMemo(() => ({
    daytona: daytonaItems.length,
    dura: duraItems.length,
    osram: osramItems.length
  }), [daytonaItems.length, duraItems.length, osramItems.length]);

  const categoryCounts = useMemo(() => {
    const counts = { Semua: currentBrandItems.length };
    currentBrandItems.forEach(item => {
      const cat = item.category || 'Lainnya';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [currentBrandItems]);

  const availableSubCategories = useMemo(() => {
    if (selectedCategory === 'Semua') return [];
    const subs = new Set();
    currentBrandItems.forEach(item => {
      if (item.category === selectedCategory && item.subCategory) {
        subs.add(item.subCategory);
      }
    });
    return Array.from(subs);
  }, [currentBrandItems, selectedCategory]);

  const filteredItems = useMemo(() => {
    const queryTokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

    return currentBrandItems.filter(item => {
      if (selectedCategory !== 'Semua' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedSubCategory !== 'Semua' && item.subCategory !== selectedSubCategory) {
        return false;
      }
      if (queryTokens.length > 0) {
        const combined = `${item.pn} ${item.description} ${item.category || ''} ${item.subCategory || ''}`.toLowerCase();
        const allMatch = queryTokens.every(token => combined.includes(token));
        if (!allMatch) return false;
      }
      return true;
    }).sort(comparePartNumbers);
  }, [currentBrandItems, selectedCategory, selectedSubCategory, query]);

  const openAddModal = () => {
    setFormData({
      pn: '',
      description: '',
      price: '',
      qty: '1',
      brand: selectedBrandId || 'daytona',
      category: selectedCategory !== 'Semua' ? selectedCategory : 'Busi',
      subCategory: ''
    });
    setModalItem(null);
    setShowItemModal(true);
  };

  const openEditModal = (item) => {
    setFormData({
      ...item,
      brand: item.brand || selectedBrandId || 'daytona',
      category: item.category || 'Busi',
      subCategory: item.subCategory || ''
    });
    setModalItem(item);
    setShowItemModal(true);
  };

  const saveItem = (e) => {
    e.preventDefault();
    if (!formData.pn.trim() || !formData.description.trim()) return;

    const rawNumeric = parseFloat(String(formData.price).replace(/[^0-9]/g, '')) || 0;
    const formattedPrice = rawNumeric > 0 ? rawNumeric.toLocaleString('id-ID') : (formData.price || '0');
    const targetBrand = modalItem?.brand || formData.brand || selectedBrandId || 'daytona';

    const itemToSave = {
      ...formData,
      brand: targetBrand,
      pn: formData.pn.trim(),
      description: formData.description.trim(),
      price: formattedPrice,
      het: rawNumeric,
      d24: Math.round(rawNumeric * 0.76),
      d27: Math.round(rawNumeric * 0.73),
      d29: Math.round(rawNumeric * 0.71),
      qty: String(formData.qty || '1'),
      category: formData.category || 'Busi',
      subCategory: formData.subCategory || modalItem?.subCategory || ''
    };

    const updateCatalog = (setter, currentList, brandLabel) => {
      if (modalItem) {
        setter(prev => prev.map(i => i.pn === modalItem.pn ? itemToSave : i).sort(comparePartNumbers));
        return true;
      }
      if (currentList.some(i => i.pn === formData.pn.trim())) {
        alert(`Part Number sudah terdaftar di ${brandLabel}!`);
        return false;
      }
      setter(prev => [...prev, itemToSave].sort(comparePartNumbers));
      return true;
    };

    let savedOk = false;
    if (targetBrand === 'dura') {
      savedOk = updateCatalog(setDuraItems, duraItems, 'Dura');
    } else if (targetBrand === 'osram') {
      savedOk = updateCatalog(setOsramItems, osramItems, 'Osram');
    } else {
      savedOk = updateCatalog(setDaytonaItems, daytonaItems, 'Daytona');
    }

    if (savedOk) {
      setShowItemModal(false);
    }
  };

  const deleteItem = () => {
    if (!modalItem) return;
    const targetBrand = modalItem.brand || selectedBrandId || 'daytona';
    if (window.confirm(`Hapus barang ini secara permanen?\n\nPN: ${modalItem.pn}\nNama: ${modalItem.description}`)) {
      if (targetBrand === 'dura') {
        setDuraItems(prev => prev.filter(i => i.pn !== modalItem.pn));
      } else if (targetBrand === 'osram') {
        setOsramItems(prev => prev.filter(i => i.pn !== modalItem.pn));
      } else {
        setDaytonaItems(prev => prev.filter(i => i.pn !== modalItem.pn));
      }
      setShowItemModal(false);
    }
  };

  return {
    selectedBrandId,
    setSelectedBrandId,
    currentBrandItems,
    allCatalogItems,
    brandCatalogs,
    brandCounts,
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    handleSelectCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    availableSubCategories,
    selectedDiscountTier,
    setSelectedDiscountTier,
    categoryCounts,
    filteredItems,
    showCategorySheet,
    setShowCategorySheet,
    isEditMode,
    setIsEditMode,
    showItemModal,
    setShowItemModal,
    modalItem,
    discountItem,
    setDiscountItem,
    formData,
    setFormData,
    openAddModal,
    openEditModal,
    saveItem,
    deleteItem
  };
}

