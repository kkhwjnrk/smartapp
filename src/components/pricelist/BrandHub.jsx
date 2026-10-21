import React from 'react';
import { BRANDS } from '../../constants/brands';

function BrandHub({ brandCounts = {}, onSelectBrand }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-8">
      {/* Hub Title & Subheading */}
      <div className="px-1 pt-1 pb-1">
        <h2 className="text-[22px] font-bold text-zinc-900 tracking-tight">Katalog Brand</h2>
        <p className="text-[13px] text-zinc-500 font-normal mt-0.5 leading-relaxed">
          Pilih brand untuk melihat daftar part number, harga HET resmi, dan skema diskon.
        </p>
      </div>

      {/* Grid Kartu Brand */}
      <div className="space-y-3.5">
        {BRANDS.map(brand => {
          const itemCount = brandCounts[brand.id] || 0;
          return (
            <div
              key={brand.id}
              onClick={() => onSelectBrand(brand.id)}
              className="group relative bg-white border border-zinc-200/80 hover:border-zinc-300/90 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.985]"
            >
              {/* Baris Atas: Solid Brand Color + Nama Brand + Badge Total Item */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3.5">
                  {/* Warna Solid Brand (Tanpa Inisial) */}
                  <div 
                    className="w-11 h-11 rounded-2xl shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: brand.accentColor }}
                    aria-label={`Brand color ${brand.name}`}
                  />

                  <div>
                    <h3 className="text-[18px] font-bold text-zinc-900 tracking-tight group-hover:text-zinc-950">
                      {brand.name}
                    </h3>
                    <p className="text-[12px] font-medium text-zinc-500 mt-0.5">
                      {brand.tagline}
                    </p>
                  </div>
                </div>

                {/* Badge Total Item */}
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${brand.theme.badge}`}>
                  {itemCount > 0 ? `${itemCount} Part` : 'Katalog Baru'}
                </span>
              </div>

              {/* Deskripsi Brand */}
              <p className="text-[13px] text-zinc-600 leading-relaxed mb-4">
                {brand.description}
              </p>

              {/* Footer Card: Skema Diskon & Tombol Aksi */}
              <div className="pt-3.5 border-t border-zinc-100 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-1.5 font-medium text-zinc-500 truncate pr-2">
                  <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="truncate">{brand.discountLabel}</span>
                </div>

                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 group-hover:translate-x-1 shrink-0"
                  style={{ backgroundColor: `${brand.accentColor}12`, color: brand.accentColor }}
                  title={`Buka katalog ${brand.name}`}
                >
                  <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
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
