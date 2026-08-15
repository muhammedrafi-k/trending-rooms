import React, { useState } from 'react';
import { FeedPost, FeedComment, PostCategory, CollegeInfo, UserProfile, TrendingRoom } from '../types';
import {
  Radio,
  ThumbsUp,
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
  Heart,
  CornerDownRight,
  X,
  MoreVertical,
  Flag,
  User,
} from 'lucide-react';

interface LiveFeedProps {
  posts: FeedPost[];
  trendingRooms?: TrendingRoom[];
  currentCollege: CollegeInfo;
  currentUser: UserProfile;
  onOpenCreatePost: () => void;
  onOpenCreateRoomForPost: (post: FeedPost) => void;
  onSelectRoom?: (roomId: string) => void;
  onUpvotePost: (postId: string) => void;
  onReportPost: (post: FeedPost) => void;
  onDeletePost?: (postId: string) => void;
  onAddComment?: (postId: string, content: string, parentId?: string | null) => Promise<FeedComment | null>;
  onLikeComment?: (commentId: string) => void;
  fetchCommentsForPost?: (postId: string) => Promise<FeedComment[]>;
  onOpenPrivateChat?: (partnerUsername: string) => void;
  onSelectUser?: (username: string) => void;
}

const CATEGORY_FILTERS: Array<{ id: PostCategory | 'all'; label: string; icon: string }> = [
  { id: 'all', label: 'All Live', icon: '⚡' },
  { id: 'fest', label: 'Fest', icon: '🎉' },
  { id: 'weather', label: 'Weather/Rain', icon: '🌧️' },
  { id: 'traffic', label: 'Bus/Traffic', icon: '`🚍`' },
  { id: 'incident', label: 'Incidents/News', icon: '🚨' },
  { id: 'general', label: 'General', icon: '📢' },
];

export const LiveFeed: React.FC<LiveFeedProps> = ({
  posts,
  trendingRooms = [],
  currentCollege,
  currentUser,
  onOpenCreatePost,
  onOpenCreateRoomForPost,
  onSelectRoom,
  onUpvotePost,
  onReportPost,
  onDeletePost,
  onAddComment,
  onLikeComment,
  fetchCommentsForPost,
  onOpenPrivateChat,
  onSelectUser,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<PostCategory | 'all'>('all');

  // Expanded comments state
  const [expandedPostIds, setExpandedPostIds] = useState<string[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<string, FeedComment[]>>({});
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<string | null>(null);

  // Reddit-style reply thread expansion state (commentId -> boolean)
  const [expandedReplyThreads, setExpandedReplyThreads] = useState<Record<string, boolean>>({});

  // Who Liked My Post Modal State
  const [viewingUpvotersPost, setViewingUpvotersPost] = useState<FeedPost | null>(null);
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);

  // Input states
  const [commentInputMap, setCommentInputMap] = useState<Record<string, string>>({});
  const [replyingToMap, setReplyingToMap] = useState<Record<string, { commentId: string; username: string } | null>>({});

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

  const filteredPosts = posts.filter((p) => {
    if (selectedFilter === 'all') return true;
    return p.category === selectedFilter;
  });

  const getTimeAgo = (isoString: string) => {
    const diffMin = Math.max(1, Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60)));
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-xs font-bold mb-3">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Real-Time Local Feed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              What is Happening Right Now
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Live updates, incidents, fest situations, and bus delays shared directly by nearby students in real-time.
            </p>
          </div>

          <button
            onClick={onOpenCreatePost}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Post Live Update</span>
          </button>
        </div>
      </div>

      {/* TRENDING COLLEGE ROOMS WIDGET ON LIVE FEED */}
      {trendingRooms.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Flame className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
                  <span>🔥 Trending College Rooms</span>
                  <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30">
                    Live Now
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Hot discussion hubs
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trendingRooms.slice(0, 6).map((room) => (
              <div
                key={room.id}
                onClick={() => onSelectRoom?.(room.id)}
                className="bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-orange-500/50 p-4 rounded-2xl transition cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{room.emoji}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      <Users className="w-3 h-3 text-emerald-400" />
                      <span>{room.activePeopleCount} online</span>
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-white group-hover:text-orange-400 transition line-clamp-1">
                    {room.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {room.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{room.locationArea}</span>
                  </span>

                  <span className="text-orange-400 font-bold group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                    <span>Join Room</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feed Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No live updates in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Be the first witness to share what is happening around campus right now!
          </p>
          <button
            onClick={onOpenCreatePost}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow hover:bg-orange-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Post</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const hasUpvoted = post.upvoters.includes(currentUser.username);
            const isAuthorOrAdmin = currentUser.username.toLowerCase() === post.authorUsername.toLowerCase() || currentUser.isAdmin;
            const isCommentsExpanded = expandedPostIds.includes(post.id);
            const postComments = commentsMap[post.id] || [];
            const replyingTo = replyingToMap[post.id];

            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition relative"
              >
                <div className="p-5 sm:p-6 space-y-3.5">
                  {/* Top Bar: Author, Verification Badge, Time, and 3-Dot Action Menu */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => onSelectUser?.(post.authorUsername)}
                        className="w-9 h-9 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0 border border-orange-200 transition cursor-pointer active:scale-95"
                        title={`View profile for @${post.authorUsername}`}
                      >
                        @{post.authorUsername.charAt(0).toUpperCase()}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSelectUser?.(post.authorUsername)}
                            className="text-xs font-bold text-slate-900 hover:text-orange-600 transition text-left cursor-pointer"
                          >
                            @{post.authorUsername}
                          </button>
                          {post.authorBadge && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold">
                              {post.authorBadge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <MapPin className="w-3 h-3 text-orange-500" />
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

                    {/* Right side: Verification Badge & 3-Dot Options Dropdown */}
                    <div className="flex items-center gap-1.5 relative">
                      {post.verificationStatus === 'verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">Verified Live</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span className="hidden sm:inline">Unverified</span>
                        </span>
                      )}

                      {/* 3-Dot Menu Button */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenPostMenuId(openPostMenuId === post.id ? null : post.id)
                          }
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
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

                              {/* Liked by Users */}
                              <button
                                onClick={() => {
                                  setOpenPostMenuId(null);
                                  setViewingUpvotersPost(post);
                                }}
                                className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium transition cursor-pointer"
                              >
                                <Heart className="w-3.5 h-3.5 text-red-500" />
                                <span>Liked by ({post.upvoters?.length || 0})</span>
                              </button>

                              {/* Report Post */}
                              <button
                                onClick={() => {
                                  setOpenPostMenuId(null);
                                  onReportPost(post);
                                }}
                                className="w-full px-3.5 py-2 text-left text-amber-700 hover:bg-amber-50 flex items-center gap-2 font-medium transition cursor-pointer"
                              >
                                <Flag className="w-3.5 h-3.5 text-amber-600" />
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
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-72">
                      <img
                        src={post.mediaUrl}
                        alt="Live post media"
                        className="w-full h-full object-cover max-h-72"
                      />
                    </div>
                  )}

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Upvote Button */}
                      <button
                        onClick={() => onUpvotePost(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          hasUpvoted
                            ? 'bg-orange-50 text-orange-600 border border-orange-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-orange-500 text-orange-500' : ''}`} />
                        <span>{post.upvotes}</span>
                      </button>

                      {/* Expandable Comments Button */}
                      <button
                        onClick={() => toggleComments(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition ${
                          isCommentsExpanded
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
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
                    <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50/80 -mx-5 sm:-mx-6 px-5 sm:px-6 pb-4 space-y-4 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                          <span>Campus Comments & Discussion Threads</span>
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          {postComments.length} Comments
                        </span>
                      </div>

                      {/* Comments List */}
                      {loadingCommentsPostId === post.id ? (
                        <div className="text-center py-4 text-xs text-slate-500">
                          Loading discussion threads...
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
                                  <div className="p-3 bg-white border border-slate-200 rounded-2xl text-xs space-y-1.5 shadow-2xs">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => onSelectUser?.(topComment.authorUsername)}
                                          className="font-extrabold text-slate-900 hover:text-orange-600 transition text-left cursor-pointer"
                                        >
                                          @{topComment.authorUsername}
                                        </button>
                                        {topComment.authorDisplayName && (
                                          <span className="text-[10px] text-slate-400">
                                            ({topComment.authorDisplayName})
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {getTimeAgo(topComment.timestamp)}
                                      </span>
                                    </div>

                                    <p className="text-slate-700 leading-relaxed font-normal">
                                      {topComment.content}
                                    </p>

                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                                      {/* Like comment button */}
                                      <button
                                        onClick={() => handleToggleLikeComment(post.id, topComment.id)}
                                        className={`flex items-center gap-1 font-bold transition px-2 py-0.5 rounded-lg ${
                                          hasLikedTop
                                            ? 'text-red-600 bg-red-50'
                                            : 'text-slate-500 hover:text-red-500 hover:bg-slate-100'
                                        }`}
                                      >
                                        <Heart className={`w-3 h-3 ${hasLikedTop ? 'fill-red-500 text-red-500' : ''}`} />
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
                                        className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
                                      >
                                        <CornerDownRight className="w-3 h-3" />
                                        <span>Reply</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* REDDIT-STYLE NESTED REPLIES TREE */}
                                  {directReplies.length > 0 && (
                                    <div className="ml-4 pl-3.5 border-l-2 border-orange-300/80 space-y-2 mt-1">
                                      {visibleReplies.map((reply) => {
                                        const hasLikedReply = reply.likes?.includes(currentUser.username);
                                        const subReplies = postComments.filter((c) => c.parentId === reply.id);

                                        return (
                                          <div key={reply.id} className="space-y-1.5">
                                            <div className="p-2.5 bg-white border border-orange-200/90 rounded-2xl text-xs space-y-1 shadow-2xs">
                                              <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <button
                                                    onClick={() => onSelectUser?.(reply.authorUsername)}
                                                    className="font-extrabold text-slate-900 hover:text-orange-600 transition text-left cursor-pointer"
                                                  >
                                                    @{reply.authorUsername}
                                                  </button>
                                                  <span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                                                    <CornerDownRight className="w-2.5 h-2.5" />
                                                    <span>replying to @{topComment.authorUsername}</span>
                                                  </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                  {getTimeAgo(reply.timestamp)}
                                                </span>
                                              </div>

                                              <p className="text-slate-700 leading-relaxed font-normal">
                                                {reply.content}
                                              </p>

                                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                                                <button
                                                  onClick={() => handleToggleLikeComment(post.id, reply.id)}
                                                  className={`flex items-center gap-1 font-bold transition px-2 py-0.5 rounded-lg ${
                                                    hasLikedReply
                                                      ? 'text-red-600 bg-red-50'
                                                      : 'text-slate-500 hover:text-red-500 hover:bg-slate-100'
                                                  }`}
                                                >
                                                  <Heart className={`w-3 h-3 ${hasLikedReply ? 'fill-red-500 text-red-500' : ''}`} />
                                                  <span>{reply.likesCount || 0}</span>
                                                </button>

                                                <button
                                                  onClick={() =>
                                                    setReplyingToMap({
                                                      ...replyingToMap,
                                                      [post.id]: { commentId: reply.id, username: reply.authorUsername },
                                                    })
                                                  }
                                                  className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 text-[11px]"
                                                >
                                                  <CornerDownRight className="w-3 h-3" />
                                                  <span>Reply</span>
                                                </button>
                                              </div>
                                            </div>

                                            {/* Sub-sub replies if any */}
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

                                      {/* EXPAND / COLLAPSE REPLIES BUTTON */}
                                      {directReplies.length > 2 && (
                                        <button
                                          onClick={() => toggleReplyThread(topComment.id)}
                                          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1 rounded-xl transition flex items-center gap-1 mt-1"
                                        >
                                          {isThreadExpanded
                                            ? '👆 Hide extra replies'
                                            : `👇 Show ${directReplies.length - 2} more ${directReplies.length - 2 === 1 ? 'reply' : 'replies'}`}
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
                        <div className="flex items-center justify-between bg-orange-100 border border-orange-300 px-3 py-1.5 rounded-xl text-xs text-orange-900 font-semibold">
                          <span>Replying to @{replyingTo.username}...</span>
                          <button
                            onClick={() => setReplyingToMap({ ...replyingToMap, [post.id]: null })}
                            className="p-0.5 text-orange-700 hover:text-orange-950"
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
                          className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500 text-slate-900 placeholder:text-slate-400"
                        />
                        <button
                          onClick={() => handlePostComment(post.id)}
                          className="px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1 shrink-0"
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
        </div>
      )}
      {/* WHO LIKED MY POST MODAL */}
      {viewingUpvotersPost && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingUpvotersPost(null);
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-extrabold text-sm flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <span>Liked by {viewingUpvotersPost.upvoters?.length || 0} {viewingUpvotersPost.upvoters?.length === 1 ? 'user' : 'users'}</span>
              </h4>
              <button
                onClick={() => setViewingUpvotersPost(null)}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
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
                      className="w-7 h-7 rounded-lg bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 font-bold flex items-center justify-center text-xs transition cursor-pointer"
                    >
                      {username.slice(0, 2).toUpperCase()}
                    </button>
                    <button
                      onClick={() => {
                        setViewingUpvotersPost(null);
                        onSelectUser?.(username);
                      }}
                      className="font-bold text-slate-100 hover:text-orange-400 transition cursor-pointer text-left"
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
                      className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] rounded-xl transition flex items-center gap-1 shadow-xs"
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
