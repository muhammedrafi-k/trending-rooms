export type RoomType = 'auto_trending' | 'student_created';

export type RoomCategory =
  | 'fest'
  | 'exam'
  | 'bus'
  | 'canteen'
  | 'placement'
  | 'complaint'
  | 'sports'
  | 'general'
  | 'incident'
  | 'weather'
  | 'local_news';

export type PostCategory =
  | 'fest'
  | 'incident'
  | 'weather'
  | 'traffic'
  | 'news'
  | 'general';

export interface LocationCoords {
  lat: number;
  lng: number;
  name?: string;
  area?: string;
}

export interface CollegeInfo {
  id: string;
  name: string;
  shortName: string;
  district: string;
  studentCount: number;
  area: string;
  lat: number;
  lng: number;
}

export interface UserProfile {
  id: string;
  profileId: string; // Unique permanent ID (e.g., "PID-894102")
  username: string; // e.g., "arjun_bsc"
  displayName: string; // e.g., "Arjun K."
  email: string; // Private & Unique
  password?: string; // Encrypted / hashed profile auth
  collegeId: string;
  badge?: string; // e.g., "👑 Campus MVP"
  isAdmin?: boolean;
  isRegistered: boolean;
  isBanned?: boolean;
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  createdBy: string;
  isAnonymous?: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderName: string;
  senderUsername?: string;
  senderBadge?: string;
  isAnonymous?: boolean;
  witnessDistanceText: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  poll?: PollData;
  timestamp: string;
  reactions: Record<string, number>;
  isWitness: boolean;
  mentions?: string[]; // list of usernames mentioned
  isDeleted?: boolean;
}

export interface RoomLog {
  id: string;
  roomId: string;
  username: string;
  displayName: string;
  action: 'joined' | 'left' | 'created' | 'privacy_changed';
  timestamp: string;
}

export interface RoomAdminRights {
  canDeleteMessages: boolean;
  canPinMessages: boolean;
  canManagePolls: boolean;
  canChangePrivacy?: boolean;
  canEditRoom?: boolean;
}

export interface TrendingRoom {
  id: string;
  collegeId: string;
  title: string;
  category: RoomCategory;
  roomType: RoomType;
  emoji: string;
  locationArea: string;
  location?: LocationCoords;
  lat?: number;
  lng?: number;
  activePeopleCount: number;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  description: string;
  isLiveNow?: boolean;
  isPrivate?: boolean; // Default false (Public room)
  isListedPublicly?: boolean; // When true for private room, show in public list as locked (requires code to join/view)
  inviteCode?: string; // Secret code for private room access e.g., "PRV-8A2F91"
  allowedUsers?: string[]; // users explicitly allowed / joined
  activeMembers?: string[]; // currently joined & stayed users
  roomLogs?: RoomLog[]; // history of user joins and leaves
  hasActivePoll?: boolean;
  creatorName?: string;
  creatorUsername?: string; // User who owns/created the room (Room Admin)
  roomAdmins?: string[]; // Usernames promoted by creator with admin permissions for this room
  roomAdminRights?: Record<string, RoomAdminRights>; // Granular rights per room admin
  pinnedMessageId?: string | null; // Pinned chat message ID
  deletionRequested?: boolean;
  deletionReason?: string;
  deletionRequestedBy?: string;
  topContributor?: {
    name: string;
    badge: string;
  };
}

export interface AppNotification {
  id: string;
  recipientUsername: string;
  title: string;
  message: string;
  type: 'mention' | 'dm' | 'room_admin' | 'admin_alert' | 'system' | 'reply' | 'like';
  linkRoomId?: string;
  roomId?: string;
  fromUsername?: string;
  timestamp: string;
  isRead: boolean;
}

export interface FeedPost {
  id: string;
  collegeId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorBadge?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  locationName: string;
  category: PostCategory;
  verificationStatus: 'verified' | 'unverified';
  timestamp: string;
  upvotes: number;
  upvoters: string[]; // usernames that upvoted
  commentsCount: number;
}

export interface FeedComment {
  id: string;
  postId: string;
  authorUsername: string;
  authorDisplayName: string;
  content: string;
  timestamp: string;
  parentId?: string | null; // For comment-to-comment replies
  likesCount: number;
  likes: string[]; // usernames who liked this comment
}

export interface ReportItem {
  id: string;
  targetType: 'room' | 'message' | 'post' | 'user';
  targetId: string;
  roomId?: string;
  reportedBy: string;
  reason: string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'dismissed';
  contentPreview?: string;
}

export interface ModerationSettings {
  autoKeywordFilterEnabled: boolean;
  trendingSensitivity: 'low' | 'medium' | 'high';
  bannedKeywords: string[];
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

export interface PrivateMessage {
  id: string;
  senderUsername: string;
  senderDisplayName?: string;
  recipientUsername: string;
  content: string;
  mediaUrl?: string;
  timestamp: string;
  isRead?: boolean;
}

