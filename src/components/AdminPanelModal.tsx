import React, { useState } from 'react';
import {
  TrendingRoom,
  ChatMessage,
  FeedPost,
  ReportItem,
  ModerationSettings,
} from '../types';
import {
  Shield,
  X,
  AlertTriangle,
  Users,
  MessageSquare,
  Radio,
  Check,
  Trash2,
  Ban,
  Slash,
  Settings,
  BarChart3,
  Search,
  CheckCircle2,
  Filter,
  Sparkles,
  Flame,
} from 'lucide-react';

interface AdminPanelModalProps {
  rooms: TrendingRoom[];
  posts: FeedPost[];
  reports: ReportItem[];
  moderationSettings: ModerationSettings;
  onClose: () => void;
  onDeleteRoom: (roomId: string) => void;
  onDeletePost: (postId: string) => void;
  onResolveReport: (reportId: string, action: 'delete' | 'warn' | 'ban' | 'dismiss') => void;
  onApproveRoomDeletionRequest: (roomId: string) => void;
  onRejectRoomDeletionRequest: (roomId: string) => void;
  onUpdateSettings: (settings: ModerationSettings) => void;
  onSendDeveloperAlert?: (recipientUsername: string, message: string) => void;
  onOpenPrivateChat?: (partnerUsername: string) => void;
  onUpdateRoom?: (roomId: string, updates: Partial<TrendingRoom>) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  rooms,
  posts,
  reports,
  moderationSettings,
  onClose,
  onDeleteRoom,
  onDeletePost,
  onResolveReport,
  onApproveRoomDeletionRequest,
  onRejectRoomDeletionRequest,
  onUpdateSettings,
  onSendDeveloperAlert,
  onOpenPrivateChat,
  onUpdateRoom,
}) => {
  const [activeTab, setActiveTab] = useState<
    'monitoring' | 'reports' | 'room_requests' | 'content_control' | 'settings'
  >('monitoring');

  const [searchQuery, setSearchQuery] = useState('');
  const [newBannedKeyword, setNewBannedKeyword] = useState('');

  // Room editing state
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editArea, setEditArea] = useState('');

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const deletionRequestedRooms = rooms.filter((r) => r.deletionRequested);

  const totalActiveUsers = rooms.reduce((acc, r) => acc + r.activePeopleCount, 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] my-auto">
        {/* Top Header Bar */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">Developer Dashboard</h2>
                <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-md text-[10px] font-bold uppercase">
                  Lead Dev: Developer
                </span>
              </div>
              <p className="text-xs text-slate-400">System Analytics, Content Moderation, Deletion Approvals & Global Operations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900 px-6 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'monitoring'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 System Monitoring</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap relative ${
              activeTab === 'reports'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>🚨 Reports Queue</span>
            {pendingReports.length > 0 && (
              <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-black">
                {pendingReports.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('room_requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'room_requests'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>🏗 Room Deletion Requests</span>
            {deletionRequestedRooms.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black">
                {deletionRequestedRooms.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('content_control')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'content_control'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>🧹 Content Control</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>⚙️ System Controls</span>
          </button>
        </div>

        {/* Modal Main Body Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 space-y-6">
          {/* TAB 1: SYSTEM MONITORING */}
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase">Active Students</span>
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{totalActiveUsers.toLocaleString()}</div>
                  <span className="text-[11px] text-emerald-600 font-semibold">● 100% Real-time sync</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase">Active Rooms</span>
                    <Flame className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{rooms.length}</div>
                  <span className="text-[11px] text-slate-500">Topic-based rooms live</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase">Live Event Posts</span>
                    <Radio className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{posts.length}</div>
                  <span className="text-[11px] text-indigo-600 font-semibold">Verified live posts</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase">Pending Reports</span>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">{pendingReports.length}</div>
                  <span className="text-[11px] text-amber-600 font-semibold">Needs review</span>
                </div>
              </div>

              {/* Trending Topics Monitor */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Trending Topics Velocity Breakdown</span>
                </h3>

                <div className="space-y-3">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3"
                    >
                      {editingRoomId === room.id ? (
                        <div className="space-y-3 bg-white p-3 rounded-lg border border-amber-300">
                          <div className="font-bold text-xs text-amber-800">Edit Room Details</div>
                          <div className="grid grid-cols-4 gap-2">
                            <input
                              type="text"
                              value={editEmoji}
                              onChange={(e) => setEditEmoji(e.target.value)}
                              placeholder="Emoji"
                              className="p-2 border rounded text-center text-sm font-bold"
                            />
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Title"
                              className="col-span-3 p-2 border rounded text-xs font-bold"
                            />
                          </div>
                          <input
                            type="text"
                            value={editArea}
                            onChange={(e) => setEditArea(e.target.value)}
                            placeholder="Location / Area"
                            className="w-full p-2 border rounded text-xs"
                          />
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Description"
                            rows={2}
                            className="w-full p-2 border rounded text-xs"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingRoomId(null)}
                              className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateRoom) {
                                  onUpdateRoom(room.id, {
                                    title: editTitle,
                                    emoji: editEmoji,
                                    description: editDesc,
                                    locationArea: editArea,
                                  });
                                }
                                setEditingRoomId(null);
                              }}
                              className="px-3 py-1 bg-amber-600 text-white text-xs rounded font-bold"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{room.emoji}</span>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{room.title}</div>
                              <span className="text-[11px] text-slate-500">
                                {room.locationArea} • {room.activePeopleCount} live users
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingRoomId(room.id);
                                setEditTitle(room.title);
                                setEditEmoji(room.emoji);
                                setEditDesc(room.description);
                                setEditArea(room.locationArea);
                              }}
                              className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[11px] font-bold border border-amber-200 transition"
                            >
                              ✏️ Edit Room
                            </button>
                            <button
                              onClick={() => onDeleteRoom(room.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Force delete room"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REPORTS QUEUE */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  User Reported Items ({pendingReports.length} Pending)
                </h3>
              </div>

              {pendingReports.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">No Pending Reports</h4>
                  <p className="text-xs text-slate-500">All user flags have been reviewed and resolved.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md text-[11px] font-bold uppercase">
                            Flagged {rep.targetType}
                          </span>
                          <span className="text-xs text-slate-500">Reported by @{rep.reportedBy}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-800">
                        <span className="font-bold text-slate-900">Reason:</span> {rep.reason}
                        {rep.contentPreview && (
                          <div className="mt-2 text-slate-600 italic border-l-2 border-amber-400 pl-2.5">
                            "{rep.contentPreview}"
                          </div>
                        )}
                      </div>

                      {/* Moderator Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 flex-wrap">
                        {rep.reportedBy && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenPrivateChat?.(rep.reportedBy);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Message @{rep.reportedBy}</span>
                          </button>
                        )}
                        <button
                          onClick={() => onResolveReport(rep.id, 'dismiss')}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                          Dismiss Report
                        </button>
                        <button
                          onClick={() => onResolveReport(rep.id, 'warn')}
                          className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-xl transition"
                        >
                          Warn User
                        </button>
                        <button
                          onClick={() => onResolveReport(rep.id, 'delete')}
                          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Content</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROOM DELETION REQUESTS */}
          {activeTab === 'room_requests' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Room Admin Deletion Requests ({deletionRequestedRooms.length})
              </h3>
              <p className="text-xs text-slate-500">
                According to platform rules, room creators (Room Admins) submit deletion requests to the developer panel rather than destroying public rooms directly.
              </p>

              {deletionRequestedRooms.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
                  <Flame className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">No Pending Room Deletion Requests</h4>
                  <p className="text-xs text-slate-500">All room creators are actively managing their rooms.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deletionRequestedRooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{room.emoji}</span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{room.title}</h4>
                            <span className="text-xs text-slate-500">
                              Creator: @{room.creatorUsername || room.creatorName || 'student_creator'}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                          Deletion Requested
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-800">Reason provided:</span>{' '}
                        {room.deletionReason || 'Topic or issue has been resolved.'}
                      </p>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 flex-wrap">
                        {(room.creatorUsername || room.creatorName) && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenPrivateChat?.(room.creatorUsername || room.creatorName || '');
                            }}
                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Chat with Creator (@{room.creatorUsername || room.creatorName})</span>
                          </button>
                        )}
                        <button
                          onClick={() => onRejectRoomDeletionRequest(room.id)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                          Reject Request
                        </button>
                        <button
                          onClick={() => onApproveRoomDeletionRequest(room.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Approve & Wipe Room</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONTENT CONTROL */}
          {activeTab === 'content_control' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rooms or posts to manage..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Rooms List */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Active Rooms ({rooms.length})
                </h4>
                <div className="space-y-2">
                  {rooms
                    .filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{r.emoji}</span>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{r.title}</div>
                            <span className="text-[11px] text-slate-500">
                              {r.activePeopleCount} live users • {r.roomType}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onDeleteRoom(r.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Posts List */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Event Posts ({posts.length})
                </h4>
                <div className="space-y-2">
                  {posts
                    .filter((p) => p.content.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">@{p.authorUsername}</div>
                          <p className="text-xs text-slate-600 line-clamp-1">{p.content}</p>
                        </div>

                        <button
                          onClick={() => onDeletePost(p.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS & MODERATION */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Auto Keyword Filter */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Auto Keyword Moderation Filter</h4>
                  <p className="text-xs text-slate-500">
                    Automatically masks profanity and blocked words in live room messages and posts.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={moderationSettings.autoKeywordFilterEnabled}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...moderationSettings,
                        autoKeywordFilterEnabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Trending Algorithm Sensitivity */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-sm font-bold text-slate-900">Trending Algorithm Sensitivity</h4>
                <p className="text-xs text-slate-500">
                  Controls how rapidly auto-trending rooms are created based on activity spikes.
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  {(['low', 'medium', 'high'] as const).map((sens) => (
                    <button
                      key={sens}
                      onClick={() =>
                        onUpdateSettings({ ...moderationSettings, trendingSensitivity: sens })
                      }
                      className={`p-3 rounded-xl border text-xs font-bold capitalize transition ${
                        moderationSettings.trendingSensitivity === sens
                          ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      {sens} Sensitivity
                    </button>
                  ))}
                </div>
              </div>

              {/* Banned Keywords List */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Banned Keywords List</h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBannedKeyword}
                    onChange={(e) => setNewBannedKeyword(e.target.value)}
                    placeholder="Add blocked keyword..."
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => {
                      if (newBannedKeyword.trim()) {
                        onUpdateSettings({
                          ...moderationSettings,
                          bannedKeywords: [
                            ...moderationSettings.bannedKeywords,
                            newBannedKeyword.trim().toLowerCase(),
                          ],
                        });
                        setNewBannedKeyword('');
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Add Word
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {moderationSettings.bannedKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-medium border border-slate-200"
                    >
                      <span>{kw}</span>
                      <button
                        onClick={() =>
                          onUpdateSettings({
                            ...moderationSettings,
                            bannedKeywords: moderationSettings.bannedKeywords.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-slate-400 hover:text-red-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
