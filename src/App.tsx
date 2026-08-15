import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingRoom,
  ChatMessage,
  LocationCoords,
  FloatingReaction,
  CollegeInfo,
  PollData,
  UserProfile,
  FeedPost,
  FeedComment,
  ReportItem,
  ModerationSettings,
  PrivateMessage,
  AppNotification,
  RoomAdminRights,
} from './types';
import { COLLEGES } from './data/mockRooms';
import { Header } from './components/Header';
import { RoomList } from './components/RoomList';
import { LiveRoomView } from './components/LiveRoomView';
import { LiveFeed } from './components/LiveFeed';
import { BottomNav } from './components/BottomNav';
import { PrivateChatModal } from './components/PrivateChatModal';
import { CreateEventModal } from './components/CreateEventModal';
import { CreatePostModal } from './components/CreatePostModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ReportModal } from './components/ReportModal';
import { CollegeSelectorModal } from './components/CollegeSelectorModal';
import { CreatePollModal } from './components/CreatePollModal';
import { SupabaseDevModal } from './components/SupabaseDevModal';
import { AppDownloadModal } from './components/AppDownloadModal';
import { NotificationsModal } from './components/NotificationsModal';
import { broadcastEngine } from './lib/broadcast';
import { supabaseService } from './lib/supabaseService';

export default function App() {
  // Navigation tab: 'feed' | 'rooms' | 'dms'
  const [activeTab, setActiveTab] = useState<'feed' | 'rooms' | 'dms'>('feed');

  // Private Chat State
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>(() => {
    const saved = localStorage.getItem('TRENDING_PRIVATE_MSGS_V2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [activePrivatePartner, setActivePrivatePartner] = useState<string | null>(null);
  const [showPrivateChatModal, setShowPrivateChatModal] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('TRENDING_NOTIFICATIONS_STATE_V2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const sendOutsideNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch (e) {
        console.warn('Could not launch browser notification:', e);
      }
    }
  };

  const handleRequestBrowserNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      setNotificationPermissionStatus(res);
      if (res === 'granted') {
        sendOutsideNotification('🔥 Outside Notifications Enabled!', 'You will now receive desktop / browser alerts even when away.');
      }
    } else {
      alert('Browser push notifications are not supported in this environment.');
    }
  };

  // Active User Profile (Clean unauthenticated guest visitor by default)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('CAMPUS_ACTIVE_USER_SESSION_V5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    const guestRandom = Math.floor(1000 + Math.random() * 9000);
    return {
      id: `guest-${Date.now()}-${guestRandom}`,
      profileId: `PID-${Math.floor(100000 + Math.random() * 900000)}`,
      username: `student_${guestRandom}`,
      displayName: 'Campus Visitor',
      email: '',
      password: '',
      collegeId: COLLEGES[0].id,
      badge: '👤 Campus Visitor',
      isRegistered: false,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };
  });

  // Instant Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Active College Network
  const [currentCollege, setCurrentCollege] = useState<CollegeInfo>(() => {
    const saved = localStorage.getItem('CAMPUS_SELECTED_COLLEGE_V2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return COLLEGES[0]; // SN College Cherthala
  });

  // Rooms State (Initialized empty, loaded from Supabase Database)
  const [rooms, setRooms] = useState<TrendingRoom[]>(() => {
    const saved = localStorage.getItem('TRENDING_ROOMS_STATE_V4');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Messages Map State (Loaded from Supabase Database)
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('TRENDING_MESSAGES_STATE_V4');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  // Feed Posts State (Loaded from Supabase Database)
  const [posts, setPosts] = useState<FeedPost[]>(() => {
    const saved = localStorage.getItem('TRENDING_FEED_POSTS_V4');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Reports State
  const [reports, setReports] = useState<ReportItem[]>(() => {
    const saved = localStorage.getItem('TRENDING_REPORTS_STATE_V4');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Registered Users from Database State
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);

  // Moderation & System Settings State
  const [moderationSettings, setModerationSettings] = useState<ModerationSettings>(() => {
    const saved = localStorage.getItem('TRENDING_MODERATION_SETTINGS_V3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      autoKeywordFilterEnabled: true,
      trendingSensitivity: 'medium',
      bannedKeywords: ['hate', 'scam', 'abuse', 'spam_link'],
    };
  });

  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  // Modals
  const [isCollegeSelectorOpen, setIsCollegeSelectorOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSupabaseDevOpen, setIsSupabaseDevOpen] = useState(false);
  const [requiredActionForProfile, setRequiredActionForProfile] = useState<string | undefined>(
    undefined
  );

  // Report Modal Target State
  const [reportTarget, setReportTarget] = useState<{
    targetType: 'room' | 'message' | 'post' | 'user';
    targetId: string;
    roomId?: string;
    contentPreview?: string;
  } | null>(null);

  // Floating reaction particles
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Unlocked Private Room IDs State
  const [unlockedPrivateRoomIds, setUnlockedPrivateRoomIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('CAMPUS_UNLOCKED_PRIVATE_ROOMS_V1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('CAMPUS_UNLOCKED_PRIVATE_ROOMS_V1', JSON.stringify(unlockedPrivateRoomIds));
  }, [unlockedPrivateRoomIds]);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('TRENDING_USER_PROFILE_V3', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('CAMPUS_SELECTED_COLLEGE', JSON.stringify(currentCollege));
  }, [currentCollege]);

  useEffect(() => {
    localStorage.setItem('TRENDING_ROOMS_STATE_V3', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('TRENDING_MESSAGES_STATE_V3', JSON.stringify(messagesMap));
  }, [messagesMap]);

  useEffect(() => {
    localStorage.setItem('TRENDING_FEED_POSTS_V3', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('TRENDING_REPORTS_STATE_V3', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('TRENDING_MODERATION_SETTINGS_V3', JSON.stringify(moderationSettings));
  }, [moderationSettings]);

  useEffect(() => {
    localStorage.setItem('TRENDING_PRIVATE_MSGS_V2', JSON.stringify(privateMessages));
  }, [privateMessages]);

  useEffect(() => {
    localStorage.setItem('CAMPUS_ACTIVE_USER_SESSION_V5', JSON.stringify(currentUser));
  }, [currentUser]);

  // Supabase Data Initialization & Realtime Sync Effects
  useEffect(() => {
    async function syncSupabaseData() {
      if (!supabaseService.isConfigured()) return;
      await supabaseService.initializeAndSeed(currentCollege.id);

      const dbRooms = await supabaseService.getRooms(currentCollege.id);
      if (dbRooms) {
        setRooms(dbRooms);
      }

      const dbPosts = await supabaseService.getFeedPosts(currentCollege.id);
      if (dbPosts) {
        setPosts(dbPosts);
      }

      const users = await supabaseService.getRegisteredUsers();
      if (users) {
        setDbUsers(users);
      }
    }
    syncSupabaseData();

    const unsubRooms = supabaseService.subscribeToRooms(async () => {
      const updatedRooms = await supabaseService.getRooms(currentCollege.id);
      if (updatedRooms) setRooms(updatedRooms);
    });

    const unsubPosts = supabaseService.subscribeToFeedPosts(async () => {
      const updatedPosts = await supabaseService.getFeedPosts(currentCollege.id);
      if (updatedPosts) setPosts(updatedPosts);
    });

    return () => {
      unsubRooms();
      unsubPosts();
    };
  }, [currentCollege.id]);

  // Sync Room Messages when room opens
  useEffect(() => {
    if (!currentRoomId || !supabaseService.isConfigured()) return;

    async function fetchRoomMessages() {
      const msgs = await supabaseService.getMessages(currentRoomId!);
      if (msgs) {
        setMessagesMap((prev) => ({ ...prev, [currentRoomId!]: msgs }));
      }
    }
    fetchRoomMessages();

    const unsubMsgs = supabaseService.subscribeToMessages(
      currentRoomId,
      (event, msg, oldId) => {
        if (event === 'INSERT') {
          setMessagesMap((prev) => {
            const list = prev[currentRoomId!] || [];
            if (list.some((m) => m.id === msg.id)) return prev;
            return { ...prev, [currentRoomId!]: [...list, msg] };
          });
        } else if (event === 'UPDATE') {
          setMessagesMap((prev) => {
            const list = prev[currentRoomId!] || [];
            return {
              ...prev,
              [currentRoomId!]: list.map((m) => (m.id === msg.id ? msg : m)),
            };
          });
        } else if (event === 'DELETE') {
          const targetId = oldId || msg.id;
          setMessagesMap((prev) => ({
            ...prev,
            [currentRoomId!]: (prev[currentRoomId!] || []).filter((m) => m.id !== targetId),
          }));
        }
      }
    );

    return () => unsubMsgs();
  }, [currentRoomId]);

  // Private Chat Helper Functions
  const handleOpenPrivateChat = (partnerUsername: string) => {
    requireRegistration('send direct private messages', () => {
      setActivePrivatePartner(partnerUsername);
      setShowPrivateChatModal(true);
      // Clear DM unread flags for this partner
      setPrivateMessages((prev) =>
        prev.map((m) =>
          m.senderUsername === partnerUsername && m.recipientUsername === currentUser.username
            ? { ...m, isRead: true }
            : m
        )
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n.type === 'dm' && (!n.fromUsername || n.fromUsername === partnerUsername)
            ? { ...n, isRead: true }
            : n
        )
      );
    });
  };

  const handleDeletePrivateMessage = async (messageId: string) => {
    setPrivateMessages((prev) => prev.filter((m) => m.id !== messageId));
    await supabaseService.deletePrivateMessage(messageId);
    showToast('🗑️ Direct message deleted.', 'info');
  };

  const handleSendPrivateMessage = (recipientUsername: string, content: string) => {
    requireRegistration('send direct private messages', () => {
      const newMsg: PrivateMessage = {
        id: `pm-${Date.now()}`,
        senderUsername: currentUser.username,
        recipientUsername,
        content,
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      setPrivateMessages((prev) => [...prev, newMsg]);
      supabaseService.sendPrivateMessage(newMsg);

      // Trigger notification for recipient
      const dmNotif: AppNotification = {
        id: `notif-dm-${Date.now()}`,
        recipientUsername,
        title: `📩 Direct Message from @${currentUser.username}`,
        message: content.slice(0, 60),
        type: 'dm',
        fromUsername: currentUser.username,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setNotifications((prev) => [dmNotif, ...prev]);
      sendOutsideNotification(
        `📩 Direct Message from @${currentUser.username}`,
        content.slice(0, 60)
      );
    });
  };

  // Logout handler
  const handleLogout = () => {
    const guestUser: UserProfile = {
      id: `guest-${Date.now()}`,
      profileId: `PID-${Math.floor(100000 + Math.random() * 900000)}`,
      username: 'guest',
      displayName: 'Guest Visitor',
      email: '',
      collegeId: currentCollege.id,
      isRegistered: false,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(guestUser);
    localStorage.removeItem('TRENDING_USER_PROFILE_V3');
  };

  // Get list of all conversation partner usernames
  const allConversationPartners = useMemo(() => {
    const list = new Set<string>();
    privateMessages.forEach((m) => {
      if (m.senderUsername === currentUser.username) {
        list.add(m.recipientUsername);
      } else if (m.recipientUsername === currentUser.username) {
        list.add(m.senderUsername);
      }
    });
    return Array.from(list);
  }, [privateMessages, currentUser.username]);

  // Unread DM count
  const unreadDmsCount = useMemo(() => {
    return privateMessages.filter(
      (m) => m.recipientUsername === currentUser.username && !m.isRead
    ).length;
  }, [privateMessages, currentUser.username]);

  // Realtime Multi-tab sync
  useEffect(() => {
    const unsubscribe = broadcastEngine.subscribe((payload) => {
      if (payload.type === 'NEW_MESSAGE') {
        const msg = payload.message;
        setMessagesMap((prev) => ({
          ...prev,
          [msg.roomId]: [...(prev[msg.roomId] || []), msg],
        }));
        setRooms((prev) =>
          prev.map((r) =>
            r.id === msg.roomId
              ? {
                  ...r,
                  lastActivityAt: new Date().toISOString(),
                  activePeopleCount: r.activePeopleCount + 1,
                  hasActivePoll: r.hasActivePoll || !!msg.poll,
                }
              : r
          )
        );
      } else if (payload.type === 'POLL_VOTE') {
        const { roomId, messageId, optionId } = payload;
        setMessagesMap((prev) => {
          const list = prev[roomId] || [];
          return {
            ...prev,
            [roomId]: list.map((m) => {
              if (m.id === messageId && m.poll) {
                return {
                  ...m,
                  poll: {
                    ...m.poll,
                    totalVotes: m.poll.totalVotes + 1,
                    options: m.poll.options.map((opt) =>
                      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
                    ),
                  },
                };
              }
              return m;
            }),
          };
        });
      } else if (payload.type === 'REACTION') {
        const { roomId, messageId, emoji } = payload;
        setMessagesMap((prev) => {
          const list = prev[roomId] || [];
          return {
            ...prev,
            [roomId]: list.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    reactions: {
                      ...m.reactions,
                      [emoji]: (m.reactions[emoji] || 0) + 1,
                    },
                  }
                : m
            ),
          };
        });
      } else if (payload.type === 'FLOATING_EMOJI') {
        const { roomId, emoji } = payload;
        if (roomId === currentRoomId) {
          const newParticle: FloatingReaction = {
            id: `f-${Date.now()}-${Math.random()}`,
            emoji,
            x: Math.floor(Math.random() * 70) + 15,
          };
          setFloatingReactions((prev) => [...prev, newParticle]);
          setTimeout(() => {
            setFloatingReactions((prev) => prev.filter((p) => p.id !== newParticle.id));
          }, 1200);
        }
      } else if (payload.type === 'NEW_ROOM') {
        const newRoom = payload.room;
        setRooms((prev) => [newRoom, ...prev.filter((r) => r.id !== newRoom.id)]);
      } else if (payload.type === 'DELETE_MESSAGE') {
        const { roomId, messageId } = payload;
        setMessagesMap((prev) => ({
          ...prev,
          [roomId]: (prev[roomId] || []).filter((m) => m.id !== messageId),
        }));
      } else if (payload.type === 'DELETE_ROOM') {
        const { roomId } = payload;
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
        setMessagesMap((prev) => {
          const next = { ...prev };
          delete next[roomId];
          return next;
        });
        if (currentRoomId === roomId) {
          setCurrentRoomId(null);
        }
      } else if (payload.type === 'NEW_POST') {
        const newPost = payload.post;
        setPosts((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)]);
      } else if (payload.type === 'DELETE_POST') {
        const { postId } = payload;
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    });

    return unsubscribe;
  }, [currentRoomId]);

  // Helper check for registration requirement before participation
  const requireRegistration = (actionName: string, callback: () => void) => {
    if (!currentUser.isRegistered) {
      setRequiredActionForProfile(actionName);
      setIsUserProfileOpen(true);
    } else {
      callback();
    }
  };

  // Handlers
  const handleEnterRoom = (room: TrendingRoom) => {
    setCurrentRoomId(room.id);
  };

  const handleSendMessage = (
    content: string,
    mediaUrl?: string,
    isAnonymous?: boolean,
    mentions?: string[]
  ) => {
    if (!currentRoomId) return;

    requireRegistration('post messages in rooms', () => {
      // Auto keyword moderation filter check
      let finalContent = content;
      if (moderationSettings.autoKeywordFilterEnabled) {
        moderationSettings.bannedKeywords.forEach((word) => {
          const reg = new RegExp(word, 'gi');
          finalContent = finalContent.replace(reg, '***');
        });
      }

      const senderName = isAnonymous
        ? `🕵️ Anonymous Student #${Math.floor(Math.random() * 89) + 10}`
        : `@${currentUser.username}`;

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        roomId: currentRoomId,
        senderName,
        senderUsername: isAnonymous ? undefined : currentUser.username,
        isAnonymous,
        witnessDistanceText: '📍 Live Spot',
        content: finalContent,
        mediaUrl,
        mediaType: mediaUrl ? 'image' : undefined,
        timestamp: new Date().toISOString(),
        reactions: {},
        isWitness: true,
        mentions,
      };

      setMessagesMap((prev) => ({
        ...prev,
        [currentRoomId]: [...(prev[currentRoomId] || []), newMsg],
      }));

      // Async write to Supabase
      supabaseService.sendMessage(newMsg);

      setRooms((prev) =>
        prev.map((r) =>
          r.id === currentRoomId
            ? {
                ...r,
                lastActivityAt: new Date().toISOString(),
                activePeopleCount: r.activePeopleCount + 1,
              }
            : r
        )
      );

      broadcastEngine.broadcast({ type: 'NEW_MESSAGE', message: newMsg });

      // Trigger notifications for @mentions
      if (mentions && mentions.length > 0) {
        const currentRoom = rooms.find((r) => r.id === currentRoomId);
        const roomTitle = currentRoom ? currentRoom.title : 'a live room';
        mentions.forEach((m) => {
          const notif: AppNotification = {
            id: `notif-${Date.now()}-${Math.random()}`,
            recipientUsername: m,
            title: `💬 Mentioned by @${currentUser.username}`,
            message: `@${currentUser.username} tagged you in "${roomTitle}": "${finalContent.slice(0, 60)}"`,
            type: 'mention',
            linkRoomId: currentRoomId,
            fromUsername: currentUser.username,
            timestamp: new Date().toISOString(),
            isRead: false,
          };
          setNotifications((prev) => [notif, ...prev]);
          sendOutsideNotification(
            `💬 Mentioned by @${currentUser.username}`,
            `Tagged in ${roomTitle}: "${finalContent.slice(0, 50)}"`
          );
        });
      }
    });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentRoomId) return;
    setMessagesMap((prev) => ({
      ...prev,
      [currentRoomId]: (prev[currentRoomId] || []).filter((m) => m.id !== messageId),
    }));
    await supabaseService.deleteMessage(messageId);
    broadcastEngine.broadcast({
      type: 'DELETE_MESSAGE',
      roomId: currentRoomId,
      messageId,
    });
    showToast('🗑️ Message deleted.', 'info');
  };

  const handleDeletePoll = async (messageId: string) => {
    if (!currentRoomId) return;
    setMessagesMap((prev) => ({
      ...prev,
      [currentRoomId]: (prev[currentRoomId] || []).map((m) =>
        m.id === messageId ? { ...m, poll: undefined, content: '🗑️ [Poll Removed by Admin]' } : m
      ),
    }));
    await supabaseService.deleteMessage(messageId);
    showToast('🗑️ Poll removed.', 'info');
  };

  const handleRequestRoomDeletion = (roomId: string, reason: string) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              deletionRequested: true,
              deletionReason: reason,
            }
          : r
      )
    );

    // Add to reports queue for Developer Admin review
    const newReport: ReportItem = {
      id: `rep-del-${Date.now()}`,
      targetType: 'room',
      targetId: roomId,
      reportedBy: currentUser.username,
      reason: `Room Creator Deletion Request: ${reason}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      contentPreview: rooms.find((r) => r.id === roomId)?.title,
    };

    setReports((prev) => [newReport, ...prev]);
    alert('Room deletion request submitted! Developer/Admin system will review shortly.');
  };

  const handlePromoteRoomAdmin = (
    roomId: string,
    targetUsername: string,
    rights?: RoomAdminRights
  ) => {
    requireRegistration('manage room admins', () => {
      const defaultRights: RoomAdminRights = rights || {
        canDeleteMessages: true,
        canPinMessages: true,
        canManagePolls: true,
      };

      setRooms((prev) =>
        prev.map((r) => {
          if (r.id === roomId) {
            const currentAdmins = r.roomAdmins || [];
            const newAdmins = currentAdmins.includes(targetUsername)
              ? currentAdmins
              : [...currentAdmins, targetUsername];
            const newRights = {
              ...(r.roomAdminRights || {}),
              [targetUsername]: defaultRights,
            };
            return {
              ...r,
              roomAdmins: newAdmins,
              roomAdminRights: newRights,
            };
          }
          return r;
        })
      );

      // Trigger notification for target user
      const adminNotif: AppNotification = {
        id: `notif-admin-${Date.now()}`,
        recipientUsername: targetUsername,
        title: '🛡️ Promoted to Room Admin!',
        message: `@${currentUser.username} granted you admin moderation rights in this room.`,
        type: 'room_admin',
        fromUsername: currentUser.username,
        roomId,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setNotifications((prev) => [adminNotif, ...prev]);
      sendOutsideNotification(
        '🛡️ Promoted to Room Admin!',
        `@${currentUser.username} granted you admin moderation rights.`
      );
    });
  };

  const handleDemoteRoomAdmin = (roomId: string, targetUsername: string) => {
    requireRegistration('manage room admins', () => {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id === roomId) {
            const updatedAdmins = (r.roomAdmins || []).filter((u) => u !== targetUsername);
            const updatedRights = { ...(r.roomAdminRights || {}) };
            delete updatedRights[targetUsername];
            return {
              ...r,
              roomAdmins: updatedAdmins,
              roomAdminRights: updatedRights,
            };
          }
          return r;
        })
      );
    });
  };

  const handlePinMessage = (roomId: string, messageId: string | null) => {
    requireRegistration('pin messages', () => {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id === roomId) {
            return {
              ...r,
              pinnedMessageId: messageId,
            };
          }
          return r;
        })
      );
    });
  };

  const handleVotePoll = (messageId: string, optionId: string) => {
    if (!currentRoomId) return;

    requireRegistration('vote in polls', () => {
      setMessagesMap((prev) => {
        const list = prev[currentRoomId] || [];
        return {
          ...prev,
          [currentRoomId]: list.map((m) => {
            if (m.id === messageId && m.poll) {
              return {
                ...m,
                poll: {
                  ...m.poll,
                  totalVotes: m.poll.totalVotes + 1,
                  options: m.poll.options.map((opt) =>
                    opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
                  ),
                },
              };
            }
            return m;
          }),
        };
      });

      broadcastEngine.broadcast({
        type: 'POLL_VOTE',
        roomId: currentRoomId,
        messageId,
        optionId,
      });
    });
  };

  const handleCreatePoll = (question: string, options: string[], isAnonymous: boolean) => {
    if (!currentRoomId) return;

    requireRegistration('create polls', () => {
      const senderName = isAnonymous
        ? `🕵️ Anonymous Student #${Math.floor(Math.random() * 89) + 10}`
        : `@${currentUser.username}`;

      const pollData: PollData = {
        id: `poll-${Date.now()}`,
        question,
        totalVotes: 0,
        createdBy: senderName,
        isAnonymous,
        options: options.map((optText, idx) => ({
          id: `opt-${idx}-${Date.now()}`,
          text: optText,
          votes: 0,
          voters: [],
        })),
      };

      const pollMsg: ChatMessage = {
        id: `msg-poll-${Date.now()}`,
        roomId: currentRoomId,
        senderName,
        isAnonymous,
        witnessDistanceText: '📍 Live Campus Poll',
        content: `📊 Campus Live Poll: ${question}`,
        poll: pollData,
        timestamp: new Date().toISOString(),
        reactions: { '📊': 1 },
        isWitness: true,
      };

      setMessagesMap((prev) => ({
        ...prev,
        [currentRoomId]: [...(prev[currentRoomId] || []), pollMsg],
      }));

      setRooms((prev) =>
        prev.map((r) =>
          r.id === currentRoomId
            ? {
                ...r,
                lastActivityAt: new Date().toISOString(),
                hasActivePoll: true,
              }
            : r
        )
      );

      broadcastEngine.broadcast({ type: 'NEW_MESSAGE', message: pollMsg });
    });
  };

  const handleAddReactionToMessage = (messageId: string, emoji: string) => {
    if (!currentRoomId) return;

    setMessagesMap((prev) => {
      const list = prev[currentRoomId] || [];
      return {
        ...prev,
        [currentRoomId]: list.map((m) =>
          m.id === messageId
            ? {
                ...m,
                reactions: {
                  ...m.reactions,
                  [emoji]: (m.reactions[emoji] || 0) + 1,
                },
              }
            : m
        ),
      };
    });

    broadcastEngine.broadcast({
      type: 'REACTION',
      roomId: currentRoomId,
      messageId,
      emoji,
    });
  };

  const handleSendFloatingEmoji = (emoji: string) => {
    if (!currentRoomId) return;

    const newParticle: FloatingReaction = {
      id: `f-${Date.now()}-${Math.random()}`,
      emoji,
      x: Math.floor(Math.random() * 70) + 15,
    };

    setFloatingReactions((prev) => [...prev, newParticle]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 1200);

    broadcastEngine.broadcast({
      type: 'FLOATING_EMOJI',
      roomId: currentRoomId,
      emoji,
    });
  };

  const handleCreateRoom = (newRoom: TrendingRoom) => {
    requireRegistration('create discussion rooms', () => {
      const roomWithCreator: TrendingRoom = {
        ...newRoom,
        creatorUsername: currentUser.username,
        creatorName: currentUser.displayName,
      };

      setRooms((prev) => [roomWithCreator, ...prev]);
      if (roomWithCreator.isPrivate) {
        setUnlockedPrivateRoomIds((prev) =>
          prev.includes(roomWithCreator.id) ? prev : [...prev, roomWithCreator.id]
        );
      }
      setCurrentRoomId(roomWithCreator.id);
      setActiveTab('rooms');
      supabaseService.createRoom(roomWithCreator);
      broadcastEngine.broadcast({ type: 'NEW_ROOM', room: roomWithCreator });
      showToast(`✨ Room "${newRoom.title.slice(0, 30)}" created successfully!`, 'success');
    });
  };

  const handleJoinPrivateRoomWithCode = (codeOrLink: string): { success: boolean; message: string } => {
    const query = codeOrLink.trim();
    if (!query) {
      return { success: false, message: 'Please enter a valid invite code or room link.' };
    }

    const matchedRoom = rooms.find((r) => {
      if (!r.isPrivate) return false;
      if (r.inviteCode && r.inviteCode.toUpperCase() === query.toUpperCase()) return true;
      if (r.id === query) return true;
      if (query.includes(r.id)) return true;
      if (r.inviteCode && query.toUpperCase().includes(r.inviteCode.toUpperCase())) return true;
      return false;
    });

    if (!matchedRoom) {
      return {
        success: false,
        message: 'No private room found with that code or link. Please check and try again.',
      };
    }

    if (!unlockedPrivateRoomIds.includes(matchedRoom.id)) {
      setUnlockedPrivateRoomIds((prev) => [...prev, matchedRoom.id]);
    }

    showToast(`🔓 Private room "${matchedRoom.title}" unlocked!`, 'success');
    return {
      success: true,
      message: `Access granted! Unlocked "${matchedRoom.title}".`,
    };
  };

  const handleCreatePost = (post: FeedPost) => {
    requireRegistration('post live updates', () => {
      setPosts((prev) => [post, ...prev]);
      setActiveTab('feed');
      supabaseService.createFeedPost(post);
      broadcastEngine.broadcast({ type: 'NEW_POST', post });
      showToast('📢 Live post published successfully!', 'success');
    });
  };

  const handleAddComment = async (postId: string, content: string, parentId?: string | null): Promise<FeedComment | null> => {
    if (!currentUser.isRegistered) {
      setIsUserProfileOpen(true);
      return null;
    }
    const newComment: FeedComment = {
      id: `comment-${Date.now()}`,
      postId,
      authorUsername: currentUser.username,
      authorDisplayName: currentUser.displayName,
      content,
      timestamp: new Date().toISOString(),
      parentId: parentId || null,
      likesCount: 0,
      likes: [],
    };

    const created = await supabaseService.createFeedComment(newComment);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
    );

    // If this comment is a reply, notify the parent comment author
    if (parentId) {
      const currentComments = await supabaseService.getFeedComments(postId);
      const parentComment = currentComments?.find((c) => c.id === parentId);
      if (parentComment && parentComment.authorUsername !== currentUser.username) {
        const replyNotif: AppNotification = {
          id: `notif-reply-${Date.now()}`,
          recipientUsername: parentComment.authorUsername,
          title: `💬 @${currentUser.username} replied to your comment`,
          message: `"${content.slice(0, 60)}"`,
          type: 'reply',
          fromUsername: currentUser.username,
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        setNotifications((prev) => [replyNotif, ...prev]);
        sendOutsideNotification(
          `💬 @${currentUser.username} replied to your comment`,
          `"${content.slice(0, 60)}"`
        );
      }
    }

    showToast('💬 Comment posted successfully!', 'success');
    return typeof created === 'object' && created ? created : newComment;
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser.isRegistered) {
      setIsUserProfileOpen(true);
      return;
    }
    await supabaseService.likeFeedComment(commentId, currentUser.username);
  };

  const fetchCommentsForPost = async (postId: string): Promise<FeedComment[]> => {
    return await supabaseService.getFeedComments(postId);
  };

  const handleUpvotePost = (postId: string) => {
    requireRegistration('upvote live posts', () => {
      let targetPostAuthor: string | null = null;
      let targetPostContent = '';
      let isLikingNow = false;

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            targetPostAuthor = p.authorUsername;
            targetPostContent = p.content;
            const hasUpvoted = p.upvoters.includes(currentUser.username);
            isLikingNow = !hasUpvoted;
            const newUpvoters = hasUpvoted
              ? p.upvoters.filter((u) => u !== currentUser.username)
              : [...p.upvoters, currentUser.username];
            return {
              ...p,
              upvoters: newUpvoters,
              upvotes: newUpvoters.length,
            };
          }
          return p;
        })
      );

      supabaseService.upvoteFeedPost(postId, currentUser.username);

      // Trigger notification if liking for the first time
      if (isLikingNow && targetPostAuthor && targetPostAuthor !== currentUser.username) {
        const likeNotif: AppNotification = {
          id: `notif-like-${Date.now()}`,
          recipientUsername: targetPostAuthor,
          title: `❤️ @${currentUser.username} liked your post`,
          message: `"${targetPostContent.slice(0, 50)}..."`,
          type: 'like',
          fromUsername: currentUser.username,
          timestamp: new Date().toISOString(),
          isRead: false,
        };
        setNotifications((prev) => [likeNotif, ...prev]);
        sendOutsideNotification(
          `❤️ @${currentUser.username} liked your post`,
          `"${targetPostContent.slice(0, 50)}..."`
        );
      }
    });
  };

  const handleOpenCreateRoomForPost = (post: FeedPost) => {
    requireRegistration('create a discussion room', () => {
      const newRoom: TrendingRoom = {
        id: `room-post-${Date.now()}`,
        collegeId: currentCollege.id,
        title: `🔥 Discussion: ${post.content.slice(0, 30)}...`,
        category: post.category === 'weather' ? 'weather' : post.category === 'traffic' ? 'bus' : 'general',
        roomType: 'student_created',
        emoji: post.category === 'fest' ? '🎉' : post.category === 'weather' ? '🌧️' : '💬',
        locationArea: post.locationName,
        activePeopleCount: 12,
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        description: `Room created for live update: "${post.content}"`,
        isLiveNow: true,
        creatorUsername: currentUser.username,
        creatorName: currentUser.displayName,
      };

      setRooms((prev) => [newRoom, ...prev]);
      setCurrentRoomId(newRoom.id);
      setActiveTab('rooms');
      showToast('✨ Discussion room created for live update!', 'success');
    });
  };

  // Developer Admin Operations
  const handleUpdateRoom = (roomId: string, updates: Partial<TrendingRoom>) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, ...updates } : r))
    );
    supabaseService.updateRoom(roomId, updates);
  };

  const handleSaveProfile = (prof: UserProfile) => {
    setCurrentUser(prof);
    setIsUserProfileOpen(false);
    setRequiredActionForProfile(undefined);

    // Persist profile to Supabase Database
    supabaseService.saveProfile(prof);
    showToast(`🎉 Welcome @${prof.username}! Account synchronized successfully.`, 'success');
  };

  const handleDeleteRoom = async (roomId: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    setMessagesMap((prev) => {
      const next = { ...prev };
      delete next[roomId];
      return next;
    });
    if (currentRoomId === roomId) {
      setCurrentRoomId(null);
    }
    await supabaseService.deleteRoom(roomId);
    broadcastEngine.broadcast({ type: 'DELETE_ROOM', roomId });
    showToast('🗑️ Room deleted successfully.', 'info');
  };

  const handleDeletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await supabaseService.deleteFeedPost(postId);
    broadcastEngine.broadcast({ type: 'DELETE_POST', postId });
    showToast('🗑️ Live update post deleted.', 'info');
  };

  const handleResolveReport = (
    reportId: string,
    action: 'delete' | 'warn' | 'ban' | 'dismiss'
  ) => {
    const report = reports.find((r) => r.id === reportId);
    if (report && action === 'delete') {
      if (report.targetType === 'room') {
        handleDeleteRoom(report.targetId);
      } else if (report.targetType === 'post') {
        handleDeletePost(report.targetId);
      }
    }

    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r))
    );
  };

  const handleSubmitReport = (report: ReportItem) => {
    setReports((prev) => [report, ...prev]);
  };

  const latestMessages = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(messagesMap).forEach(([roomId, list]) => {
      const msgs = list as ChatMessage[];
      if (msgs && msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        map[roomId] = last.content || (last.mediaUrl ? '📸 Photo attachment' : '');
      }
    });
    return map;
  }, [messagesMap]);

  const roomsWithRealMemberCounts = useMemo(() => {
    return rooms.map((r) => {
      const roomMsgs = messagesMap[r.id] || [];
      const uniqueMembers = new Set([
        currentUser.username,
        ...(r.creatorUsername ? [r.creatorUsername] : []),
        ...(r.roomAdmins || []),
        ...roomMsgs
          .filter((m) => m.senderUsername && !m.isAnonymous)
          .map((m) => m.senderUsername as string),
      ]);
      const realCount = Math.max(1, uniqueMembers.size);
      return {
        ...r,
        activePeopleCount: realCount,
      };
    });
  }, [rooms, messagesMap, currentUser.username]);

  const allCampusMembers = useMemo(() => {
    const map = new Map<string, { username: string; displayName?: string; badge?: string }>();

    // Add Lead Dev
    map.set('muhammedrafii2002', { username: 'muhammedrafii2002', displayName: 'Muhammed Rafi', badge: 'Lead Dev' });

    // Add Current User
    if (currentUser.username) {
      map.set(currentUser.username, {
        username: currentUser.username,
        displayName: currentUser.displayName,
        badge: currentUser.isAdmin ? 'Admin' : undefined,
      });
    }

    // Add authors from feed posts
    posts.forEach((p) => {
      if (p.authorUsername) {
        map.set(p.authorUsername, {
          username: p.authorUsername,
          displayName: p.authorDisplayName,
          badge: p.authorBadge,
        });
      }
    });

    // Add room creators & room admins
    rooms.forEach((r) => {
      if (r.creatorUsername) {
        map.set(r.creatorUsername, { username: r.creatorUsername });
      }
      r.roomAdmins?.forEach((a) => {
        if (a) map.set(a, { username: a, badge: 'Room Admin' });
      });
    });

    // Add senders from room messages
    Object.values(messagesMap).forEach((msgList) => {
      (msgList as ChatMessage[]).forEach((m) => {
        if (m.senderUsername && !m.isAnonymous) {
          map.set(m.senderUsername, {
            username: m.senderUsername,
            displayName: m.senderName,
            badge: m.senderBadge,
          });
        }
      });
    });

    // Add senders/recipients from private messages
    privateMessages.forEach((m) => {
      if (m.senderUsername) map.set(m.senderUsername, { username: m.senderUsername });
      if (m.recipientUsername) map.set(m.recipientUsername, { username: m.recipientUsername });
    });

    // Add registered users from database
    dbUsers.forEach((u) => {
      if (u.username) {
        map.set(u.username, {
          username: u.username,
          displayName: u.displayName,
          badge: u.badge || (u.isAdmin ? 'Admin' : undefined),
        });
      }
    });

    return Array.from(map.values()).filter((m) => m.username !== currentUser.username);
  }, [posts, rooms, messagesMap, privateMessages, currentUser, dbUsers]);

  const activeRoomObj = roomsWithRealMemberCounts.find((r) => r.id === currentRoomId);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Header Bar */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        onOpenCreateRoom={() =>
          requireRegistration('create rooms', () => setIsCreateRoomOpen(true))
        }
        onOpenCreatePost={() =>
          requireRegistration('post live updates', () => setIsCreatePostOpen(true))
        }
        onOpenProfileModal={() => setIsUserProfileOpen(true)}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseDevOpen(true)}
        onLogout={handleLogout}
        onOpenDirectMessages={() =>
          requireRegistration('view direct messages', () => setShowPrivateChatModal(true))
        }
        unreadDmsCount={unreadDmsCount}
        unreadNotificationsCount={notifications.filter((n) => !n.isRead).length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-slate-900 border-2 border-orange-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="text-base">{toastMessage.type === 'success' ? '✅' : 'ℹ️'}</span>
          <span className="text-xs sm:text-sm font-bold">{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Main Content Body */}
      <main className={`flex-1 max-w-7xl w-full mx-auto ${currentRoomId ? 'px-0 sm:px-6 lg:px-8 py-0 sm:py-6 pb-16 sm:pb-24' : 'px-4 sm:px-6 lg:px-8 py-6 pb-24'}`}>
        {currentRoomId && activeRoomObj ? (
          <LiveRoomView
            room={activeRoomObj}
            userLocation={{
              lat: currentCollege.lat,
              lng: currentCollege.lng,
              name: currentCollege.name,
              area: currentCollege.area,
            }}
            currentUser={currentUser}
            messages={messagesMap[currentRoomId] || []}
            onBack={() => setCurrentRoomId(null)}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onDeletePoll={handleDeletePoll}
            onRequestRoomDeletion={handleRequestRoomDeletion}
            onReportItem={(type, id, preview) =>
              setReportTarget({ targetType: type, targetId: id, roomId: currentRoomId, contentPreview: preview })
            }
            onAddReactionToMessage={handleAddReactionToMessage}
            onVotePoll={handleVotePoll}
            onOpenCreatePoll={() =>
              requireRegistration('create polls', () => setIsCreatePollOpen(true))
            }
            onSendFloatingEmoji={handleSendFloatingEmoji}
            floatingReactions={floatingReactions}
            onOpenPrivateChat={handleOpenPrivateChat}
            onPromoteRoomAdmin={handlePromoteRoomAdmin}
            onDemoteRoomAdmin={handleDemoteRoomAdmin}
            onPinMessage={handlePinMessage}
            onUpdateRoom={handleUpdateRoom}
          />
        ) : activeTab === 'feed' ? (
          <LiveFeed
            posts={posts.filter((p) => p.collegeId === currentCollege.id || p.collegeId === 'sn_cherthala')}
            trendingRooms={roomsWithRealMemberCounts.filter((r) => r.collegeId === currentCollege.id || r.collegeId === 'sn_cherthala')}
            currentCollege={currentCollege}
            currentUser={currentUser}
            onOpenCreatePost={() =>
              requireRegistration('post live updates', () => setIsCreatePostOpen(true))
            }
            onOpenCreateRoomForPost={handleOpenCreateRoomForPost}
            onSelectRoom={(roomId) => {
              setCurrentRoomId(roomId);
              setActiveTab('rooms');
            }}
            onUpvotePost={(postId) =>
              requireRegistration('upvote posts', () => handleUpvotePost(postId))
            }
            onReportPost={(post) =>
              requireRegistration('report posts', () =>
                setReportTarget({
                  targetType: 'post',
                  targetId: post.id,
                  contentPreview: post.content,
                })
              )
            }
            onDeletePost={handleDeletePost}
            onAddComment={handleAddComment}
            onLikeComment={handleLikeComment}
            fetchCommentsForPost={fetchCommentsForPost}
            onOpenPrivateChat={handleOpenPrivateChat}
          />
        ) : (
          <RoomList
            rooms={roomsWithRealMemberCounts.filter((r) => r.collegeId === currentCollege.id || r.collegeId === 'sn_cherthala')}
            currentCollege={currentCollege}
            currentUserUsername={currentUser.username}
            isAdmin={currentUser.isAdmin}
            unlockedPrivateRoomIds={unlockedPrivateRoomIds}
            onEnterRoom={handleEnterRoom}
            onOpenCreateRoom={() =>
              requireRegistration('create rooms', () => setIsCreateRoomOpen(true))
            }
            onOpenCollegeSelector={() => setIsCollegeSelectorOpen(true)}
            onJoinPrivateRoomWithCode={handleJoinPrivateRoomWithCode}
            latestMessages={latestMessages}
          />
        )}
      </main>

      {/* Bottom Fixed Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'dms') {
            requireRegistration('view direct messages', () => setShowPrivateChatModal(true));
          }
        }}
        onOpenCreateRoom={() =>
          requireRegistration('create rooms', () => setIsCreateRoomOpen(true))
        }
        onOpenCreatePost={() =>
          requireRegistration('post live updates', () => setIsCreatePostOpen(true))
        }
        onOpenProfile={() => setIsUserProfileOpen(true)}
        activeRoomsCount={roomsWithRealMemberCounts.length}
        unreadDmsCount={unreadDmsCount}
      />

      {/* Direct Private Chat Modal */}
      {(showPrivateChatModal || activeTab === 'dms') && (
        <PrivateChatModal
          currentUser={currentUser}
          partnerUsername={activePrivatePartner}
          messages={privateMessages}
          allConversations={allConversationPartners}
          availableMembers={allCampusMembers}
          onSendMessage={handleSendPrivateMessage}
          onDeleteMessage={handleDeletePrivateMessage}
          onSelectPartner={(username) => {
            setActivePrivatePartner(username || null);
            if (username) {
              setPrivateMessages((prev) =>
                prev.map((m) =>
                  m.senderUsername === username && m.recipientUsername === currentUser.username
                    ? { ...m, isRead: true }
                    : m
                )
              );
              setNotifications((prev) =>
                prev.map((n) =>
                  n.type === 'dm' && (!n.fromUsername || n.fromUsername === username)
                    ? { ...n, isRead: true }
                    : n
                )
              );
            }
          }}
          onClose={() => {
            setShowPrivateChatModal(false);
            if (activeTab === 'dms') setActiveTab('rooms');
          }}
        />
      )}

      {/* MODALS */}
      {isUserProfileOpen && (
        <UserProfileModal
          currentUser={currentUser}
          onSaveProfile={handleSaveProfile}
          onLogout={handleLogout}
          onClose={() => {
            setIsUserProfileOpen(false);
            setRequiredActionForProfile(undefined);
          }}
          onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
          requiredForAction={requiredActionForProfile}
        />
      )}

      {isCollegeSelectorOpen && (
        <CollegeSelectorModal
          currentCollege={currentCollege}
          onSelectCollege={(col) => setCurrentCollege(col)}
          onClose={() => setIsCollegeSelectorOpen(false)}
        />
      )}

      {isCreateRoomOpen && (
        <CreateEventModal
          currentCollege={currentCollege}
          onClose={() => setIsCreateRoomOpen(false)}
          onCreateRoom={handleCreateRoom}
        />
      )}

      {isCreatePostOpen && (
        <CreatePostModal
          currentCollege={currentCollege}
          currentUser={currentUser}
          onClose={() => setIsCreatePostOpen(false)}
          onCreatePost={handleCreatePost}
        />
      )}

      {isCreatePollOpen && (
        <CreatePollModal
          onClose={() => setIsCreatePollOpen(false)}
          onCreatePoll={handleCreatePoll}
        />
      )}

      {isAdminPanelOpen && (
        <AdminPanelModal
          rooms={rooms}
          posts={posts}
          reports={reports}
          moderationSettings={moderationSettings}
          onClose={() => setIsAdminPanelOpen(false)}
          onDeleteRoom={handleDeleteRoom}
          onDeletePost={handleDeletePost}
          onResolveReport={handleResolveReport}
          onApproveRoomDeletionRequest={(roomId) => {
            handleDeleteRoom(roomId);
            setReports((prev) => prev.filter((r) => r.targetId !== roomId));
          }}
          onRejectRoomDeletionRequest={(roomId) => {
            setRooms((prev) =>
              prev.map((r) => (r.id === roomId ? { ...r, deletionRequested: false } : r))
            );
          }}
          onUpdateSettings={(newSet) => setModerationSettings(newSet)}
          onSendDeveloperAlert={(recipientUsername, msgText) => {
            const notif: AppNotification = {
              id: `notif-${Date.now()}`,
              recipientUsername,
              title: '💬 Developer Notice',
              message: msgText,
              type: 'admin_alert',
              fromUsername: currentUser.username,
              timestamp: new Date().toISOString(),
              isRead: false,
            };
            setNotifications((prev) => [notif, ...prev]);
            sendOutsideNotification('💬 Developer Notice', msgText);
          }}
          onOpenPrivateChat={handleOpenPrivateChat}
          onUpdateRoom={handleUpdateRoom}
        />
      )}

      {isNotificationsOpen && (
        <NotificationsModal
          notifications={notifications}
          onMarkAllAsRead={() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
          }
          onSelectNotification={(n) => {
            // Mark clicked notification as read so notification is read and unread badge disappears
            setNotifications((prev) =>
              prev.map((notif) => (notif.id === n.id ? { ...notif, isRead: true } : notif))
            );
            if (n.type === 'dm' || (n.fromUsername && !n.linkRoomId && !n.roomId)) {
              handleOpenPrivateChat(n.fromUsername || 'muhammedrafii2002');
            } else if (n.linkRoomId || n.roomId) {
              setCurrentRoomId(n.linkRoomId || n.roomId || null);
              setActiveTab('rooms');
            } else if (n.fromUsername) {
              handleOpenPrivateChat(n.fromUsername);
            }
            setIsNotificationsOpen(false);
          }}
          onRequestBrowserPermission={handleRequestBrowserNotificationPermission}
          notificationPermissionStatus={notificationPermissionStatus}
          onClose={() => setIsNotificationsOpen(false)}
        />
      )}

      {isDownloadModalOpen && (
        <AppDownloadModal onClose={() => setIsDownloadModalOpen(false)} />
      )}

      {reportTarget && (
        <ReportModal
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          roomId={reportTarget.roomId}
          reportedBy={currentUser.username}
          contentPreview={reportTarget.contentPreview}
          onClose={() => setReportTarget(null)}
          onSubmitReport={handleSubmitReport}
        />
      )}

      {isSupabaseDevOpen && (
        <SupabaseDevModal onClose={() => setIsSupabaseDevOpen(false)} />
      )}
    </div>
  );
}
