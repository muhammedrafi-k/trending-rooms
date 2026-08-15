import React from 'react';
import { Activity, Flame, MessageSquare, Plus, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'feed' | 'rooms' | 'dms';
  onChangeTab: (tab: 'feed' | 'rooms' | 'dms') => void;
  onOpenCreateRoom: () => void;
  onOpenCreatePost?: () => void;
  onOpenProfile: () => void;
  activeRoomsCount: number;
  unreadDmsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenCreateRoom,
  onOpenCreatePost,
  onOpenProfile,
  activeRoomsCount,
  unreadDmsCount = 0,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 text-slate-300 shadow-2xl">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {/* Live Feed Tab */}
        <button
          onClick={() => onChangeTab('feed')}
          className={`flex flex-col items-center justify-center gap-1 w-16 py-1 rounded-xl transition ${
            activeTab === 'feed'
              ? 'text-orange-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Activity className="w-5 h-5" />
            {activeTab === 'feed' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            )}
          </div>
          <span className="text-[11px]">Live Feed</span>
        </button>

        {/* Rooms Tab */}
        <button
          onClick={() => onChangeTab('rooms')}
          className={`flex flex-col items-center justify-center gap-1 w-16 py-1 rounded-xl transition ${
            activeTab === 'rooms'
              ? 'text-orange-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Flame className="w-5 h-5" />
            {activeRoomsCount > 0 && (
              <span className="absolute -top-1.5 -right-3 px-1.5 py-0.2 bg-orange-600 text-white text-[9px] font-black rounded-full">
                {activeRoomsCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">Rooms</span>
        </button>

        {/* Create Button (Center Contextual) */}
        <button
          onClick={() => {
            if (activeTab === 'feed' && onOpenCreatePost) {
              onOpenCreatePost();
            } else {
              onOpenCreateRoom();
            }
          }}
          className="flex flex-col items-center justify-center -mt-5"
          title={activeTab === 'feed' ? 'Create Live Post' : 'Create Live Room'}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 transition transform active:scale-90 border-2 border-slate-900">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] text-slate-400 font-bold mt-1">
            {activeTab === 'feed' ? 'Post' : 'Room'}
          </span>
        </button>

        {/* Private DMs Tab */}
        <button
          onClick={() => onChangeTab('dms')}
          className={`flex flex-col items-center justify-center gap-1 w-16 py-1 rounded-xl transition ${
            activeTab === 'dms'
              ? 'text-orange-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {unreadDmsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-red-500 text-white text-[9px] font-black rounded-full animate-bounce">
                {unreadDmsCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">Direct Chat</span>
        </button>

        {/* Profile / Registration Tab */}
        <button
          onClick={onOpenProfile}
          className="flex flex-col items-center justify-center gap-1 w-20 py-1 text-slate-400 hover:text-slate-200 transition"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] sm:text-[11px] truncate">Registration / Login</span>
        </button>
      </div>
    </nav>
  );
};
