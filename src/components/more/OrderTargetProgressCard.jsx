import React, { useState, useMemo } from 'react';
import { getCurrentMonthKey, getOrderMonthKey, formatMonthKeyDisplay } from '../../utils/date';
import { calculateOrderSummary } from '../../utils/formatters';

const DEFAULT_TARGET_NOMINAL = 50000000; // Rp 50.000.000

const PRESET_TARGETS = [
  { label: '25 Jt', value: 25000000 },
  { label: '50 Jt', value: 50000000 },
  { label: '75 Jt', value: 75000000 },
  { label: '100 Jt', value: 100000000 },
  { label: '150 Jt', value: 150000000 }
];

function OrderTargetProgressCard({
  orders = [],
  catalogItems = []
}) {
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);
  const currentMonthLabel = useMemo(() => formatMonthKeyDisplay(currentMonthKey), [currentMonthKey]);

  // State Target Nominal (Disimpan di LocalStorage)
  const [targetNominal, setTargetNominal] = useState(() => {
    try {
      const saved = localStorage.getItem('daytona_order_target_nominal');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TARGET_NOMINAL;
  });

  // State Modal Ubah Target
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [inputTargetValue, setInputTargetValue] = useState(String(targetNominal));

  // Hitung total nominal order bulan berjalan
  const totalNet = useMemo(() => {
    const monthOrders = orders.filter(o => getOrderMonthKey(o) === currentMonthKey);
    return monthOrders.reduce((sum, order) => {
      const summary = calculateOrderSummary(order.items, catalogItems);
      return sum + (summary.totalNet || 0);
    }, 0);
  }, [orders, catalogItems, currentMonthKey]);

  // Kalkulasi persentase dan sisa target
  const percent = targetNominal > 0 ? Math.round((totalNet / targetNominal) * 100) : 0;
  const cappedPercent = Math.min(100, Math.max(0, percent));
  const remainingNominal = targetNominal - totalNet;
  const isAchieved = totalNet >= targetNominal;

  // Handler Simpan Target Baru
  const handleSaveTarget = () => {
    const cleanNum = parseInt(String(inputTargetValue).replace(/\D/g, ''), 10);
    if (!isNaN(cleanNum) && cleanNum > 0) {
      setTargetNominal(cleanNum);
      try {
        localStorage.setItem('daytona_order_target_nominal', String(cleanNum));
      } catch {}
    }
    setIsEditingTarget(false);
  };

  return (
    <>
      <div className="bg-white p-4.5 sm:p-5 rounded-3xl border border-zinc-200/90 shadow-xs space-y-3">
        
        {/* Header: Label Target & Nominal */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Target Nominal Order ({currentMonthLabel})
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[20px] sm:text-[22px] font-black text-zinc-900 leading-tight">
                Rp {Math.round(totalNet).toLocaleString('id-ID')}
              </span>
              <span className="text-[12px] font-bold text-zinc-400">
                / Rp {targetNominal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`px-2.5 py-0.5 rounded-full text-[11.5px] font-black border ${
              isAchieved
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              {isAchieved ? `✓ ${percent}%` : `${percent}%`}
            </span>
            <button
              type="button"
              onClick={() => {
                setInputTargetValue(String(targetNominal));
                setIsEditingTarget(true);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all"
              title="Atur Target Nominal"
            >
              <svg className="w-3.5 h-3.5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200/70">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isAchieved
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-xs'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-[#EA580C] shadow-xs'
            }`}
            style={{ width: `${cappedPercent}%` }}
          />
        </div>

        {/* Keterangan Status Sisa Target Sederhana */}
        <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-0.5">
          <span className={isAchieved ? 'text-emerald-700 font-bold' : 'text-zinc-500 font-medium'}>
            {isAchieved ? (
              <>🎉 Target tercapai! (+Rp {Math.abs(remainingNominal).toLocaleString('id-ID')})</>
            ) : (
              <>Kurang Rp {remainingNominal.toLocaleString('id-ID')} lagi</>
            )}
          </span>
          <span className="text-zinc-400 font-medium">
            {percent}% tercapai
          </span>
        </div>

      </div>

      {/* MODAL DIALOG UBAH TARGET NOMINAL */}
      {isEditingTarget && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditingTarget(false); }}
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200 space-y-4">
            
            <div className="text-center">
              <h3 className="text-[16px] font-bold text-zinc-900">
                Atur Target Nominal Order
              </h3>
              <p className="text-[12px] text-zinc-500 mt-1">
                Tentukan target penjualan bulanan Anda
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
                  placeholder="50.000.000"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-[15px] font-black text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Pilihan Cepat (Preset) */}
            <div>
              <label className="block text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Pilihan Cepat:
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_TARGETS.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setInputTargetValue(String(preset.value))}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                      Number(inputTargetValue.replace(/\D/g, '')) === preset.value
                        ? 'bg-[#EA580C] text-white border-[#EA580C]'
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
                className="flex-1 py-2.5 bg-[#EA580C] hover:bg-orange-700 active:scale-95 text-white font-bold text-[13px] rounded-2xl transition-all shadow-sm"
              >
                Simpan Target
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default OrderTargetProgressCard;
