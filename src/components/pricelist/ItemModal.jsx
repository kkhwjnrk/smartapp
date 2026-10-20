import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../../constants/categories';
import useSwipeBack from '../../hooks/useSwipeBack';

function ItemModal({ isOpen, modalItem, formData, setFormData, onSave, onDelete, onClose }) {
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => setHasEntered(true), 260);
    return () => clearTimeout(t);
  }, [isOpen]);

  const {
    containerRef,
    isSwiping,
    dragX,
    isExiting,
    containerStyle,
    backdropOpacity,
    handlers: swipeHandlers
  } = useSwipeBack({
    onBack: onClose,
    edgeWidth: 85,
    threshold: 70,
    enabled: isOpen
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 overflow-hidden">
      <div 
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        style={{
          opacity: dragX > 0 || isExiting ? backdropOpacity : undefined,
          transition: isSwiping ? 'none' : 'opacity 0.25s ease'
        }}
      />
      <div 
        ref={containerRef}
        {...swipeHandlers}
        style={containerStyle}
        className={`relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl ${
          !hasEntered && dragX === 0 && !isExiting ? 'animate-in fade-in slide-in-from-bottom-8 duration-200' : ''
        }`}
      >
        <h2 className="text-[18px] font-semibold text-zinc-900 mb-5">
          {modalItem ? 'Edit Informasi Barang' : 'Tambah Barang Baru'}
        </h2>
        
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Part Number</label>
            <input 
              type="text" required
              disabled={!!modalItem}
              className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px] disabled:bg-zinc-50 disabled:text-zinc-500 font-mono font-bold text-[#EA580C]"
              value={formData.pn} onChange={e => setFormData({ ...formData, pn: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Kategori</label>
            <select
              className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px]"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.filter(c => c !== 'Semua').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Deskripsi Lengkap</label>
            <textarea 
              required rows="3"
              className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px] resize-none"
              value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Harga (HET)</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px]"
                value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-zinc-600 mb-1.5">Isi per Dus/Karton</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all text-[14px]"
                value={formData.qty} onChange={e => setFormData({ ...formData, qty: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 mt-2 flex gap-3">
            {modalItem && (
              <button 
                type="button" 
                onClick={onDelete} 
                className="px-4 py-3 text-red-600 bg-red-50 rounded-xl font-medium text-[14px] hover:bg-red-100 transition-colors"
              >
                Hapus
              </button>
            )}
            <div className="flex-1 flex gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-3 text-zinc-600 bg-zinc-100 rounded-xl font-medium text-[14px] hover:bg-zinc-200 transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-medium text-[14px] hover:bg-zinc-800 transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemModal;
