import React, { useState, useEffect, useMemo } from 'react';
import initialPricelist from './data/pricelist.json';

function App() {
  const [activeTab, setActiveTab] = useState('pricelist'); 
  
  // Storage for Pricelist
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('daytona_pricelist');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return initialPricelist; }
    }
    return initialPricelist;
  });

  useEffect(() => {
    localStorage.setItem('daytona_pricelist', JSON.stringify(items));
  }, [items]);

  // Queries
  const [query, setQuery] = useState('');
  const [draftQuery, setDraftQuery] = useState('');
  const [showDraftDropdown, setShowDraftDropdown] = useState(false);

  // Cart / Draft
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('order_draft');
    return saved ? JSON.parse(saved) : [];
  });
  const [qtyInput, setQtyInput] = useState('1');
  const [selectedDraftItem, setSelectedDraftItem] = useState(null);

  useEffect(() => {
    localStorage.setItem('order_draft', JSON.stringify(cart));
  }, [cart]);

  // Modals for CRUD
  const [isEditMode, setIsEditMode] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalItem, setModalItem] = useState(null); 

  // Form State
  const [formData, setFormData] = useState({ pn: '', description: '', price: '', qty: '1' });

  // Filter items
  const filteredItems = useMemo(() => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(item => 
      item.pn.toLowerCase().includes(lowerQuery) || 
      item.description.toLowerCase().includes(lowerQuery)
    );
  }, [query, items]);

  const draftSearchItems = useMemo(() => {
    if (!draftQuery) return [];
    const lowerQuery = draftQuery.toLowerCase();
    return items.filter(item => 
      item.pn.toLowerCase().includes(lowerQuery) || 
      item.description.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  }, [draftQuery, items]);

  // Draft Logic
  const handleAddToCart = (itemObj) => {
    if (!itemObj) return;
    const qty = parseInt(qtyInput, 10);
    if (qty <= 0) return;

    setCart(prev => {
      const existing = prev.find(i => i.pn === itemObj.pn);
      if (existing) {
        return prev.map(i => i.pn === itemObj.pn ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { ...itemObj, qty }];
    });

    setDraftQuery('');
    setQtyInput('1');
    setShowDraftDropdown(false);
    setSelectedDraftItem(null);
  };

  const removeFromCart = (pn) => {
    setCart(prev => prev.filter(i => i.pn !== pn));
  };

  const clearDraft = () => {
    if (window.confirm('Bersihkan semua daftar order saat ini?')) {
      setCart([]);
    }
  };

  // CRUD Logic
  const openAddModal = () => {
    setFormData({ pn: '', description: '', price: '', qty: '1' });
    setModalItem(null);
    setShowItemModal(true);
  };

  const openEditModal = (item) => {
    setFormData({ ...item });
    setModalItem(item);
    setShowItemModal(true);
  };

  const saveItem = (e) => {
    e.preventDefault();
    if (!formData.pn.trim() || !formData.description.trim()) return;

    if (modalItem) {
      setItems(prev => prev.map(i => i.pn === modalItem.pn ? formData : i));
    } else {
      if (items.some(i => i.pn === formData.pn)) {
        alert('Part Number sudah terdaftar!');
        return;
      }
      setItems(prev => [formData, ...prev]);
    }
    setShowItemModal(false);
  };

  const deleteItem = () => {
    if (window.confirm(`Hapus barang ini secara permanen?\n\nPN: ${modalItem.pn}\nNama: ${modalItem.description}`)) {
      setItems(prev => prev.filter(i => i.pn !== modalItem.pn));
      setShowItemModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-28 font-sans text-zinc-900 selection:bg-zinc-200">
      
      {/* Top Header - Clean Apple-like aesthetic */}
      <header className="bg-[#FDFDFD]/90 sticky top-0 z-30 backdrop-blur-xl border-b border-zinc-200/50">
        <div className="max-w-md mx-auto px-5 py-4 flex justify-between items-end">
          <div>
            <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">
              {activeTab === 'home' && "Dashboard"}
              {activeTab === 'pricelist' && "Pricelist"}
              {activeTab === 'draft' && "Draft Order"}
            </h1>
            <p className="text-[13px] font-medium text-zinc-500 mt-0.5">Daytona System</p>
          </div>
          {activeTab === 'pricelist' && (
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${isEditMode ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
            >
              {isEditMode ? 'Selesai' : 'Edit'}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-5 relative">
        
        {/* TAB: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex flex-col justify-between h-48">
              <div>
                <p className="text-[13px] font-medium text-zinc-500 mb-1">Status Draft Saat Ini</p>
                <div className="text-5xl font-semibold tracking-tight text-zinc-900">{cart.length}</div>
                <p className="text-[13px] text-zinc-500 mt-1">Item siap diproses</p>
              </div>
              <button 
                onClick={() => setActiveTab('draft')}
                className="w-full py-3 bg-zinc-900 text-white rounded-xl text-[14px] font-medium hover:bg-zinc-800 transition-colors"
              >
                Buka Daftar Order
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveTab('pricelist')}
                className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-start gap-4 hover:border-zinc-300 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <div>
                  <span className="block font-semibold text-zinc-900 text-[15px]">Katalog</span>
                  <span className="text-[13px] font-medium text-zinc-500 mt-0.5">{items.length} Item</span>
                </div>
              </button>

              <div className="bg-zinc-50/50 p-5 rounded-3xl border border-zinc-200/50 flex flex-col items-start gap-4">
                <div className="w-10 h-10 bg-zinc-100/50 rounded-full flex items-center justify-center text-zinc-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <div>
                  <span className="block font-semibold text-zinc-400 text-[15px]">Analitik</span>
                  <span className="text-[13px] font-medium text-zinc-400 mt-0.5">Segera hadir</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PRICELIST */}
        {activeTab === 'pricelist' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            
            {/* Minimalist Search Bar */}
            <div className="sticky top-[73px] z-20 bg-[#FDFDFD] pb-3 pt-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Cari nama atau part number..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 text-[15px] font-medium placeholder:font-normal placeholder:text-zinc-400 shadow-sm transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {isEditMode && (
                <div className="mt-3 bg-zinc-50 border border-zinc-200 p-3 rounded-2xl flex justify-between items-center">
                  <span className="text-[13px] text-zinc-600 font-medium px-2">Mode pengelolaan aktif</span>
                  <button onClick={openAddModal} className="px-4 py-2 bg-zinc-900 text-white font-medium text-[13px] rounded-xl hover:bg-zinc-800 transition-colors">
                    Tambah Baru
                  </button>
                </div>
              )}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-20">
                <p className="text-zinc-500 text-[15px] font-medium">Data tidak ditemukan.</p>
              </div>
            )}

            {/* List Container - Clean iOS-like cards */}
            <div className="space-y-3 pb-6">
              {filteredItems.map(item => (
                <div key={item.pn} className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[15px] text-zinc-900 leading-snug break-words pr-2">{item.description}</h3>
                      <div className="text-[13px] font-medium text-zinc-500 mt-1">PN: {item.pn}</div>
                    </div>
                    {isEditMode && (
                      <button 
                        onClick={() => openEditModal(item)}
                        className="shrink-0 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 p-2 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                      </button>
                    )}
                  </div>
                  <div className="pt-3 border-t border-zinc-100 flex justify-between items-center">
                    <div className="text-[13px] text-zinc-500 font-medium">Qty: {item.qty}</div>
                    <div className="text-[15px] font-semibold text-zinc-900">
                      {item.price === "0" || !item.price ? "-" : item.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: DRAFT */}
        {activeTab === 'draft' && (
          <div className="space-y-6 pb-6 animate-in fade-in duration-500">
            
            {/* Input Add Order */}
            <div className="relative z-30">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </div>
              <input 
                type="text" 
                placeholder="Cari part untuk ditambahkan..."
                className="w-full px-5 py-4 pl-12 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[15px] font-medium placeholder:font-normal placeholder:text-zinc-400 shadow-sm"
                value={draftQuery}
                onChange={(e) => {
                  setDraftQuery(e.target.value);
                  setShowDraftDropdown(true);
                }}
                onFocus={() => setShowDraftDropdown(true)}
              />
              
              {/* Dropdown Search Results */}
              {showDraftDropdown && draftQuery && draftSearchItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-200 z-50 max-h-[60vh] overflow-y-auto">
                  {draftSearchItems.map(item => (
                    <div key={item.pn} className="w-full text-left px-5 py-4 border-b border-zinc-100 last:border-0 flex flex-col gap-3">
                      <div>
                        <div className="text-[14px] font-semibold text-zinc-900 leading-snug">{item.description}</div>
                        <div className="text-[12px] font-medium text-zinc-500 mt-0.5">PN: {item.pn}</div>
                      </div>
                      {selectedDraftItem?.pn === item.pn ? (
                        <div className="flex gap-2 mt-1">
                          <input 
                            type="number" min="1" autoFocus
                            className="w-20 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-center font-semibold text-[14px] focus:outline-none focus:border-zinc-400"
                            value={qtyInput} onChange={(e) => setQtyInput(e.target.value)}
                          />
                          <button onClick={() => handleAddToCart(item)} className="px-4 py-2 bg-zinc-900 text-white text-[13px] font-medium rounded-xl flex-1 hover:bg-zinc-800 transition-colors">Tambah</button>
                          <button onClick={() => setSelectedDraftItem(null)} className="px-4 py-2 bg-zinc-100 text-zinc-600 text-[13px] font-medium rounded-xl hover:bg-zinc-200 transition-colors">Batal</button>
                        </div>
                      ) : (
                        <button onClick={() => { setSelectedDraftItem(item); setQtyInput('1'); }} className="w-fit px-4 py-2 bg-zinc-50 border border-zinc-200 text-zinc-700 text-[12px] font-medium rounded-xl hover:bg-zinc-100 transition-colors">
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

            <div className="flex justify-between items-end mb-2 px-1">
              <h2 className="text-[14px] font-semibold text-zinc-900">Daftar Item ({cart.length})</h2>
              {cart.length > 0 && (
                <button onClick={clearDraft} className="text-[13px] font-medium text-red-500 hover:text-red-600 transition-colors">
                  Hapus Semua
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200">
                <p className="text-zinc-900 text-[15px] font-medium">Belum ada pesanan</p>
                <p className="text-zinc-500 text-[13px] mt-1">Cari barang di atas untuk menambahkan.</p>
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
                      <div className="text-[12px] font-medium text-zinc-500">PN: {item.pn}</div>
                    </div>
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <div className="text-[15px] font-semibold text-zinc-900 bg-zinc-50 px-3 py-1 rounded-lg border border-zinc-100">
                        {item.qty} <span className="text-[11px] text-zinc-400 ml-1">PCS</span>
                      </div>
                      <button onClick={() => removeFromCart(item.pn)} className="text-[12px] font-medium text-red-500 hover:text-red-600">
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* CRUD MODAL - Clean, Native aesthetic */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowItemModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-8">
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-5">{modalItem ? 'Edit Informasi Barang' : 'Tambah Barang Baru'}</h2>
            
            <form onSubmit={saveItem} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Part Number</label>
                <input 
                  type="text" required
                  disabled={!!modalItem}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px] disabled:bg-zinc-50 disabled:text-zinc-500"
                  value={formData.pn} onChange={e => setFormData({...formData, pn: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Deskripsi Lengkap</label>
                <textarea 
                  required rows="3"
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px] resize-none"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Harga</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px]"
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Isi per Dus</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px]"
                    value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 mt-2 flex gap-3">
                {modalItem && (
                  <button type="button" onClick={deleteItem} className="px-4 py-3 text-red-600 bg-red-50 rounded-xl font-medium text-[14px] hover:bg-red-100 transition-colors">
                    Hapus
                  </button>
                )}
                <div className="flex-1 flex gap-3">
                  <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 py-3 text-zinc-600 bg-zinc-100 rounded-xl font-medium text-[14px] hover:bg-zinc-200 transition-colors">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-medium text-[14px] hover:bg-zinc-800 transition-colors">Simpan</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Minimalist */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#FDFDFD]/90 border-t border-zinc-200/60 pb-safe pt-2 backdrop-blur-xl z-40">
        <div className="max-w-md mx-auto flex justify-around items-center px-2 pb-5 pt-1">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 w-16 p-2 rounded-xl transition-all ${activeTab === 'home' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <svg className="w-[22px] h-[22px]" fill={activeTab === 'home' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'home' ? "0" : "2"} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span className="text-[11px] font-medium">Home</span>
          </button>

          <button onClick={() => setActiveTab('pricelist')} className={`flex flex-col items-center gap-1 w-16 p-2 rounded-xl transition-all ${activeTab === 'pricelist' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <svg className="w-[22px] h-[22px]" fill={activeTab === 'pricelist' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'pricelist' ? "0" : "2"} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            <span className="text-[11px] font-medium">Pricelist</span>
          </button>

          <button onClick={() => setActiveTab('draft')} className={`flex flex-col items-center gap-1 w-16 p-2 rounded-xl relative transition-all ${activeTab === 'draft' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}>
            <div className="relative">
              <svg className="w-[22px] h-[22px]" fill={activeTab === 'draft' ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === 'draft' ? "0" : "2"} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-semibold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                  {cart.length}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium">Order</span>
          </button>
        </div>
      </nav>

    </div>
  );
}

export default App;
