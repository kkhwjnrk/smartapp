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

  // State Filter Periode: 'month' (Bulan Ini) | 'all' (Semua Periode)
  const [periodFilter, setPeriodFilter] = useState('month');

  // State Modal Ubah Target
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [inputTargetValue, setInputTargetValue] = useState(String(targetNominal));

  // Hitung total nominal order berdasarkan filter periode
  const {
    totalNet,
    totalHet,
    totalQty,
    orderCount,
    pendingCount,
    completedCount
  } = useMemo(() => {
    const targetOrders = periodFilter === 'month'
      ? orders.filter(o => getOrderMonthKey(o) === currentMonthKey)
      : orders;

    let netSum = 0;
    let hetSum = 0;
    let qtySum = 0;
    let pending = 0;
    let completed = 0;

    targetOrders.forEach(order => {
      if (order.status === 'completed') {
        completed++;
      } else {
        pending++;
      }

      const summary = calculateOrderSummary(order.items, catalogItems);
      netSum += summary.totalNet;
      hetSum += summary.totalHet;
      qtySum += summary.totalQty;
    });

    return {
      totalNet: netSum,
      totalHet: hetSum,
      totalQty: qtySum,
      orderCount: targetOrders.length,
      pendingCount: pending,
      completedCount: completed
    };
  }, [orders, catalogItems, currentMonthKey, periodFilter]);

  // Kalkulasi persentase dan selisih target
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

  const currentMonthLabel = useMemo(() => formatMonthKeyDisplay(currentMonthKey), [currentMonthKey]);

  return (
    <>
      <div className="bg-white p-5 rounded-3xl border border-zinc-200/90 shadow-xs space-y-4">
        
        {/* Header Kartu: Judul, Periode, & Tombol Ubah Target */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-orange-50 border border-orange-100 text-[#EA580C] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-bold text-zinc-900 leading-tight truncate">
                Target Nominal Order
              </h3>
              <p className="text-[11.5px] text-zinc-500 mt-0.5 truncate">
                {periodFilter === 'month' ? `Periode ${currentMonthLabel}` : 'Akumulasi Semua Periode'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Tombol Ubah Target */}
            <button
              type="button"
              onClick={() => {
                setInputTargetValue(String(targetNominal));
                setIsEditingTarget(true);
              }}
              className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 active:scale-95 rounded-xl transition-all flex items-center gap-1"
              title="Atur nominal target penjualan"
            >
              <svg className="w-3 h-3 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Ubah Target</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Bulan Ini vs Semua */}
        <div className="flex p-0.5 bg-zinc-100 rounded-xl text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setPeriodFilter('month')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              periodFilter === 'month'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Bulan Ini ({currentMonthLabel})
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('all')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              periodFilter === 'all'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Semua Periode ({orders.length} Order)
          </button>
        </div>

        {/* Ringkasan Nominal Utama & Persentase */}
        <div className="pt-0.5">
          <div className="flex items-end justify-between gap-2 flex-wrap">
            <div>
              <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider block">
                Total Capaian Nominal (Net)
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-[22px] sm:text-[24px] font-black text-zinc-900 tracking-tight leading-none">
                  Rp {Math.round(totalNet).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-black border ${
                isAchieved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-orange-50 text-orange-700 border border-orange-200'
              }`}>
                {isAchieved ? `✓ ${percent}% Tercapai!` : `${percent}%`}
              </span>
              <span className="text-[11px] text-zinc-500 font-medium block mt-1">
                Target: Rp {targetNominal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="w-full h-3.5 bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200/70 mt-3">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isAchieved
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-xs'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-[#EA580C] shadow-xs'
              }`}
              style={{ width: `${cappedPercent}%` }}
            />
          </div>

          {/* Status Selisih & Keterangan Target */}
          <div className="flex items-center justify-between text-[11px] mt-2 pt-0.5 text-zinc-500">
            <span className={isAchieved ? 'text-emerald-700 font-bold' : 'text-zinc-600 font-medium'}>
              {isAchieved ? (
                <>🎉 Target terpenuhi! Surplus Rp {Math.abs(remainingNominal).toLocaleString('id-ID')}</>
              ) : (
                <>Kurang <b>Rp {remainingNominal.toLocaleString('id-ID')}</b> lagi</>
              )}
            </span>
            <span className="text-zinc-400 font-medium">
              {orderCount} Order · {totalQty.toLocaleString('id-ID')} PCS
            </span>
          </div>
        </div>

        {/* Footer Rincian Ringkas Status Order */}
        <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            <span>{pendingCount} order aktif</span>
            <span className="text-zinc-300">·</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>{completedCount} order selesai</span>
          </div>
          {totalHet > 0 && (
            <span className="text-[10.5px] text-zinc-400 font-medium truncate">
              HET: Rp {Math.round(totalHet).toLocaleString('id-ID')}
            </span>
          )}
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
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 text-[#EA580C] flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
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
