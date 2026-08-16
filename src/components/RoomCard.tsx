import React from 'react';
import { Users, MapPin, Clock, Flame, ChevronRight, BarChart2, Zap, Lock, Sparkles, Activity } from 'lucide-react';
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

  // Compute or fallback spike velocity score (10 to 99)
  const spikeScore = room.spikeVelocity || Math.min(99, Math.max(45, (room.activePeopleCount * 3) % 95 + 15));
  const isExtremeSpike = spikeScore >= 85;
  const isHighSpike = spikeScore >= 70 && spikeScore < 85;

  const rawTitle = room.title || '';
  // Strip duplicate leading emoji if present in room.title
  const cleanTitle = rawTitle.replace(/^(\p{Emoji}|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83E[\uDD00-\uDDFF])\s*/u, '').trim();
  const displayEmoji = room.emoji || '💬';

  return (
    <div
      onClick={() => onEnterRoom(room)}
      className="group relative bg-white hover:bg-slate-50/70 rounded-3xl border border-slate-200/90 hover:border-amber-400 p-5 sm:p-6 shadow-xs hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Top Spike Voltage Tag & Header Line */}
      <div>
        {/* UNIQUE SPIKE REPRESENTATION BANNER */}
        <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Dynamic Attractive Spike Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wide border transition-all ${
                isExtremeSpike
                  ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 text-orange-700 border-orange-400/40 shadow-xs'
                  : isHighSpike
                  ? 'bg-amber-500/15 text-amber-800 border-amber-400/40'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isExtremeSpike ? 'fill-amber-400 text-amber-500 animate-bounce' : 'fill-amber-400 text-amber-500'}`} />
              <span className="font-mono">{spikeScore}% SPIKE</span>
              {/* Micro Voltage Equalizer bars */}
              <span className="inline-flex items-center gap-0.5 ml-0.5">
                <span className="w-0.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
                <span className="w-0.5 h-3.5 bg-orange-500 rounded-full animate-pulse delay-75"></span>
                <span className="w-0.5 h-2 bg-rose-500 rounded-full animate-pulse delay-150"></span>
              </span>
            </div>

            {/* Public vs Private Lock Badge */}
            {room.isPrivate ? (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                  isUnlocked
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                <Lock className="w-3 h-3 text-purple-600" />
                {isUnlocked ? 'Unlocked' : 'Locked'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                🌐 Public
              </span>
            )}

            {/* Poll Active Badge */}
            {room.hasActivePoll && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                <BarChart2 className="w-3 h-3 text-purple-600" />
                Poll
              </span>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3 text-slate-400" />
            {formatRelativeTime(room.lastActivityAt)}
          </span>
        </div>

        {/* Room Title with Emoji */}
        <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1 mb-2 flex items-center gap-2">
          <span className="shrink-0 text-xl group-hover:scale-110 transition-transform duration-200">{displayEmoji}</span>
          <span className="truncate">{cleanTitle || rawTitle}</span>
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-2 mb-3.5 leading-relaxed font-normal">
          {room.description}
        </p>

        {/* Latest Chat Preview */}
        {latestMessageText && (
          <div className="bg-slate-50 group-hover:bg-white rounded-2xl p-2.5 mb-3.5 border border-slate-200/80 text-xs text-slate-700 italic line-clamp-1 flex items-center gap-2 transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping"></span>
            <span className="truncate font-medium">"{latestMessageText}"</span>
          </div>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Live People Counter & Location Area */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl border border-emerald-200/80 font-black text-xs shadow-2xs">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>{room.activePeopleCount} live</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100/90 px-2.5 py-1 rounded-xl border border-slate-200/60 truncate flex items-center gap-1 max-w-[140px]">
            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">{room.locationArea}</span>
          </span>
        </div>

        {/* Enter Action Button */}
        <div
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 shrink-0 ${
            room.isPrivate && !isUnlocked
              ? 'bg-purple-50 text-purple-700 border border-purple-200 group-hover:bg-purple-600 group-hover:text-white'
              : 'bg-orange-50 text-orange-600 border border-orange-200 group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-orange-600 group-hover:text-white'
          }`}
        >
          <span>{room.isPrivate && !isUnlocked ? 'View Code' : 'Enter'}</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
