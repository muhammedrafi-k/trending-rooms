import React, { useState, useMemo } from 'react';
import { Search, Flame, Radio, Filter, MapPin, Sparkles, Plus, BarChart2, School, Award, Lock, Key, X, Check } from 'lucide-react';
import { TrendingRoom, CollegeInfo } from '../types';
import { RoomCard } from './RoomCard';

interface RoomListProps {
  rooms: TrendingRoom[];
  currentCollege: CollegeInfo;
  currentUserUsername?: string;
  isAdmin?: boolean;
  unlockedPrivateRoomIds: string[];
  onEnterRoom: (room: TrendingRoom) => void;
  onOpenCreateRoom: () => void;
  onOpenCollegeSelector: () => void;
  onJoinPrivateRoomWithCode: (codeOrLink: string) => { success: boolean; message: string };
  latestMessages: Record<string, string>;
}

export const RoomList: React.FC<RoomListProps> = ({
  rooms,
  currentCollege,
  currentUserUsername,
  isAdmin,
  unlockedPrivateRoomIds,
  onEnterRoom,
  onOpenCreateRoom,
  onOpenCollegeSelector,
  onJoinPrivateRoomWithCode,
  latestMessages,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showJoinPrivateModal, setShowJoinPrivateModal] = useState(false);
  const [privateInput, setPrivateInput] = useState('');
  const [privateError, setPrivateError] = useState('');
  const [privateSuccess, setPrivateSuccess] = useState('');

  const filterTabs = [
    { id: 'all', label: '🌐 All Campus Rooms', emoji: '🌐' },
    { id: 'auto', label: '🔥 Auto Trending', emoji: '🔥' },
    { id: 'student', label: '🎓 Student Created', emoji: '🎓' },
    { id: 'private', label: '🔒 My Private Rooms', emoji: '🔒' },
    { id: 'polls', label: '📊 Live Poll Rooms', emoji: '📊' },
    { id: 'fest', label: 'Fests & Events', emoji: '🎉' },
    { id: 'canteen', label: 'Canteen & Food', emoji: '🍛' },
    { id: 'exam', label: 'Exams & Academics', emoji: '📚' },
  ];

  const collegeRooms = useMemo(() => {
    // Filter rooms for current college (or all if custom)
    return rooms.filter((r) => r.collegeId === currentCollege.id || !r.collegeId);
  }, [rooms, currentCollege]);

  const filteredRooms = useMemo(() => {
    return collegeRooms.filter((room) => {
      // Check if room is private
      if (room.isPrivate) {
        const isCreator = currentUserUsername && room.creatorUsername === currentUserUsername;
        const isUnlocked = unlockedPrivateRoomIds.includes(room.id);
        const hasAccess = isAdmin || isCreator || isUnlocked;

        if (selectedFilter === 'private') {
          return hasAccess || room.isListedPublicly;
        }

        // In standard public tabs, show if publicly listed OR if user has unlocked/created it
        if (!room.isListedPublicly && !hasAccess) return false;
      } else {
        if (selectedFilter === 'private') return false;
      }

      // Filter tab
      if (selectedFilter === 'auto' && room.roomType !== 'auto_trending') return false;
      if (selectedFilter === 'student' && room.roomType !== 'student_created') return false;
      if (selectedFilter === 'polls' && !room.hasActivePoll) return false;
      if (
        ['fest', 'canteen', 'exam'].includes(selectedFilter) &&
        room.category !== selectedFilter
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = room.title.toLowerCase().includes(q);
        const matchArea = room.locationArea.toLowerCase().includes(q);
        const matchDesc = room.description.toLowerCase().includes(q);
        return matchTitle || matchArea || matchDesc;
      }

      return true;
    });
  }, [collegeRooms, selectedFilter, searchQuery, unlockedPrivateRoomIds, currentUserUsername, isAdmin]);

  const handleRoomCardClick = (room: TrendingRoom) => {
    if (room.isPrivate) {
      const isCreator = currentUserUsername && room.creatorUsername === currentUserUsername;
      const isUnlocked = unlockedPrivateRoomIds.includes(room.id);
      const hasAccess = isAdmin || isCreator || isUnlocked;

      if (!hasAccess) {
        setPrivateInput('');
        setPrivateError('');
        setPrivateSuccess('');
        setShowJoinPrivateModal(true);
        return;
      }
    }
    onEnterRoom(room);
  };

  return (
    <div className="space-y-6">
      {/* College Campus Network Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-extrabold">
              <Radio className="w-3.5 h-3.5 text-orange-400" />
              <span>Live Room</span>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {filteredRooms.length} Live Room{filteredRooms.length === 1 ? '' : 's'} Active
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Live Campus Rooms & Student Polls
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Zero friction • No join approvals • Instant campus engagement. Talk about fests, exam updates, bus delays, canteen reviews, and vote in live polls.
          </p>
        </div>
      </div>

      {/* Controls Bar: Search & Category Filter Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search active rooms (e.g., Biryani, Fest, Exam)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs font-medium text-slate-800 placeholder-slate-400 transition"
            />
          </div>

          {/* Actions: Join Private Room & Create Room */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                setPrivateError('');
                setPrivateSuccess('');
                setPrivateInput('');
                setShowJoinPrivateModal(true);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 font-extrabold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              title="Join Private Room with Invite Code"
            >
              <Key className="w-4 h-4 text-purple-600" />
              <span>Join Private Room</span>
            </button>

            <button
              onClick={onOpenCreateRoom}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <span>{currentCollege.shortName} Live Rooms</span>
          <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
            {filteredRooms.length}
          </span>
        </h3>

        <button
          onClick={onOpenCreateRoom}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 underline flex items-center gap-1"
        >
          <span>Start a new discussion or room</span>
        </button>
      </div>

      {/* Grid of Rooms */}
      {filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => {
            const isCreator = currentUserUsername && room.creatorUsername === currentUserUsername;
            const isUnlocked = unlockedPrivateRoomIds.includes(room.id);
            const hasAccess = !room.isPrivate || isAdmin || isCreator || isUnlocked;

            return (
              <RoomCard
                key={room.id}
                room={room}
                onEnterRoom={handleRoomCardClick}
                latestMessageText={latestMessages[room.id]}
                isUnlocked={hasAccess}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto font-bold">
            <School className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">
            No active rooms match this filter
          </h4>
          <p className="text-xs text-slate-500">
            Be the first student to start a live discussion room or launch a poll for {currentCollege.shortName}!
          </p>
          <button
            onClick={onOpenCreateRoom}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition"
          >
            🔥 Create Campus Room Now
          </button>
        </div>
      )}
      {/* Join Private Room Modal */}
      {showJoinPrivateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Join Private Room
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter Invite Code or Private Room Link
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowJoinPrivateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPrivateError('');
                setPrivateSuccess('');
                if (!privateInput.trim()) {
                  setPrivateError('Please enter an invite code or room link.');
                  return;
                }
                const res = onJoinPrivateRoomWithCode(privateInput.trim());
                if (res.success) {
                  setPrivateSuccess(res.message);
                  setTimeout(() => {
                    setShowJoinPrivateModal(false);
                  }, 800);
                } else {
                  setPrivateError(res.message);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Invite Code / Room URL
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={privateInput}
                    onChange={(e) => {
                      setPrivateError('');
                      setPrivateInput(e.target.value);
                    }}
                    placeholder="e.g. PRV-8A2F91 or paste join link..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs font-mono font-bold text-slate-900 placeholder-slate-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Private rooms are invite-only and protected by unique access keys.
                </p>
              </div>

              {privateError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                  {privateError}
                </div>
              )}

              {privateSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{privateSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinPrivateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-medium text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Key className="w-4 h-4" />
                  <span>Unlock & Join Room</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
