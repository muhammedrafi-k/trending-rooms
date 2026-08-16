import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FeedPost, FeedComment, PostCategory, CollegeInfo, UserProfile, TrendingRoom } from '../types';
import {
  Radio,
  Zap,
  MessageSquare,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Flame,
  Clock,
  ArrowRight,
  Filter,
  Users,
  Trash2,
  Send,
  CornerDownRight,
  X,
  MoreVertical,
  Flag,
  User,
  Activity,
  Sparkles,
  ArrowUp,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

interface LiveFeedProps {
  posts: FeedPost[];
  trendingRooms?: TrendingRoom[];
  currentCollege: CollegeInfo;
  currentUser: UserProfile;
  onOpenCreatePost: () => void;
  onSelectRoom?: (roomId: string) => void;
  onUpvotePost: (postId: string) => void;
  onReportPost: (post: FeedPost) => void;
  onDeletePost?: (postId: string) => void;
  onAddComment?: (postId: string, content: string, parentId?: string | null) => Promise<FeedComment | null>;
  onLikeComment?: (commentId: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onReportComment?: (comment: FeedComment, postId: string) => void;
  fetchCommentsForPost?: (postId: string) => Promise<FeedComment[]>;
  onOpenPrivateChat?: (partnerUsername: string) => void;
  onSelectUser?: (username: string) => void;
}

const CATEGORY_FILTERS: Array<{ id: PostCategory | 'all'; label: string; icon: string }> = [
  { id: 'all', label: 'All Live', icon: '⚡' },
  { id: 'fest', label: 'Fest', icon: '🎉' },
  { id: 'weather', label: 'Weather', icon: '🌧️' },
  { id: 'traffic', label: 'Bus & Traffic', icon: '🚍' },
  { id: 'incident', label: 'Incidents', icon: '🚨' },
  { id: 'general', label: 'Campus Life', icon: '📢' },
];

const POSTS_PER_PAGE = 12;

export const LiveFeed: React.FC<LiveFeedProps> = ({
  posts = [],
  trendingRooms = [],
  currentCollege,
  currentUser,
  onOpenCreatePost,
  onSelectRoom,
  onUpvotePost,
  onReportPost,
  onDeletePost,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  onReportComment,
  fetchCommentsForPost,
  onOpenPrivateChat,
  onSelectUser,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<PostCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'top_zapped' | 'latest' | 'discussed'>('latest');
  const [visiblePostsCount, setVisiblePostsCount] = useState<number>(POSTS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Sentinel for infinite scroll
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  // Expanded comments state
  const [expandedPostIds, setExpandedPostIds] = useState<string[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<string, FeedComment[]>>({});
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<string | null>(null);

  // Reply thread expansion state (commentId -> boolean)
  const [expandedReplyThreads, setExpandedReplyThreads] = useState<Record<string, boolean>>({});

  // Who Zapped My Post Modal State
  const [viewingUpvotersPost, setViewingUpvotersPost] = useState<FeedPost | null>(null);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);

  // Input states
  const [commentInputMap, setCommentInputMap] = useState<Record<string, string>>({});
  const [replyingToMap, setReplyingToMap] = useState<Record<string, { commentId: string; username: string } | null>>({});

  // Filtered & Sorted Posts (Supports 1000+ items seamlessly)
  const processedPosts = useMemo(() => {
    const list = posts.filter((p) => {
      if (selectedFilter !== 'all' && p.category !== selectedFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchContent = p.content.toLowerCase().includes(q);
        const matchAuthor = p.authorUsername.toLowerCase().includes(q);
        const matchLoc = p.locationName.toLowerCase().includes(q);
        return matchContent || matchAuthor || matchLoc;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'top_zapped') {
        return (b.upvotes || 0) - (a.upvotes || 0);
      }
      if (sortBy === 'discussed') {
        return (b.commentsCount || 0) - (a.commentsCount || 0);
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [posts, selectedFilter, searchQuery, sortBy]);

  // Infinite Scroll Trigger via IntersectionObserver (X/Instagram pattern)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visiblePostsCount < processedPosts.length && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisiblePostsCount((prev) => Math.min(prev + POSTS_PER_PAGE, processedPosts.length));
            setIsLoadingMore(false);
          }, 200);
        }
      },
      { threshold: 0.1, rootMargin: '250px' }
    );

    if (bottomSentinelRef.current) {
      observer.observe(bottomSentinelRef.current);
    }

    return () => observer.disconnect();
  }, [visiblePostsCount, processedPosts.length, isLoadingMore]);

  // Track window scroll for Back-To-Top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleReplyThread = (commentId: string) => {
    setExpandedReplyThreads((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const toggleComments = async (postId: string) => {
    if (expandedPostIds.includes(postId)) {
      setExpandedPostIds(expandedPostIds.filter((id) => id !== postId));
    } else {
      setExpandedPostIds([...expandedPostIds, postId]);
      if (fetchCommentsForPost && !commentsMap[postId]) {
        setLoadingCommentsPostId(postId);
        const fetched = await fetchCommentsForPost(postId);
        setCommentsMap((prev) => ({ ...prev, [postId]: fetched || [] }));
        setLoadingCommentsPostId(null);
      }
    }
  };

  const handlePostComment = async (postId: string) => {
    const text = commentInputMap[postId]?.trim();
    if (!text || !onAddComment) return;

    const parentId = replyingToMap[postId]?.commentId || null;
    const newComment = await onAddComment(postId, text, parentId);
    if (newComment) {
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setCommentInputMap((prev) => ({ ...prev, [postId]: '' }));
      setReplyingToMap((prev) => ({ ...prev, [postId]: null }));
    }
  };

  const handleToggleLikeComment = (postId: string, commentId: string) => {
    if (onLikeComment) {
      onLikeComment(commentId);
    }
    // Optimistic UI update
    setCommentsMap((prev) => {
      const existing = prev[postId] || [];
      const updated = existing.map((c) => {
        if (c.id === commentId) {
          const hasLiked = c.likes?.includes(currentUser.username);
          const newLikes = hasLiked
            ? (c.likes || []).filter((u) => u !== currentUser.username)
            : [...(c.likes || []), currentUser.username];
          return {
            ...c,
            likes: newLikes,
            likesCount: newLikes.length,
          };
        }
        return c;
      });
      return { ...prev, [postId]: updated };
    });
  };

  const handleDeleteCommentAction = (postId: string, commentId: string) => {
    setOpenCommentMenuId(null);
    if (onDeleteComment) {
      onDeleteComment(postId, commentId);
    }
    // Optimistic UI update: remove comment and any nested replies attached to it
    setCommentsMap((prev) => {
      const existing = prev[postId] || [];
      const updated = existing.filter((c) => c.id !== commentId && c.parentId !== commentId);
      return { ...prev, [postId]: updated };
    });
  };

  const getTimeAgo = (isoString: string) => {
    const diffMin = Math.max(1, Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60)));
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with High Scale Info */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-slate-800/80">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-xs font-black mb-3">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-bounce" />
              <span>Live Broadcasts</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Live Updates & Feed</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Real-time updates, community spikes, events, and trending discussions.
            </p>
          </div>

          <button
            onClick={onOpenCreatePost}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-orange-500/25 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Post Live Update</span>
          </button>
        </div>

        {/* Live Feed Status Indicator */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>{posts.length} Active Broadcasts</span>
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 fill-emerald-400 text-emerald-400" />
              <span>Live Synced</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {currentCollege.name}
          </span>
        </div>
      </div>

      {/* UNIQUE ROOM FORMAT IN LIVE FEED: SPARK / SPIKES STORIES & SPACES BAR */}
      {trendingRooms.length > 0 && (
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 border border-amber-500/20 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Zap className="w-5 h-5 fill-amber-400 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
                  <span>Live Spikes Radar</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-black border border-amber-500/30">
                    ⚡ {trendingRooms.length} Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Instant tap-to-join live conversation capsules
                </p>
              </div>
            </div>
          </div>

          {/* Horizontal Spikes Stories Capsule Row (Instagram Stories / X Spaces Style) */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
            {trendingRooms.slice(0, 10).map((room) => {
              const score = room.spikeVelocity || (room.activePeopleCount * 2 + 35);
              return (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom?.(room.id)}
                  className="snap-start shrink-0 w-44 sm:w-52 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/60 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                      {room.emoji || '⚡'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">
                      <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{score}%</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-xs text-white group-hover:text-amber-400 transition line-clamp-1">
                      {room.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      📍 {room.locationArea}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{room.activePeopleCount} live</span>
                    </span>
                    <span className="text-amber-400 font-extrabold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Join</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEARCH & FILTER CONTROLS */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Field */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisiblePostsCount(POSTS_PER_PAGE);
              }}
              placeholder="Search 1,000+ live updates, locations, authors..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs font-medium text-slate-800 placeholder-slate-400 transition"
            />
          </div>

          {/* Sorter Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setSortBy('latest')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                sortBy === 'latest' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>✨ Latest</span>
            </button>

            <button
              onClick={() => setSortBy('top_zapped')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                sortBy === 'top_zapped' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>⚡ Top Zapped</span>
            </button>

            <button
              onClick={() => setSortBy('discussed')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                sortBy === 'discussed' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discussed</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feed Posts List */}
      {processedPosts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Zap className="w-7 h-7 fill-amber-500 text-amber-600" />
          </div>
          <h3 className="text-base font-black text-slate-900">No live updates found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Be the first to share a live spike or community broadcast with your network!
          </p>
          <button
            onClick={onOpenCreatePost}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl text-xs font-black shadow-md transition hover:from-amber-600 hover:to-orange-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Post</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {processedPosts.slice(0, visiblePostsCount).map((post) => {
            const hasUpvoted = post.upvoters.includes(currentUser.username);
            const isAuthorOrAdmin = currentUser.username.toLowerCase() === post.authorUsername.toLowerCase() || currentUser.isAdmin;
            const isCommentsExpanded = expandedPostIds.includes(post.id);
            const postComments = commentsMap[post.id] || [];
            const replyingTo = replyingToMap[post.id];
            const isHighSpikePost = (post.upvotes || 0) >= 20 || (post.commentsCount || 0) >= 8;

            return (
              <div
                key={post.id}
                className={`bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-amber-400/60 transition-all duration-200 relative ${
                  openPostMenuId === post.id ? 'z-30' : 'z-10'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-3.5">
                  {/* Top Bar: Author, Location, Time, and 3-Dot Action Menu */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => onSelectUser?.(post.authorUsername)}
                        className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-orange-700 font-black text-xs flex items-center justify-center shrink-0 border border-orange-200/80 transition cursor-pointer active:scale-95 shadow-2xs"
                        title={`View profile for @${post.authorUsername}`}
                      >
                        @{post.authorUsername.charAt(0).toUpperCase()}
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectUser?.(post.authorUsername)}
                            className="text-xs sm:text-sm font-black text-slate-900 hover:text-orange-600 transition text-left cursor-pointer"
                          >
                            @{post.authorUsername}
                          </button>
                          {isHighSpikePost && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 text-[10px] font-black">
                              <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500 animate-bounce" />
                              <span>SURGE</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <MapPin className="w-3 h-3 text-amber-500" />
                            {post.locationName}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {getTimeAgo(post.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: 3-Dot Options Dropdown */}
                    <div className="flex items-center gap-1.5 relative">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenPostMenuId(openPostMenuId === post.id ? null : post.id)
                          }
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                          title="Post Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* 3-Dot Dropdown Menu with Click-Outside Backdrop */}
                        {openPostMenuId === post.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenPostMenuId(null)}
                            />
                            <div
                              className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Author Profile */}
                              <button
                                onClick={() => {
                                  setOpenPostMenuId(null);
                                  onSelectUser?.(post.authorUsername);
                                }}
                                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium transition cursor-pointer"
                              >
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span>View @{post.authorUsername}</span>
                              </button>

                              {/* Zapped by Users */}
                              <button
                                onClick={() => {
                                  setOpenPostMenuId(null);
                                  setViewingUpvotersPost(post);
                                }}
                                className="w-full px-3.5 py-2 text-left text-amber-800 hover:bg-amber-50 flex items-center gap-2 font-bold transition cursor-pointer"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                <span>⚡ Zapped by ({post.upvoters?.length || 0})</span>
                              </button>

                              {/* Report Post */}
                              <button
                                onClick={() => {
                                  setOpenPostMenuId(null);
                                  onReportPost(post);
                                }}
                                className="w-full px-3.5 py-2 text-left text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium transition cursor-pointer"
                              >
                                <Flag className="w-3.5 h-3.5 text-rose-600" />
                                <span>Report Post</span>
                              </button>

                              {/* Delete Post (if author or admin) */}
                              {isAuthorOrAdmin && onDeletePost && (
                                <button
                                  onClick={() => {
                                    setOpenPostMenuId(null);
                                    onDeletePost(post.id);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold transition border-t border-slate-100 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  <span>Delete Post</span>
                                </button>
                              )}

                              {/* Explicit Close Option */}
                              <button
                                onClick={() => setOpenPostMenuId(null)}
                                className="w-full px-3.5 py-2 text-left text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-between font-semibold transition border-t border-slate-100 cursor-pointer"
                              >
                                <span className="flex items-center gap-1.5">
                                  <X className="w-3.5 h-3.5" />
                                  <span>Close</span>
                                </span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-sm text-slate-800 font-normal leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Post Media Attachment */}
                  {post.mediaUrl && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 max-h-80">
                      <img
                        src={post.mediaUrl}
                        alt="Live post media"
                        className="w-full h-full object-cover max-h-80"
                      />
                    </div>
                  )}

                  {/* Bottom Action Footer with ⚡ Zap Button */}
                  <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* ⚡ ZAP BUTTON (Replaces Like) */}
                      <button
                        onClick={() => onUpvotePost(post.id)}
                        className={`group/zap flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                          hasUpvoted
                            ? 'bg-amber-500/15 text-amber-700 border border-amber-400/50 shadow-xs scale-105'
                            : 'bg-slate-50 hover:bg-amber-500/10 text-slate-700 hover:text-amber-600 border border-slate-200/90 active:scale-95'
                        }`}
                        title={hasUpvoted ? 'Remove Zap' : 'Zap this post ⚡'}
                      >
                        <Zap
                          className={`w-4 h-4 transition-transform duration-200 ${
                            hasUpvoted
                              ? 'fill-amber-400 text-amber-500 animate-pulse scale-110'
                              : 'text-slate-500 group-hover/zap:fill-amber-400 group-hover/zap:text-amber-500 group-hover/zap:scale-110'
                          }`}
                        />
                        <span>{post.upvotes}</span>
                        <span className="text-[10px] font-mono opacity-80">⚡</span>
                      </button>

                      {/* Expandable Comments Button */}
                      <button
                        onClick={() => toggleComments(post.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-2xl text-xs font-black transition cursor-pointer ${
                          isCommentsExpanded
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {postComments.length > 0
                            ? `${postComments.length} comments`
                            : `${post.commentsCount} comments`}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* EXPANDABLE COMMENTS PANEL (REDDIT FORMAT) */}
                  {isCommentsExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50/90 -mx-5 sm:-mx-6 px-5 sm:px-6 pb-4 space-y-4 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                          <span>Discussion Threads</span>
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          {postComments.length} Comments
                        </span>
                      </div>

                      {/* Comments List */}
                      {loadingCommentsPostId === post.id ? (
                        <div className="text-center py-4 text-xs text-slate-500 flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading discussion threads...</span>
                        </div>
                      ) : postComments.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-400 italic">
                          No comments yet. Be the first to start a thread!
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                          {/* TOP LEVEL COMMENTS */}
                          {postComments
                            .filter((c) => !c.parentId)
                            .map((topComment) => {
                              const hasLikedTop = topComment.likes?.includes(currentUser.username);
                              const directReplies = postComments.filter((c) => c.parentId === topComment.id);
                              const isThreadExpanded = expandedReplyThreads[topComment.id] || false;
                              const visibleReplies = isThreadExpanded ? directReplies : directReplies.slice(0, 2);

                              return (
                                <div key={topComment.id} className="space-y-2">
                                  {/* Top Level Comment Card */}
                                  <div className="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs space-y-1.5 shadow-2xs relative">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <button
                                          onClick={() => onSelectUser?.(topComment.authorUsername)}
                                          className="font-black text-slate-900 hover:text-orange-600 transition text-left cursor-pointer truncate"
                                        >
                                          @{topComment.authorUsername}
                                        </button>
                                        {topComment.authorDisplayName && (
                                          <span className="text-[10px] text-slate-400 truncate">
                                            ({topComment.authorDisplayName})
                                          </span>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-1 shrink-0 relative">
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          {getTimeAgo(topComment.timestamp)}
                                        </span>
                                        
                                        {/* Instagram style 3-dot Menu Button */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenCommentMenuId(openCommentMenuId === topComment.id ? null : topComment.id);
                                          }}
                                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                          title="Comment options"
                                        >
                                          <MoreVertical className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {openCommentMenuId === topComment.id && (
                                          <>
                                            <div
                                              className="fixed inset-0 z-40"
                                              onClick={() => setOpenCommentMenuId(null)}
                                            />
                                            <div
                                              className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100 text-xs overflow-hidden"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {/* View Author */}
                                              <button
                                                onClick={() => {
                                                  setOpenCommentMenuId(null);
                                                  onSelectUser?.(topComment.authorUsername);
                                                }}
                                                className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium transition cursor-pointer"
                                              >
                                                <User className="w-3.5 h-3.5 text-slate-500" />
                                                <span className="truncate">View @{topComment.authorUsername}</span>
                                              </button>

                                              {/* Report Comment */}
                                              <button
                                                onClick={() => {
                                                  setOpenCommentMenuId(null);
                                                  onReportComment?.(topComment, post.id);
                                                }}
                                                className="w-full px-3 py-2 text-left text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-semibold transition cursor-pointer"
                                              >
                                                <Flag className="w-3.5 h-3.5 text-rose-600" />
                                                <span>Report Comment</span>
                                              </button>

                                              {/* Delete Comment */}
                                              {(currentUser.username === topComment.authorUsername ||
                                                currentUser.username === post.authorUsername ||
                                                currentUser.isAdmin) && (
                                                <button
                                                  onClick={() => handleDeleteCommentAction(post.id, topComment.id)}
                                                  className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold transition border-t border-slate-100 cursor-pointer"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                  <span>Delete Comment</span>
                                                </button>
                                              )}

                                              {/* Close */}
                                              <button
                                                onClick={() => setOpenCommentMenuId(null)}
                                                className="w-full px-3 py-1.5 text-left text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center gap-2 font-medium transition border-t border-slate-100 cursor-pointer text-[11px]"
                                              >
                                                <X className="w-3 h-3" />
                                                <span>Cancel</span>
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    <p className="text-slate-700 leading-relaxed font-normal">
                                      {topComment.content}
                                    </p>

                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                                      {/* ⚡ Zap comment button */}
                                      <button
                                        onClick={() => handleToggleLikeComment(post.id, topComment.id)}
                                        className={`flex items-center gap-1 font-black transition px-2 py-0.5 rounded-lg cursor-pointer ${
                                          hasLikedTop
                                            ? 'text-amber-700 bg-amber-50 border border-amber-200'
                                            : 'text-slate-500 hover:text-amber-600 hover:bg-slate-100'
                                        }`}
                                      >
                                        <Zap className={`w-3 h-3 ${hasLikedTop ? 'fill-amber-400 text-amber-500' : ''}`} />
                                        <span>{topComment.likesCount || 0}</span>
                                      </button>

                                      {/* Reply to comment button */}
                                      <button
                                        onClick={() =>
                                          setReplyingToMap({
                                            ...replyingToMap,
                                            [post.id]: { commentId: topComment.id, username: topComment.authorUsername },
                                          })
                                        }
                                        className="text-orange-600 hover:text-orange-700 font-black flex items-center gap-1 cursor-pointer"
                                      >
                                        <CornerDownRight className="w-3 h-3" />
                                        <span>Reply</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* NESTED REPLIES TREE */}
                                  {directReplies.length > 0 && (
                                    <div className="ml-4 pl-3.5 border-l-2 border-amber-400 space-y-2 mt-1">
                                      {visibleReplies.map((reply) => {
                                        const hasLikedReply = reply.likes?.includes(currentUser.username);
                                        const subReplies = postComments.filter((c) => c.parentId === reply.id);

                                        return (
                                          <div key={reply.id} className="space-y-1.5">
                                            <div className="p-3 bg-white border border-amber-200/90 rounded-2xl text-xs space-y-1 shadow-2xs relative">
                                              <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                  <button
                                                    onClick={() => onSelectUser?.(reply.authorUsername)}
                                                    className="font-black text-slate-900 hover:text-orange-600 transition text-left cursor-pointer truncate"
                                                  >
                                                    @{reply.authorUsername}
                                                  </button>
                                                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                                                    <CornerDownRight className="w-2.5 h-2.5" />
                                                    <span>to @{topComment.authorUsername}</span>
                                                  </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-1 shrink-0 relative">
                                                  <span className="text-[10px] text-slate-400 font-mono">
                                                    {getTimeAgo(reply.timestamp)}
                                                  </span>

                                                  {/* Reply 3-dot Menu Button */}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenCommentMenuId(openCommentMenuId === reply.id ? null : reply.id);
                                                    }}
                                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                                    title="Reply options"
                                                  >
                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                  </button>

                                                  {/* Dropdown Menu for reply */}
                                                  {openCommentMenuId === reply.id && (
                                                    <>
                                                      <div
                                                        className="fixed inset-0 z-40"
                                                        onClick={() => setOpenCommentMenuId(null)}
                                                      />
                                                      <div
                                                        className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100 text-xs overflow-hidden"
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        {/* View Author */}
                                                        <button
                                                          onClick={() => {
                                                            setOpenCommentMenuId(null);
                                                            onSelectUser?.(reply.authorUsername);
                                                          }}
                                                          className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium transition cursor-pointer"
                                                        >
                                                          <User className="w-3.5 h-3.5 text-slate-500" />
                                                          <span className="truncate">View @{reply.authorUsername}</span>
                                                        </button>

                                                        {/* Report Comment */}
                                                        <button
                                                          onClick={() => {
                                                            setOpenCommentMenuId(null);
                                                            onReportComment?.(reply, post.id);
                                                          }}
                                                          className="w-full px-3 py-2 text-left text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-semibold transition cursor-pointer"
                                                        >
                                                          <Flag className="w-3.5 h-3.5 text-rose-600" />
                                                          <span>Report Reply</span>
                                                        </button>

                                                        {/* Delete Comment */}
                                                        {(currentUser.username === reply.authorUsername ||
                                                          currentUser.username === post.authorUsername ||
                                                          currentUser.isAdmin) && (
                                                          <button
                                                            onClick={() => handleDeleteCommentAction(post.id, reply.id)}
                                                            className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold transition border-t border-slate-100 cursor-pointer"
                                                          >
                                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                            <span>Delete Reply</span>
                                                          </button>
                                                        )}

                                                        {/* Close */}
                                                        <button
                                                          onClick={() => setOpenCommentMenuId(null)}
                                                          className="w-full px-3 py-1.5 text-left text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center gap-2 font-medium transition border-t border-slate-100 cursor-pointer text-[11px]"
                                                        >
                                                          <X className="w-3 h-3" />
                                                          <span>Cancel</span>
                                                        </button>
                                                      </div>
                                                    </>
                                                  )}
                                                </div>
                                              </div>

                                              <p className="text-slate-700 leading-relaxed font-normal">
                                                {reply.content}
                                              </p>

                                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                                                <button
                                                  onClick={() => handleToggleLikeComment(post.id, reply.id)}
                                                  className={`flex items-center gap-1 font-black transition px-2 py-0.5 rounded-lg cursor-pointer ${
                                                    hasLikedReply
                                                      ? 'text-amber-700 bg-amber-50 border border-amber-200'
                                                      : 'text-slate-500 hover:text-amber-600 hover:bg-slate-100'
                                                  }`}
                                                >
                                                  <Zap className={`w-3 h-3 ${hasLikedReply ? 'fill-amber-400 text-amber-500' : ''}`} />
                                                  <span>{reply.likesCount || 0}</span>
                                                </button>

                                                <button
                                                  onClick={() =>
                                                    setReplyingToMap({
                                                      ...replyingToMap,
                                                      [post.id]: { commentId: reply.id, username: reply.authorUsername },
                                                    })
                                                  }
                                                  className="text-orange-600 hover:text-orange-700 font-black flex items-center gap-1 text-[11px] cursor-pointer"
                                                >
                                                  <CornerDownRight className="w-3 h-3" />
                                                  <span>Reply</span>
                                                </button>
                                              </div>
                                            </div>

                                            {/* Sub-replies */}
                                            {subReplies.length > 0 && (
                                              <div className="ml-3 pl-3 border-l-2 border-slate-300 space-y-1.5">
                                                {subReplies.map((sub) => (
                                                  <div key={sub.id} className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                                                    <div className="flex items-center justify-between gap-1">
                                                      <span className="font-bold text-slate-900">@{sub.authorUsername}</span>
                                                      <span className="text-[9px] text-slate-400 font-mono">{getTimeAgo(sub.timestamp)}</span>
                                                    </div>
                                                    <p className="text-slate-700">{sub.content}</p>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}

                                      {/* Expand / Collapse Replies */}
                                      {directReplies.length > 2 && (
                                        <button
                                          onClick={() => toggleReplyThread(topComment.id)}
                                          className="text-[11px] font-black text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-xl transition flex items-center gap-1 mt-1 cursor-pointer"
                                        >
                                          {isThreadExpanded
                                            ? '▲ Hide replies'
                                            : `▼ Show ${directReplies.length - 2} more replies`}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* Replying Indicator Banner */}
                      {replyingTo && (
                        <div className="flex items-center justify-between bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl text-xs text-amber-900 font-bold">
                          <span>Replying to @{replyingTo.username}...</span>
                          <button
                            onClick={() => setReplyingToMap({ ...replyingToMap, [post.id]: null })}
                            className="p-0.5 text-amber-700 hover:text-amber-950 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Comment Input Form */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentInputMap[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputMap({ ...commentInputMap, [post.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handlePostComment(post.id);
                          }}
                          placeholder={
                            replyingTo
                              ? `Reply to @${replyingTo.username}...`
                              : 'Write a comment on this live update...'
                          }
                          className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 placeholder:text-slate-400"
                        />
                        <button
                          onClick={() => handlePostComment(post.id)}
                          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs rounded-2xl shadow-md transition flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Post</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* INFINITE SCROLL SENTINEL & SKELETON LOADER (For 1000+ Posts) */}
          {visiblePostsCount < processedPosts.length && (
            <div ref={bottomSentinelRef} className="pt-6 pb-6 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium">
                Loading stream updates ({visiblePostsCount} / {processedPosts.length})...
              </p>
            </div>
          )}
        </div>
      )}

      {/* BACK TO TOP BUTTON */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 z-40 p-3.5 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 rounded-2xl shadow-2xl border border-slate-700 transition-all duration-200 cursor-pointer active:scale-90"
          title="Back to Top"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      {/* WHO ZAPPED MY POST MODAL (Replaces Who Liked) */}
      {viewingUpvotersPost && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingUpvotersPost(null);
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-black text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>⚡ Zapped by {viewingUpvotersPost.upvoters?.length || 0} {viewingUpvotersPost.upvoters?.length === 1 ? 'user' : 'users'}</span>
              </h4>
              <button
                onClick={() => setViewingUpvotersPost(null)}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {viewingUpvotersPost.upvoters?.map((username) => (
                <div
                  key={username}
                  className="flex items-center justify-between bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setViewingUpvotersPost(null);
                        onSelectUser?.(username);
                      }}
                      className="w-8 h-8 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 font-black flex items-center justify-center text-xs transition cursor-pointer"
                    >
                      {username.slice(0, 2).toUpperCase()}
                    </button>
                    <button
                      onClick={() => {
                        setViewingUpvotersPost(null);
                        onSelectUser?.(username);
                      }}
                      className="font-bold text-slate-100 hover:text-amber-400 transition cursor-pointer text-left"
                    >
                      @{username}
                    </button>
                  </div>

                  {onOpenPrivateChat && username !== currentUser.username && (
                    <button
                      onClick={() => {
                        setViewingUpvotersPost(null);
                        onOpenPrivateChat(username);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Chat</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
