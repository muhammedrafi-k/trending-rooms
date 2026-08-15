import React, { useState } from 'react';
import { X, MapPin, School, Plus, Lock, Globe, Key } from 'lucide-react';
import { CollegeInfo, RoomCategory, TrendingRoom } from '../types';

interface CreateEventModalProps {
  currentCollege: CollegeInfo;
  currentUserUsername?: string;
  onClose: () => void;
  onCreateRoom: (room: TrendingRoom) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  currentCollege,
  currentUserUsername,
  onClose,
  onCreateRoom,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RoomCategory>('canteen');
  const [description, setDescription] = useState('');
  const [locationArea, setLocationArea] = useState('Main Campus');
  const [creatorName, setCreatorName] = useState(currentUserUsername || 'Campus Student');
  const [isPrivate, setIsPrivate] = useState(false);

  const categoryOptions: { id: RoomCategory; label: string; emoji: string }[] = [
    { id: 'canteen', label: 'Canteen / Food', emoji: '🍛' },
    { id: 'fest', label: 'Fest / Cultural', emoji: '🎉' },
    { id: 'exam', label: 'Exam / Academics', emoji: '📚' },
    { id: 'bus', label: 'Bus / Travel', emoji: '🚍' },
    { id: 'placement', label: 'Placement & Career', emoji: '💼' },
    { id: 'complaint', label: 'Campus Issue', emoji: '🚰' },
    { id: 'sports', label: 'Sports & Games', emoji: '🏆' },
    { id: 'general', label: 'General Chat', emoji: '💬' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const catObj = categoryOptions.find((c) => c.id === category);
    const emoji = catObj?.emoji || '💬';
    const nowIso = new Date().toISOString();

    const inviteCode = isPrivate
      ? `PRV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      : undefined;

    const creatorUser = currentUserUsername || 'student';

    const newRoom: TrendingRoom = {
      id: `room-${currentCollege.id}-${Date.now()}`,
      collegeId: currentCollege.id,
      title: `${emoji} ${title.trim()}`,
      category,
      roomType: 'student_created',
      emoji,
      locationArea: locationArea.trim() || currentCollege.area,
      activePeopleCount: 1,
      createdAt: nowIso,
      lastActivityAt: nowIso,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description:
        description.trim() ||
        `Student discussion room for ${currentCollege.shortName}.`,
      isLiveNow: true,
      isPrivate,
      inviteCode,
      allowedUsers: [creatorUser],
      activeMembers: [creatorUser],
      roomLogs: [
        {
          id: `log-${Date.now()}`,
          roomId: `room-${currentCollege.id}-${Date.now()}`,
          username: creatorUser,
          displayName: creatorName.trim() || `@${creatorUser}`,
          action: 'created',
          timestamp: nowIso,
        },
      ],
      hasActivePoll: false,
      creatorName: creatorName.trim() || `@${creatorUser}`,
      creatorUsername: creatorUser,
      roomAdmins: [],
      topContributor: {
        name: creatorName.trim() || `@${creatorUser}`,
        badge: '👑 Room Creator',
      },
    };

    onCreateRoom(newRoom);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Create Campus Room
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentCollege.shortName} ({currentCollege.name})</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Room Access Control (Public vs Private) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Room Privacy & Access Control <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1 ${
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
                    Visible to all campus students. Anyone can join, view, and participate.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1 ${
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
                placeholder="e.g. Canteen Pazham Pori & Tea Review or S4 Study Group"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs font-medium text-slate-900 placeholder-slate-400"
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
                    className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition flex flex-col items-center gap-1 ${
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

            {/* Campus Location Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Campus Spot / Location Area
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={locationArea}
                  onChange={(e) => setLocationArea(e.target.value)}
                  placeholder="e.g. Main Canteen, Science Block, Gate #2..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-xs font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Description / Discussion Topic
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give context or ask students to share opinions & photos..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-xs font-medium text-slate-800 placeholder-slate-400 resize-none"
              />
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-200/70 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Campus Room</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
