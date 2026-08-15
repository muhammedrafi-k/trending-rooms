import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  MapPin,
  Send,
  Image as ImageIcon,
  Flame,
  Clock,
  Share2,
  Sparkles,
  Camera,
  X,
  Radio,
  BarChart2,
  Award,
  Lock,
  Plus,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  AtSign,
  Shield,
  Crown,
  Pin,
  Check,
  Settings,
  UserX,
  MoreVertical,
  LogOut,
  Globe,
} from 'lucide-react';
import {
  TrendingRoom,
  ChatMessage,
  LocationCoords,
  FloatingReaction,
  UserProfile,
  RoomAdminRights,
  RoomLog,
} from '../types';
import {
  formatWitnessDistance,
  formatRelativeTime,
  getRoomExpirationText,
} from '../lib/distance';

interface LiveRoomViewProps {
  room: TrendingRoom;
  userLocation: LocationCoords;
  currentUser: UserProfile;
  messages: ChatMessage[];
  onBack: () => void;
  onSendMessage: (content: string, mediaUrl?: string, isAnonymous?: boolean, mentions?: string[]) => void;
  onDeleteMessage: (messageId: string) => void;
  onDeletePoll: (messageId: string) => void;
  onRequestRoomDeletion: (roomId: string, reason: string) => void;
  onReportItem: (targetType: 'room' | 'message', targetId: string, preview?: string) => void;
  onAddReactionToMessage: (messageId: string, emoji: string) => void;
  onVotePoll: (messageId: string, optionId: string) => void;
  onOpenCreatePoll: () => void;
  onSendFloatingEmoji?: (emoji: string) => void;
  floatingReactions?: FloatingReaction[];
  onOpenPrivateChat?: (partnerUsername: string) => void;
  onSelectUser?: (username: string) => void;
  onPromoteRoomAdmin?: (roomId: string, targetUsername: string, rights?: RoomAdminRights) => void;
  onDemoteRoomAdmin?: (roomId: string, targetUsername: string) => void;
  onPinMessage?: (roomId: string, messageId: string | null) => void;
  onUpdateRoom?: (roomId: string, updates: Partial<TrendingRoom>) => void;
  onJoinRoom?: (roomId: string) => void;
  onLeaveRoom?: (roomId: string) => void;
}

export const LiveRoomView: React.FC<LiveRoomViewProps> = ({
  room,
  userLocation,
  currentUser,
  messages,
  onBack,
  onSendMessage,
  onDeleteMessage,
  onDeletePoll,
  onRequestRoomDeletion,
  onReportItem,
  onAddReactionToMessage,
  onVotePoll,
  onOpenCreatePoll,
  onOpenPrivateChat,
  onSelectUser,
  onPromoteRoomAdmin,
  onDemoteRoomAdmin,
  onPinMessage,
  onUpdateRoom,
  onJoinRoom,
  onLeaveRoom,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);
  const [votedOptionIds, setVotedOptionIds] = useState<Record<string, string>>({});
  
  // Mentions & Members modal state
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [deletionReasonInput, setDeletionReasonInput] = useState('');
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showRoomLogsModal, setShowRoomLogsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);

  // Edit Room Details State
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [editTitle, setEditTitle] = useState(room.title);
  const [editCategory, setEditCategory] = useState(room.category);
  const [editEmoji, setEditEmoji] = useState(room.emoji);
  const [editDescription, setEditDescription] = useState(room.description);
  const [editLocationArea, setEditLocationArea] = useState(room.locationArea);
  const [editIsPrivate, setEditIsPrivate] = useState(room.isPrivate || false);
  const [editIsListedPublicly, setEditIsListedPublicly] = useState(room.isListedPublicly || false);

  // Admin rights configuration modal state
  const [configuringRightsUser, setConfiguringRightsUser] = useState<string | null>(null);
  const [editingRights, setEditingRights] = useState<RoomAdminRights>({
    canDeleteMessages: true,
    canPinMessages: true,
    canManagePolls: true,
    canChangePrivacy: true,
    canEditRoom: true,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const expiry = getRoomExpirationText(room.lastActivityAt);

  // Only currently joined and stayed members for active member list
  const activeMembersList = Array.isArray(room.activeMembers) && room.activeMembers.length > 0
    ? room.activeMembers
    : Array.from(
        new Set([
          currentUser.username,
          ...(room.creatorUsername ? [room.creatorUsername] : []),
          ...(room.roomAdmins || []),
          ...messages
            .filter((m) => m.senderUsername && !m.isAnonymous)
            .map((m) => m.senderUsername as string),
        ])
      ).filter(Boolean);

  const isUserJoined = Array.isArray(room.activeMembers) && room.activeMembers.length > 0
    ? room.activeMembers.includes(currentUser.username)
    : Boolean(
        currentUser.username &&
        (room.creatorUsername === currentUser.username ||
          (Array.isArray(room.allowedUsers) && room.allowedUsers.includes(currentUser.username)))
      );

  const roomLogs: RoomLog[] = Array.isArray(room.roomLogs) && room.roomLogs.length > 0
    ? room.roomLogs
    : [
        {
          id: 'log-creator',
          roomId: room.id,
          username: room.creatorUsername || 'creator',
          displayName: room.creatorUsername ? `@${room.creatorUsername}` : 'Room Creator',
          action: 'created',
          timestamp: room.createdAt || new Date().toISOString(),
        },
      ];

  const isCreatorOrUniversalAdmin =
    currentUser.isAdmin ||
    (room.creatorUsername && currentUser.username === room.creatorUsername) ||
    (!room.creatorUsername && room.roomType === 'student_created');

  const userAdminRights = room.roomAdminRights?.[currentUser.username] || {
    canDeleteMessages: true,
    canPinMessages: true,
    canManagePolls: true,
    canChangePrivacy: true,
    canEditRoom: true,
  };

  const isPromotedAdmin = room.roomAdmins?.includes(currentUser.username) || false;

  const canUserDeleteMessages =
    isCreatorOrUniversalAdmin || (isPromotedAdmin && userAdminRights.canDeleteMessages);

  const canUserPinMessages =
    isCreatorOrUniversalAdmin || (isPromotedAdmin && userAdminRights.canPinMessages);

  const canUserManagePolls =
    isCreatorOrUniversalAdmin || (isPromotedAdmin && userAdminRights.canManagePolls);

  const canUserEditRoom =
    isCreatorOrUniversalAdmin || (isPromotedAdmin && (userAdminRights.canEditRoom ?? true));

  const isRoomAdmin = isCreatorOrUniversalAdmin || isPromotedAdmin;

  const samplePhotos = [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    const lastWord = val.split(' ').pop() || '';

    if (lastWord.startsWith('@')) {
      setShowMentionMenu(true);
      setMentionFilter(lastWord.slice(1).toLowerCase());
    } else {
      setShowMentionMenu(false);
    }
  };

  const handleSelectMention = (username: string) => {
    const words = inputText.split(' ');
    words.pop();
    const newText = [...words, `@${username} `].join(' ');
    setInputText(newText);
    setShowMentionMenu(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    // Detect mentioned usernames
    const mentions = (inputText.match(/@[a-zA-Z0-9_]+/g) || []).map((m) => m.slice(1));

    onSendMessage(inputText.trim(), selectedImage || undefined, isAnonymousMode, mentions);
    setInputText('');
    setSelectedImage(null);
    setShowImagePicker(false);
    setShowMentionMenu(false);
  };

  const handleVote = (messageId: string, optionId: string) => {
    setVotedOptionIds((prev) => ({ ...prev, [messageId]: optionId }));
    onVotePoll(messageId, optionId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setShowImagePicker(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to render text with clickable @username mentions for user details & private chat
  const renderMessageContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(@[a-zA-Z0-9_]+)/g);

    return (
      <span className="leading-relaxed">
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            const handle = part.slice(1);
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (onSelectUser) {
                    onSelectUser(handle);
                  } else {
                    onOpenPrivateChat?.(handle);
                  }
                }}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 mx-0.5 bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 font-bold rounded-md border border-orange-500/30 text-xs transition cursor-pointer active:scale-95"
                title={`View profile details for @${handle}`}
              >
                {part}
              </button>
            );
          }
          return part;
        })}
      </span>
    );
  };

  const filteredMentionUsers = activeMembersList.filter((u) =>
    u.toLowerCase().includes(mentionFilter)
  );

  return (
    <div className="relative h-[calc(100dvh-4rem)] sm:h-[calc(100vh-6rem)] bg-slate-900 text-slate-100 rounded-none sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl border-0 sm:border sm:border-slate-800">
      {/* ROOM HEADER */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3 sm:p-5 sticky top-0 z-30 flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Back & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
              title="Back to campus rooms"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base sm:text-xl shrink-0">{room.emoji}</span>
                <h2 className="text-sm sm:text-lg font-extrabold text-white tracking-tight truncate">
                  {room.title}
                </h2>
                {/* Public vs Private Room Badge */}
                {room.isPrivate ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-purple-300" />
                    <span>Private Room</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    🌐 Public
                  </span>
                )}

                {/* Room Admin Badge */}
                {isRoomAdmin && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Room Admin</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                {room.description}
              </p>
            </div>
          </div>

          {/* Quick Join/Leave & 3-Dot Options Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isUserJoined ? (
              <button
                onClick={() => onLeaveRoom?.(room.id)}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-400 text-xs font-bold border border-slate-700 transition"
                title="Leave room"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Room</span>
              </button>
            ) : (
              <button
                onClick={() => onJoinRoom?.(room.id)}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition"
                title="Join room"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Join Room</span>
              </button>
            )}

            <div className="relative shrink-0">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 flex items-center justify-center"
                title="More Room Options"
              >
                <MoreVertical className="w-4 h-4 text-slate-200" />
              </button>

              {showMoreMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMoreMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-1.5 z-50 text-xs font-semibold text-slate-200 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                    {/* Join / Leave Room Option */}
                    {isUserJoined ? (
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          onLeaveRoom?.(room.id);
                        }}
                        className="w-full px-3.5 py-2.5 hover:bg-red-950/60 text-left flex items-center gap-2 text-red-400 transition"
                      >
                        <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Leave Room</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          onJoinRoom?.(room.id);
                        }}
                        className="w-full px-3.5 py-2.5 hover:bg-emerald-950/60 text-left flex items-center gap-2 text-emerald-400 transition"
                      >
                        <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Join Room</span>
                      </button>
                    )}

                    {/* Active Members Option */}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowMembersModal(true);
                      }}
                      className="w-full px-3.5 py-2.5 hover:bg-slate-800 text-left flex items-center gap-2 text-emerald-400 transition"
                    >
                      <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Active Members ({activeMembersList.length})</span>
                    </button>

                    {/* Room Activity Log Option */}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowRoomLogsModal(true);
                      }}
                      className="w-full px-3.5 py-2.5 hover:bg-slate-800 text-left flex items-center gap-2 text-blue-300 transition"
                    >
                      <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>📜 Room Activity Log</span>
                    </button>

                    {/* Share Room Option */}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowShareModal(true);
                      }}
                      className="w-full px-3.5 py-2.5 hover:bg-slate-800 text-left flex items-center gap-2 text-slate-200 transition"
                    >
                      <Share2 className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>Share Room Link</span>
                    </button>

                    {/* Report Room Option */}
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        onReportItem('room', room.id, room.title);
                      }}
                      className="w-full px-3.5 py-2.5 hover:bg-slate-800 text-left flex items-center gap-2 text-red-400 transition"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Report Room</span>
                    </button>

                    {/* Edit Room Details Option (For Room Admins) */}
                    {isRoomAdmin && (
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          setEditTitle(room.title);
                          setEditCategory(room.category);
                          setEditEmoji(room.emoji);
                          setEditDescription(room.description);
                          setEditLocationArea(room.locationArea);
                          setEditIsPrivate(room.isPrivate || false);
                          setShowEditRoomModal(true);
                        }}
                        className="w-full px-3.5 py-2.5 hover:bg-slate-800 text-left flex items-center gap-2 text-amber-300 transition border-t border-slate-800"
                      >
                        <Settings className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Edit Room Details</span>
                      </button>
                    )}

                    {/* Request Room Deletion Option (For Room Admin) */}
                    {isRoomAdmin && (
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowDeletionModal(true);
                        }}
                        className="w-full px-3.5 py-2.5 hover:bg-red-950/60 hover:text-red-300 text-left flex items-center gap-2 text-red-400 transition border-t border-slate-800"
                      >
                        <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Request Room Deletion</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Deletion Request Status Banner */}
        {room.deletionRequested && (
          <div className="bg-amber-950/80 border border-amber-500/50 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Room Deletion Pending Approval:</strong> Requested by room creator. Developer/Admin system reviewing request.
              </span>
            </div>
          </div>
        )}

        {/* Live People Counter + Location + Auto-Delete Expiry */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pt-1.5 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-950/80 border border-emerald-500/30 px-2.5 sm:px-3 py-1 rounded-xl font-bold text-emerald-300">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 animate-pulse shrink-0" />
            <span className="hidden sm:inline">👥 {activeMembersList.length} members in room</span>
            <span className="sm:hidden font-extrabold text-xs">{activeMembersList.length}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-3 py-1 rounded-xl text-slate-200 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>📍 {room.locationArea}</span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>⏳ {expiry.label}</span>
          </div>
        </div>
      </div>

      {/* PINNED ANNOUNCEMENT BANNER */}
      {(() => {
        const pinnedMsg = messages.find((m) => m.id === room.pinnedMessageId);
        if (!pinnedMsg) return null;
        return (
          <div className="bg-amber-950/90 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-between text-amber-200 text-xs backdrop-blur-md sticky top-[73px] z-20">
            <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
              <Pin className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400/20" />
              <div className="truncate">
                <span className="font-extrabold text-amber-300 mr-1">
                  Pinned Message by {pinnedMsg.senderName}:
                </span>
                <span className="italic opacity-90">{pinnedMsg.content || 'Poll/Media Attachment'}</span>
              </div>
            </div>
            {canUserPinMessages && (
              <button
                onClick={() => onPinMessage?.(room.id, null)}
                className="p-1 px-2.5 bg-amber-800/80 hover:bg-amber-800 text-amber-200 border border-amber-600/50 rounded-lg font-extrabold text-[10px] shrink-0 transition"
                title="Unpin Message"
              >
                Unpin
              </button>
            )}
          </div>
        );
      })()}

      {/* CHAT FEED & LIVE POLLS CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950/60">
        {/* Intro Room Banner */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 text-center max-w-xl mx-auto space-y-2">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <p className="text-xs text-slate-300">
            Welcome to <span className="font-bold text-white">{room.title}</span>.
            Type <strong className="text-orange-400 font-mono">@username</strong> to mention students. Click any username to private chat.
          </p>
          <div className="flex justify-center gap-2 text-[11px] font-semibold text-purple-300 pt-1">
            <button
              onClick={() => setShowMembersModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-300 transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>👥 See All Room Members</span>
            </button>
            <button
              onClick={onOpenCreatePoll}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>📊 Launch Campus Poll</span>
            </button>
          </div>
        </div>

        {/* Chat Messages and Embedded Polls */}
        {messages.map((msg) => {
          const senderUsernameToUse =
            msg.senderUsername ||
            (msg.senderName.startsWith('@') ? msg.senderName.slice(1) : undefined);

          return (
            <div
              key={msg.id}
              className="flex gap-3 items-start group max-w-2xl mx-auto w-full"
            >
              {/* Avatar */}
              <button
                type="button"
                disabled={msg.isAnonymous || !senderUsernameToUse}
                onClick={() => {
                  if (senderUsernameToUse) {
                    if (onSelectUser) {
                      onSelectUser(senderUsernameToUse);
                    } else {
                      onOpenPrivateChat?.(senderUsernameToUse);
                    }
                  }
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                  msg.isAnonymous
                    ? 'bg-purple-950 text-purple-300 border-purple-700/60 cursor-default'
                    : 'bg-slate-800 hover:bg-orange-600 text-slate-200 hover:text-white border-slate-700 transition cursor-pointer active:scale-95'
                }`}
                title={senderUsernameToUse ? `Click to view profile / chat with @${senderUsernameToUse}` : undefined}
              >
                {msg.isAnonymous ? '🕵️' : msg.senderName.slice(0, 2).toUpperCase()}
              </button>

              <div className="flex-1 bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 shadow-md hover:border-slate-700 transition relative">
                {/* Sender Line */}
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    {!msg.isAnonymous && senderUsernameToUse ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectUser) {
                            onSelectUser(senderUsernameToUse);
                          } else {
                            onOpenPrivateChat?.(senderUsernameToUse);
                          }
                        }}
                        className="font-bold text-xs text-orange-400 hover:text-orange-300 hover:underline transition text-left"
                        title={`Click to view profile for @${senderUsernameToUse}`}
                      >
                        {msg.senderName}
                      </button>
                    ) : (
                      <span className="font-bold text-xs text-slate-200">
                        {msg.senderName}
                      </span>
                    )}

                    {msg.senderBadge && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {msg.senderBadge}
                      </span>
                    )}

                  {msg.isAnonymous && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Anonymous
                    </span>
                  )}

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                    {msg.witnessDistanceText}
                  </span>
                </div>

                {/* Right controls: Timestamp & 3-dot Action Menu (Pin, Report, Delete, DM) */}
                <div className="flex items-center gap-1.5 relative">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatRelativeTime(msg.timestamp)}
                  </span>

                  {room.pinnedMessageId === msg.id && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      <Pin className="w-2.5 h-2.5" />
                      <span>Pinned</span>
                    </span>
                  )}

                  {/* 3-Dot Message Action Dropdown Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMessageMenuId((prev) => (prev === msg.id ? null : msg.id));
                      }}
                      className={`p-1 rounded-lg transition ${
                        activeMessageMenuId === msg.id
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800 opacity-70 group-hover:opacity-100'
                      }`}
                      title="Message options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* 3-Dot Floating Context Menu */}
                    {activeMessageMenuId === msg.id && (
                      <div
                        className="absolute right-0 top-6 z-30 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-1.5 min-w-[170px] space-y-1 animate-in fade-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* 1. View User Details / Profile */}
                        {senderUsernameToUse && !msg.isAnonymous && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectUser) {
                                onSelectUser(senderUsernameToUse);
                              } else {
                                onOpenPrivateChat?.(senderUsernameToUse);
                              }
                              setActiveMessageMenuId(null);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-orange-400 flex items-center gap-2 transition"
                          >
                            <Users className="w-3.5 h-3.5 text-orange-400" />
                            <span>View Profile</span>
                          </button>
                        )}

                        {/* 2. Pin / Unpin Action */}
                        {canUserPinMessages && (
                          <button
                            type="button"
                            onClick={() => {
                              onPinMessage?.(
                                room.id,
                                room.pinnedMessageId === msg.id ? null : msg.id
                              );
                              setActiveMessageMenuId(null);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-amber-300 flex items-center gap-2 transition"
                          >
                            <Pin className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              {room.pinnedMessageId === msg.id ? 'Unpin Message' : 'Pin Message'}
                            </span>
                          </button>
                        )}

                        {/* 3. Direct Private Chat (if other registered user) */}
                        {senderUsernameToUse &&
                          senderUsernameToUse.toLowerCase() !== currentUser.username.toLowerCase() &&
                          !msg.isAnonymous && (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenPrivateChat?.(senderUsernameToUse);
                                setActiveMessageMenuId(null);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-orange-400 flex items-center gap-2 transition"
                            >
                              <AtSign className="w-3.5 h-3.5 text-orange-400" />
                              <span>Chat @{senderUsernameToUse}</span>
                            </button>
                          )}

                        {/* 4. Report Message */}
                        <button
                          type="button"
                          onClick={() => {
                            onReportItem('message', msg.id, msg.content || 'Poll message');
                            setActiveMessageMenuId(null);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-amber-400 flex items-center gap-2 transition"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Report Message</span>
                        </button>

                        {/* 5. Delete Message (Sender, Room Admin, or Platform Admin) */}
                        {(canUserDeleteMessages ||
                          (senderUsernameToUse &&
                            senderUsernameToUse.toLowerCase() === currentUser.username.toLowerCase()) ||
                          msg.senderName === currentUser.displayName ||
                          currentUser.isAdmin) && (
                          <div className="pt-1 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteMessage(msg.id);
                                setActiveMessageMenuId(null);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              <span>Delete Message</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Content with Mention Highlighting */}
              {msg.content && (
                <div className="text-xs sm:text-sm text-slate-200">
                  {renderMessageContent(msg.content)}
                </div>
              )}

              {/* EMBEDDED INTERACTIVE POLL */}
              {msg.poll && (
                <div className="mt-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-purple-400" />
                      <span>{msg.poll.question}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-purple-300/80">
                        {msg.poll.totalVotes} votes
                      </span>
                      {canUserManagePolls && (
                        <button
                          onClick={() => onDeletePoll(msg.id)}
                          className="p-1 text-slate-400 hover:text-red-400 transition"
                          title="Admin: Remove Poll"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {msg.poll.options.map((opt) => {
                      const total = msg.poll!.totalVotes || 1;
                      const pct = Math.round((opt.votes / total) * 100);
                      const isUserVoted = votedOptionIds[msg.id] === opt.id;

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleVote(msg.id, opt.id)}
                          className={`w-full text-left p-2.5 rounded-xl border transition relative overflow-hidden flex items-center justify-between ${
                            isUserVoted
                              ? 'bg-purple-900/60 border-purple-400 text-white font-bold'
                              : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200'
                          }`}
                        >
                          <div
                            style={{ width: `${pct}%` }}
                            className="absolute left-0 top-0 bottom-0 bg-purple-500/20 transition-all duration-300"
                          ></div>

                          <span className="relative z-10 text-xs font-semibold flex items-center gap-2">
                            {isUserVoted && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                            <span>{opt.text}</span>
                          </span>

                          <span className="relative z-10 text-xs font-bold text-purple-300 shrink-0">
                            {opt.votes} ({pct}%)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Media Attachment */}
              {msg.mediaUrl && (
                <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-800 max-h-64 bg-black">
                  <img
                    src={msg.mediaUrl}
                    alt="Campus witness photo"
                    onClick={() => setLightboxImage(msg.mediaUrl!)}
                    className="w-full h-full object-cover cursor-pointer hover:scale-102 transition duration-200"
                  />
                </div>
              )}

              {/* Reaction Chips */}
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {Object.entries(msg.reactions).map(([emoji, count]) => {
                  const num = Number(count) || 0;
                  return num > 0 ? (
                    <button
                      key={emoji}
                      onClick={() => onAddReactionToMessage(msg.id, emoji)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition active:scale-90"
                    >
                      <span>{emoji}</span>
                      <span className="font-semibold text-[11px] text-slate-400">
                        {num}
                      </span>
                    </button>
                  ) : null;
                })}

                <button
                  onClick={() => onAddReactionToMessage(msg.id, '🔥')}
                  className="opacity-0 group-hover:opacity-100 transition px-2 py-0.5 rounded-lg bg-slate-800/80 text-[11px] text-slate-400 hover:text-white"
                >
                  +🔥
                </button>
              </div>
            </div>
          </div>
        );
      })}

        <div ref={chatEndRef} />
      </div>

      {/* MESSAGE INPUT COMPOSER & MENTIONS POPUP */}
      <form
        onSubmit={handleSend}
        className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4 relative space-y-2"
      >
        {/* Mentions Autosuggest Dropdown */}
        {showMentionMenu && filteredMentionUsers.length > 0 && (
          <div className="absolute bottom-full mb-2 left-4 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-w-xs w-full p-1 animate-in fade-in">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60 mb-1 flex items-center gap-1">
              <AtSign className="w-3 h-3 text-orange-400" />
              <span>Mention Student User</span>
            </div>
            {filteredMentionUsers.map((username) => (
              <button
                key={username}
                type="button"
                onClick={() => handleSelectMention(username)}
                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-orange-600 hover:text-white rounded-lg transition flex items-center justify-between"
              >
                <span>@{username}</span>
                <span className="text-[10px] opacity-70">Room Member</span>
              </button>
            ))}
          </div>
        )}

        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg border border-slate-700"
            />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Image Picker Panel */}
        {showImagePicker && (
          <div className="mb-3 p-3 bg-slate-800 rounded-2xl border border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span>📸 Attach Campus Photo Witness Media</span>
              <button
                type="button"
                onClick={() => setShowImagePicker(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <label className="flex-1 flex flex-col items-center justify-center p-3 border border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-700/50 transition">
                <Camera className="w-5 h-5 text-orange-400 mb-1" />
                <span className="text-[11px] text-slate-300 font-medium">Upload File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {samplePhotos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Sample ${i}`}
                  onClick={() => {
                    setSelectedImage(url);
                    setShowImagePicker(false);
                  }}
                  className="w-14 h-14 object-cover rounded-xl cursor-pointer border border-slate-700 hover:border-orange-500 transition"
                />
              ))}
            </div>
          </div>
        )}

        {/* Anonymous Mode & Poll Bar */}
        <div className="flex items-center justify-between text-xs px-1">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300 hover:text-white transition">
            <input
              type="checkbox"
              checked={isAnonymousMode}
              onChange={(e) => setIsAnonymousMode(e.target.checked)}
              className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <span>🕵️ Post Anonymously</span>
              {isAnonymousMode && (
                <span className="text-[10px] text-purple-400 font-mono">
                  (Masked as 🕵️ Anon Student)
                </span>
              )}
            </span>
          </label>

          <button
            type="button"
            onClick={onOpenCreatePoll}
            className="text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-1 transition"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>+ Create Poll</span>
          </button>
        </div>

        {/* Inputs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImagePicker(!showImagePicker)}
            className={`p-2.5 rounded-xl border transition ${
              selectedImage || showImagePicker
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
            }`}
            title="Attach Photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={
                isAnonymousMode
                  ? 'Posting anonymously (🕵️ Secret Student)...'
                  : `Chat live (type @ for mention)...`
              }
              className={`w-full text-slate-100 placeholder-slate-500 px-4 py-3 rounded-xl border focus:outline-none text-xs sm:text-sm ${
                isAnonymousMode
                  ? 'bg-purple-950/50 border-purple-700 focus:border-purple-400'
                  : 'bg-slate-950 border-slate-800 focus:border-orange-500'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() && !selectedImage}
            className={`p-3 rounded-xl font-semibold transition active:scale-95 shadow-md shrink-0 text-white disabled:opacity-40 ${
              isAnonymousMode
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Room Deletion Request Modal */}
      {showDeletionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-bold text-base">
              <Trash2 className="w-5 h-5" />
              <span>Request Room Deletion</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              As Room Admin, you can request room deletion. This sends a deletion request to the Developer/Admin control platform for approval.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Reason for Deletion
              </label>
              <textarea
                rows={2}
                value={deletionReasonInput}
                onChange={(e) => setDeletionReasonInput(e.target.value)}
                placeholder="e.g., College fest finished, discussion resolved."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-red-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeletionModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRequestRoomDeletion(
                    room.id,
                    deletionReasonInput.trim() || 'Room Creator requested deletion.'
                  );
                  setShowDeletionModal(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Members List Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-base">
                  Room Members ({activeMembersList.length})
                </h3>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Click on any member's avatar or <strong className="text-orange-400">@username</strong> to view their campus profile or message privately.
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {activeMembersList.map((username) => {
                const isCreator = room.creatorUsername === username;
                const isPromotedAdmin = room.roomAdmins?.includes(username);

                return (
                  <div
                    key={username}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-orange-500/50 transition"
                  >
                    <div
                      onClick={() => {
                        if (onSelectUser) onSelectUser(username);
                        else onOpenPrivateChat?.(username);
                      }}
                      className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                    >
                      <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-xs border border-orange-500/30 shrink-0 hover:scale-105 transition">
                        {username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-white flex items-center gap-1.5 flex-wrap">
                          <span className="hover:text-orange-400 transition truncate">@{username}</span>
                          {isCreator && (
                            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-black flex items-center gap-0.5 shrink-0">
                              <Crown className="w-3 h-3 text-amber-400" /> Creator
                            </span>
                          )}
                          {!isCreator && isPromotedAdmin && (
                            <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[9px] font-black flex items-center gap-0.5 shrink-0">
                              <Shield className="w-3 h-3 text-purple-400" /> Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Active in Room
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {/* View Profile Action */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectUser) onSelectUser(username);
                          else onOpenPrivateChat?.(username);
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition"
                        title="View Profile"
                      >
                        Profile
                      </button>

                      {/* Room Creator / Universal Admin Controls */}
                      {isRoomAdmin && !isCreator && username !== currentUser.username && (
                        !isPromotedAdmin ? (
                          <button
                            onClick={() => {
                              setConfiguringRightsUser(username);
                              setEditingRights({
                                canDeleteMessages: true,
                                canPinMessages: true,
                                canManagePolls: true,
                              });
                            }}
                            className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 font-bold text-[11px] rounded-xl transition flex items-center gap-1"
                            title="Promote to Room Admin and choose rights"
                          >
                            <Shield className="w-3 h-3 text-purple-400" />
                            <span>Make Admin</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const currentRights = room.roomAdminRights?.[username] || {
                                  canDeleteMessages: true,
                                  canPinMessages: true,
                                  canManagePolls: true,
                                };
                                setConfiguringRightsUser(username);
                                setEditingRights(currentRights);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold rounded-lg transition"
                              title="Edit Admin Rights"
                            >
                              ⚙️
                            </button>
                            <button
                              onClick={() => onDemoteRoomAdmin?.(room.id, username)}
                              className="px-2 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 text-[10px] font-bold rounded-lg transition flex items-center gap-0.5"
                              title="Remove from Admin"
                            >
                              <UserX className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        )
                      )}

                      {username !== currentUser.username ? (
                        <button
                          onClick={() => {
                            setShowMembersModal(false);
                            onOpenPrivateChat?.(username);
                          }}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1"
                        >
                          <span>Chat</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 px-2 py-1 rounded bg-slate-800">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Room Activity Log Modal */}
      {showRoomLogsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 text-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    📜 Room Activity Logs
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time member join & leave records with timestamps
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRoomLogsModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {roomLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">No activity logged yet.</p>
                </div>
              ) : (
                roomLogs.map((log) => {
                  const isJoin = log.action === 'joined';
                  const isLeave = log.action === 'left';
                  const isCreate = log.action === 'created';
                  const logDate = new Date(log.timestamp);
                  const formattedDate = logDate.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  });
                  const formattedTime = logDate.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                            isJoin
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isLeave
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isJoin ? '👋' : isLeave ? '🚪' : '👑'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                            <span
                              onClick={() => {
                                if (onSelectUser) onSelectUser(log.username);
                              }}
                              className="text-orange-400 hover:underline cursor-pointer"
                            >
                              @{log.username}
                            </span>
                            <span className="text-slate-300 font-medium">
                              {isJoin ? 'joined the room' : isLeave ? 'left the room' : 'created this room'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {log.displayName || `@${log.username}`}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                        <div>{formattedTime}</div>
                        <div className="text-slate-500">{formattedDate}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRoomLogsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Admin Rights Modal */}
      {configuringRightsUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="font-extrabold text-white text-base">
                  Admin Rights: @{configuringRightsUser}
                </h3>
              </div>
              <button
                onClick={() => setConfiguringRightsUser(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              As Room Creator, choose the moderation privileges granted to <strong className="text-purple-300">@{configuringRightsUser}</strong>:
            </p>

            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-white">
                    🗑️ Delete Messages
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Can delete inappropriate messages posted in room
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editingRights.canDeleteMessages}
                  onChange={(e) =>
                    setEditingRights({ ...editingRights, canDeleteMessages: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700"
                />
              </label>

              <div className="border-t border-slate-900"></div>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-white">
                    📌 Pin Messages
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Can pin key announcements to top of the room
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editingRights.canPinMessages}
                  onChange={(e) =>
                    setEditingRights({ ...editingRights, canPinMessages: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700"
                />
              </label>

              <div className="border-t border-slate-900"></div>

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-white">
                    📊 Manage Polls
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Can launch or remove campus polls in room
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editingRights.canManagePolls}
                  onChange={(e) =>
                    setEditingRights({ ...editingRights, canManagePolls: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfiguringRightsUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onPromoteRoomAdmin?.(room.id, configuringRightsUser, editingRights);
                  setConfiguringRightsUser(null);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Admin Rights</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Room Join Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Share Room Join Link</h3>
                  <p className="text-[11px] text-slate-400">Invite fellow students to join live</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setCopiedLink(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room Type Notice */}
            {room.isPrivate ? (
              <div className="bg-purple-950/80 border border-purple-500/50 rounded-2xl p-3.5 space-y-2 text-purple-200">
                <div className="flex items-center gap-2 font-bold text-xs text-purple-300">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>🔒 Private Room Link</span>
                </div>
                <p className="text-[11px] leading-relaxed text-purple-200/90">
                  This is a private room. Only students with this exact invite link or code can see and join this room.
                </p>
                {room.inviteCode && (
                  <div className="flex items-center justify-between bg-purple-900/60 p-2 rounded-xl border border-purple-700">
                    <span className="text-[10px] text-purple-300 font-medium">Invite Code:</span>
                    <span className="text-xs font-mono font-black text-amber-300 tracking-wider">
                      {room.inviteCode}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-3.5 space-y-1 text-emerald-200">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                  <span>🌐 Public Room Link</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-200/90">
                  This room is public. Anyone on campus can view and participate.
                </p>
              </div>
            )}

            {/* Link Input & Copy */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                Direct Room Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={
                    room.isPrivate && room.inviteCode
                      ? `${window.location.origin}${window.location.pathname}?room=${room.id}&invite=${room.inviteCode}`
                      : `${window.location.origin}${window.location.pathname}?room=${room.id}`
                  }
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const link = room.isPrivate && room.inviteCode
                      ? `${window.location.origin}${window.location.pathname}?room=${room.id}&invite=${room.inviteCode}`
                      : `${window.location.origin}${window.location.pathname}?room=${room.id}`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(link);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 active:scale-95"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  setCopiedLink(false);
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Full view"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
            <p className="text-center text-xs text-slate-400 mt-2">
              Tap anywhere to close
            </p>
          </div>
        </div>
      )}

      {/* Edit Room Details Modal */}
      {showEditRoomModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditRoomModal(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base text-white">Edit Room Details</h3>
              </div>
              <button
                onClick={() => setShowEditRoomModal(false)}
                className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editTitle.trim()) return;
                if (onUpdateRoom) {
                  const payload: any = {
                    title: editTitle.trim(),
                    emoji: editEmoji.trim() || '💬',
                    category: editCategory,
                    description: editDescription.trim(),
                    locationArea: editLocationArea.trim(),
                    isPrivate: editIsPrivate,
                    isListedPublicly: editIsPrivate ? editIsListedPublicly : false,
                  };
                  if (editIsPrivate && !room.inviteCode) {
                    payload.inviteCode = 'ROOM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                  }
                  onUpdateRoom(room.id, payload);
                }
                setShowEditRoomModal(false);
              }}
              className="space-y-4"
            >
              {/* Emoji & Title */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Emoji</label>
                  <input
                    type="text"
                    value={editEmoji}
                    onChange={(e) => setEditEmoji(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Room Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Public vs Private Room Switch */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {editIsPrivate ? (
                      <Lock className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Globe className="w-4 h-4 text-emerald-400" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white">
                        {editIsPrivate ? 'Private Room' : 'Public Room'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {editIsPrivate
                          ? 'Protected with invite code / link'
                          : 'Visible to everyone on campus in room list & live feed'}
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsPrivate}
                      onChange={(e) => setEditIsPrivate(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Sub-option for Public Listing with Code when Private */}
                {editIsPrivate && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5 animate-in fade-in duration-150">
                    <span className="text-[10px] font-bold text-purple-300 block">
                      Private Room Visibility in Campus List:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditIsListedPublicly(false)}
                        className={`p-2 rounded-xl text-left border text-[11px] transition ${
                          !editIsListedPublicly
                            ? 'bg-purple-900/90 border-purple-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold">🕶️ Secret Hidden</div>
                        <div className="text-[9px] opacity-75">Link/code only</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditIsListedPublicly(true)}
                        className={`p-2 rounded-xl text-left border text-[11px] transition ${
                          editIsListedPublicly
                            ? 'bg-purple-900/90 border-purple-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold">🔒 Public List (Locked)</div>
                        <div className="text-[9px] opacity-75">Code required to enter</div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Room Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="canteen">🍛 Canteen & Food</option>
                  <option value="fest">🎉 Fest & Cultural</option>
                  <option value="exam">📚 Exam & Academics</option>
                  <option value="bus">🚍 Bus & Travel</option>
                  <option value="placement">💼 Placement & Jobs</option>
                  <option value="complaint">🚰 Campus Issues</option>
                  <option value="sports">🏆 Sports & Games</option>
                  <option value="general">💬 General Discussion</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Location Area */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Location / Area</label>
                <input
                  type="text"
                  value={editLocationArea}
                  onChange={(e) => setEditLocationArea(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditRoomModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition"
                >
                  Save Room Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
