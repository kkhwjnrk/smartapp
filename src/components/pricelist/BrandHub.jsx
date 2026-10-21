import React from 'react';
import { BRANDS } from '../../constants/brands';

function BrandHub({ brandCounts = {}, onSelectBrand }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-8">
      {/* Header Section: Bersih, Minimalis & Profesional */}
      <div className="px-1 pt-1 pb-0.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[19px] font-bold text-zinc-900 tracking-tight">Katalog Pricelist</h2>
            <p className="text-[13px] text-zinc-500 mt-0.5 font-normal">
              Pilih brand untuk melihat daftar part dan rincian harga
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-100/90 border border-zinc-200/70 px-3 py-1.5 rounded-full text-[11px] font-semibold text-zinc-600 shrink-0 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{BRANDS.length} Brand</span>
          </div>
        </div>
      </div>

      {/* Grid Kartu Brand Modern */}
      <div className="space-y-3.5">
        {BRANDS.map(brand => {
          const itemCount = brandCounts[brand.id] || 0;
          return (
            <div
              key={brand.id}
              onClick={() => onSelectBrand(brand.id)}
              className="group relative bg-white border border-zinc-200/80 hover:border-zinc-300/90 rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.985]"
            >
              {/* Baris Atas: Inisial Solid + Nama & Tagline Brand + Badge Status Part */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Avatar Inisial Brand Solid */}
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[17px] text-white tracking-wider shadow-sm shrink-0 select-none transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: brand.accentColor }}
                  >
                    {brand.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[17px] font-bold text-zinc-900 tracking-tight group-hover:text-zinc-950 truncate">
                      {brand.name}
                    </h3>
                    <p className="text-[12px] font-medium text-zinc-500 truncate mt-0.5">
                      {brand.tagline}
                    </p>
                  </div>
                </div>

                {/* Badge Total Item */}
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/70 shrink-0 whitespace-nowrap">
                  {itemCount > 0 ? `${itemCount.toLocaleString('id-ID')} Part` : 'Katalog Baru'}
                </span>
              </div>

              {/* Deskripsi Brand */}
              <p className="text-[13px] text-zinc-600 leading-relaxed mb-4 font-normal">
                {brand.description}
              </p>

              {/* Footer Card: Info Diskon & Aksi Buka */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2 font-medium text-zinc-500 truncate pr-2">
                  <span 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: brand.accentColor }} 
                  />
                  <span className="truncate">{brand.discountLabel}</span>
                </div>

                <div 
                  className="flex items-center gap-1 font-bold shrink-0 transition-transform group-hover:translate-x-1"
                  style={{ color: brand.accentColor }}
                >
                  <span>Buka Katalog</span>
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
