import React from 'react';
import { 
  formatMonthKeyDisplay, 
  getPreviousMonthKey, 
  getNextMonthKey 
} from '../../utils/date';

function Header({ 
  activeTab, 
  isEditMode, 
  setIsEditMode, 
  isStoreEditMode, 
  setIsStoreEditMode,
  selectedMonthKey,
  setSelectedMonthKey,
  availableMonths = [],
  currentMonthKey
}) {
  const showEditButton = activeTab === 'pricelist' || activeTab === 'stores';
  const currentIsEdit = activeTab === 'stores' ? isStoreEditMode : isEditMode;
  
  const toggleEdit = () => {
    if (activeTab === 'stores') {
      setIsStoreEditMode(!isStoreEditMode);
    } else {
      setIsEditMode(!isEditMode);
    }
  };

  return (
    <header className="bg-[#FDFDFD]/90 sticky top-0 z-30 backdrop-blur-xl border-b border-zinc-200/50">
      <div className="max-w-md mx-auto px-5 py-3.5 flex justify-between items-center gap-2">
        
        {/* Sisi Kiri: Heading Halaman */}
        <div className="min-w-0 shrink-0">
          <h1 className="text-[20px] font-bold text-zinc-900 tracking-tight truncate">
            {activeTab === 'home' && "Home"}
            {activeTab === 'draft' && "Catatan Order"}
            {activeTab === 'pricelist' && "Pricelist"}
            {activeTab === 'stores' && "Data Toko"}
          </h1>
        </div>

        {/* Sisi Kanan Khusus Tab Catatan Order: Pemilih Periode Bulan Compact */}
        {activeTab === 'draft' && setSelectedMonthKey && (
          <div className="flex items-center gap-0.5 bg-zinc-100 hover:bg-zinc-200/60 border border-zinc-200/80 rounded-xl px-1.5 py-1 transition-all shadow-2xs shrink-0">
            {/* Tombol Mundur 1 Bulan */}
            <button
              type="button"
              onClick={() => {
                if (selectedMonthKey === 'all') {
                  setSelectedMonthKey(currentMonthKey);
                } else {
                  setSelectedMonthKey(getPreviousMonthKey(selectedMonthKey));
                }
              }}
              className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-white rounded-lg transition-colors active:scale-90"
              title="Bulan sebelumnya"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Dropdown Nama Bulan */}
            <div className="relative flex items-center">
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="appearance-none bg-transparent font-bold text-zinc-800 text-[12px] focus:outline-none cursor-pointer pl-1 pr-4 py-0.5"
              >
                {availableMonths.map(mKey => (
                  <option key={mKey} value={mKey}>
                    {formatMonthKeyDisplay(mKey)} {mKey === currentMonthKey ? '• Ini' : ''}
                  </option>
                ))}
                <option value="all">Semua Bulan</option>
              </select>
              <svg className="w-3 h-3 text-zinc-400 absolute right-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Tombol Maju 1 Bulan */}
            <button
              type="button"
              onClick={() => {
                if (selectedMonthKey === 'all') {
                  setSelectedMonthKey(currentMonthKey);
                } else {
                  setSelectedMonthKey(getNextMonthKey(selectedMonthKey));
                }
              }}
              className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-white rounded-lg transition-colors active:scale-90"
              title="Bulan berikutnya"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Sisi Kanan Khusus Pricelist / Data Toko: Tombol Mode Edit */}
        {showEditButton && (
          <button 
            onClick={toggleEdit}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              currentIsEdit 
                ? 'bg-zinc-900 text-white' 
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {currentIsEdit ? 'Selesai' : 'Edit'}
          </button>
        )}

      </div>
    </header>
  );
}

export default Header;
