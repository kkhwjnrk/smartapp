import React from 'react';

function Header({ 
  activeTab, 
  isEditMode, 
  setIsEditMode, 
  isStoreEditMode, 
  setIsStoreEditMode 
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
      <div className="max-w-md mx-auto px-5 py-3.5 flex justify-between items-center">
        <div>
          <h1 className="text-[20px] font-bold text-zinc-900 tracking-tight">
            {activeTab === 'home' && "Dashboard"}
            {activeTab === 'pricelist' && "Pricelist"}
            {activeTab === 'stores' && "Data Toko"}
            {activeTab === 'draft' && "Draft Order"}
          </h1>
        </div>
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
