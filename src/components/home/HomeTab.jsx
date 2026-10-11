import React from 'react';

function HomeTab({ 
  cartCount, 
  itemsCount, 
  categoriesCount, 
  storesCount = 0,
  routesCount = 0,
  onOpenDraft, 
  onOpenPricelist, 
  onOpenCategories,
  onOpenStores
}) {
  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Draft Status Card */}
      <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm flex flex-col justify-between h-48">
        <div>
          <p className="text-[13px] font-medium text-zinc-500 mb-1">Order Aktif (Perlu Diproses)</p>
          <div className="text-5xl font-semibold tracking-tight text-zinc-900">{cartCount}</div>
          <p className="text-[13px] text-zinc-500 mt-1">
            {cartCount > 0 ? "Toko dengan pesanan belum selesai" : "Semua order sudah selesai diproses"}
          </p>
        </div>
        <button 
          onClick={onOpenDraft}
          className="w-full py-3 bg-zinc-900 text-white rounded-xl text-[14px] font-medium hover:bg-zinc-800 transition-colors shadow-2xs"
        >
          Buka Catatan Order
        </button>
      </div>

      {/* Grid Menu Cepat */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Card Data Toko & Rute */}
        <button 
          onClick={onOpenStores}
          className="col-span-2 bg-white p-4.5 rounded-3xl border border-zinc-200/80 shadow-xs flex items-center justify-between hover:border-zinc-300 transition-colors text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-orange-50 text-orange-600 border border-orange-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div>
              <span className="block font-bold text-zinc-900 text-[15px]">Data Toko & Rute</span>
              <span className="text-[12.5px] font-medium text-zinc-500">
                {storesCount} Toko · {routesCount} Kode Rute
              </span>
            </div>
          </div>
          <div className="text-zinc-400 group-hover:text-zinc-600 pr-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Card Katalog Pricelist */}
        <button 
          onClick={onOpenPricelist}
          className="bg-white p-4.5 rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col items-start gap-3 hover:border-zinc-300 transition-colors text-left"
        >
          <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <div>
            <span className="block font-bold text-zinc-900 text-[14.5px]">Katalog</span>
            <span className="text-[12.5px] font-medium text-zinc-500 mt-0.5">{itemsCount} Item</span>
          </div>
        </button>

        {/* Card Kategori */}
        <button 
          onClick={onOpenCategories}
          className="bg-white p-4.5 rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col items-start gap-3 hover:border-zinc-300 transition-colors text-left"
        >
          <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path>
            </svg>
          </div>
          <div>
            <span className="block font-bold text-zinc-900 text-[14.5px]">Kategori</span>
            <span className="text-[12.5px] font-medium text-zinc-500 mt-0.5">{categoriesCount} Kategori</span>
          </div>
        </button>
      </div>
    </div>
  );
}

export default HomeTab;
