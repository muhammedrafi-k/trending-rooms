import React, { useState } from 'react';
import { X, Flame, MapPin, Radio, School, Sparkles, Plus, Award } from 'lucide-react';
import { CollegeInfo, RoomCategory, RoomType, TrendingRoom } from '../types';

interface CreateEventModalProps {
  currentCollege: CollegeInfo;
  onClose: () => void;
  onCreateRoom: (room: TrendingRoom) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  currentCollege,
  onClose,
  onCreateRoom,
}) => {
  const [title, setTitle] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('student_created');
  const [category, setCategory] = useState<RoomCategory>('canteen');
  const [description, setDescription] = useState('');
  const [locationArea, setLocationArea] = useState('Main Campus Quadrangle');
  const [creatorName, setCreatorName] = useState('Campus Student');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isListedPublicly, setIsListedPublicly] = useState(false);

  const categoryOptions: { id: RoomCategory; label: string; emoji: string }[] = [
    { id: 'canteen', label: 'Canteen / Food Review', emoji: '🍛' },
    { id: 'fest', label: 'Fest / Cultural Event', emoji: '🎉' },
    { id: 'exam', label: 'Exam / Academic Talk', emoji: '📚' },
    { id: 'bus', label: 'Bus / Route Delay', emoji: '🚍' },
    { id: 'placement', label: 'Placement & Career', emoji: '💼' },
    { id: 'complaint', label: 'Campus Issue / Complaint', emoji: '🚰' },
    { id: 'sports', label: 'Sports & Tournament', emoji: '🏆' },
    { id: 'general', label: 'General Student Chat', emoji: '💬' },
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

    const newRoom: TrendingRoom = {
      id: `room-${currentCollege.id}-${Date.now()}`,
      collegeId: currentCollege.id,
      title: `${emoji} ${title.trim()}`,
      category,
      roomType,
      emoji,
      locationArea: locationArea.trim() || currentCollege.area,
      activePeopleCount: Math.floor(Math.random() * 30) + 15,
      createdAt: nowIso,
      lastActivityAt: nowIso,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description:
        description.trim() ||
        `Student discussion room created for ${currentCollege.shortName}.`,
      isLiveNow: true,
      isPrivate,
      isListedPublicly: isPrivate ? isListedPublicly : false,
      inviteCode,
      hasActivePoll: false,
      creatorName: creatorName.trim() || 'Anonymous Student',
      topContributor: {
        name: creatorName.trim() || 'Room Host',
        badge: roomType === 'auto_trending' ? '⚡ Event Host' : '🎓 Room Creator',
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
                Create Campus Live Room
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
            {/* Room Type Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Room Category & Trigger
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRoomType('student_created')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    roomType === 'student_created'
                      ? 'bg-slate-900 border-slate-900 text-white font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-extrabold flex items-center gap-1.5 mb-0.5">
                    <span>🎓 Student Room</span>
                  </div>
                  <div className="text-[10px] opacity-80 leading-tight">
                    Canteen review, Placement talk, Water complaints
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRoomType('auto_trending')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    roomType === 'auto_trending'
                      ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-extrabold flex items-center gap-1.5 mb-0.5 text-orange-600">
                    <Flame className="w-3.5 h-3.5 fill-orange-500" />
                    <span>🔥 Auto Event Spike</span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Fest happening, Bus delay, Emergency alert
                  </div>
                </button>
              </div>
            </div>

            {/* Room Access Control (Public vs Private) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Room Privacy & Access Control
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                    !isPrivate
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-extrabold flex items-center gap-1.5 text-emerald-700">
                    <span>🌐 Public Room</span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Anyone on campus can browse, view, and join.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                    isPrivate
                      ? 'bg-purple-50 border-purple-500 text-purple-950 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-extrabold flex items-center gap-1.5 text-purple-700">
                    <span>🔒 Private Room</span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Requires secret invite code or link to join.
                  </div>
                </button>
              </div>

              {/* When Private: Choice of Public Listing with Code vs Secret Hidden */}
              {isPrivate && (
                <div className="mt-3 p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-2 animate-in fade-in duration-200">
                  <span className="text-[11px] font-extrabold text-purple-950 block">
                    Private Room Listing Mode:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsListedPublicly(false)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition ${
                        !isListedPublicly
                          ? 'bg-purple-900 border-purple-950 text-white font-bold shadow-xs'
                          : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-100/60 font-medium'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1">
                        <span>🕶️ Secret & Hidden</span>
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5 leading-tight">
                        Hidden from all lists. Only users with the direct link/code can enter.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsListedPublicly(true)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition ${
                        isListedPublicly
                          ? 'bg-purple-900 border-purple-950 text-white font-bold shadow-xs'
                          : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-100/60 font-medium'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1">
                        <span>🔒 Public Listing (Code Gated)</span>
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5 leading-tight">
                        Visible in campus list with a lock icon. Entering & viewing content requires code.
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Room Title / Discussion Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Canteen Pazham Pori & Tea Review or S4 Physics Study Group"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs font-medium text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* Topic Category Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Topic Tag
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categoryOptions.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition flex flex-col items-center gap-1 ${
                      category === cat.id
                        ? 'bg-orange-500 text-white font-bold border-orange-500 shadow-sm'
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
                Description / Instructions
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give context or ask students to share photos & opinions..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-xs font-medium text-slate-800 placeholder-slate-400 resize-none"
              />
            </div>

            {/* Private Room Toggle */}
            <div className="p-3.5 bg-slate-900 rounded-2xl text-white border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔒</span>
                  <div>
                    <div className="text-xs font-bold text-white">Private Room Access</div>
                    <div className="text-[10px] text-slate-400">
                      Hidden from public feed & room lists unless joined by code or link
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isPrivate ? 'bg-orange-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isPrivate ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {isPrivate && (
                <div className="text-[11px] text-orange-300 bg-orange-950/40 border border-orange-500/30 p-2.5 rounded-xl">
                  ✨ A secret invite code and private shareable link will be generated. Only members with the link or code can see and join this room.
                </div>
              )}
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
              <span>🎓 Launch Campus Room</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
