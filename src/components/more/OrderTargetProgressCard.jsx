import React, { useState, useMemo } from 'react';
import { getCurrentMonthKey, getOrderMonthKey, formatMonthKeyDisplay } from '../../utils/date';
import { calculateOrderSummary } from '../../utils/formatters';

const DEFAULT_DAYTONA_TARGET = 50000000; // Rp 50.000.000
const DEFAULT_OSRAM_TARGET = 25000000;   // Rp 25.000.000

const DAYTONA_PRESETS = [
  { label: '25 Jt', value: 25000000 },
  { label: '50 Jt', value: 50000000 },
  { label: '75 Jt', value: 75000000 },
  { label: '100 Jt', value: 100000000 },
  { label: '150 Jt', value: 150000000 }
];

const OSRAM_PRESETS = [
  { label: '10 Jt', value: 10000000 },
  { label: '20 Jt', value: 20000000 },
  { label: '30 Jt', value: 30000000 },
  { label: '50 Jt', value: 50000000 },
  { label: '75 Jt', value: 75000000 }
];

function OrderTargetProgressCard({
  orders = [],
  catalogItems = [],
  selectedMonthKey,
  currentMonthKey: propCurrentMonthKey
}) {
  // Tentukan bulan target: gunakan selectedMonthKey jika ada dan bukan 'all', atau fallback ke bulan berjalan
  const activeMonthKey = useMemo(() => {
    if (selectedMonthKey && selectedMonthKey !== 'all') {
      return selectedMonthKey;
    }
    return propCurrentMonthKey || getCurrentMonthKey();
  }, [selectedMonthKey, propCurrentMonthKey]);

  const activeMonthLabel = useMemo(() => formatMonthKeyDisplay(activeMonthKey), [activeMonthKey]);

  // Tab View: 'both' | 'daytona' | 'osram'
  const [activeBrandView, setActiveBrandView] = useState(() => {
    try {
      const saved = localStorage.getItem('order_target_view_brand');
      if (saved === 'daytona' || saved === 'osram' || saved === 'both') return saved;
    } catch {}
    return 'both';
  });

  const handleBrandViewChange = (view) => {
    setActiveBrandView(view);
    try {
      localStorage.setItem('order_target_view_brand', view);
    } catch {}
  };

  // State Target Nominal Daytona (Disimpan di LocalStorage)
  const [daytonaTarget, setDaytonaTarget] = useState(() => {
    try {
      const saved = localStorage.getItem('daytona_order_target_nominal');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return DEFAULT_DAYTONA_TARGET;
  });

  // State Target Nominal Osram (Disimpan di LocalStorage)
  const [osramTarget, setOsramTarget] = useState(() => {
    try {
      const saved = localStorage.getItem('osram_order_target_nominal');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return DEFAULT_OSRAM_TARGET;
  });

  // State Modal Ubah Target
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editingBrand, setEditingBrand] = useState('daytona'); // 'daytona' | 'osram'
  const [inputTargetValue, setInputTargetValue] = useState('');

  // 1. Filter Order Bulan Ini yang SUDAH SELESAI (status === 'completed')
  const completedMonthOrders = useMemo(() => {
    return orders.filter(order => {
      // HANYA draft order yang sudah diselesaikan yang dihitung ke target
      if (order.status !== 'completed') return false;
      const orderMonth = getOrderMonthKey(order);
      return orderMonth === activeMonthKey;
    });
  }, [orders, activeMonthKey]);

  // 2. Kalkulasi Akumulasi Capaian Terpisah: Daytona (+ Dura) vs Osram
  const {
    daytonaNet,
    osramNet,
    daytonaOrdersCount,
    osramOrdersCount,
    daytonaPcs,
    osramPcs
  } = useMemo(() => {
    let dNet = 0;
    let oNet = 0;
    let dOrders = 0;
    let oOrders = 0;
    let dPcs = 0;
    let oPcs = 0;

    completedMonthOrders.forEach(order => {
      const orderBrand = (order.brand || '').toLowerCase();
      // Pastikan fallback brand pada item jika belum tercatat
      const resolvedItems = (order.items || []).map(it => {
        if (!it.brand && orderBrand) {
          return { ...it, brand: orderBrand };
        }
        return it;
      });

      const summary = calculateOrderSummary(resolvedItems, catalogItems);

      if (summary.hasDaytonaGroup || summary.daytonaGroupNet > 0) {
        dNet += summary.daytonaGroupNet || 0;
        dOrders += 1;
        dPcs += summary.daytonaQty || 0;
      }

      if (summary.hasOsram || summary.osramNet > 0) {
        oNet += summary.osramNet || 0;
        oOrders += 1;
        oPcs += summary.osramQty || 0;
      }
    });

    return {
      daytonaNet: dNet,
      osramNet: oNet,
      daytonaOrdersCount: dOrders,
      osramOrdersCount: oOrders,
      daytonaPcs: dPcs,
      osramPcs: oPcs
    };
  }, [completedMonthOrders, catalogItems]);

  // Kalkulasi Persentase dan Sisa Target Daytona
  const daytonaPercent = daytonaTarget > 0 ? Math.round((daytonaNet / daytonaTarget) * 100) : 0;
  const daytonaCappedPercent = Math.min(100, Math.max(0, daytonaPercent));
  const daytonaRemaining = daytonaTarget - daytonaNet;
  const isDaytonaAchieved = daytonaNet >= daytonaTarget;

  // Kalkulasi Persentase dan Sisa Target Osram
  const osramPercent = osramTarget > 0 ? Math.round((osramNet / osramTarget) * 100) : 0;
  const osramCappedPercent = Math.min(100, Math.max(0, osramPercent));
  const osramRemaining = osramTarget - osramNet;
  const isOsramAchieved = osramNet >= osramTarget;

  // Buka Modal Edit Target untuk Brand Tertentu
  const handleOpenEditModal = (brandKey) => {
    setEditingBrand(brandKey);
    const currentValue = brandKey === 'daytona' ? daytonaTarget : osramTarget;
    setInputTargetValue(String(currentValue));
    setIsEditingTarget(true);
  };

  // Simpan Target Baru ke State dan LocalStorage
  const handleSaveTarget = () => {
    const cleanNum = parseInt(String(inputTargetValue).replace(/\D/g, ''), 10);
    if (!isNaN(cleanNum) && cleanNum > 0) {
      if (editingBrand === 'daytona') {
        setDaytonaTarget(cleanNum);
        try {
          localStorage.setItem('daytona_order_target_nominal', String(cleanNum));
        } catch {}
      } else {
        setOsramTarget(cleanNum);
        try {
          localStorage.setItem('osram_order_target_nominal', String(cleanNum));
        } catch {}
      }
    }
    setIsEditingTarget(false);
  };

  // Helper render kartu Daytona
  const renderDaytonaCard = () => (
    <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-orange-200/90 shadow-2xs space-y-3 relative overflow-hidden">
      {/* Aksen Latar Belakang Halus */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Baris 1: Judul Brand & Capaian */}
      <div className="flex items-center justify-between gap-2 relative">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] shrink-0" />
          <h4 className="text-[13px] sm:text-[13.5px] font-bold text-zinc-900 tracking-tight">
            Target Daytona
          </h4>
          <span className="text-[9.5px] font-bold text-[#EA580C] bg-orange-50 border border-orange-200/80 px-1.5 py-0.2 rounded-md shrink-0">
            Daytona & Dura
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${
            isDaytonaAchieved
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-orange-50 text-orange-700 border border-orange-200'
          }`}>
            {isDaytonaAchieved ? `✓ ${daytonaPercent}%` : `${daytonaPercent}%`}
          </span>
          <button
            type="button"
            onClick={() => handleOpenEditModal('daytona')}
            className="p-1 text-zinc-400 hover:text-[#EA580C] hover:bg-orange-50 active:scale-90 rounded-lg transition-all"
            title="Ubah Target Daytona"
          >
            <svg className="w-3.5 h-3.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Baris 2: Nominal Capaian & Target */}
      <div className="flex items-baseline justify-between gap-2 relative">
        <span className="text-[20px] sm:text-[22px] font-black text-zinc-900 tracking-tight leading-none">
          Rp {Math.round(daytonaNet).toLocaleString('id-ID')}
        </span>
        <span className="text-[11.5px] font-bold text-zinc-400 shrink-0">
          Target: Rp {daytonaTarget.toLocaleString('id-ID')}
        </span>
      </div>

      {/* Baris 3: Progress Bar */}
      <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200/60 relative">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isDaytonaAchieved
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-xs'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-[#EA580C] shadow-xs'
          }`}
          style={{ width: `${daytonaCappedPercent}%` }}
        />
      </div>

      {/* Baris 4: Keterangan Sisa & Status Order */}
      <div className="flex items-center justify-between text-[11px] pt-0.5 text-zinc-500 relative flex-wrap gap-1">
        <span className={isDaytonaAchieved ? 'text-emerald-700 font-bold' : 'text-zinc-600 font-medium'}>
          {isDaytonaAchieved ? (
            <>🎉 Target tercapai! (+Rp {Math.abs(daytonaRemaining).toLocaleString('id-ID')})</>
          ) : (
            <>Kurang <b className="text-zinc-800">Rp {daytonaRemaining.toLocaleString('id-ID')}</b> lagi</>
          )}
        </span>
        <span className="text-zinc-400 font-medium text-[10.5px]">
          {daytonaOrdersCount} order selesai ({daytonaPcs} pcs)
        </span>
      </div>
    </div>
  );

  // Helper render kartu Osram
  const renderOsramCard = () => (
    <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-200/90 shadow-2xs space-y-3 relative overflow-hidden">
      {/* Aksen Latar Belakang Halus */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Baris 1: Judul Brand & Capaian */}
      <div className="flex items-center justify-between gap-2 relative">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <h4 className="text-[13px] sm:text-[13.5px] font-bold text-zinc-900 tracking-tight">
            Target Osram
          </h4>
          <span className="text-[9.5px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded-md shrink-0">
            Osram
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black border ${
            isOsramAchieved
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {isOsramAchieved ? `✓ ${osramPercent}%` : `${osramPercent}%`}
          </span>
          <button
            type="button"
            onClick={() => handleOpenEditModal('osram')}
            className="p-1 text-zinc-400 hover:text-amber-700 hover:bg-amber-50 active:scale-90 rounded-lg transition-all"
            title="Ubah Target Osram"
          >
            <svg className="w-3.5 h-3.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Baris 2: Nominal Capaian & Target */}
      <div className="flex items-baseline justify-between gap-2 relative">
        <span className="text-[20px] sm:text-[22px] font-black text-zinc-900 tracking-tight leading-none">
          Rp {Math.round(osramNet).toLocaleString('id-ID')}
        </span>
        <span className="text-[11.5px] font-bold text-zinc-400 shrink-0">
          Target: Rp {osramTarget.toLocaleString('id-ID')}
        </span>
      </div>

      {/* Baris 3: Progress Bar */}
      <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200/60 relative">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isOsramAchieved
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-xs'
              : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 shadow-xs'
          }`}
          style={{ width: `${osramCappedPercent}%` }}
        />
      </div>

      {/* Baris 4: Keterangan Sisa & Status Order */}
      <div className="flex items-center justify-between text-[11px] pt-0.5 text-zinc-500 relative flex-wrap gap-1">
        <span className={isOsramAchieved ? 'text-emerald-700 font-bold' : 'text-zinc-600 font-medium'}>
          {isOsramAchieved ? (
            <>🎉 Target tercapai! (+Rp {Math.abs(osramRemaining).toLocaleString('id-ID')})</>
          ) : (
            <>Kurang <b className="text-zinc-800">Rp {osramRemaining.toLocaleString('id-ID')}</b> lagi</>
          )}
        </span>
        <span className="text-zinc-400 font-medium text-[10.5px]">
          {osramOrdersCount} order selesai ({osramPcs} pcs)
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-2.5">
      {/* Header Bagian Target & Filter Tab Brand */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12.5px] sm:text-[13px] font-bold text-zinc-900 truncate">
            Target Nominal Penjualan
          </span>
          <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full shrink-0">
            {activeMonthLabel}
          </span>
        </div>

        {/* Tab Switcher: Keduanya | Daytona | Osram */}
        <div className="flex bg-zinc-100 p-0.5 rounded-xl text-[11px] font-bold shrink-0">
          <button
            type="button"
            onClick={() => handleBrandViewChange('both')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeBrandView === 'both'
                ? 'bg-white text-zinc-900 shadow-2xs font-black'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Keduanya
          </button>
          <button
            type="button"
            onClick={() => handleBrandViewChange('daytona')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeBrandView === 'daytona'
                ? 'bg-[#EA580C] text-white shadow-2xs font-black'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Daytona
          </button>
          <button
            type="button"
            onClick={() => handleBrandViewChange('osram')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeBrandView === 'osram'
                ? 'bg-amber-600 text-white shadow-2xs font-black'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Osram
          </button>
        </div>
      </div>

      {/* Keterangan: Dihitung dari draft order yang sudah diselesaikan */}
      <div className="px-1 text-[11px] text-zinc-400 font-medium">
        * Dihitung hanya dari draft order yang berstatus selesai
      </div>

      {/* Render Kartu Target Sesuai Pilihan */}
      {activeBrandView === 'both' && (
        <div className="space-y-3">
          {renderDaytonaCard()}
          {renderOsramCard()}
        </div>
      )}

      {activeBrandView === 'daytona' && renderDaytonaCard()}

      {activeBrandView === 'osram' && renderOsramCard()}

      {/* MODAL DIALOG UBAH TARGET NOMINAL PER BRAND */}
      {isEditingTarget && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditingTarget(false); }}
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200 space-y-4">
            
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${editingBrand === 'daytona' ? 'bg-[#EA580C]' : 'bg-amber-500'}`} />
                <span className={editingBrand === 'daytona' ? 'text-[#EA580C]' : 'text-amber-800'}>
                  {editingBrand === 'daytona' ? 'Daytona & Dura' : 'Osram'}
                </span>
              </div>
              <h3 className="text-[16px] font-bold text-zinc-900">
                Atur Target {editingBrand === 'daytona' ? 'Daytona' : 'Osram'}
              </h3>
              <p className="text-[12px] text-zinc-500 mt-1">
                Tentukan target penjualan bulanan untuk {editingBrand === 'daytona' ? 'Daytona & Dura' : 'Osram'}
              </p>
            </div>

            {/* Input Nominal Rupiah */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                NOMINAL TARGET (RP)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 inset-y-0 flex items-center text-zinc-400 font-bold text-[13px] pointer-events-none">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    inputTargetValue === ''
                      ? ''
                      : Number(inputTargetValue.replace(/\D/g, '') || 0).toLocaleString('id-ID')
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setInputTargetValue(raw);
                  }}
                  placeholder={editingBrand === 'daytona' ? '50.000.000' : '25.000.000'}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-[15px] font-black text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Pilihan Cepat (Preset) Berdasarkan Brand */}
            <div>
              <label className="block text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Pilihan Cepat:
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {(editingBrand === 'daytona' ? DAYTONA_PRESETS : OSRAM_PRESETS).map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setInputTargetValue(String(preset.value))}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                      Number(inputTargetValue.replace(/\D/g, '')) === preset.value
                        ? editingBrand === 'daytona'
                          ? 'bg-[#EA580C] text-white border-[#EA580C]'
                          : 'bg-amber-600 text-white border-amber-600'
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingTarget(false)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[13px] rounded-2xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveTarget}
                className={`flex-1 py-2.5 active:scale-95 text-white font-bold text-[13px] rounded-2xl transition-all shadow-sm ${
                  editingBrand === 'daytona'
                    ? 'bg-[#EA580C] hover:bg-orange-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Simpan Target
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default OrderTargetProgressCard;
