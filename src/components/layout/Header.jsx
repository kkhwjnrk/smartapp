import React from 'react';

function Header({ activeTab, isEditMode, setIsEditMode }) {
  return (
    <header className="bg-[#FDFDFD]/90 sticky top-0 z-30 backdrop-blur-xl border-b border-zinc-200/50">
      <div className="max-w-md mx-auto px-5 py-3.5 flex justify-between items-center">
        <div>
          <h1 className="text-[20px] font-bold text-zinc-900 tracking-tight">
            {activeTab === 'home' && "Dashboard"}
            {activeTab === 'pricelist' && "Pricelist"}
            {activeTab === 'draft' && "Draft Order"}
          </h1>
        </div>
        {activeTab === 'pricelist' && (
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
              isEditMode 
                ? 'bg-zinc-900 text-white' 
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {isEditMode ? 'Selesai' : 'Edit'}
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
