import React from 'react';
import { Radio, Plus, User, Shield, Database, Download, Bell, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentUser: UserProfile;
  activeTab?: 'feed' | 'rooms' | 'dms';
  onOpenCreateRoom: () => void;
  onOpenCreatePost?: () => void;
  onOpenProfileModal: () => void;
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
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab = 'rooms',
  onOpenCreateRoom,
  onOpenCreatePost,
  onOpenProfileModal,
  onOpenAdminPanel,
  onOpenSupabaseModal,
  onHardRefresh,
  isRefreshing = false,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenDownloadModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-red-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-none flex items-center gap-1">
                <span>Trending Rooms</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider border border-emerald-200">
                  Live
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 hidden xs:block">
                Campus Network
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Hard Refresh Button */}
            {onHardRefresh && (
              <button
                onClick={onHardRefresh}
                disabled={isRefreshing}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1 active:scale-95 disabled:opacity-50"
                title="Hard Refresh: Pull Fresh Campus Data from Database"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
                <span className="hidden lg:inline text-[11px]">Sync Data</span>
              </button>
            )}

            {/* App Download Button */}
            {onOpenDownloadModal && (
              <button
                onClick={onOpenDownloadModal}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition flex items-center gap-1"
                title="Download / Install Web App"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                <span className="hidden md:inline">Download App</span>
              </button>
            )}

            {/* Notifications Bell */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition"
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

            {/* Supabase Integration Modal Trigger (Developer/Admin Only) */}
            {onOpenSupabaseModal && currentUser.isAdmin && (
              <button
                onClick={onOpenSupabaseModal}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition"
                title="Supabase PostgreSQL & Realtime Channel Status"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xl:inline">Supabase DB</span>
              </button>
            )}

            {/* Developer / Admin Control Panel */}
            {currentUser.isAdmin && (
              <button
                onClick={onOpenAdminPanel}
                className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white border border-purple-500 text-[11px] sm:text-xs font-black shadow-xs transition active:scale-95"
                title="Developer Dashboard"
              >
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200 fill-purple-400/30 animate-pulse shrink-0" />
                <span className="hidden sm:inline">Dev Dashboard</span>
                <span className="sm:hidden text-[10px]">Dev</span>
              </button>
            )}

            {/* Profile Button */}
            <button
              onClick={onOpenProfileModal}
              className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition flex items-center gap-1 ${
                currentUser.isRegistered
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
              }`}
              title={currentUser.isRegistered ? 'Registration / Login & Settings' : 'Registration / Login'}
            >
              <User className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-orange-600 shrink-0" />
              <span className="max-w-[110px] sm:max-w-[140px] truncate hidden sm:inline">
                {currentUser.isRegistered ? `@${currentUser.username}` : 'Registration / Login'}
              </span>
            </button>

            {/* Create Room / Post Button */}
            {activeTab === 'feed' ? (
              <button
                onClick={onOpenCreatePost}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Post</span>
              </button>
            ) : (
              <button
                onClick={onOpenCreateRoom}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
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
