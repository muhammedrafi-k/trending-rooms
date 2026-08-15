import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Globe, CheckCircle2, ShieldCheck, Share2, Sparkles, X, Apple, Play } from 'lucide-react';

interface AppDownloadModalProps {
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'To install Trending Rooms on your mobile home screen:\n\n' +
        '• On iOS (Safari): Tap the Share button 📤 and choose "Add to Home Screen" 📲.\n' +
        '• On Android (Chrome): Tap the menu ⋮ and select "Install app" or "Add to Home screen".'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-slate-100 relative my-auto max-h-[85vh] flex flex-col">
        
        {/* Header visual */}
        <div className="bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-white text-orange-600 font-black flex items-center justify-center text-3xl mx-auto shadow-xl shadow-orange-950/30 border-2 border-white/40 mb-3">
            🔥
          </div>
          <h2 className="text-xl font-black tracking-tight">Download Trending Rooms App</h2>
          <p className="text-xs text-orange-100 mt-1">
            Install the Web App directly on your Phone or Desktop
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Status card */}
          {isInstalled ? (
            <div className="bg-emerald-950/80 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs text-white">App is Installed!</h4>
                <p className="text-[11px] text-emerald-300">You are running the official Progressive Web App.</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Instant Installation (PWA / Android / iOS)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enjoy zero app store downloads, offline access, outside push notifications, and high-speed campus feeds.
              </p>

              <button
                onClick={handleInstallClick}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/25 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{deferredPrompt ? 'Install App Now' : 'Add to Mobile Home Screen'}</span>
              </button>
            </div>
          )}

          {/* Device Instructions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Installation Guides by Device
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* Android */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Android (Chrome)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Tap Chrome menu (⋮) → <strong className="text-slate-200">"Install app"</strong> or <strong className="text-slate-200">"Add to Home screen"</strong>.
                </p>
              </div>

              {/* iOS */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-blue-400">
                  <Apple className="w-4 h-4" />
                  <span>iOS (Safari)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Tap Safari Share button (📤) → <strong className="text-slate-200">"Add to Home Screen"</strong> (📲).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
