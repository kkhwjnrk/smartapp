import React, { useRef } from 'react';
import ItemCard from './ItemCard';
import BrandHub from './BrandHub';
import { getBrandById } from '../../constants/brands';
import useSwipeBack from '../../hooks/useSwipeBack';

function PricelistTab({
  selectedBrandId = null,
  setSelectedBrandId = () => {},
  brandCounts = {},
  items = [],
  filteredItems = [],
  query = '',
  setQuery = () => {},
  selectedCategory = 'Semua',
  setSelectedCategory = () => {},
  selectedSubCategory = 'Semua',
  setSelectedSubCategory = () => {},
  availableSubCategories = [],
  selectedDiscountTier = 'het',
  setSelectedDiscountTier = () => {},
  categoryCounts = {},
  onOpenCategorySheet = () => {},
  isEditMode = false,
  onOpenAddModal = () => {},
  onOpenEditModal = () => {},
  onOpenDiscountSheet = () => {}
}) {
  const searchInputRef = useRef(null);

  // Gesture Swipe-Back: Geser sisi kiri ke kanan untuk kembali ke Brand Hub
  const { containerRef, swipeHandlers, containerStyle, isSwiping } = useSwipeBack({
    onBack: () => setSelectedBrandId(null),
    enabled: Boolean(selectedBrandId)
  });

  // Tampilan 1: Jika belum memilih brand -> Tampilkan Brand Hub Cards
  if (!selectedBrandId) {
    return (
      <BrandHub
        brandCounts={brandCounts}
        onSelectBrand={(brandId) => {
          setSelectedBrandId(brandId);
          setQuery('');
          setSelectedCategory('Semua');
          setSelectedSubCategory('Semua');
        }}
      />
    );
  }

  const activeBrand = getBrandById(selectedBrandId);
  const showDiscountTiers = activeBrand.discountTiers && activeBrand.discountTiers.length > 1;

  // Tampilan 2: Tampilan Katalog Lengkap untuk Brand yang Dipilih
  return (
    <div 
      ref={containerRef}
      {...swipeHandlers}
      style={containerStyle}
      className={`space-y-3.5 animate-in fade-in duration-300 ${isSwiping ? 'select-none' : ''}`}
    >
      {/* Sticky Top Bar: Navigasi Kembali ke Brand Hub & Kontrol Katalog */}
      <div className="sticky top-[58px] z-20 bg-[#FDFDFD] pb-2.5 pt-1 space-y-2.5">
        
        {/* Baris Navigasi Atas: Tombol Kembali ke Semua Brand & Badge Brand Aktif */}
        <div className="flex items-center justify-between px-0.5">
          <button
            type="button"
            onClick={() => setSelectedBrandId(null)}
            className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 font-bold text-[13.5px] px-2.5 py-1.5 -ml-1.5 rounded-xl hover:bg-zinc-100 transition-colors active:scale-95"
            title="Kembali ke pilihan brand"
          >
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Semua Brand</span>
          </button>

          <div className="flex items-center gap-2">
            <span className={`text-[12px] font-bold px-2.5 py-1 rounded-xl border ${activeBrand.theme.badge}`}>
              {activeBrand.name}
            </span>
          </div>
        </div>

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
            placeholder={`Cari part ${activeBrand.name} (part number, nama, motor)...`}
            className="w-full pl-12 pr-11 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 text-[14.5px] font-medium placeholder:font-normal placeholder:text-zinc-400 shadow-sm transition-all"
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

        {/* Row 2: Category Selector Bar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCategorySheet}
            className={`flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-2xl border text-[13px] font-medium transition-all active:scale-[0.99] ${
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

            <div className="flex items-center gap-1 shrink-0 ml-1.5">
              <span className="text-[12px] opacity-75">Ganti</span>
              <svg className="w-4 h-4 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {selectedCategory !== 'Semua' && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Semua');
                setSelectedSubCategory('Semua');
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[13px] font-medium transition-colors shrink-0"
              title="Reset ke Semua Kategori"
            >
              Semua
            </button>
          )}
        </div>

        {/* Row 3: Quick Discount Tier Toggle Buttons (Jika brand mendukung tier diskon grosir) */}
        {showDiscountTiers && (
          <div className="bg-zinc-100 p-1 rounded-2xl flex items-center gap-1 border border-zinc-200/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
            <button
              type="button"
              onClick={() => setSelectedDiscountTier('het')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 ${
                selectedDiscountTier === 'het'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              HET
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiscountTier('24')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 ${
                selectedDiscountTier === '24'
                  ? 'bg-[#EA580C] text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Disc 24%
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiscountTier('27')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 ${
                selectedDiscountTier === '27'
                  ? 'bg-[#EA580C] text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Disc 27%
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiscountTier('29')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 ${
                selectedDiscountTier === '29'
                  ? 'bg-[#EA580C] text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Disc 29%
            </button>
          </div>
        )}

        {/* Row 4: Sub-Category Horizontal Scrollable Pills */}
        {selectedCategory !== 'Semua' && availableSubCategories.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none no-scrollbar -mx-1 px-1">
            <button
              type="button"
              onClick={() => setSelectedSubCategory('Semua')}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all active:scale-95 ${
                selectedSubCategory === 'Semua'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200/60'
              }`}
            >
              Semua Tipe
            </button>
            {availableSubCategories.map(sub => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubCategory(sub)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all active:scale-95 ${
                  selectedSubCategory === sub
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200/60'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Status Hasil Pencarian & Tombol Reset Filter */}
        <div className="flex items-center justify-between text-[12px] text-zinc-500 font-medium px-1 pt-0.5">
          <span>
            {query.trim() ? (
              <>Hasil cari "{query}" ({filteredItems.length} item)</>
            ) : (
              <>Menampilkan {filteredItems.length} item {selectedDiscountTier !== 'het' ? `(Netto ${selectedDiscountTier}%)` : ''}</>
            )}
          </span>
          {(selectedCategory !== 'Semua' || selectedSubCategory !== 'Semua' || query.trim().length > 0 || (showDiscountTiers && selectedDiscountTier !== 'het')) && (
            <button
              onClick={() => {
                setSelectedCategory('Semua');
                setSelectedSubCategory('Semua');
                setQuery('');
                setSelectedDiscountTier('het');
              }}
              className="text-zinc-500 hover:text-zinc-900 font-medium underline transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Mode Edit Banner */}
        {isEditMode && (
          <div className="mt-2 bg-zinc-50 border border-zinc-200 p-3 rounded-2xl flex justify-between items-center animate-in fade-in">
            <span className="text-[13px] text-zinc-600 font-medium px-2">Mode kelola {activeBrand.name} aktif</span>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-zinc-900 text-white font-medium text-[13px] rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Tambah Barang
            </button>
          </div>
        )}
      </div>

      {/* Empty State: Belum Ada Data Item Sama Sekali di Brand Ini */}
      {items.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 mt-2 p-6 shadow-xs">
          <div 
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center font-black text-[20px] mb-3 select-none shadow-2xs"
            style={{
              backgroundColor: `${activeBrand.accentColor}15`,
              color: activeBrand.accentColor,
              border: `1.5px solid ${activeBrand.accentColor}30`
            }}
          >
            {activeBrand.name.substring(0, 2).toUpperCase()}
          </div>
          <p className="text-zinc-900 text-[16px] font-bold">Katalog {activeBrand.name} Siap Diisi</p>
          <p className="text-zinc-500 text-[13px] mt-1 max-w-sm mx-auto leading-relaxed">
            Pricelist brand ini belum memiliki data part. Anda dapat menambahkan item baru melalui tombol di bawah atau menunggu data resmi diimpor.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="mt-5 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-[13px] font-semibold hover:bg-zinc-800 transition-colors active:scale-95 inline-flex items-center gap-2 shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Barang {activeBrand.name}</span>
          </button>
        </div>
      )}

      {/* Empty State: Ada data barang tapi pencarian/filter tidak cocok */}
      {items.length > 0 && filteredItems.length === 0 && (
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
              setSelectedSubCategory('Semua');
              setQuery('');
              setSelectedDiscountTier('het');
            }}
            className="mt-4 px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-[13px] font-medium hover:bg-zinc-200 transition-colors"
          >
            Tampilkan Semua Barang {activeBrand.name}
          </button>
        </div>
      )}

      {/* List Container */}
      <div className="space-y-3 pb-6">
        {filteredItems.map(item => (
          <ItemCard
            key={item.pn}
            item={item}
            selectedDiscountTier={selectedDiscountTier}
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
