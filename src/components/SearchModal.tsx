import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  User,
  Radio,
  FileText,
  MapPin,
  Users,
  Lock,
  MessageSquare,
  Heart,
  Clock,
  ArrowRight,
  Shield,
  Send,
  Building2,
  Sparkles,
} from 'lucide-react';
import { UserProfile, FeedPost, TrendingRoom } from '../types';

export type SearchableUser =
  | UserProfile
  | {
      username: string;
      displayName?: string;
      badge?: string;
      collegeId?: string;
      email?: string;
      isAdmin?: boolean;
      bio?: string;
      [key: string]: any;
    };

interface SearchModalProps {
  isOpen?: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers?: SearchableUser[];
  users?: SearchableUser[];
  posts?: FeedPost[];
  rooms?: TrendingRoom[];
  onSelectUser: (username: string) => void;
  onSelectPost: (post: FeedPost) => void;
  onSelectRoom: (roomId: string) => void;
  onOpenPrivateChat?: (username: string) => void;
}

type SearchFilter = 'all' | 'profiles' | 'posts' | 'rooms';

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen = true,
  onClose,
  currentUser,
  allUsers = [],
  users = [],
  posts = [],
  rooms = [],
  onSelectUser,
  onSelectPost,
  onSelectRoom,
  onOpenPrivateChat,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolved list of all available users
  const rawUsersList = useMemo(() => {
    const list = (allUsers && allUsers.length > 0) ? allUsers : (users || []);
    // Deduplicate by username
    const seen = new Set<string>();
    return list.filter((u) => {
      if (!u || !u.username) return false;
      const lower = u.username.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  }, [allUsers, users]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setActiveFilter('all');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const cleanQuery = query.trim().toLowerCase();

  // Deduplicate and filter users
  const filteredUsers = useMemo(() => {
    const safeUsers = rawUsersList || [];
    if (!cleanQuery) return safeUsers.slice(0, 8);
    const q = cleanQuery.replace(/^@/, '');
    return safeUsers.filter((u) => {
      if (!u) return false;
      const uName = (u.username || '').toLowerCase();
      const dName = (u.displayName || '').toLowerCase();
      const email = ((u as any).email || '').toLowerCase();
      const bio = ((u as any).bio || '').toLowerCase();
      const college = ((u as any).collegeId || '').toLowerCase();
      return (
        uName.includes(q) ||
        dName.includes(q) ||
        email.includes(q) ||
        bio.includes(q) ||
        college.includes(q)
      );
    });
  }, [rawUsersList, cleanQuery]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    const safePosts = posts || [];
    if (!cleanQuery) return safePosts.slice(0, 6);
    return safePosts.filter((p) => {
      if (!p) return false;
      const content = (p.content || '').toLowerCase();
      const author = (p.authorUsername || '').toLowerCase();
      const location = (p.locationName || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      return (
        content.includes(cleanQuery) ||
        author.includes(cleanQuery) ||
        location.includes(cleanQuery) ||
        category.includes(cleanQuery)
      );
    });
  }, [posts, cleanQuery]);

  // Filter rooms / spikes
  const filteredRooms = useMemo(() => {
    const safeRooms = rooms || [];
    if (!cleanQuery) return safeRooms.slice(0, 6);
    return safeRooms.filter((r) => {
      if (!r) return false;
      const title = (r.title || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      const cat = (r.category || '').toLowerCase();
      const area = (r.locationArea || '').toLowerCase();
      const creator = (r.creatorUsername || '').toLowerCase();
      return (
        title.includes(cleanQuery) ||
        desc.includes(cleanQuery) ||
        cat.includes(cleanQuery) ||
        area.includes(cleanQuery) ||
        creator.includes(cleanQuery)
      );
    });
  }, [rooms, cleanQuery]);

  if (!isOpen) return null;

  const totalResults =
    (activeFilter === 'all' || activeFilter === 'profiles' ? filteredUsers.length : 0) +
    (activeFilter === 'all' || activeFilter === 'posts' ? filteredPosts.length : 0) +
    (activeFilter === 'all' || activeFilter === 'rooms' ? filteredRooms.length : 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Search Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search profiles (@user), posts, or campus spikes..."
              className="w-full bg-slate-900/90 text-white placeholder-slate-500 px-4 py-2.5 rounded-2xl border border-slate-700 focus:outline-none focus:border-orange-500 text-sm font-medium pr-10"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            title="Close Search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-slate-900 border-b border-slate-800/80 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>All Results</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('profiles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeFilter === 'profiles'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profiles ({filteredUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('posts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeFilter === 'posts'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Posts ({filteredPosts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('rooms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeFilter === 'rooms'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Spikes ({filteredRooms.length})</span>
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {totalResults === 0 && (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <div className="text-4xl">🔍</div>
              <p className="text-sm font-bold text-slate-400">No results found for "{query}"</p>
              <p className="text-xs text-slate-500">
                Try searching for a different username, keyword, post topic, or room title.
              </p>
            </div>
          )}

          {/* PROFILES SECTION */}
          {(activeFilter === 'all' || activeFilter === 'profiles') && filteredUsers.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  <span>Profiles ({filteredUsers.length})</span>
                </span>
                {activeFilter === 'all' && filteredUsers.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('profiles')}
                    className="text-orange-400 hover:underline capitalize"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredUsers.slice(0, activeFilter === 'all' ? 4 : 20).map((u) => {
                  const isMe = u.username.toLowerCase() === currentUser.username.toLowerCase();
                  const isDev = u.username === 'muhammedrafii2002' || u.isAdmin;

                  return (
                    <div
                      key={u.id || u.username}
                      className="p-3 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-orange-500/50 rounded-2xl transition flex items-center justify-between gap-3 group"
                    >
                      <div
                        onClick={() => {
                          onClose();
                          onSelectUser(u.username);
                        }}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm ${
                            isDev
                              ? 'bg-gradient-to-tr from-purple-600 to-amber-500'
                              : 'bg-orange-600'
                          }`}
                        >
                          {u.displayName?.charAt(0).toUpperCase() || u.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-white group-hover:text-orange-400 transition truncate">
                              {u.displayName || u.username}
                            </span>
                            {isDev && (
                              <span title="Admin/Developer">
                                <Shield className="w-3 h-3 text-purple-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            @{u.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onOpenPrivateChat && !isMe && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenPrivateChat(u.username);
                            }}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-orange-600 text-slate-300 hover:text-white transition cursor-pointer"
                            title={`Direct Message @${u.username}`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectUser(u.username);
                          }}
                          className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          Profile
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* POSTS SECTION */}
          {(activeFilter === 'all' || activeFilter === 'posts') && filteredPosts.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Feed Posts ({filteredPosts.length})</span>
                </span>
                {activeFilter === 'all' && filteredPosts.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('posts')}
                    className="text-orange-400 hover:underline capitalize"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {filteredPosts.slice(0, activeFilter === 'all' ? 4 : 20).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      onClose();
                      onSelectPost(post);
                    }}
                    className="p-3.5 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition cursor-pointer group space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-orange-400">
                          @{post.authorUsername}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          <span>{post.locationName}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-red-400 font-semibold">
                          <Heart className="w-3 h-3" />
                          <span>{post.upvotes || 0}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400 font-semibold">
                          <MessageSquare className="w-3 h-3" />
                          <span>{post.commentsCount || 0} comments</span>
                        </span>
                      </div>
                      <span className="text-orange-400 font-bold group-hover:translate-x-1 transition flex items-center gap-0.5">
                        <span>Open Post</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ROOMS / SPIKES SECTION */}
          {(activeFilter === 'all' || activeFilter === 'rooms') && filteredRooms.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Campus Spikes & Rooms ({filteredRooms.length})</span>
                </span>
                {activeFilter === 'all' && filteredRooms.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('rooms')}
                    className="text-orange-400 hover:underline capitalize"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredRooms.slice(0, activeFilter === 'all' ? 4 : 20).map((room) => (
                  <div
                    key={room.id}
                    onClick={() => {
                      onClose();
                      onSelectRoom(room.id);
                    }}
                    className="p-3.5 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition cursor-pointer group space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{room.emoji || '💬'}</span>
                        <div className="flex items-center gap-1.5">
                          {room.isPrivate && (
                            <span className="px-1.5 py-0.5 rounded-md bg-purple-950 text-purple-400 text-[9px] font-bold border border-purple-800/50 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Private</span>
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800/50 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{room.activePeopleCount || 0}</span>
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-xs text-white group-hover:text-emerald-400 transition truncate">
                        {room.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {room.description}
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-amber-400" />
                        <span>{room.locationArea}</span>
                      </span>
                      <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                        <span>Enter Spike</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span>Tip: Type <strong className="text-slate-400">@username</strong> to find users quickly</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white font-bold"
          >
            Esc to close
          </button>
        </div>
      </div>
    </div>
  );
};
