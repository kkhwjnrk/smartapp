import React, { useState, useEffect } from 'react';

function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Hanya tampilkan jika di browser iOS (bukan mode standalone PWA)
    const isIos = typeof window !== 'undefined' && /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = typeof window !== 'undefined' && (
      (window.navigator.standalone === true) || 
      window.matchMedia('(display-mode: standalone)').matches
    );
    const isDismissed = localStorage.getItem('daytona_pwa_dismissed');

    // Tampilkan hanya jika di iOS Safari dan belum dipasang ke Home Screen
    if (isIos && !isStandalone && !isDismissed) {
      // Beri sedikit jeda agar tidak langsung mengagetkan saat pertama buka
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    // Simpan di localStorage agar tidak terus muncul
    localStorage.setItem('daytona_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-zinc-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-zinc-800">
        <div className="flex items-start gap-3">
          
          {/* Ikon Aplikasi Squircle */}
          <div className="w-10 h-10 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-black italic text-[17px] shrink-0 shadow-md">
            D
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[13.5px] text-white leading-tight">
                Pasang di Layar Utama iPhone
              </h4>
              <button 
                onClick={handleDismiss} 
                className="text-zinc-400 hover:text-white p-1 -mr-1"
                aria-label="Tutup"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-[12px] text-zinc-300 mt-1 leading-snug">
              Buka aplikasi tanpa bar browser Safari:
            </p>
            
            <div className="mt-2.5 flex items-center gap-2 text-[11.5px] text-zinc-300 bg-zinc-800/80 p-2 rounded-xl border border-zinc-700/60">
              <span>1. Ketuk ikon <strong>Share</strong></span>
              <span className="p-1 bg-zinc-700 rounded text-blue-400 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </span>
              <span>2. Pilih <strong>Tambahkan ke Layar Utama</strong></span>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-[12px] font-semibold text-[#EA580C] hover:text-orange-400 transition-colors"
              >
                Sudah Saya Pasang / Nanti Saja
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default IosInstallPrompt;
