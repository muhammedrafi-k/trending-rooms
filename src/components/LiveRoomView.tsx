import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Key,
  RotateCcw,
  Smile,
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
  onCancelRoomDeletionRequest?: (roomId: string) => void;
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
  onKickUser?: (roomId: string, targetUsername: string) => void;
  onPinMessage?: (roomId: string, messageId: string | null) => void;
  onUpdateRoom?: (roomId: string, updates: Partial<TrendingRoom>) => void;
  onJoinRoom?: (roomId: string, codeInput?: string) => void;
  onLeaveRoom?: (roomId: string) => void;
  onDeleteRoom?: (roomId: string) => void;
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
  onCancelRoomDeletionRequest,
  onReportItem,
  onAddReactionToMessage,
  onVotePoll,
  onOpenCreatePoll,
  onOpenPrivateChat,
  onSelectUser,
  onPromoteRoomAdmin,
  onDemoteRoomAdmin,
  onKickUser,
  onPinMessage,
  onUpdateRoom,
  onJoinRoom,
  onLeaveRoom,
  onDeleteRoom,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);
  
  // Persist and load user's voted option IDs across page refreshes
  const [votedOptionIds, setVotedOptionIds] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(`CAMPUS_POLL_VOTES_${currentUser.username}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Keep votedOptionIds synchronized with incoming messages & user profile
  useEffect(() => {
    if (!currentUser.username || !messages || messages.length === 0) return;
    setVotedOptionIds((prev) => {
      let changed = false;
      const next = { ...prev };
      messages.forEach((m) => {
        if (m.poll && Array.isArray(m.poll.options)) {
          const userVotedOpt = m.poll.options.find((opt) =>
            Array.isArray(opt.voters) && opt.voters.includes(currentUser.username)
          );
          if (userVotedOpt && next[m.id] !== userVotedOpt.id) {
            next[m.id] = userVotedOpt.id;
            changed = true;
          }
        }
      });
      if (changed) {
        try {
          localStorage.setItem(`CAMPUS_POLL_VOTES_${currentUser.username}`, JSON.stringify(next));
        } catch (e) {}
        return next;
      }
      return prev;
    });
  }, [messages, currentUser.username]);
  
  // Mentions & Members modal state
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [deletionReasonInput, setDeletionReasonInput] = useState('');
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [showDirectDeleteModal, setShowDirectDeleteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showRoomLogsModal, setShowRoomLogsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
  const [activeReactionMenuId, setActiveReactionMenuId] = useState<string | null>(null);
  const [activeMemberMenuUser, setActiveMemberMenuUser] = useState<string | null>(null);
  const [kickingTargetUser, setKickingTargetUser] = useState<string | null>(null);

  // Private room unlock state
  const [privateCodeInput, setPrivateCodeInput] = useState('');
  const [privateCodeError, setPrivateCodeError] = useState('');
  const [isLocallyUnlocked, setIsLocallyUnlocked] = useState(false);
  const [showPrivateUnlockModal, setShowPrivateUnlockModal] = useState(false);
  const [modalPasscodeInput, setModalPasscodeInput] = useState('');
  const [modalPasscodeError, setModalPasscodeError] = useState('');

  // Edit Room Details State
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [editTitle, setEditTitle] = useState(room.title);
  const [editCategory, setEditCategory] = useState(room.category);
  const [editEmoji, setEditEmoji] = useState(room.emoji || '💬');
  const [editDescription, setEditDescription] = useState(room.description || '');
  const [editLocationArea, setEditLocationArea] = useState(room.locationArea || '');
  const [editIsPrivate, setEditIsPrivate] = useState(Boolean(room.isPrivate));

  // Admin rights configuration modal state
  const [configuringRightsUser, setConfiguringRightsUser] = useState<string | null>(null);
  const [editingRights, setEditingRights] = useState<RoomAdminRights>({
    canDeleteMessages: true,
    canPinMessages: true,
    canManagePolls: true,
    canDeletePolls: true,
    canChangePrivacy: true,
    canEditRoom: true,
    canKickUsers: true,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const expiry = getRoomExpirationText(room.lastActivityAt);

  // Identity checks - strictly authenticate creator and super admin privileges
  const isDevUser = Boolean(
    currentUser.isAdmin ||
    currentUser.username === 'muhammedrafii2002' ||
    currentUser.username === 'muhammedrafi042002' ||
    currentUser.email === 'muhammedrafi042002@gmail.com'
  );

  const isCreator = Boolean(
    isDevUser ||
    currentUser.isAdmin ||
    (room.creatorUsername && currentUser.username && currentUser.username.toLowerCase() === room.creatorUsername.toLowerCase())
  );

  const isUserJoined =
    isCreator ||
    (Array.isArray(room.activeMembers) && room.activeMembers.some((u) => u.toLowerCase() === currentUser.username?.toLowerCase())) ||
    (Array.isArray(room.allowedUsers) && room.allowedUsers.some((u) => u.toLowerCase() === currentUser.username?.toLowerCase()));

  const hasFullAccess =
    !room.isPrivate ||
    isCreator ||
    currentUser.isAdmin ||
    isUserJoined ||
    isLocallyUnlocked;

  const isPromotedAdmin = Boolean(
    currentUser.username &&
    room.roomAdmins?.some((u) => u.toLowerCase() === currentUser.username.toLowerCase())
  );
  const isRoomAdmin = isCreator || isPromotedAdmin;

  const userAdminRights: RoomAdminRights = room.roomAdminRights?.[currentUser.username] || {
    canDeleteMessages: true,
    canPinMessages: true,
    canManagePolls: true,
    canDeletePolls: true,
    canChangePrivacy: true,
    canEditRoom: true,
    canKickUsers: true,
  };

  // Telegram-style granular permission rules:
  // 1. Only Room Creator / Owner / Global Dev Admin can promote, demote, or configure admin rights
  const canUserManageAdmins = isCreator;

  // 2. Room Creator OR Promoted Admin with canKickUsers can kick normal members
  const canUserKickMembers = isCreator || (isPromotedAdmin && Boolean(userAdminRights.canKickUsers));

  const canUserDeleteMessages = isCreator || (isPromotedAdmin && Boolean(userAdminRights.canDeleteMessages));
  const canUserDeletePolls = isCreator || (isPromotedAdmin && Boolean(userAdminRights.canDeletePolls ?? userAdminRights.canManagePolls));
  const canUserManagePolls = isCreator || (isPromotedAdmin && Boolean(userAdminRights.canManagePolls));
  const canUserPinMessages = isCreator || (isPromotedAdmin && Boolean(userAdminRights.canPinMessages));
  const canUserEditRoom = isCreator || (isPromotedAdmin && Boolean(userAdminRights.canEditRoom ?? true));
  const canUserChangePrivacy = isCreator || (isPromotedAdmin && Boolean(userAdminRights.canChangePrivacy ?? true));

  // Active member list - ensure owner is always included and prioritized at the top
  const activeMembersList = useMemo(() => {
    const raw = Array.isArray(room.activeMembers) && room.activeMembers.length > 0
      ? room.activeMembers
      : Array.from(
          new Set([
            ...(room.creatorUsername ? [room.creatorUsername] : []),
            ...(room.roomAdmins || []),
            ...messages
              .filter((m) => m.senderUsername && !m.isAnonymous)
              .map((m) => m.senderUsername as string),
          ])
        ).filter(Boolean);

    const list = Array.from(
      new Set([
        ...(room.creatorUsername ? [room.creatorUsername] : []),
        ...raw,
      ])
    )
      .filter(Boolean)
      .filter((u) => u.toLowerCase() !== 'student');

    return list.sort((a, b) => {
      if (a === room.creatorUsername) return -1;
      if (b === room.creatorUsername) return 1;
      const aIsAdmin = room.roomAdmins?.includes(a);
      const bIsAdmin = room.roomAdmins?.includes(b);
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;
      return a.localeCompare(b);
    });
  }, [room.activeMembers, room.creatorUsername, room.roomAdmins, messages]);

  const roomLogs: RoomLog[] = Array.isArray(room.roomLogs) && room.roomLogs.length > 0
    ? room.roomLogs.filter((l) => l.username?.toLowerCase() !== 'student')
    : room.creatorUsername && room.creatorUsername.toLowerCase() !== 'student'
    ? [
        {
          id: 'log-creator',
          roomId: room.id,
          username: room.creatorUsername,
          displayName: room.creatorName || `@${room.creatorUsername}`,
          action: 'created',
          timestamp: room.createdAt || new Date().toISOString(),
        },
      ]
    : [];

  const samplePhotos = [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleOpenEditModal = () => {
    const rawTitle = room.title || '';
    // Strip leading emoji if duplicate
    const cleanTitle = rawTitle.replace(/^(\p{Emoji}|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83E[\uDD00-\uDDFF])\s*/u, '').trim();
    setEditTitle(cleanTitle || rawTitle);
    setEditEmoji(room.emoji || '💬');
    setEditCategory(room.category || 'general');
    setEditDescription(room.description || '');
    setEditLocationArea(room.locationArea || '');
    setEditIsPrivate(Boolean(room.isPrivate));
    setShowEditRoomModal(true);
  };

  const handleUnlockPrivateRoom = (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const cleanInput = (customCode !== undefined ? customCode : privateCodeInput).trim().toUpperCase();
    const cleanInvite = (room.inviteCode || '').trim().toUpperCase();

    if (!cleanInput) {
      if (customCode !== undefined) {
        setModalPasscodeError('Please enter the room invite code.');
      } else {
        setPrivateCodeError('Please enter the room invite code.');
      }
      return;
    }

    if (cleanInvite && cleanInput === cleanInvite) {
      setIsLocallyUnlocked(true);
      setPrivateCodeError('');
      setModalPasscodeError('');
      setShowPrivateUnlockModal(false);
      onJoinRoom?.(room.id, cleanInput);
    } else {
      const errMsg = 'Incorrect invite code. Please check with the room host.';
      if (customCode !== undefined) {
        setModalPasscodeError(errMsg);
      } else {
        setPrivateCodeError(errMsg);
      }
    }
  };

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
    if (!isUserJoined) return;
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
    setVotedOptionIds((prev) => {
      const next = { ...prev, [messageId]: optionId };
      if (currentUser.username) {
        try {
          localStorage.setItem(`CAMPUS_POLL_VOTES_${currentUser.username}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
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
            const rawHandle = part.slice(1);
            const isDevMention = rawHandle.toLowerCase() === 'muhammedrafii2002' || rawHandle.toLowerCase() === 'developer';
            const displayLabel = isDevMention ? '@developer' : part;
            const targetHandle = isDevMention ? 'muhammedrafii2002' : rawHandle;

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (onSelectUser) {
                    onSelectUser(targetHandle);
                  } else {
                    onOpenPrivateChat?.(targetHandle);
                  }
                }}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 mx-0.5 bg-orange-500/20 hover:bg-orange-500/40 text-orange-300 font-bold rounded-md border border-orange-500/30 text-xs transition cursor-pointer active:scale-95"
                title={isDevMention ? 'View Developer Profile' : `View profile details for @${rawHandle}`}
              >
                {displayLabel}
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
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0 cursor-pointer"
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
                
                {/* Privacy Badge */}
                {room.isPrivate ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-purple-300" />
                    <span>Private</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-300" />
                    <span>Public</span>
                  </span>
                )}

                {/* Creator Badge */}
                {isCreator && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Owner / Creator</span>
                  </span>
                )}

                {/* Admin Badge (for non-creator promoted admins) */}
                {!isCreator && isPromotedAdmin && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-purple-400" />
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
            {/* Quick Edit Room Button for Creator/Admin */}
            {canUserEditRoom && (
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                title="Edit Room Details"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Room</span>
              </button>
            )}

            {/* Creator has no Join/Leave option. Non-creators toggle Join vs Leave */}
            {!isCreator && (
              isUserJoined ? (
                <button
                  type="button"
                  onClick={() => setShowLeaveConfirmModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-400 text-xs font-bold border border-slate-700 transition cursor-pointer"
                  title="Leave room"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (room.isPrivate && !hasFullAccess) {
                      setModalPasscodeInput('');
                      setModalPasscodeError('');
                      setShowPrivateUnlockModal(true);
                    } else {
                      onJoinRoom?.(room.id);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
                  title="Join room"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Join</span>
                </button>
              )
            )}

            {/* 3-Dot Menu */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 flex items-center justify-center cursor-pointer"
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
                    {/* Join / Leave Room Option (Only for non-creators) */}
                    {!isCreator && (
                      isUserJoined ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreMenu(false);
                            setShowLeaveConfirmModal(true);
                          }}
                          className="w-full px-3.5 py-2.5 hover:bg-red-950/60 text-left flex items-center gap-2 text-red-400 transition cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                          <span>Leave Room</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreMenu(false);
                            if (room.isPrivate && !hasFullAccess) {
                              setModalPasscodeInput('');
                              setModalPasscodeError('');
                              setShowPrivateUnlockModal(true);
                            } else {
                              onJoinRoom?.(room.id);
                            }
                          }}
                          className="w-full px-3.5 py-2.5 hover:bg-emerald-950/60 text-left flex items-center gap-2 text-emerald-400 transition cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Join Room</span>
                        </button>
                      )
                    )}

                    {/* Edit Room Details Option */}
                    {canUserEditRoom && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          handleOpenEditModal();
                        }}
                        className="w-full px-3.5 py-2.5 hover:bg-slate-800 text-left flex items-center gap-2 text-amber-300 transition cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Edit Room Details</span>
                      </button>
                    )}

                    {/* Active Members Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowMembersModal(true);
                      }}
                      className="w-full px-3.5 py-2.5 hover:bg-slate-800 text-left flex items-center gap-2 text-emerald-400 transition cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Active Members ({activeMembersList.length})</span>
                    </button>

                    {/* Room Activity Log Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowRoomLogsModal(true);
                      }}
                      className="w-full px-3.5 py-2.5 hover:bg-slate-800 text-left flex items-center gap-2 text-blue-300 transition cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>📜 Room Activity Log</span>
                    </button>

                    {/* Share Room Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowShareModal(true);
                      }}
                      className="w-full px-3.5 py-2.5 hover:bg-slate-800 text-left flex items-center gap-2 text-slate-200 transition cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>Share Room Link</span>
                    </button>

                    {/* Report Room Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        onReportItem('room', room.id, room.title);
                      }}
                      className="w-full px-3.5 py-2.5 hover:bg-slate-800 text-left flex items-center gap-2 text-red-400 transition cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Report Room</span>
                    </button>

                    {/* Direct Delete Room Option (For Platform Developer / Lead Admin) */}
                    {currentUser.isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowDirectDeleteModal(true);
                        }}
                        className="w-full px-3.5 py-2.5 hover:bg-red-950/60 hover:text-red-300 text-left flex items-center gap-2 text-red-400 font-bold transition border-t border-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Delete Room (Dev Admin)</span>
                      </button>
                    )}

                    {/* Request Room Deletion Option (For Room Creator & Promoted Admins) */}
                    {isRoomAdmin && !currentUser.isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowDeletionModal(true);
                        }}
                        className="w-full px-3.5 py-2.5 hover:bg-red-950/60 hover:text-red-300 text-left flex items-center gap-2 text-red-400 font-bold transition border-t border-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Request Room Deletion to Developer</span>
                      </button>
                    )}

                    {/* Close Option */}
                    <button
                      type="button"
                      onClick={() => setShowMoreMenu(false)}
                      className="w-full px-3.5 py-2 hover:bg-slate-800 text-left flex items-center gap-2 text-slate-400 border-t border-slate-800 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 shrink-0" />
                      <span>Close Menu</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Room Info Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <MapPin className="w-3 h-3 text-orange-400" />
              <span>{room.locationArea}</span>
            </span>

            <button
              onClick={() => setShowMembersModal(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 hover:text-emerald-300 hover:border-emerald-700/60 font-semibold transition cursor-pointer"
            >
              <Users className="w-3 h-3 text-emerald-400" />
              <span>{activeMembersList.length} Members</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-mono">{expiry.label}</span>
          </div>
        </div>

        {/* ROOM DELETION REQUESTED BANNER (Visible to creator, admins, and members) */}
        {room.deletionRequested && (
          <div className="mt-2 p-3 bg-amber-950/80 border border-amber-500/40 rounded-2xl flex items-start justify-between gap-3 text-amber-200 text-xs">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-amber-300 text-xs sm:text-sm">
                    ⚠️ Deletion Requested by {isCreator ? 'You (Creator)' : `@${room.deletionRequestedBy || room.creatorUsername}`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-bold text-amber-300">
                    Pending Review
                  </span>
                </div>
                <p className="text-amber-200/90 mt-0.5 text-xs">
                  {room.deletionReason ? `Reason: "${room.deletionReason}"` : 'The creator has requested developer admin review to delete this room.'}
                </p>
                <p className="text-[11px] text-amber-400/70 mt-0.5">
                  Lead Developer Admin (`@muhammedrafii2002`) has received this in the moderation queue.
                </p>
              </div>
            </div>
            {(isCreator || currentUser.isAdmin || isRoomAdmin) && onCancelRoomDeletionRequest && (
              <button
                type="button"
                onClick={() => onCancelRoomDeletionRequest(room.id)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold transition flex items-center gap-1.5 cursor-pointer text-xs active:scale-95"
                title="Cancel deletion request"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* MESSAGES LIST */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* If private room and user does not have full access yet, show private gate */}
        {room.isPrivate && !hasFullAccess ? (
          <div className="my-auto py-10 flex flex-col items-center justify-center text-center space-y-5 px-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border-2 border-purple-500/30 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/10">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-black">
                <span>🔒 Private Campus Room</span>
              </div>
              <h3 className="text-lg font-black text-white">
                Access Code Required
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {room.description || 'This is a private discussion room. An invite code is required to read messages and join.'}
              </p>
              <p className="text-[11px] text-slate-400">
                You can view room details and active members below, but messages are locked.
              </p>
            </div>

            {/* Code Input Form */}
            <form onSubmit={handleUnlockPrivateRoom} className="w-full space-y-3">
              <div className="relative">
                <input
                  id="private-room-code-input"
                  type="text"
                  value={privateCodeInput}
                  onChange={(e) => {
                    setPrivateCodeInput(e.target.value);
                    setPrivateCodeError('');
                  }}
                  placeholder="Enter Room Code (e.g. PRV-XXXXXX)"
                  className="w-full px-4 py-3 bg-slate-950 border border-purple-500/40 rounded-2xl text-center text-sm font-mono font-bold tracking-widest text-amber-300 placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:border-purple-400 shadow-inner uppercase"
                />
              </div>

              {privateCodeError && (
                <p className="text-xs font-bold text-red-400 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{privateCodeError}</span>
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-purple-600/30 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>Unlock & Join Room</span>
              </button>
            </form>

            {/* Quick action to view members */}
            <button
              type="button"
              onClick={() => setShowMembersModal(true)}
              className="text-xs text-slate-400 hover:text-emerald-400 font-semibold flex items-center gap-1.5 transition cursor-pointer pt-2"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>View Room Members ({activeMembersList.length})</span>
            </button>
          </div>
        ) : (
          <>
            {/* Creator / Pinned Message Banner if exists */}
            {room.pinnedMessageId && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs text-amber-200">
                <div className="flex items-center gap-2 min-w-0">
                  <Pin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold text-amber-300 shrink-0">Pinned:</span>
                  <span className="truncate">
                    {messages.find((m) => m.id === room.pinnedMessageId)?.content || 'Pinned notice'}
                  </span>
                </div>
                {canUserPinMessages && (
                  <button
                    type="button"
                    onClick={() => onPinMessage?.(room.id, null)}
                    className="text-[10px] text-amber-400 hover:underline shrink-0 font-bold"
                  >
                    Unpin
                  </button>
                )}
              </div>
            )}

            {messages.length === 0 && (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <div className="text-3xl">💬</div>
                <p className="text-xs font-semibold text-slate-400">
                  No messages in this room yet.
                </p>
                <p className="text-[11px] text-slate-500">
                  {isUserJoined
                    ? 'Say hello and start the campus conversation!'
                    : 'Click Join Room below to send the first message.'}
                </p>
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.senderUsername === currentUser.username;
              const isMsgCreator = room.creatorUsername === msg.senderUsername;
              const isPinned = room.pinnedMessageId === msg.id;
              const isDevSender = msg.senderUsername === 'muhammedrafii2002' || (!msg.isAnonymous && msg.senderName?.includes('Muhammed Rafi'));
              const senderDisplayName = isDevSender ? 'Developer' : msg.senderName;
              const senderBadge = isDevSender ? '⚡ Developer' : msg.senderBadge;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 sm:gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    onClick={() => {
                      if (!msg.isAnonymous && msg.senderUsername && onSelectUser) {
                        onSelectUser(msg.senderUsername);
                      }
                    }}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 ${
                      msg.isAnonymous
                        ? 'bg-purple-950 text-purple-400 border border-purple-700/50'
                        : isMe
                        ? 'bg-orange-600 text-white shadow-md cursor-pointer'
                        : isDevSender
                        ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-md cursor-pointer border border-orange-400/40'
                        : 'bg-slate-800 text-orange-400 border border-slate-700 cursor-pointer hover:border-orange-500'
                    }`}
                    title={msg.isAnonymous ? 'Anonymous Member' : `View @${msg.senderUsername}`}
                  >
                    {msg.isAnonymous ? '🕵️' : isDevSender ? '👨‍💻' : (senderDisplayName?.charAt(0) || 'U')}
                  </div>

                  {/* Message Content Bubble */}
                  <div
                    className={`max-w-[82%] sm:max-w-[75%] rounded-2xl p-3.5 relative shadow-sm ${
                      isMe
                        ? 'bg-orange-600/90 text-white rounded-tr-none border border-orange-500/40'
                        : 'bg-slate-800/90 text-slate-100 rounded-tl-none border border-slate-700/80'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          onClick={() => {
                            if (!msg.isAnonymous && msg.senderUsername && onSelectUser) {
                              onSelectUser(msg.senderUsername);
                            }
                          }}
                          className={`text-xs font-black ${
                            isMe ? 'text-white' : 'text-orange-400 hover:underline cursor-pointer'
                          }`}
                        >
                          {senderDisplayName}
                        </span>

                        {isMsgCreator && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 border border-amber-500/40 flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5 text-amber-400" /> Host
                          </span>
                        )}

                        {senderBadge && (
                          <span className="text-[9px] font-semibold opacity-75">
                            {senderBadge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] opacity-60 font-mono">
                          {formatRelativeTime(msg.timestamp)}
                        </span>

                        {/* Action button */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMessageMenuId(
                                activeMessageMenuId === msg.id ? null : msg.id
                              )
                            }
                            className="opacity-70 sm:opacity-0 group-hover:opacity-100 transition p-1 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                            title="Message options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeMessageMenuId === msg.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setActiveMessageMenuId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs w-44">
                                {!msg.isAnonymous && msg.senderUsername && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMessageMenuId(null);
                                      onSelectUser?.(msg.senderUsername!);
                                    }}
                                    className="w-full px-3 py-1.5 text-left hover:bg-slate-800 text-slate-200 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span>👤 View Profile</span>
                                  </button>
                                )}

                                {!isMe && !msg.isAnonymous && msg.senderUsername && onOpenPrivateChat && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMessageMenuId(null);
                                      onOpenPrivateChat(msg.senderUsername!);
                                    }}
                                    className="w-full px-3 py-1.5 text-left hover:bg-slate-800 text-orange-400 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span>💬 Direct Message</span>
                                  </button>
                                )}

                                {/* Admin Promotion & Management from Message Menu */}
                                {!isMe && !msg.isAnonymous && msg.senderUsername && msg.senderUsername !== room.creatorUsername && canUserManageAdmins && (
                                  !(room.roomAdmins || []).includes(msg.senderUsername) ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMessageMenuId(null);
                                        setConfiguringRightsUser(msg.senderUsername!);
                                        setEditingRights({
                                          canDeleteMessages: true,
                                          canPinMessages: true,
                                          canManagePolls: true,
                                          canDeletePolls: true,
                                          canChangePrivacy: true,
                                          canEditRoom: true,
                                          canKickUsers: true,
                                        });
                                      }}
                                      className="w-full px-3 py-1.5 text-left hover:bg-slate-800 text-purple-300 flex items-center gap-1.5 cursor-pointer font-semibold"
                                    >
                                      <Crown className="w-3.5 h-3.5 text-purple-400" />
                                      <span>👑 Promote to Admin</span>
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMessageMenuId(null);
                                          setConfiguringRightsUser(msg.senderUsername!);
                                          setEditingRights(
                                            room.roomAdminRights?.[msg.senderUsername!] || {
                                              canDeleteMessages: true,
                                              canPinMessages: true,
                                              canManagePolls: true,
                                              canDeletePolls: true,
                                              canChangePrivacy: true,
                                              canEditRoom: true,
                                              canKickUsers: true,
                                            }
                                          );
                                        }}
                                        className="w-full px-3 py-1.5 text-left hover:bg-slate-800 text-amber-300 flex items-center gap-1.5 cursor-pointer font-semibold"
                                      >
                                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                                        <span>⚙️ Edit Admin Rights</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMessageMenuId(null);
                                          onDemoteRoomAdmin?.(room.id, msg.senderUsername!);
                                        }}
                                        className="w-full px-3 py-1.5 text-left hover:bg-red-950/60 text-red-400 flex items-center gap-1.5 cursor-pointer font-semibold"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>🔻 Demote to User</span>
                                      </button>
                                    </>
                                  )
                                )}

                                {/* Kick User from Room option */}
                                {!isMe && !msg.isAnonymous && msg.senderUsername && msg.senderUsername !== room.creatorUsername && canUserKickMembers && (!room.roomAdmins?.includes(msg.senderUsername) || canUserManageAdmins) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMessageMenuId(null);
                                      setKickingTargetUser(msg.senderUsername!);
                                    }}
                                    className="w-full px-3 py-1.5 text-left hover:bg-red-950/60 text-rose-400 flex items-center gap-1.5 cursor-pointer font-semibold"
                                  >
                                    <span>🥾 Kick from Room</span>
                                  </button>
                                )}

                                {/* Delete Poll Option */}
                                {msg.poll && (isMe || msg.poll.createdBy === currentUser.username || canUserDeletePolls) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMessageMenuId(null);
                                      onDeletePoll(msg.id);
                                    }}
                                    className="w-full px-3 py-1.5 text-left hover:bg-red-950/60 text-purple-300 hover:text-red-300 flex items-center gap-1.5 cursor-pointer font-semibold"
                                  >
                                    <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
                                    <span>🗑️ Delete Poll</span>
                                  </button>
                                )}

                                {canUserPinMessages && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMessageMenuId(null);
                                      onPinMessage?.(room.id, isPinned ? null : msg.id);
                                    }}
                                    className="w-full px-3 py-1.5 text-left hover:bg-slate-800 text-amber-300 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Pin className="w-3.5 h-3.5" />
                                    <span>{isPinned ? 'Unpin' : 'Pin to Top'}</span>
                                  </button>
                                )}

                                {(isMe || canUserDeleteMessages) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMessageMenuId(null);
                                      onDeleteMessage(msg.id);
                                    }}
                                    className="w-full px-3 py-1.5 text-left hover:bg-red-950/60 text-red-400 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Message</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMessageMenuId(null);
                                    onReportItem('message', msg.id, msg.content);
                                  }}
                                  className="w-full px-3 py-1.5 text-left hover:bg-slate-800 text-slate-400 hover:text-red-400 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Report</span>
                                </button>

                                {/* Close Button */}
                                <button
                                  type="button"
                                  onClick={() => setActiveMessageMenuId(null)}
                                  className="w-full px-3 py-1.5 text-left hover:bg-slate-800 text-slate-400 flex items-center gap-1.5 border-t border-slate-800 font-semibold cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Close</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Message Body */}
                <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                  {renderMessageContent(msg.content)}
                </div>

                {/* Media Image */}
                {msg.mediaUrl && (
                  <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-700/60 max-h-60 bg-black">
                    <img
                      src={msg.mediaUrl}
                      alt="Witness attachment"
                      onClick={() => setLightboxImage(msg.mediaUrl!)}
                      className="w-full h-full object-cover cursor-pointer hover:scale-102 transition duration-200"
                    />
                  </div>
                )}

                {/* Poll Card */}
                {msg.poll && (
                  <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                      <div className="flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4 text-purple-400" />
                        <span>{msg.poll.question}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {msg.poll.totalVotes} votes
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {msg.poll.options.map((opt) => {
                        const total = msg.poll!.totalVotes || 0;
                        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                        const isVoted =
                          votedOptionIds[msg.id] === opt.id ||
                          opt.voters?.includes(currentUser.username);

                        return (
                          <button
                            key={opt.id}
                            disabled={!isUserJoined}
                            onClick={() => handleVote(msg.id, opt.id)}
                            className={`w-full text-left p-2 rounded-xl text-xs relative overflow-hidden border transition flex items-center justify-between cursor-pointer ${
                              isVoted
                                ? 'bg-purple-900/60 border-purple-500 text-white font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div
                              style={{ width: `${pct}%` }}
                              className="absolute left-0 top-0 bottom-0 bg-purple-500/20 transition-all duration-300"
                            />
                            <span className="relative z-10 flex items-center gap-1.5 truncate">
                              {isVoted && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                              <span>{opt.text}</span>
                            </span>
                            <span className="relative z-10 text-[10px] font-mono text-purple-300 shrink-0">
                              {opt.votes} ({pct}%)
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reaction Chips & Quick React Menu */}
                <div className="mt-2.5 flex items-center gap-1 flex-wrap relative">
                  {Object.entries(msg.reactions || {}).map(([emoji, count]) => {
                    const num = Number(count) || 0;
                    return num > 0 ? (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onAddReactionToMessage(msg.id, emoji)}
                        title={`React with ${emoji}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-700 border border-slate-700/80 text-xs text-slate-300 transition active:scale-90 cursor-pointer shadow-sm"
                      >
                        <span>{emoji}</span>
                        <span className="font-semibold text-[10px] text-slate-400">{num}</span>
                      </button>
                    ) : null;
                  })}

                  {/* Add reaction trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser.isRegistered) {
                          onAddReactionToMessage(msg.id, '🔥');
                          return;
                        }
                        setActiveReactionMenuId(activeReactionMenuId === msg.id ? null : msg.id);
                      }}
                      title="Add reaction"
                      className="px-1.5 py-0.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-400 hover:text-amber-400 transition cursor-pointer flex items-center gap-1"
                    >
                      <Smile className="w-3 h-3" />
                      <span>+</span>
                    </button>

                    {activeReactionMenuId === msg.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setActiveReactionMenuId(null)}
                        />
                        <div className="absolute left-0 bottom-full mb-1 z-50 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-full px-2 py-1 flex items-center gap-1 shadow-2xl animate-in fade-in zoom-in-95">
                          {['🔥', '❤️', '👍', '😂', '👏', '🚀', '💯', '💡'].map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => {
                                onAddReactionToMessage(msg.id, em);
                                setActiveReactionMenuId(null);
                              }}
                              className="text-base p-1 hover:scale-125 transition active:scale-95 cursor-pointer"
                              title={`React with ${em}`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </>
      )}

        <div ref={chatEndRef} />
      </div>

      {/* BOTTOM ACTION AREA: COMPOSER IF JOINED / JOIN PROMPT IF NOT JOINED */}
      {isUserJoined ? (
        <form
          onSubmit={handleSend}
          className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4 relative space-y-2 shrink-0"
        >
          {/* Mentions Autosuggest Dropdown */}
          {showMentionMenu && filteredMentionUsers.length > 0 && (
            <div className="absolute bottom-full mb-2 left-4 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-w-xs w-full p-1 animate-in fade-in">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60 mb-1 flex items-center gap-1">
                <AtSign className="w-3 h-3 text-orange-400" />
                <span>Mention Room Member</span>
              </div>
              {filteredMentionUsers.map((username) => (
                <button
                  key={username}
                  type="button"
                  onClick={() => handleSelectMention(username)}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-orange-600 hover:text-white rounded-lg transition flex items-center justify-between cursor-pointer"
                >
                  <span>@{username}</span>
                  <span className="text-[10px] opacity-70">Member</span>
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
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Image Picker Panel */}
          {showImagePicker && (
            <div className="mb-3 p-3 bg-slate-800 rounded-2xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>📸 Attach Campus Photo</span>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
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
              className="text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-1 transition cursor-pointer"
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
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
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
              className={`p-3 rounded-xl font-semibold transition active:scale-95 shadow-md shrink-0 text-white disabled:opacity-40 cursor-pointer ${
                isAnonymousMode
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      ) : room.isPrivate && !hasFullAccess ? (
        /* PRIVATE LOCKED BANNER: Requires code to message */
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-white">
                Private Room • Code Required to Chat
              </h4>
              <p className="text-[11px] text-slate-400">
                Enter the room invite code to unlock messages and send live chats.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const inputEl = document.getElementById('private-room-code-input');
              inputEl?.focus();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Enter Code to Join</span>
          </button>
        </div>
      ) : (
        /* NOT JOINED BANNER: Requires Join to Message */
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-white">
                Join this room to send messages & participate
              </h4>
              <p className="text-[11px] text-slate-400">
                Join to chat with campus students, share photos, and vote in live polls.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (room.isPrivate && !hasFullAccess) {
                setModalPasscodeInput('');
                setModalPasscodeError('');
                setShowPrivateUnlockModal(true);
              } else {
                onJoinRoom?.(room.id);
              }
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Join Room</span>
          </button>
        </div>
      )}

      {/* Private Room Passcode Unlock Modal */}
      {showPrivateUnlockModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrivateUnlockModal(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-sm w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-5 space-y-3 sm:space-y-4 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-white">Private Room Code</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">Invite Code Required to Join</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivateUnlockModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUnlockPrivateRoom(e, modalPasscodeInput);
              }}
              className="space-y-3 overflow-y-auto pr-1 flex-1 py-1"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Enter 6-Character Passcode
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={modalPasscodeInput}
                    onChange={(e) => {
                      setModalPasscodeError('');
                      setModalPasscodeInput(e.target.value);
                    }}
                    placeholder="e.g. PRV-8A2F91"
                    className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 text-xs font-mono font-bold text-white placeholder-slate-500 uppercase"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">
                  This room is private. You must enter the exact host invite code to read messages and join.
                </p>
              </div>

              {modalPasscodeError && (
                <div className="p-2.5 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs font-semibold">
                  {modalPasscodeError}
                </div>
              )}

              <div className="flex gap-2 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPrivateUnlockModal(false)}
                  className="flex-1 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 sm:py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlock & Join</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Details Modal */}
      {showEditRoomModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditRoomModal(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-5 shadow-2xl space-y-3 sm:space-y-4 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm sm:text-base text-white">Edit Room Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditRoomModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editTitle.trim()) return;
                if (onUpdateRoom) {
                  const updatedTitle = editEmoji.trim()
                    ? `${editEmoji.trim()} ${editTitle.trim()}`
                    : editTitle.trim();

                  const payload: Partial<TrendingRoom> = {
                    title: updatedTitle,
                    emoji: editEmoji.trim() || '💬',
                    category: editCategory,
                    description: editDescription.trim(),
                    locationArea: editLocationArea.trim(),
                    isPrivate: editIsPrivate,
                  };
                  if (editIsPrivate && !room.inviteCode) {
                    payload.inviteCode = `PRV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                  }
                  onUpdateRoom(room.id, payload);
                }
                setShowEditRoomModal(false);
              }}
              className="space-y-3 sm:space-y-4 overflow-y-auto pr-1 flex-1 py-1"
            >
              {/* Emoji & Title */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Emoji</label>
                  <input
                    type="text"
                    value={editEmoji}
                    onChange={(e) => setEditEmoji(e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:py-2 bg-slate-950 border border-slate-800 rounded-xl text-center text-base sm:text-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Room Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Public vs Private Room Switch */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Privacy Setting
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsPrivate(false)}
                    className={`p-2 sm:p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                      !editIsPrivate
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">Public</div>
                      <div className="text-[9px] opacity-75 truncate">All campus</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditIsPrivate(true)}
                    className={`p-2 sm:p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                      editIsPrivate
                        ? 'bg-purple-950/80 border-purple-500 text-purple-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">Private</div>
                      <div className="text-[9px] opacity-75 truncate">Code only</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Room Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
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
                  rows={2}
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Location Area */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Location / Area</label>
                <input
                  type="text"
                  value={editLocationArea}
                  onChange={(e) => setEditLocationArea(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditRoomModal(false)}
                  className="flex-1 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 sm:py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Room Join Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-white">Share Room Join Link</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">Invite students to join live</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  setCopiedLink(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 space-y-3 py-1">
              {/* Room Type Notice */}
              {room.isPrivate ? (
                <div className="bg-purple-950/80 border border-purple-500/50 rounded-2xl p-3 space-y-2 text-purple-200">
                  <div className="flex items-center gap-2 font-bold text-xs text-purple-300">
                    <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>🔒 Private Room</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] leading-relaxed text-purple-200/90">
                    This is a private room. Only students with this exact invite link or code can join.
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
                <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-3 space-y-1 text-emerald-200">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-300">
                    <span>🌐 Public Room</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] leading-relaxed text-emerald-200/90">
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
                    className="flex-1 px-3 py-2 sm:py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none"
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
                    className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 active:scale-95 cursor-pointer"
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
            </div>

            <div className="pt-2 text-center shrink-0 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  setCopiedLink(false);
                }}
                className="w-full py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
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

      {/* Room Members List Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-5 space-y-3 sm:space-y-4 text-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-xs sm:text-base">
                  Room Members ({activeMembersList.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMembersModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1 py-1">
              {activeMembersList.map((username) => {
                const isMe = username === currentUser.username;
                const isMemberCreator = room.creatorUsername === username;
                const isMemberAdmin = Boolean(room.roomAdmins?.includes(username));
                const isDevMember = username === 'muhammedrafii2002' || username === 'muhammedrafi042002';

                return (
                  <div
                    key={username}
                    className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between transition border ${
                      isMe
                        ? 'bg-slate-900/90 border-orange-500/40 ring-1 ring-orange-500/20'
                        : isMemberCreator
                        ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                        : isMemberAdmin
                        ? 'bg-purple-950/20 border-purple-500/40 hover:border-purple-400'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      onClick={() => {
                        if (isMe) return;
                        if (onSelectUser) onSelectUser(username);
                        else onOpenPrivateChat?.(username);
                      }}
                      className={`flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 ${isMe ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-bold flex items-center justify-center text-xs border shrink-0 transition ${
                        isMe
                          ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white border-orange-400/50'
                          : isDevMember
                          ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white border-orange-400/40'
                          : isMemberCreator
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : isMemberAdmin
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      }`}>
                        {isDevMember ? '👨‍💻' : username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-white flex items-center gap-1.5 flex-wrap">
                          <span className={`truncate ${isMe ? 'text-orange-300' : 'hover:text-orange-400 transition'}`}>
                            {isDevMember ? 'Developer' : `@${username}`}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/40 rounded text-[9px] font-black shrink-0">
                              You
                            </span>
                          )}
                          {isDevMember && (
                            <span className="px-1.5 py-0.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-black flex items-center gap-1 shrink-0 shadow-sm">
                              ⚡ Lead Dev
                            </span>
                          )}
                          {isMemberCreator && (
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-black flex items-center gap-1 shrink-0 shadow-sm">
                              <Crown className="w-3 h-3 text-amber-400" /> Owner
                            </span>
                          )}
                          {!isMemberCreator && isMemberAdmin && (
                            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[9px] font-black flex items-center gap-1 shrink-0 shadow-sm">
                              <Shield className="w-3 h-3 text-purple-400" /> Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          {isMemberCreator ? 'Owner & Member' : isMemberAdmin ? 'Admin & Member' : 'Member'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                      {isMe ? (
                        <span className="text-[10px] font-extrabold text-orange-400 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/30">
                          👤 You
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveMemberMenuUser(username)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700/80 transition cursor-pointer active:scale-95 shadow-sm"
                          title="Member options"
                        >
                          <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Member Action Options Popup Modal */}
      {activeMemberMenuUser && (
        <div
          className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveMemberMenuUser(null);
          }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl max-w-sm w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-5 space-y-3 sm:space-y-4 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                  {activeMemberMenuUser.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1.5 truncate">
                    <span>@{activeMemberMenuUser}</span>
                    {room.roomAdmins?.includes(activeMemberMenuUser) && (
                      <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[9px] font-bold shrink-0">
                        Admin
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-400">Select an action for this member</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveMemberMenuUser(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1 py-1">
              {/* Telegram-style Admin Actions: Only Room Creator / SuperAdmin can promote or manage admin roles */}
              {canUserManageAdmins && activeMemberMenuUser !== room.creatorUsername && (
                <>
                  {!room.roomAdmins?.includes(activeMemberMenuUser) ? (
                    /* Regular Member -> Promote to Admin */
                    <button
                      type="button"
                      onClick={() => {
                        const target = activeMemberMenuUser;
                        setActiveMemberMenuUser(null);
                        setConfiguringRightsUser(target);
                        setEditingRights({
                          canDeleteMessages: true,
                          canPinMessages: true,
                          canManagePolls: true,
                          canDeletePolls: true,
                          canChangePrivacy: true,
                          canEditRoom: true,
                          canKickUsers: true,
                        });
                      }}
                      className="w-full p-2.5 sm:p-3 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 rounded-xl sm:rounded-2xl text-left flex items-center gap-2.5 sm:gap-3 transition cursor-pointer active:scale-98 group"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                        <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-200 group-hover:text-white">Promote to Admin</div>
                        <div className="text-[10px] text-purple-400/80">Configure moderation rights & permissions</div>
                      </div>
                    </button>
                  ) : (
                    /* Existing Admin -> Edit Rights & Demote */
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const target = activeMemberMenuUser;
                          setActiveMemberMenuUser(null);
                          setConfiguringRightsUser(target);
                          setEditingRights(
                            room.roomAdminRights?.[target] || {
                              canDeleteMessages: true,
                              canPinMessages: true,
                              canManagePolls: true,
                              canDeletePolls: true,
                              canChangePrivacy: true,
                              canEditRoom: true,
                              canKickUsers: true,
                            }
                          );
                        }}
                        className="w-full p-2.5 sm:p-3 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 rounded-xl sm:rounded-2xl text-left flex items-center gap-2.5 sm:gap-3 transition cursor-pointer active:scale-98 group"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-amber-200 group-hover:text-white">Edit Admin Rights</div>
                          <div className="text-[10px] text-amber-400/80">Enable or disable specific admin privileges</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const target = activeMemberMenuUser;
                          setActiveMemberMenuUser(null);
                          onDemoteRoomAdmin?.(room.id, target);
                        }}
                        className="w-full p-2.5 sm:p-3 bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 rounded-xl sm:rounded-2xl text-left flex items-center gap-2.5 sm:gap-3 transition cursor-pointer active:scale-98 group"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-sm shrink-0">
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-red-200 group-hover:text-white">Demote to Member</div>
                          <div className="text-[10px] text-red-400/80">Revoke admin privileges for this user</div>
                        </div>
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Kick Out: Only Creator / SuperAdmin OR Promoted Admin with canKickUsers right (and cannot kick Creator or fellow Admins) */}
              {canUserKickMembers && activeMemberMenuUser !== room.creatorUsername && (!room.roomAdmins?.includes(activeMemberMenuUser) || canUserManageAdmins) && (
                <button
                  type="button"
                  onClick={() => {
                    const target = activeMemberMenuUser;
                    setActiveMemberMenuUser(null);
                    setKickingTargetUser(target);
                  }}
                  className="w-full p-2.5 sm:p-3 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 rounded-xl sm:rounded-2xl text-left flex items-center gap-2.5 sm:gap-3 transition cursor-pointer active:scale-98 group"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm shrink-0">
                    <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-200 group-hover:text-white">Kick Out</div>
                    <div className="text-[10px] text-rose-400/80">Remove this member from the room</div>
                  </div>
                </button>
              )}

              {/* Direct Message & Profile for all users */}
              <button
                type="button"
                onClick={() => {
                  const target = activeMemberMenuUser;
                  setActiveMemberMenuUser(null);
                  setShowMembersModal(false);
                  onOpenPrivateChat?.(target);
                }}
                className="w-full p-2.5 sm:p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl sm:rounded-2xl text-left flex items-center gap-2.5 sm:gap-3 transition cursor-pointer active:scale-98"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm shrink-0">
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Send Direct Message</div>
                  <div className="text-[10px] text-slate-400">Open a 1-on-1 private chat</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = activeMemberMenuUser;
                  setActiveMemberMenuUser(null);
                  if (onSelectUser) onSelectUser(target);
                  else onOpenPrivateChat?.(target);
                }}
                className="w-full p-2.5 sm:p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-xl sm:rounded-2xl text-left flex items-center gap-2.5 sm:gap-3 transition cursor-pointer active:scale-98"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm shrink-0">
                  👤
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-300">View User Profile</div>
                  <div className="text-[10px] text-slate-400">Check college affiliation and badges</div>
                </div>
              </button>
            </div>

            <div className="pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveMemberMenuUser(null)}
                className="w-full py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Activity Log Modal */}
      {showRoomLogsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-5 space-y-3 sm:space-y-4 text-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base">
                    📜 Room Activity Logs
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">
                    Real-time member join & leave records
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRoomLogsModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1 flex-1 py-1">
              {roomLogs.length === 0 ? (
                <div className="p-6 sm:p-8 text-center bg-slate-950 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400">No activity logged yet.</p>
                </div>
              ) : (
                roomLogs.map((log) => {
                  const isJoin = log.action === 'joined';
                  const isLeave = log.action === 'left';
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
                      className="p-2.5 sm:p-3 bg-slate-950 border border-slate-800/80 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
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

            <div className="pt-2 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowRoomLogsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Modal */}
      {showDeletionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-5 space-y-3 sm:space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 border-b border-slate-800 pb-2.5 shrink-0">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-extrabold text-sm sm:text-base text-white">Request Room Deletion</h3>
            </div>
            <div className="space-y-3 overflow-y-auto pr-1 flex-1 py-1">
              <p className="text-xs text-slate-400">
                As Room Admin, explain why this campus room should be archived or removed:
              </p>
              <textarea
                value={deletionReasonInput}
                onChange={(e) => setDeletionReasonInput(e.target.value)}
                placeholder="e.g., Event has finished or topic completed..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowDeletionModal(false)}
                className="px-3.5 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRequestRoomDeletion(room.id, deletionReasonInput || 'Host requested deletion.');
                  setShowDeletionModal(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Room Confirmation Modal */}
      {showLeaveConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLeaveConfirmModal(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-sm w-full max-h-[85vh] flex flex-col p-4 sm:p-5 space-y-3 sm:space-y-4 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shrink-0">
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="text-center space-y-1.5 overflow-y-auto flex-1">
              <h3 className="font-extrabold text-sm sm:text-base text-white">Leave Room?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to leave <span className="text-orange-400 font-bold">"{room.title}"</span>? You will stop receiving live notifications from this room.
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowLeaveConfirmModal(false)}
                className="flex-1 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveConfirmModal(false);
                  onLeaveRoom?.(room.id);
                }}
                className="flex-1 py-2 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-md shadow-red-600/30 transition cursor-pointer active:scale-95"
              >
                Yes, Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Delete Room Confirmation Modal (For Room Creator & Admin) */}
      {showDirectDeleteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDirectDeleteModal(false);
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-sm w-full max-h-[85vh] flex flex-col p-4 sm:p-5 space-y-3 sm:space-y-4 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shrink-0">
              <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="text-center space-y-1.5 overflow-y-auto flex-1">
              <h3 className="font-extrabold text-sm sm:text-base text-white">Delete Room Permanently?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to delete <span className="text-orange-400 font-bold">"{room.title}"</span>? This will permanently remove the room, all live chat messages, and polls for all students.
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowDirectDeleteModal(false)}
                className="flex-1 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDirectDeleteModal(false);
                  if (onDeleteRoom) {
                    onDeleteRoom(room.id);
                  } else {
                    onRequestRoomDeletion(room.id, 'Creator deleted room.');
                    onBack();
                  }
                }}
                className="flex-1 py-2 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-md shadow-red-600/30 transition cursor-pointer active:scale-95"
              >
                Yes, Delete Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Rights Modal */}
      {configuringRightsUser && (
        <div
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfiguringRightsUser(null);
          }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-5 space-y-3 sm:space-y-4 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-white text-xs sm:text-base truncate">
                    Admin Rights
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                    {room.roomAdmins?.includes(configuringRightsUser)
                      ? `Edit permissions for @${configuringRightsUser}`
                      : `Configure permissions to promote @${configuringRightsUser}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfiguringRightsUser(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1 py-1">
              <label className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">🗑️ Delete Messages</div>
                  <div className="text-[10px] text-slate-400">Can delete inappropriate or spam messages</div>
                </div>
                <input
                  type="checkbox"
                  checked={editingRights.canDeleteMessages}
                  onChange={(e) =>
                    setEditingRights((prev) => ({ ...prev, canDeleteMessages: e.target.checked }))
                  }
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">📌 Pin & Unpin Messages</div>
                  <div className="text-[10px] text-slate-400">Can pin announcements to the top of the room</div>
                </div>
                <input
                  type="checkbox"
                  checked={editingRights.canPinMessages}
                  onChange={(e) =>
                    setEditingRights((prev) => ({ ...prev, canPinMessages: e.target.checked }))
                  }
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">📊 Delete & Manage Polls</div>
                  <div className="text-[10px] text-slate-400">Can create, manage, and delete room polls</div>
                </div>
                <input
                  type="checkbox"
                  checked={editingRights.canDeletePolls ?? editingRights.canManagePolls}
                  onChange={(e) =>
                    setEditingRights((prev) => ({ ...prev, canDeletePolls: e.target.checked, canManagePolls: e.target.checked }))
                  }
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">⚙️ Edit Room Details</div>
                  <div className="text-[10px] text-slate-400">Can modify topic, category, description, and location</div>
                </div>
                <input
                  type="checkbox"
                  checked={editingRights.canEditRoom ?? true}
                  onChange={(e) =>
                    setEditingRights((prev) => ({ ...prev, canEditRoom: e.target.checked }))
                  }
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">🥾 Kick Out Members</div>
                  <div className="text-[10px] text-slate-400">Can remove disruptive users from the room</div>
                </div>
                <input
                  type="checkbox"
                  checked={editingRights.canKickUsers ?? true}
                  onChange={(e) =>
                    setEditingRights((prev) => ({ ...prev, canKickUsers: e.target.checked }))
                  }
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">🔒 Manage Privacy & Passcode</div>
                  <div className="text-[10px] text-slate-400">Can toggle public/private mode and change passcode</div>
                </div>
                <input
                  type="checkbox"
                  checked={editingRights.canChangePrivacy ?? true}
                  onChange={(e) =>
                    setEditingRights((prev) => ({ ...prev, canChangePrivacy: e.target.checked }))
                  }
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="flex gap-2 pt-2.5 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setConfiguringRightsUser(null)}
                className="flex-1 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onPromoteRoomAdmin?.(room.id, configuringRightsUser, editingRights);
                  setConfiguringRightsUser(null);
                }}
                className="flex-1 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95"
              >
                {room.roomAdmins?.includes(configuringRightsUser) ? 'Update Rights' : 'Promote to Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kick Out Member Confirmation Modal */}
      {kickingTargetUser && (
        <div
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setKickingTargetUser(null);
          }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl max-w-sm w-full max-h-[85vh] flex flex-col p-4 sm:p-5 space-y-3 sm:space-y-4 text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center text-base shrink-0">
                🥾
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-white text-sm sm:text-base truncate">
                  Kick Out Member
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  Remove <span className="text-rose-400 font-bold">@{kickingTargetUser}</span> from this room?
                </p>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <p className="text-xs text-slate-300 bg-slate-950/80 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-800 leading-relaxed">
                This member will be removed from the active room members list immediately.
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setKickingTargetUser(null)}
                className="flex-1 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onKickUser) {
                    onKickUser(room.id, kickingTargetUser);
                  }
                  setKickingTargetUser(null);
                }}
                className="flex-1 py-2 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95"
              >
                Kick Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
