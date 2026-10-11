// Daftar 29 Kategori Utama + Lainnya
export const CATEGORIES = [
  'Semua',
  'Busi',
  'Kampas Rem',
  'Vanbelt',
  'Roller',
  'Kampas Ganda Matic',
  'Kampas Ganda Bebek',
  'Kampas Kopling',
  'Per CVT',
  'Per Sentrik',
  'Filter Udara',
  'Gas Spontan',
  'Handgrip',
  'Disc Rotor',
  'Komstir',
  'Mangkok Kampas Ganda',
  'Bearing',
  'Pulley',
  'Per Kopling',
  'Slider Pulley',
  'Selang Rem',
  'Velg',
  'Rantai',
  'Kaliper',
  'Bracket Kaliper',
  'Master Rem',
  'Bushing Pulley',
  'Injector',
  'Klep',
  'Mesin',
  'Lainnya'
];

// Helper otomatisasi kategorisasi jika ada data lama/baru tanpa kategori
export const categorizeItem = (item) => {
  const d = ((item.description || '') + ' ' + (item.pn || '')).toLowerCase();

  // 1. Busi
  if (d.includes('spark plug') || d.includes('splug') || d.includes('busi')) {
    return 'Busi';
  }

  // 2. Per Sentrik (Clutch shoe spring / per sentrik)
  if (d.includes('per sentrik') || d.includes('clutch shoe spring') || d.includes('spring set(5pcs), clutch shoe') || d.includes('spring set (3pcs), clutch shoe') || d.includes('per ganda') || d.includes('centrifugal spring')) {
    return 'Per Sentrik';
  }

  // 3. Per CVT
  if (d.includes('cvt spring') || d.includes('spring cvt') || d.includes('per cvt') || d.includes('driven spring')) {
    return 'Per CVT';
  }

  // 4. Per Kopling
  if (d.includes('clutch spring') || d.includes('per kopling')) {
    return 'Per Kopling';
  }

  // 5. Mangkok Kampas Ganda
  if (d.includes('clutch housing') || d.includes('ctlutch housing') || d.includes('clutch bell') || d.includes('mangkok kampas ganda') || d.includes('mangkok ganda')) {
    return 'Mangkok Kampas Ganda';
  }

  // 6. Kampas Ganda Bebek (Primary Clutch)
  if (d.includes('primary clutch') || (d.includes('kampas ganda') && (d.includes('bebek') || d.includes('jupiter') || d.includes('vega') || d.includes('supra') || d.includes('grand') || d.includes('blade') || d.includes('revo')))) {
    return 'Kampas Ganda Bebek';
  }

  // 7. Kampas Ganda Matic (Clutch Shoe matic)
  if (d.includes('clutch shoe') || d.includes('kampas ganda') || d.includes('weight set clutch')) {
    return 'Kampas Ganda Matic';
  }

  // 8. Kampas Kopling
  if (d.includes('clutch disc') || d.includes('lining clutch') || d.includes('friction disc') || d.includes('plat kopling') || d.includes('kampas kopling')) {
    return 'Kampas Kopling';
  }

  // 9. Slider Pulley
  if (d.includes('slider pulley') || d.includes('piece slide') || d.includes('slider piece') || d.includes('slider plate') || d.includes('slide piece')) {
    return 'Slider Pulley';
  }

  // 10. Bushing Pulley
  if (d.includes('bushing pulley') || d.includes('collar') || (d.includes('bushing') && !d.includes('swing arm'))) {
    return 'Bushing Pulley';
  }

  // 11. Pulley
  if (d.includes('pulley') || d.includes('pully') || d.includes('face comp') || d.includes('drive face') || d.includes('sheave')) {
    return 'Pulley';
  }

  // 12. Vanbelt
  if (d.includes('drive belt') || d.includes('ultra drive belt') || d.includes('v-belt') || d.includes('vanbelt') || d.includes('belt')) {
    return 'Vanbelt';
  }

  // 13. Roller
  if (d.includes('weight roller') || d.includes('weightroller') || d.includes('roller')) {
    return 'Roller';
  }

  // 14. Bracket Kaliper
  if (d.includes('bracket kaliper') || d.includes('bracket caliper') || d.includes('breket kaliper') || d.includes('caliper bracket') || (d.includes('bracket') && d.includes('kaliper'))) {
    return 'Bracket Kaliper';
  }

  // 15. Master Rem
  if (d.includes('brake pump') || d.includes('master rem') || d.includes('master cylinder') || d.includes('brake master') || d.includes('clutch/brake lever')) {
    return 'Master Rem';
  }

  // 16. Kaliper
  if (d.includes('kaliper') || d.includes('caliper')) {
    return 'Kaliper';
  }

  // 17. Selang Rem
  if (d.includes('selang rem') || d.includes('brake hose')) {
    return 'Selang Rem';
  }

  // 18. Disc Rotor
  if (d.includes('disc rotor') || d.includes('brake disc') || d.includes('disc brake') || d.includes('piringan cakram') || d.includes('rotor disc') || d.includes('piringan') || d.includes('rotor') || (d.includes('disc') && !d.includes('clutch'))) {
    return 'Disc Rotor';
  }

  // 19. Kampas Rem
  if (d.includes('brake pad') || d.includes('brake shoe') || d.includes('pad set') || d.includes('shoe set') || d.includes('kampas rem') || d.includes('kampas tromol')) {
    return 'Kampas Rem';
  }

  // 20. Filter Udara
  if (d.includes('filter udara') || d.includes('air filter') || d.includes('hi-flow filter') || d.includes('element comp')) {
    return 'Filter Udara';
  }

  // 21. Gas Spontan
  if (d.includes('gas spontan') || d.includes('quick throttle') || d.includes('throttle kit')) {
    return 'Gas Spontan';
  }

  // 22. Handgrip
  if (d.includes('handgrip') || d.includes('handle grip') || d.includes('grip') || d.includes('bar end')) {
    return 'Handgrip';
  }

  // 23. Komstir
  if (d.includes('steering stem') || d.includes('komstir') || d.includes('cone race') || d.includes('steering cone')) {
    return 'Komstir';
  }

  // 24. Bearing
  if (d.includes('bearing') || d.includes('laher') || d.includes('ball bearing')) {
    return 'Bearing';
  }

  // 25. Velg
  if (d.includes('velg') || d.includes('wheel') || d.includes('rim') || d.includes('pelek')) {
    return 'Velg';
  }

  // 26. Rantai
  if (d.includes('rantai') || d.includes('chain')) {
    return 'Rantai';
  }

  // 27. Injector
  if (d.includes('injector') || d.includes('injektor')) {
    return 'Injector';
  }

  // 28. Klep
  if (d.includes('klep') || d.includes('valve')) {
    return 'Klep';
  }

  // 29. Mesin
  if (d.includes('oil filter') || d.includes('exhaust') || d.includes('knalpot') || d.includes('engine') || d.includes('piston') || d.includes('cylinder block') || d.includes('blok seher') || d.includes('noken as') || d.includes('camshaft') || d.includes('crankshaft') || d.includes('kruk as') || d.includes('mesin') || d.includes('muffler') || d.includes('gasket') || d.includes('packing') || d.includes('silinder') || d.includes('ignition coil') || d.includes('koil')) {
    return 'Mesin';
  }

  return 'Lainnya';
};

export const ensureValidCategory = (item) => {
  if (item.category && CATEGORIES.includes(item.category) && item.category !== 'Semua') {
    return item.category;
  }
  return categorizeItem(item);
};
