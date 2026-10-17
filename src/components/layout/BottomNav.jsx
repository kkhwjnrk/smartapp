import React from 'react';

function BottomNav({ activeTab = 'home', setActiveTab = () => {}, cartCount = 0 }) {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[#FDFDFD]/90 border-t border-zinc-200/60 pb-safe pt-1.5 backdrop-blur-xl z-40 shadow-xs">
      <div className="max-w-md mx-auto flex justify-around items-center px-2 pb-1.5 pt-0.5">
        
        {/* 1. Home */}
        <button 
          onClick={() => setActiveTab('home')} 
          className={`flex flex-col items-center gap-1 w-16 p-2 rounded-xl transition-all ${
            activeTab === 'home' ? 'text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <svg className="w-[22px] h-[22px]" fill={activeTab === 'home' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'home' ? "0" : "2"} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          <span className="text-[11px]">Home</span>
        </button>

        {/* 2. Order */}
        <button 
          onClick={() => setActiveTab('draft')} 
          className={`flex flex-col items-center gap-1 w-16 p-2 rounded-xl relative transition-all ${
            activeTab === 'draft' ? 'text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <div className="relative">
            <svg className="w-[22px] h-[22px]" fill={activeTab === 'draft' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'draft' ? "0" : "2"} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-semibold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">Order</span>
        </button>

        {/* 3. Pricelist */}
        <button 
          onClick={() => setActiveTab('pricelist')} 
          className={`flex flex-col items-center gap-1 w-16 p-2 rounded-xl transition-all ${
            activeTab === 'pricelist' ? 'text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <svg className="w-[22px] h-[22px]" fill={activeTab === 'pricelist' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'pricelist' ? "0" : "2"} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <span className="text-[11px]">Pricelist</span>
        </button>

        {/* 4. Toko */}
        <button 
          onClick={() => setActiveTab('stores')} 
          className={`flex flex-col items-center gap-1 w-16 p-2 rounded-xl transition-all ${
            activeTab === 'stores' ? 'text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <svg className="w-[22px] h-[22px]" fill={activeTab === 'stores' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'stores' ? "0" : "2"} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <span className="text-[11px]">Toko</span>
        </button>

        {/* 5. Lainnya */}
        <button 
          onClick={() => setActiveTab('more')} 
          className={`flex flex-col items-center gap-1 w-16 p-2 rounded-xl transition-all ${
            activeTab === 'more' ? 'text-zinc-900 font-semibold' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <svg className="w-[22px] h-[22px]" fill={activeTab === 'more' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'more' ? "0" : "2"} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-[11px]">Lainnya</span>
        </button>

      </div>
    </nav>
  );
}

export default BottomNav;
