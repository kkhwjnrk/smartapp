import React, { useState, useMemo } from 'react';
import { getCurrentMonthKey, formatMonthKeyDisplay } from '../../utils/date';
import {
  getStoredBrandTarget,
  saveStoredBrandTarget,
  calculateCompletedBrandStats,
  computeTargetProgress,
  DAYTONA_PRESETS,
  OSRAM_PRESETS
} from '../../utils/targetUtils';

function OrderTargetProgressCard({
  orders = [],
  catalogItems = [],
  selectedMonthKey,
  currentMonthKey: propCurrentMonthKey
}) {
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

  // State Target Nominal (Disimpan di LocalStorage)
  const [daytonaTarget, setDaytonaTarget] = useState(() => getStoredBrandTarget('daytona'));
  const [osramTarget, setOsramTarget] = useState(() => getStoredBrandTarget('osram'));

  // State Modal Ubah Target
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editingBrand, setEditingBrand] = useState('daytona'); // 'daytona' | 'osram'
  const [inputTargetValue, setInputTargetValue] = useState('');

  // Kalkulasi Akumulasi Capaian Terpisah HANYA dari draft order yang berstatus 'completed'
  const brandStats = useMemo(() => {
    return calculateCompletedBrandStats(orders, catalogItems, activeMonthKey);
  }, [orders, catalogItems, activeMonthKey]);

  // Metrik Progres Daytona
  const daytonaProgress = useMemo(() => {
    return computeTargetProgress(brandStats.daytonaNet, daytonaTarget);
  }, [brandStats.daytonaNet, daytonaTarget]);

  // Metrik Progres Osram
  const osramProgress = useMemo(() => {
    return computeTargetProgress(brandStats.osramNet, osramTarget);
  }, [brandStats.osramNet, osramTarget]);

  const handleOpenEditModal = (brandKey) => {
    setEditingBrand(brandKey);
    const currentValue = brandKey === 'daytona' ? daytonaTarget : osramTarget;
    setInputTargetValue(String(currentValue));
    setIsEditingTarget(true);
  };

  const handleSaveTarget = () => {
    const savedNum = saveStoredBrandTarget(editingBrand, inputTargetValue);
    if (savedNum) {
      if (editingBrand === 'daytona') {
        setDaytonaTarget(savedNum);
      } else {
        setOsramTarget(savedNum);
      }
    }
    setIsEditingTarget(false);
  };

  const renderDaytonaCard = () => (
    <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-orange-200/80 shadow-2xs space-y-3 relative overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] shrink-0" />
          <h4 className="text-[13.5px] font-bold text-zinc-900 tracking-tight">
            Target Daytona
          </h4>
          <span className="text-[10px] font-bold text-[#EA580C] bg-orange-50 px-1.5 py-0.2 rounded">
            Daytona & Dura
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
            daytonaProgress.isAchieved
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-orange-50 text-orange-700 border border-orange-200'
          }`}>
            {daytonaProgress.isAchieved ? `✓ ${daytonaProgress.percent}%` : `${daytonaProgress.percent}%`}
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

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[20px] sm:text-[22px] font-bold text-zinc-900 tracking-tight leading-none">
          Rp {Math.round(brandStats.daytonaNet).toLocaleString('id-ID')}
        </span>
        <span className="text-[11.5px] font-semibold text-zinc-400 shrink-0">
          Target: Rp {daytonaTarget.toLocaleString('id-ID')}
        </span>
      </div>

      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            daytonaProgress.isAchieved
              ? 'bg-emerald-500'
              : 'bg-[#EA580C]'
          }`}
          style={{ width: `${daytonaProgress.cappedPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] pt-0.5 text-zinc-500 flex-wrap gap-1">
        <span className={daytonaProgress.isAchieved ? 'text-emerald-700 font-bold' : 'text-zinc-600 font-medium'}>
          {daytonaProgress.isAchieved ? (
            <>🎉 Tercapai! (+Rp {daytonaProgress.surplus.toLocaleString('id-ID')})</>
          ) : (
            <>Kurang <b className="text-zinc-800 font-bold">Rp {daytonaProgress.remaining.toLocaleString('id-ID')}</b> lagi</>
          )}
        </span>
        <span className="text-zinc-400 font-medium text-[10.5px]">
          {brandStats.daytonaOrdersCount} order selesai ({brandStats.daytonaPcs} pcs)
        </span>
      </div>
    </div>
  );

  const renderOsramCard = () => (
    <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-200/80 shadow-2xs space-y-3 relative overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <h4 className="text-[13.5px] font-bold text-zinc-900 tracking-tight">
            Target Osram
          </h4>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded">
            Osram
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
            osramProgress.isAchieved
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {osramProgress.isAchieved ? `✓ ${osramProgress.percent}%` : `${osramProgress.percent}%`}
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

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[20px] sm:text-[22px] font-bold text-zinc-900 tracking-tight leading-none">
          Rp {Math.round(brandStats.osramNet).toLocaleString('id-ID')}
        </span>
        <span className="text-[11.5px] font-semibold text-zinc-400 shrink-0">
          Target: Rp {osramTarget.toLocaleString('id-ID')}
        </span>
      </div>

      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            osramProgress.isAchieved
              ? 'bg-emerald-500'
              : 'bg-amber-500'
          }`}
          style={{ width: `${osramProgress.cappedPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] pt-0.5 text-zinc-500 flex-wrap gap-1">
        <span className={osramProgress.isAchieved ? 'text-emerald-700 font-bold' : 'text-zinc-600 font-medium'}>
          {osramProgress.isAchieved ? (
            <>🎉 Tercapai! (+Rp {osramProgress.surplus.toLocaleString('id-ID')})</>
          ) : (
            <>Kurang <b className="text-zinc-800 font-bold">Rp {osramProgress.remaining.toLocaleString('id-ID')}</b> lagi</>
          )}
        </span>
        <span className="text-zinc-400 font-medium text-[10.5px]">
          {brandStats.osramOrdersCount} order selesai ({brandStats.osramPcs} pcs)
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-2.5">
      {/* Header Bagian Target & Filter Tab Brand */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12.5px] sm:text-[13px] font-bold text-zinc-800 truncate">
            Target Penjualan Bulanan
          </span>
          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full shrink-0">
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
                ? 'bg-white text-zinc-900 shadow-2xs font-bold'
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
                ? 'bg-[#EA580C] text-white shadow-2xs font-bold'
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
                ? 'bg-amber-600 text-white shadow-2xs font-bold'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Osram
          </button>
        </div>
      </div>

      <div className="px-1 text-[11px] text-zinc-400 font-medium">
        * Dihitung hanya dari draft order yang berstatus selesai
      </div>

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
