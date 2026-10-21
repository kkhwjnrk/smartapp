import React from 'react';
import { BRANDS } from '../../constants/brands';

function BrandHub({ brandCounts = {}, onSelectBrand }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-8">
      {/* Hero / Header Card */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white p-5 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10 inline-block mb-2">
            Pricelist Distributor
          </span>
          <h2 className="text-[20px] font-bold tracking-tight">Katalog Resmi Multi-Brand</h2>
          <p className="text-[13px] text-zinc-300 mt-1 leading-relaxed">
            Pilih brand untuk melihat daftar part number, harga HET resmi, serta skema diskon grosir.
          </p>
        </div>
      </div>

      {/* Grid Kartu Brand */}
      <div className="space-y-3.5">
        {BRANDS.map(brand => {
          const itemCount = brandCounts[brand.id] || 0;
          return (
            <div
              key={brand.id}
              onClick={() => onSelectBrand(brand.id)}
              className="group relative bg-white border border-zinc-200/90 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all duration-200 cursor-pointer active:scale-[0.985]"
            >
              {/* Baris Atas: Logo/Inisial Brand + Badge Jumlah Item */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar / Icon Brand */}
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[18px] tracking-tight shadow-2xs select-none"
                    style={{
                      backgroundColor: `${brand.accentColor}15`,
                      color: brand.accentColor,
                      border: `1.5px solid ${brand.accentColor}30`
                    }}
                  >
                    {brand.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="text-[18px] font-bold text-zinc-900 tracking-tight group-hover:text-zinc-950 flex items-center gap-2">
                      <span>{brand.name}</span>
                      {brand.id === 'daytona' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-[#EA580C] border border-orange-200/60 uppercase">
                          Utama
                        </span>
                      )}
                      {brand.id === 'dura' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 border border-sky-200/60 uppercase">
                          1 Grup
                        </span>
                      )}
                    </h3>
                    <p className="text-[12px] font-medium text-zinc-500">
                      {brand.tagline}
                    </p>
                  </div>
                </div>

                {/* Badge Total Item */}
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${brand.theme.badge}`}>
                  {itemCount > 0 ? `${itemCount} Item` : 'Katalog Baru'}
                </span>
              </div>

              {/* Deskripsi Brand */}
              <p className="text-[13px] text-zinc-600 leading-relaxed mb-4">
                {brand.description}
              </p>

              {/* Footer Card: Skema Diskon & Tombol Aksi */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-1.5 font-medium text-zinc-500 truncate pr-2">
                  <svg className="w-4 h-4 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="truncate">{brand.discountLabel}</span>
                </div>

                <div 
                  className="flex items-center gap-1 font-bold shrink-0 transition-transform group-hover:translate-x-1"
                  style={{ color: brand.accentColor }}
                >
                  <span>Buka</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BrandHub;
