export const BRANDS = [
  {
    id: 'daytona',
    name: 'Daytona',
    tagline: 'Racing & Performance Parts',
    description: 'Busi Ignimax/Iridium, Kampas Rem Lapinus, Vanbelt, Roller, Per CVT, Pulley, dll.',
    accentColor: '#EA580C',
    theme: {
      badge: 'bg-orange-50 text-[#EA580C] border-orange-200/80',
      activeTab: 'bg-[#EA580C] text-white shadow-sm',
      tag: 'bg-orange-500 text-white',
      borderHover: 'hover:border-orange-300',
      iconBg: 'bg-orange-50 text-[#EA580C]',
      ringFocus: 'focus:ring-orange-400 focus:border-orange-400'
    },
    discountGroup: 'daytona_group',
    discountLabel: 'Grup Diskon: 24% · 27% · 29%',
    discountTiers: ['het', '24', '27', '29'],
    storageKey: 'daytona_pricelist',
    versionKey: 'daytona_pricelist_version',
    version: 'v3_612_official_pdf'
  },
  {
    id: 'dura',
    name: 'Dura',
    tagline: 'Quality Motorcycle Parts',
    description: 'Suku cadang motor harian & komersial. Bergabung dalam 1 nota & akumulasi diskon dengan Daytona.',
    accentColor: '#0284C7',
    theme: {
      badge: 'bg-sky-50 text-sky-700 border-sky-200/80',
      activeTab: 'bg-sky-600 text-white shadow-sm',
      tag: 'bg-sky-600 text-white',
      borderHover: 'hover:border-sky-300',
      iconBg: 'bg-sky-50 text-sky-600',
      ringFocus: 'focus:ring-sky-400 focus:border-sky-400'
    },
    discountGroup: 'daytona_group',
    discountLabel: 'Grup Diskon: Gabung Daytona (24% · 27% · 29%)',
    discountTiers: ['het', '24', '27', '29'],
    storageKey: 'dura_pricelist',
    versionKey: 'dura_pricelist_version',
    version: 'v1_dura'
  },
  {
    id: 'osram',
    name: 'Osram',
    tagline: 'Automotive Lighting Solutions',
    description: 'Solusi pencahayaan lampu halogen, LED, dan bohlam motor presisi tinggi.',
    accentColor: '#D97706',
    theme: {
      badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
      activeTab: 'bg-amber-600 text-white shadow-sm',
      tag: 'bg-amber-600 text-white',
      borderHover: 'hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-700',
      ringFocus: 'focus:ring-amber-400 focus:border-amber-400'
    },
    discountGroup: 'osram',
    discountLabel: 'Skema Diskon Khusus Osram',
    discountTiers: ['het'],
    storageKey: 'osram_pricelist',
    versionKey: 'osram_pricelist_version',
    version: 'v1_osram'
  }
];

export const getBrandById = (brandId) => {
  return BRANDS.find(b => b.id === brandId) || BRANDS[0];
};

export const getBrandName = (brandId) => {
  const brand = BRANDS.find(b => b.id === brandId);
  return brand ? brand.name : 'Daytona';
};
