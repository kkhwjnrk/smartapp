import React from 'react';

function StoreCard({ store, isEditMode, onEdit, onDelete }) {
  const hasCoordinates = store.lat !== undefined && store.lat !== null && store.lat !== '' &&
                         store.lng !== undefined && store.lng !== null && store.lng !== '';

  const mapsUrl = hasCoordinates 
    ? `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`
    : null;

  return (
    <div 
      onClick={() => isEditMode && onEdit(store)}
      className={`bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-sm transition-all flex flex-col justify-between gap-3 ${
        isEditMode ? 'cursor-pointer hover:border-zinc-400 hover:shadow-md' : 'hover:shadow-md'
      }`}
    >
      {/* Header Card: Customer ID, Route Code & Actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {store.customerId && (
            <span className="px-2.5 py-0.5 bg-zinc-900 text-white rounded-lg text-[11px] font-bold font-mono tracking-tight shadow-xs">
              {store.customerId}
            </span>
          )}
          <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold tracking-wider ${
            store.routeCode 
              ? 'bg-orange-50 text-orange-700 border border-orange-200/70' 
              : 'bg-zinc-100 text-zinc-500 border border-zinc-200/60'
          }`}>
            {store.routeCode || 'TANPA RUTE'}
          </span>
          {hasCoordinates && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              GPS Aktif
            </span>
          )}
        </div>

        {/* Action buttons hanya muncul di Mode Edit */}
        {isEditMode && (
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onEdit(store)}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              title="Edit Toko"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(store)}
              className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              title="Hapus Toko"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Store Name & Owner */}
      <div>
        <h3 className="text-[16px] font-bold text-zinc-900 tracking-tight leading-snug">
          {store.name}
        </h3>
        {store.owner && (
          <p className="text-[13px] text-zinc-500 font-medium mt-0.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>PIC: {store.owner}</span>
          </p>
        )}
      </div>

      {/* Address */}
      {store.address && (
        <div className="text-[12.5px] text-zinc-600 flex items-start gap-1.5 leading-relaxed bg-zinc-50/70 p-2.5 rounded-xl border border-zinc-100">
          <svg className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-2">{store.address}</span>
        </div>
      )}

      {/* Notes / Patokan Rute */}
      {store.notes && (
        <div className="text-[11.5px] text-zinc-500 italic px-2.5 py-1.5 bg-amber-50/50 rounded-lg border border-amber-100/60">
          <span className="font-semibold text-amber-800 not-italic mr-1">Patokan:</span>
          {store.notes}
        </div>
      )}

      {/* Google Maps Action / Coordinate Status */}
      <div className="pt-1 border-t border-zinc-100 flex items-center justify-between gap-2 mt-1">
        {hasCoordinates ? (
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-[11px] text-zinc-400 font-mono truncate">
              {Number(store.lat).toFixed(4)}, {Number(store.lng).toFixed(4)}
            </span>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[12px] font-medium rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Buka Maps</span>
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-[11.5px] text-zinc-400 italic">
              Belum ada koordinat Maps
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(store);
              }}
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200/80 transition-colors active:scale-95"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Pasang Titik</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoreCard;
