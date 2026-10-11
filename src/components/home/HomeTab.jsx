import React from 'react';

function HomeTab({ cartCount, itemsCount, categoriesCount, onOpenDraft, onOpenPricelist, onOpenCategories }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex flex-col justify-between h-48">
        <div>
          <p className="text-[13px] font-medium text-zinc-500 mb-1">Status Draft Saat Ini</p>
          <div className="text-5xl font-semibold tracking-tight text-zinc-900">{cartCount}</div>
          <p className="text-[13px] text-zinc-500 mt-1">Item siap diproses</p>
        </div>
        <button 
          onClick={onOpenDraft}
          className="w-full py-3 bg-zinc-900 text-white rounded-xl text-[14px] font-medium hover:bg-zinc-800 transition-colors"
        >
          Buka Daftar Order
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={onOpenPricelist}
          className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-start gap-4 hover:border-zinc-300 transition-colors text-left"
        >
          <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <div>
            <span className="block font-semibold text-zinc-900 text-[15px]">Katalog</span>
            <span className="text-[13px] font-medium text-zinc-500 mt-0.5">{itemsCount} Item</span>
          </div>
        </button>

        <button 
          onClick={onOpenCategories}
          className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-start gap-4 hover:border-zinc-300 transition-colors text-left"
        >
          <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <div>
            <span className="block font-semibold text-zinc-900 text-[15px]">Kategori</span>
            <span className="text-[13px] font-medium text-zinc-500 mt-0.5">{categoriesCount} Kategori</span>
          </div>
        </button>
      </div>
    </div>
  );
}

export default HomeTab;
