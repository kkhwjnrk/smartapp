import React from 'react';

function DraftTab({
  cart,
  draftQuery,
  setDraftQuery,
  showDraftDropdown,
  setShowDraftDropdown,
  draftSearchItems,
  selectedDraftItem,
  setSelectedDraftItem,
  qtyInput,
  setQtyInput,
  onAddToCart,
  onRemoveFromCart,
  onClearDraft
}) {
  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      
      {/* Search Input for Draft */}
      <div className="relative z-30">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
        </div>
        <input 
          type="text" 
          placeholder="Cari part untuk ditambahkan..."
          className="w-full px-5 py-4 pl-12 pr-11 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[15px] font-medium placeholder:font-normal placeholder:text-zinc-400 shadow-sm"
          value={draftQuery}
          onChange={(e) => {
            setDraftQuery(e.target.value);
            setShowDraftDropdown(true);
          }}
          onFocus={() => setShowDraftDropdown(true)}
        />
        {draftQuery.length > 0 && (
          <button
            type="button"
            onClick={() => setDraftQuery('')}
            aria-label="Hapus pencarian draft"
            className="absolute inset-y-0 right-3.5 flex items-center justify-center my-auto w-6 h-6 rounded-full bg-zinc-200/90 hover:bg-zinc-300 text-zinc-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Autocomplete Dropdown */}
        {showDraftDropdown && draftQuery && draftSearchItems.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-200 z-50 max-h-[60vh] overflow-y-auto">
            {draftSearchItems.map(item => (
              <div key={item.pn} className="w-full text-left px-5 py-4 border-b border-zinc-100 last:border-0 flex flex-col gap-3">
                <div>
                  <div className="text-[14px] font-semibold text-zinc-900 leading-snug">{item.description}</div>
                  <div className="text-[12px] font-medium text-zinc-500 mt-0.5 flex items-center gap-1.5">
                    <span className="text-[#EA580C] font-semibold font-mono">PN: {item.pn}</span>
                    <span>·</span>
                    <span>{item.category}</span>
                    <span>·</span>
                    <span className="text-zinc-400">{item.qty} pcs/dus</span>
                  </div>
                </div>
                {selectedDraftItem?.pn === item.pn ? (
                  <div className="flex gap-2 mt-1">
                    <input 
                      type="number" min="1" autoFocus
                      className="w-20 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-center font-semibold text-[14px] focus:outline-none focus:border-zinc-400"
                      value={qtyInput} onChange={(e) => setQtyInput(e.target.value)}
                    />
                    <button 
                      onClick={() => onAddToCart(item)} 
                      className="px-4 py-2 bg-zinc-900 text-white text-[13px] font-medium rounded-xl flex-1 hover:bg-zinc-800 transition-colors"
                    >
                      Tambah
                    </button>
                    <button 
                      onClick={() => setSelectedDraftItem(null)} 
                      className="px-4 py-2 bg-zinc-100 text-zinc-600 text-[13px] font-medium rounded-xl hover:bg-zinc-200 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setSelectedDraftItem(item); setQtyInput('1'); }} 
                    className="w-fit px-4 py-2 bg-zinc-50 border border-zinc-200 text-zinc-700 text-[12px] font-medium rounded-xl hover:bg-zinc-100 transition-colors"
                  >
                    Pilih Barang
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showDraftDropdown && draftQuery && (
        <div className="fixed inset-0 z-20 bg-zinc-900/10 backdrop-blur-sm" onClick={() => setShowDraftDropdown(false)}></div>
      )}

      {/* Cart Items Header */}
      <div className="flex justify-between items-end mb-2 px-1">
        <h2 className="text-[14px] font-semibold text-zinc-900">Daftar Item ({cart.length})</h2>
        {cart.length > 0 && (
          <button onClick={onClearDraft} className="text-[13px] font-medium text-red-500 hover:text-red-600 transition-colors">
            Hapus Semua
          </button>
        )}
      </div>

      {/* Cart Items List */}
      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200">
          <p className="text-zinc-900 text-[15px] font-medium">Belum ada pesanan</p>
          <p className="text-zinc-500 text-[13px] mt-1">Cari barang di atas untuk menambahkan ke order.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cart.map((item, index) => (
            <div key={item.pn} className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-200 flex items-center justify-between gap-4">
              <div className="w-8 h-8 shrink-0 bg-zinc-50 text-zinc-500 rounded-full flex items-center justify-center text-[12px] font-semibold border border-zinc-100">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-semibold text-zinc-900 text-[14px] leading-snug break-words line-clamp-2 mb-0.5">{item.description}</div>
                <div className="text-[12px] font-medium text-zinc-500 flex items-center gap-1.5">
                  <span className="text-[#EA580C] font-semibold font-mono">PN: {item.pn}</span>
                  <span>·</span>
                  <span className="text-zinc-400">{item.qty} pcs/dus</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 shrink-0">
                <div className="text-[15px] font-semibold text-zinc-900 bg-zinc-50 px-3 py-1 rounded-lg border border-zinc-100">
                  {item.qty} <span className="text-[11px] text-zinc-400 ml-1">PCS</span>
                </div>
                <button onClick={() => onRemoveFromCart(item.pn)} className="text-[12px] font-medium text-red-500 hover:text-red-600">
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DraftTab;
