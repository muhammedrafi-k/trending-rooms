import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Shield,
  Database,
  Bell,
  RefreshCw,
  Search,
  MoreVertical,
  Info,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentUser: UserProfile;
  activeTab?: 'feed' | 'rooms' | 'dms';
  onOpenCreateRoom: () => void;
  onOpenCreatePost?: () => void;
  onOpenProfileModal?: () => void;
  onOpenAdminPanel: () => void;
  onOpenSupabaseModal?: () => void;
  onLogout?: () => void;
  onOpenDirectMessages?: () => void;
  onHardRefresh?: () => void;
  isRefreshing?: boolean;
  unreadDmsCount?: number;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenDownloadModal?: () => void;
  onOpenSearchModal?: () => void;
  onOpenAboutUsModal?: () => void;
  onOpenPrivacyPolicyModal?: () => void;
  onOpenContactUsModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab = 'rooms',
  onOpenCreateRoom,
  onOpenCreatePost,
  onOpenAdminPanel,
  onOpenSupabaseModal,
  onHardRefresh,
  isRefreshing = false,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenDownloadModal,
  onOpenSearchModal,
  onOpenAboutUsModal,
  onOpenPrivacyPolicyModal,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-2">
          {/* Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 group cursor-pointer select-none">
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 shrink-0 transform group-hover:scale-105 transition-transform duration-200 border border-amber-300/30">
                <span className="text-lg sm:text-xl font-black filter drop-shadow">⚡</span>
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border-2 border-white"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-xl font-black tracking-tighter bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 bg-clip-text text-transparent drop-shadow-xs flex items-center">
                  SPIKES
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  LIVE
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 tracking-wide uppercase flex items-center gap-1">
                <span>Real-Time Pulse</span>
                <span>•</span>
                <span className="text-amber-600 font-bold">Live Community</span>
              </p>
            </div>
          </div>

          {/* Right Header Actions: Search -> Notifications -> 3-Dot Menu -> Sync -> Create */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Search Option (Profile lookup, post search, spike/room search) */}
            {onOpenSearchModal && (
              <button
                type="button"
                onClick={onOpenSearchModal}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Search profiles (@user), posts, or spikes"
              >
                <Search className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="hidden sm:inline text-slate-600 font-medium">Search...</span>
              </button>
            )}

            {/* Notifications Bell */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition cursor-pointer"
                title="Notifications & Mentions"
              >
                <Bell className="w-4 h-4 text-slate-700" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Three-Dot Menu (ONLY: About Us and Privacy Policy) */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowDropdown((prev) => !prev)}
                className={`p-1.5 sm:p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                  showDropdown
                    ? 'bg-orange-100 text-orange-800 border-orange-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="More Options"
              >
                <MoreVertical className="w-4 h-4 text-slate-700" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Download App */}
                  {onOpenDownloadModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDropdown(false);
                        onOpenDownloadModal();
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block font-bold">Download App</span>
                        <span className="text-[10px] text-slate-400 font-normal">Install on phone or desktop</span>
                      </div>
                    </button>
                  )}

                  {/* About Us */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      onOpenAboutUsModal?.();
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold">About Us</span>
                      <span className="text-[10px] text-slate-400 font-normal">Learn about Spikes</span>
                    </div>
                  </button>

                  {/* Privacy Policy */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      onOpenPrivacyPolicyModal?.();
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold">Privacy Policy</span>
                      <span className="text-[10px] text-slate-400 font-normal">Data & security guidelines</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Hard Refresh Button */}
            {onHardRefresh && (
              <button
                type="button"
                onClick={onHardRefresh}
                disabled={isRefreshing}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Sync and refresh live data"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
                <span className="hidden lg:inline text-[11px]">Sync</span>
              </button>
            )}

            {/* Create Room / Post Button */}
            {activeTab === 'feed' ? (
              <button
                type="button"
                onClick={onOpenCreatePost}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Post</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCreateRoom}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Room</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
