import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Radio, Plus, School, Lock, Key, X, Check, CheckCircle2, Globe, Zap, Flame, Users, ArrowUpRight, ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react';
import { TrendingRoom, CollegeInfo } from '../types';
import { RoomCard } from './RoomCard';

interface RoomListProps {
  rooms: TrendingRoom[];
  currentCollege: CollegeInfo;
  currentUserUsername?: string;
  isAdmin?: boolean;
  unlockedPrivateRoomIds: string[];
  userCreatedRooms?: TrendingRoom[];
  onRequestRoomDeletion?: (roomId: string, reason: string) => void;
  onEnterRoom: (room: TrendingRoom) => void;
  onOpenCreateRoom: () => void;
  onOpenCollegeSelector: () => void;
  onJoinPrivateRoomWithCode: (codeOrLink: string) => { success: boolean; message: string };
  latestMessages: Record<string, string>;
}

export const RoomList: React.FC<RoomListProps> = ({
  rooms = [],
  currentCollege,
  currentUserUsername,
  isAdmin,
  unlockedPrivateRoomIds,
  userCreatedRooms = [],
  onRequestRoomDeletion,
  onEnterRoom,
  onOpenCreateRoom,
  onJoinPrivateRoomWithCode,
  latestMessages,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'spike' | 'active' | 'recent'>('spike');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleRoomsCount, setVisibleRoomsCount] = useState<number>(12);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [showJoinPrivateModal, setShowJoinPrivateModal] = useState(false);
  const [privateInput, setPrivateInput] = useState('');
  const [privateError, setPrivateError] = useState('');
  const [privateSuccess, setPrivateSuccess] = useState('');

  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  const collegeRooms = useMemo(() => {
    return rooms.filter((r) => r.collegeId === currentCollege.id || !r.collegeId);
  }, [rooms, currentCollege]);

  // Top Spiking Radar (Top 6 highest spike intensity rooms)
  const topSpikeRooms = useMemo(() => {
    return [...collegeRooms]
      .sort((a, b) => {
        const aScore = a.spikeVelocity || (a.activePeopleCount * 3);
        const bScore = b.spikeVelocity || (b.activePeopleCount * 3);
        return bScore - aScore;
      })
      .slice(0, 6);
  }, [collegeRooms]);

  // List of rooms the current user has joined or created
  const joinedRooms = useMemo(() => {
    if (!currentUserUsername || currentUserUsername === 'guest') return [];
    return collegeRooms.filter(
      (r) =>
        r.creatorUsername === currentUserUsername ||
        (Array.isArray(r.activeMembers) && r.activeMembers.includes(currentUserUsername))
    );
  }, [collegeRooms, currentUserUsername]);

  const joinedRoomsCount = joinedRooms.length;

  const filterTabs = [
    { id: 'all', label: 'All Rooms', emoji: '🌐' },
    { id: 'joined', label: `Joined (${joinedRoomsCount})`, emoji: '⚡' },
    { id: 'public', label: 'Public', emoji: '📢' },
    { id: 'private', label: 'Private Lockers', emoji: '🔒' },
    { id: 'polls', label: 'Live Polls', emoji: '📊' },
    { id: 'fest', label: 'Fests & Events', emoji: '🎉' },
    { id: 'canteen', label: 'Canteen & Food', emoji: '🍛' },
    { id: 'exam', label: 'Exams & Study', emoji: '📚' },
  ];

  const filteredAndSortedRooms = useMemo(() => {
    const list = collegeRooms.filter((room) => {
      const isCreator = currentUserUsername && room.creatorUsername === currentUserUsername;
      const isJoined =
        isCreator ||
        (Array.isArray(room.activeMembers) && room.activeMembers.includes(currentUserUsername || ''));
      const isUnlocked = unlockedPrivateRoomIds.includes(room.id);
      const hasAccess = isAdmin || isCreator || isUnlocked || isJoined;

      // Filter tabs
      if (selectedFilter === 'joined') {
        if (!isJoined) return false;
      } else if (selectedFilter === 'public') {
        if (room.isPrivate) return false;
      } else if (selectedFilter === 'private') {
        if (!room.isPrivate) return false;
      } else if (selectedFilter === 'polls') {
        if (!room.hasActivePoll) return false;
      } else if (['fest', 'canteen', 'exam'].includes(selectedFilter)) {
        if (room.category !== selectedFilter) return false;
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

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'spike') {
        const aScore = a.spikeVelocity || (a.activePeopleCount * 3);
        const bScore = b.spikeVelocity || (b.activePeopleCount * 3);
        return bScore - aScore;
      }
      if (sortBy === 'active') {
        return b.activePeopleCount - a.activePeopleCount;
      }
      // recent
      return new Date(b.lastActivityAt || b.createdAt).getTime() - new Date(a.lastActivityAt || a.createdAt).getTime();
    });
  }, [collegeRooms, selectedFilter, searchQuery, sortBy, unlockedPrivateRoomIds, currentUserUsername, isAdmin]);

  // Infinite Scroll IntersectionObserver for seamless loading
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleRoomsCount < filteredAndSortedRooms.length && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleRoomsCount((prev) => Math.min(prev + 12, filteredAndSortedRooms.length));
            setIsLoadingMore(false);
          }, 200);
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleRoomsCount, filteredAndSortedRooms.length, isLoadingMore]);

  const handleRoomCardClick = (room: TrendingRoom) => {
    onEnterRoom(room);
  };

  return (
    <div className="space-y-6">
      {/* Top High-Voltage Spikes Radar Carousel */}
      {topSpikeRooms.length > 0 && (
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 rounded-3xl p-5 sm:p-6 text-white shadow-2xl border border-amber-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/15 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

          {/* Radar Header */}
          <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/30">
                <Zap className="w-5 h-5 fill-slate-950 text-slate-950 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                    Live Spikes Radar
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-black border border-amber-500/30 uppercase">
                    ⚡ {collegeRooms.length} Rooms Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Instant velocity surges & active community conversation nodes
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Synced</span>
            </div>
          </div>

          {/* Horizontal Spikes Radar Carousel */}
          <div className="flex items-stretch gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x relative z-10">
            {topSpikeRooms.map((room, idx) => {
              const score = room.spikeVelocity || Math.min(99, 70 + (idx * 5));
              return (
                <div
                  key={room.id}
                  onClick={() => onEnterRoom(room)}
                  className="snap-start shrink-0 w-64 sm:w-72 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-4 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-black">
                        <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{score}% SPIKE</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {room.activePeopleCount} live
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1 mb-1 flex items-center gap-1.5">
                      <span className="text-base">{room.emoji || '⚡'}</span>
                      <span className="truncate">{room.title}</span>
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 truncate max-w-[140px]">
                      📍 {room.locationArea}
                    </span>
                    <span className="text-amber-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Jump In</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DEDICATED JOINED ROOMS SECTION */}
      {joinedRooms.length > 0 && selectedFilter === 'all' && (
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-50 border border-amber-400/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
                <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <span>My Joined Rooms</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[11px] font-mono font-bold">
                    {joinedRooms.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Quick access to active discussions and groups you participate in
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedFilter('joined')}
              className="text-xs font-black text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View all ({joinedRooms.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {joinedRooms.slice(0, 3).map((room) => {
              const isCreator = currentUserUsername && room.creatorUsername === currentUserUsername;
              return (
                <div
                  key={room.id}
                  onClick={() => onEnterRoom(room)}
                  className="bg-white hover:bg-amber-50/50 border border-amber-200/80 hover:border-amber-400 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-2xs group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-xl">{room.emoji || '⚡'}</span>
                      <div className="flex items-center gap-1.5">
                        {isCreator && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black">
                            👑 Host
                          </span>
                        )}
                        {room.deletionRequested && (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                            ⏳ Deletion Pending
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {room.activePeopleCount} live
                        </span>
                      </div>
                    </div>
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-amber-800 transition line-clamp-1">
                      {room.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      📍 {room.locationArea}
                    </p>
                  </div>

                  <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {room.isPrivate ? '🔒 Private Room' : '🌐 Public'}
                    </span>
                    <span className="text-amber-700 font-extrabold text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      <span>Open</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls Bar: Search, Sorters & Category Filter Tabs */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleRoomsCount(12);
              }}
              placeholder="Search rooms by title, topic, or location..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs font-medium text-slate-800 placeholder-slate-400 transition"
            />
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setSortBy('spike')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                sortBy === 'spike' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>⚡ Spike</span>
            </button>

            <button
              onClick={() => setSortBy('active')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                sortBy === 'active' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Active</span>
            </button>

            <button
              onClick={() => setSortBy('recent')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                sortBy === 'recent' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Recent</span>
            </button>
          </div>

          {/* Actions: Join with Code & Create Room */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                setPrivateError('');
                setPrivateSuccess('');
                setPrivateInput('');
                setShowJoinPrivateModal(true);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Join Private Room with Invite Code"
            >
              <Key className="w-4 h-4 text-purple-600" />
              <span>Code Join</span>
            </button>

            <button
              onClick={onOpenCreateRoom}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Room</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedFilter(tab.id);
                setVisibleRoomsCount(12);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Title & Live Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>{selectedFilter === 'joined' ? 'My Joined Rooms' : 'Explore Rooms'}</span>
            <span className="text-xs font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200">
              {filteredAndSortedRooms.length}
            </span>
          </h3>
        </div>

        <button
          onClick={onOpenCreateRoom}
          className="text-xs font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
        >
          <span>+ Launch new room</span>
        </button>
      </div>

      {/* Grid of Rooms */}
      {filteredAndSortedRooms.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSortedRooms.slice(0, visibleRoomsCount).map((room) => {
              const isCreator = currentUserUsername && room.creatorUsername === currentUserUsername;
              const isJoined =
                isCreator ||
                (Array.isArray(room.activeMembers) && room.activeMembers.includes(currentUserUsername || ''));
              const isUnlocked = unlockedPrivateRoomIds.includes(room.id);
              const hasAccess = !room.isPrivate || isAdmin || isCreator || isUnlocked || isJoined;

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

          {/* Infinite Scroll Load Sentinel */}
          {visibleRoomsCount < filteredAndSortedRooms.length && (
            <div ref={loadMoreSentinelRef} className="pt-4 pb-4 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium">
                Loading more live rooms ({visibleRoomsCount} / {filteredAndSortedRooms.length})...
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8 space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto font-black shadow-inner">
            <Zap className="w-7 h-7 fill-amber-500 text-amber-600" />
          </div>
          <h4 className="text-base font-black text-slate-900">
            {selectedFilter === 'joined'
              ? "You haven't joined any rooms yet"
              : 'No active rooms match this filter'}
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {selectedFilter === 'joined'
              ? 'Join any public conversation or create your own room to connect with peers!'
              : 'Launch a new discussion room to get the conversation started!'}
          </p>
          <button
            onClick={onOpenCreateRoom}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs shadow-md transition cursor-pointer"
          >
            ⚡ Create Room
          </button>
        </div>
      )}

      {/* Join Private Room Modal */}
      {showJoinPrivateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Join Private Room
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter Invite Code or Private Room Link
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowJoinPrivateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
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
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Invite Code / Room URL
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={privateInput}
                    onChange={(e) => {
                      setPrivateInput(e.target.value);
                      setPrivateError('');
                    }}
                    placeholder="e.g. PRV-849201 or room link"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-xs font-medium text-slate-900 uppercase"
                  />
                </div>
                {privateError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5">
                    {privateError}
                  </p>
                )}
                {privateSuccess && (
                  <p className="text-xs text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{privateSuccess}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowJoinPrivateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition cursor-pointer"
                >
                  Unlock & Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
