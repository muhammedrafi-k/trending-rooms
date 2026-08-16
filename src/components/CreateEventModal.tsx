import React, { useState } from 'react';
import { X, MapPin, School, Plus, Lock, Globe, Key, AlertCircle, Trash2, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { CollegeInfo, RoomCategory, TrendingRoom } from '../types';

interface CreateEventModalProps {
  currentCollege: CollegeInfo;
  currentUserUsername?: string;
  userCreatedRooms?: TrendingRoom[];
  onRequestRoomDeletion?: (roomId: string, reason: string) => void;
  onCancelRoomDeletionRequest?: (roomId: string) => void;
  onClose: () => void;
  onCreateRoom: (room: TrendingRoom) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  currentCollege,
  currentUserUsername,
  userCreatedRooms = [],
  onRequestRoomDeletion,
  onCancelRoomDeletionRequest,
  onClose,
  onCreateRoom,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RoomCategory>('canteen');
  const [description, setDescription] = useState('');
  const [locationArea, setLocationArea] = useState('Main Area');
  const [creatorName, setCreatorName] = useState(currentUserUsername || 'User');
  const [isPrivate, setIsPrivate] = useState(false);

  // Deletion request inline state
  const [requestingDeletionRoomId, setRequestingDeletionRoomId] = useState<string | null>(null);
  const [deletionReason, setDeletionReason] = useState('');

  const isLimitReached = userCreatedRooms.length >= 2;

  const categoryOptions: { id: RoomCategory; label: string; emoji: string }[] = [
    { id: 'canteen', label: 'Canteen / Food', emoji: '🍛' },
    { id: 'fest', label: 'Fest / Cultural', emoji: '🎉' },
    { id: 'exam', label: 'Exam / Academics', emoji: '📚' },
    { id: 'bus', label: 'Bus / Travel', emoji: '🚍' },
    { id: 'placement', label: 'Placement & Career', emoji: '💼' },
    { id: 'complaint', label: 'Issues & Reports', emoji: '🚰' },
    { id: 'sports', label: 'Sports & Games', emoji: '🏆' },
    { id: 'general', label: 'General Chat', emoji: '💬' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLimitReached) return;

    const catObj = categoryOptions.find((c) => c.id === category);
    const emoji = catObj?.emoji || '💬';
    const nowIso = new Date().toISOString();

    const inviteCode = isPrivate
      ? `PRV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      : undefined;

    const creatorUser = currentUserUsername || '';

    const newRoom: TrendingRoom = {
      id: `room-${currentCollege.id}-${Date.now()}`,
      collegeId: currentCollege.id,
      title: title.trim(),
      category,
      roomType: 'user_created',
      emoji,
      locationArea: locationArea.trim() || currentCollege.area,
      activePeopleCount: 1,
      createdAt: nowIso,
      lastActivityAt: nowIso,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description:
        description.trim() ||
        `Discussion room for ${currentCollege.shortName}.`,
      isLiveNow: true,
      isPrivate,
      inviteCode,
      allowedUsers: creatorUser ? [creatorUser] : [],
      activeMembers: creatorUser ? [creatorUser] : [],
      roomLogs: creatorUser
        ? [
            {
              id: `log-${Date.now()}`,
              roomId: `room-${currentCollege.id}-${Date.now()}`,
              username: creatorUser,
              displayName: creatorName.trim() || `@${creatorUser}`,
              action: 'created',
              timestamp: nowIso,
            },
          ]
        : [],
      hasActivePoll: false,
      creatorName: creatorName.trim() || (creatorUser ? `@${creatorUser}` : 'Community Member'),
      creatorUsername: creatorUser || undefined,
      roomAdmins: [],
      topContributor: {
        name: creatorName.trim() || (creatorUser ? `@${creatorUser}` : 'Community Member'),
        badge: 'Room Creator',
      },
    };

    onCreateRoom(newRoom);
    onClose();
  };

  const handleConfirmRequestDeletion = (roomId: string) => {
    if (!onRequestRoomDeletion) return;
    const finalReason = deletionReason.trim() || 'Requesting room deletion to free up a room creation slot.';
    onRequestRoomDeletion(roomId, finalReason);
    setRequestingDeletionRoomId(null);
    setDeletionReason('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20 flex items-center justify-center font-bold shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900 text-base truncate">
                {isLimitReached ? 'Room Creation Limit Reached' : 'Create Live Room'}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{currentCollege.shortName} ({currentCollege.name})</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-ROOM LIMIT WORKFLOW */}
        {isLimitReached ? (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-black text-sm text-amber-950">
                  Maximum 2 Active Rooms Per User (2/2 Used)
                </p>
                <p className="text-amber-800 leading-relaxed">
                  To prevent clutter and keep active discussions organized, each user is limited to hosting <strong>2 rooms</strong> at a time. To launch a new room, please request deletion of one of your existing rooms below.
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                Your Active Created Rooms ({userCreatedRooms.length}/2)
              </h4>

              <div className="space-y-3">
                {userCreatedRooms.map((room) => {
                  const isRequestingThis = requestingDeletionRoomId === room.id;

                  return (
                    <div
                      key={room.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 space-y-3 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="text-2xl shrink-0 p-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                            {room.emoji || '💬'}
                          </span>
                          <div>
                            <h5 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                              {room.title}
                            </h5>
                            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>📍 {room.locationArea}</span>
                              <span>•</span>
                              <span>👥 {room.activePeopleCount} live</span>
                              {room.isPrivate && (
                                <span className="text-purple-600 font-bold flex items-center gap-0.5">
                                  <Lock className="w-3 h-3" /> Private
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {room.deletionRequested ? (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Deletion Pending</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setRequestingDeletionRoomId(isRequestingThis ? null : room.id);
                              setDeletionReason('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Request Deletion</span>
                          </button>
                        )}
                      </div>

                      {/* Deletion Pending Status Details */}
                      {room.deletionRequested && (
                        <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs space-y-1.5">
                          <p className="text-amber-900 font-medium">
                            ⏳ Deletion request submitted for admin review.
                            {room.deletionReason && (
                              <span className="block text-slate-600 italic mt-0.5">
                                Reason: "{room.deletionReason}"
                              </span>
                            )}
                          </p>
                          {onCancelRoomDeletionRequest && (
                            <button
                              type="button"
                              onClick={() => onCancelRoomDeletionRequest(room.id)}
                              className="text-[11px] text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                            >
                              Cancel deletion request
                            </button>
                          )}
                        </div>
                      )}

                      {/* Inline Request Deletion Input Form */}
                      {isRequestingThis && (
                        <div className="pt-2 border-t border-slate-200/80 space-y-2.5 animate-in fade-in duration-150">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Reason for Deletion Request:
                          </label>

                          <div className="flex flex-wrap gap-1.5">
                            {['Event Finished', 'Discussion Ended', 'Create New Room', 'Duplicate Room'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setDeletionReason(preset)}
                                className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                                  deletionReason === preset
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>

                          <input
                            type="text"
                            value={deletionReason}
                            onChange={(e) => setDeletionReason(e.target.value)}
                            placeholder="e.g. Completed discussion, want to open new room..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                          />

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setRequestingDeletionRoomId(null)}
                              className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-200 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmRequestDeletion(room.id)}
                              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Submit Request</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Need assistance? Contact support.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD SCROLLABLE FORM */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Room Creation Slot Counter */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-600 font-medium">Room Creation Slots</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {userCreatedRooms.length} / 2 Used
                </span>
              </div>

              {/* Room Access Control (Public vs Private) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Room Privacy & Access Control <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      !isPrivate
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5 text-emerald-700">
                      <Globe className="w-4 h-4" />
                      <span>🌐 Public Room</span>
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      Visible to all members. Anyone can join and participate.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      isPrivate
                        ? 'bg-purple-50 border-purple-500 text-purple-950 font-bold ring-2 ring-purple-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-extrabold flex items-center gap-1.5 text-purple-700">
                      <Lock className="w-4 h-4" />
                      <span>🔒 Private Room</span>
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      Protected with a secret invite code or link to join.
                    </div>
                  </button>
                </div>

                {isPrivate && (
                  <div className="mt-2.5 p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-2 text-xs text-purple-900 animate-in fade-in duration-150">
                    <Key className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>A unique 6-character invite code and link will be generated for your private room.</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Room Title / Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Project Discussion, Study Group, Event Hub..."
                  className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm sm:text-xs font-medium text-slate-900 placeholder-slate-400"
                />
              </div>

              {/* Topic Category Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Topic Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {categoryOptions.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 sm:p-2.5 rounded-xl text-xs font-semibold text-center border transition flex flex-col items-center gap-1 cursor-pointer min-h-[58px] justify-center ${
                        category === cat.id
                          ? 'bg-orange-500 text-white font-bold border-orange-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-[11px] truncate w-full">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Spot / Location Area
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={locationArea}
                    onChange={(e) => setLocationArea(e.target.value)}
                    placeholder="e.g. Main Area, Block A, Room 204..."
                    className="w-full pl-9 pr-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm sm:text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description / Topic Details
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share details or guidelines for participants..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-sm sm:text-xs font-medium text-slate-800 placeholder-slate-400 resize-none"
                />
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div className="p-3.5 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-200/70 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 cursor-pointer min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span>Launch Room</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
