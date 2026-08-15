import React from 'react';
import { Users, MapPin, Clock, Flame, ChevronRight, BarChart2, ShieldAlert, Sparkles, Award, Lock } from 'lucide-react';
import { TrendingRoom } from '../types';
import { formatRelativeTime, getRoomExpirationText } from '../lib/distance';

interface RoomCardProps {
  room: TrendingRoom;
  onEnterRoom: (room: TrendingRoom) => void;
  latestMessageText?: string;
  isUnlocked?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onEnterRoom,
  latestMessageText,
  isUnlocked,
}) => {
  const expiry = getRoomExpirationText(room.lastActivityAt);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'fest':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'exam':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'canteen':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'bus':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'placement':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'complaint':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div
      onClick={() => onEnterRoom(room)}
      className="group relative bg-white rounded-2xl border border-slate-200 hover:border-orange-400 p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Top Badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Public vs Private Badge */}
            {room.isPrivate ? (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  isUnlocked
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : 'bg-amber-100 text-amber-950 border-amber-300'
                }`}
              >
                <Lock className="w-3 h-3 text-purple-700" />
                {isUnlocked ? '🔓 Private (Unlocked)' : '🔒 Locked (Code Required)'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                🌐 Public
              </span>
            )}

            {/* Active Poll Badge */}
            {room.hasActivePoll && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                <BarChart2 className="w-3 h-3 text-purple-600" />
                Poll Active
              </span>
            )}
          </div>

          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-slate-400" />
            {formatRelativeTime(room.lastActivityAt)}
          </span>
        </div>

        {/* Room Title */}
        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1 mb-1.5 flex items-center gap-1.5">
          <span>{room.title}</span>
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
          {room.description}
        </p>

        {/* Latest Chat Preview */}
        {latestMessageText && (
          <div className="bg-slate-50/90 rounded-xl p-2.5 mb-3 border border-slate-100 text-xs text-slate-600 italic line-clamp-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate">"{latestMessageText}"</span>
          </div>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Live People Counter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-bold text-xs">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>👥 {room.activePeopleCount} students</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>

          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60 truncate">
            📍 {room.locationArea}
          </span>
        </div>

        {/* Enter Indicator */}
        <div
          className={`flex items-center gap-0.5 text-xs font-bold transition-transform shrink-0 ${
            room.isPrivate && !isUnlocked
              ? 'text-amber-700 group-hover:translate-x-1'
              : 'text-orange-600 group-hover:translate-x-1'
          }`}
        >
          <span>{room.isPrivate && !isUnlocked ? 'Enter Code' : 'Enter'}</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center justify-between">
        <span>Campus Room • Active Discussion</span>
      </div>
    </div>
  );
};
