import React, { useRef } from 'react';
import ItemCard from './ItemCard';

function PricelistTab({
  items,
  filteredItems,
  query,
  setQuery,
  selectedCategory,
  setSelectedCategory,
  categoryCounts,
  onOpenCategorySheet,
  isEditMode,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDiscountSheet
}) {
  const searchInputRef = useRef(null);

  return (
    <div className="space-y-3.5 animate-in fade-in duration-500">
      
      {/* Sticky Search & Category Control Bar */}
      <div className="sticky top-[58px] z-20 bg-[#FDFDFD] pb-2 pt-1">
        
        {/* Kolom Cari dengan Tombol X */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Cari nama atau part number..."
            className="w-full pl-12 pr-11 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 text-[15px] font-medium placeholder:font-normal placeholder:text-zinc-400 shadow-sm transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          {/* Tombol X untuk reset pencarian */}
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label="Hapus pencarian"
              className="absolute inset-y-0 right-3.5 flex items-center justify-center my-auto w-6 h-6 rounded-full bg-zinc-200/90 hover:bg-zinc-300 text-zinc-600 transition-colors active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Selector Bar */}
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCategorySheet}
            className={`flex-1 flex items-center justify-between px-4 py-2.5 rounded-2xl border text-[13px] font-medium transition-all active:scale-[0.99] ${
              selectedCategory !== 'Semua'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <svg className={`w-4 h-4 shrink-0 ${selectedCategory !== 'Semua' ? 'text-zinc-300' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="truncate">
                {selectedCategory === 'Semua' ? 'Semua Kategori' : selectedCategory}
              </span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                selectedCategory !== 'Semua' ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
              }`}>
                {categoryCounts[selectedCategory] || 0}
              </span>
            </div>
            
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <span className="text-[12px] opacity-75">Ganti</span>
              <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {selectedCategory !== 'Semua' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('Semua')}
              className="px-3.5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[13px] font-medium transition-colors shrink-0"
              title="Reset ke Semua Kategori"
            >
              Semua
            </button>
          )}
        </div>

        {/* Status Hasil Pencarian */}
        <div className="flex items-center justify-between text-[12px] text-zinc-500 font-medium px-1 mt-2">
          <span>
            {query.trim() ? (
              <>Hasil cari "{query}" ({filteredItems.length} item)</>
            ) : (
              <>Menampilkan {filteredItems.length} item</>
            )}
          </span>
          {(selectedCategory !== 'Semua' || query.trim().length > 0) && (
            <button 
              onClick={() => {
                setSelectedCategory('Semua');
                setQuery('');
              }}
              className="text-zinc-500 hover:text-zinc-900 font-medium underline transition-colors"
            >
              Reset Semua
            </button>
          )}
        </div>

        {/* Mode Edit Banner */}
        {isEditMode && (
          <div className="mt-2.5 bg-zinc-50 border border-zinc-200 p-3 rounded-2xl flex justify-between items-center animate-in fade-in">
            <span className="text-[13px] text-zinc-600 font-medium px-2">Mode kelola aktif</span>
            <button 
              onClick={onOpenAddModal} 
              className="px-4 py-2 bg-zinc-900 text-white font-medium text-[13px] rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Tambah Barang
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200 mt-2">
          <div className="w-12 h-12 mx-auto bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <p className="text-zinc-900 text-[15px] font-semibold">Data tidak ditemukan</p>
          <p className="text-zinc-500 text-[13px] mt-1">Coba kata kunci lain atau ubah pilihan kategori.</p>
          <button 
            onClick={() => { 
              setSelectedCategory('Semua'); 
              setQuery(''); 
            }}
            className="mt-4 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-[13px] font-medium hover:bg-zinc-200 transition-colors"
          >
            Tampilkan Semua Barang
          </button>
        </div>
      )}

      {/* List Container */}
      <div className="space-y-3 pb-6">
        {filteredItems.map(item => (
          <ItemCard 
            key={item.pn}
            item={item}
            isEditMode={isEditMode}
            onOpenDiscount={onOpenDiscountSheet}
            onOpenEdit={onOpenEditModal}
          />
        ))}
      </div>
    </div>
  );
}

export default PricelistTab;
