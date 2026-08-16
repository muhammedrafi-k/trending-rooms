import { getSupabaseClient, getSupabaseConfig } from './supabaseClient';
import {
  TrendingRoom,
  ChatMessage,
  FeedPost,
  FeedComment,
  PrivateMessage,
  AppNotification,
  CollegeInfo,
  UserProfile,
  PollData,
} from '../types';
import {
  COLLEGES as DEFAULT_COLLEGES,
  INITIAL_ROOMS,
  INITIAL_MESSAGES,
  INITIAL_POSTS,
} from '../data/mockRooms';

// In-memory set of known missing columns per table to avoid repeated PGRST204 errors
const knownMissingTableColumns: Record<string, Set<string>> = {
  rooms: new Set<string>(),
  users: new Set<string>(),
  profiles: new Set<string>(),
  messages: new Set<string>(),
  feed_posts: new Set<string>(),
  feed_comments: new Set<string>(),
  private_messages: new Set<string>(),
  notifications: new Set<string>(),
};

function stripKnownMissingColumns(table: string, payload: Record<string, any>): Record<string, any> {
  const missingSet = knownMissingTableColumns[table];
  if (!missingSet || missingSet.size === 0) return { ...payload };
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (!missingSet.has(k)) {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

function recordMissingColumn(table: string, column: string) {
  if (!knownMissingTableColumns[table]) {
    knownMissingTableColumns[table] = new Set<string>();
  }
  knownMissingTableColumns[table].add(column);
}

function extractMissingColumnFromError(error: any): string | null {
  if (!error) return null;
  const msg = `${error.message || ''} ${error.details || ''}`;
  const match = msg.match(/'([^']+)' column/) || msg.match(/column '([^']+)'/i) || msg.match(/column ([a-zA-Z0-9_]+) does not exist/i);
  return match ? match[1] : null;
}

export const supabaseService = {
  /**
   * Check if Supabase client is configured and connected
   */
  isConfigured(): boolean {
    return getSupabaseConfig().isConnected;
  },

  /**
   * Ensure the given college ID exists in the colleges table to prevent foreign key violations.
   */
  async ensureCollegeExists(collegeId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !collegeId) return false;

    try {
      const { data } = await supabase
        .from('colleges')
        .select('id')
        .eq('id', collegeId)
        .maybeSingle();

      if (data) return true;

      const matchingCol = DEFAULT_COLLEGES.find((c) => c.id === collegeId) || {
        id: collegeId,
        name: 'Campus Network',
        shortName: 'Campus',
        district: 'Kerala',
        studentCount: 0,
        area: 'Main Campus',
        lat: 9.6842,
        lng: 76.3312,
      };

      const { error } = await supabase.from('colleges').upsert({
        id: matchingCol.id,
        name: matchingCol.name,
        short_name: matchingCol.shortName,
        district: matchingCol.district,
        student_count: 0,
        area: matchingCol.area,
        lat: matchingCol.lat,
        lng: matchingCol.lng,
      });

      if (error) {
        console.warn('Could not insert college record into Supabase:', error);
      }
      return true;
    } catch (err) {
      console.warn('Error ensuring college exists:', err);
      return false;
    }
  },

  /**
   * Initialize and seed database if tables are empty
   */
  async initializeAndSeed(defaultCollegeId: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      // Ensure default college exists so foreign key constraints are satisfied
      if (defaultCollegeId) {
        await this.ensureCollegeExists(defaultCollegeId);
      }
    } catch (e) {
      console.warn('Supabase initialization check failed:', e);
    }
  },

  /**
   * Fetch Colleges from Supabase
   */
  async getColleges(): Promise<CollegeInfo[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase.from('colleges').select('*');
    if (error || !data || data.length === 0) return null;

    return data.map((c) => ({
      id: c.id,
      name: c.name,
      shortName: c.short_name,
      district: c.district,
      studentCount: c.student_count || 0,
      area: c.area,
      lat: c.lat,
      lng: c.lng,
    }));
  },

  /**
   * Fetch Rooms for a college
   */
  async getRooms(collegeId: string): Promise<TrendingRoom[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .or(`college_id.eq.${collegeId},college_id.is.null`)
      .order('last_activity_at', { ascending: false });

    if (error || !data) return null;

    return data.map((r) => ({
      id: r.id,
      collegeId: r.college_id,
      title: r.title,
      category: r.category,
      roomType: r.room_type,
      emoji: r.emoji,
      locationArea: r.location_area,
      lat: r.lat,
      lng: r.lng,
      activePeopleCount: r.active_people_count || 1,
      createdAt: r.created_at,
      lastActivityAt: r.last_activity_at,
      expiresAt: r.expires_at,
      description: r.description,
      isLiveNow: r.is_live_now,
      isPrivate: r.is_private || false,
      isListedPublicly: r.is_listed_publicly ?? r.is_publicly_listed ?? false,
      inviteCode: r.invite_code || undefined,
      allowedUsers: r.allowed_users || [],
      activeMembers: r.active_members || [],
      roomLogs: Array.isArray(r.room_logs) ? r.room_logs : [],
      hasActivePoll: r.has_active_poll,
      creatorName: r.creator_name,
      creatorUsername: r.creator_username,
      roomAdmins: r.room_admins || [],
      roomAdminRights: r.room_admin_rights || {},
      pinnedMessageId: r.pinned_message_id,
      deletionRequested: Boolean(r.deletion_requested),
      deletionReason: r.deletion_reason || undefined,
      deletionRequestedBy: r.deletion_requested_by || undefined,
      topContributor: r.top_contributor,
    }));
  },

  /**
   * Save a new room to Supabase
   */
  async createRoom(room: TrendingRoom): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    if (room.collegeId) {
      await this.ensureCollegeExists(room.collegeId);
    }

    const payload: any = {
      id: room.id,
      college_id: room.collegeId,
      title: room.title,
      category: room.category,
      room_type: room.roomType,
      emoji: room.emoji,
      location_area: room.locationArea,
      lat: room.lat,
      lng: room.lng,
      active_people_count: room.activePeopleCount,
      created_at: room.createdAt,
      last_activity_at: room.lastActivityAt,
      expires_at: room.expiresAt,
      description: room.description,
      is_live_now: room.isLiveNow,
      is_private: room.isPrivate || false,
      invite_code: room.inviteCode || null,
      allowed_users: room.allowedUsers || [],
      active_members: room.activeMembers || [],
      room_logs: room.roomLogs || [],
      has_active_poll: room.hasActivePoll,
      creator_name: room.creatorName || null,
      creator_username: room.creatorUsername || null,
      room_admins: room.roomAdmins || [],
      room_admin_rights: room.roomAdminRights || {},
      deletion_requested: room.deletionRequested || false,
      deletion_reason: room.deletionReason || null,
      top_contributor: room.topContributor || null,
    };

    let { error } = await supabase.from('rooms').insert(payload);

    // Auto-recover if table has missing optional columns (e.g. PGRST204)
    while (error && error.code === 'PGRST204') {
      const match = error.message?.match(/'([^']+)' column/);
      if (match && match[1] && payload[match[1]] !== undefined) {
        delete payload[match[1]];
        const retryRes = await supabase.from('rooms').insert(payload);
        error = retryRes.error;
      } else {
        break;
      }
    }

    if (error) {
      console.error('Error creating room in Supabase:', error);
      return false;
    }
    return true;
  },

  /**
   * Fetch all registered users from Supabase DB
   */
  async getRegisteredUsers(): Promise<UserProfile[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((u) => ({
        id: u.id,
        profileId: u.profile_id || `PID-${u.id.slice(0, 6)}`,
        username: u.username,
        displayName: u.display_name || u.username,
        email: u.email,
        collegeId: u.college_id,
        badge: u.badge || '🎓 Campus Member',
        isAdmin: Boolean(u.is_admin),
        isRegistered: Boolean(u.is_registered ?? true),
        createdAt: u.created_at,
      }));
    } catch (e) {
      return [];
    }
  },

  /**
   * Save / Register user profile to Supabase database
   */
  async saveProfile(profile: UserProfile): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase client is not connected.' };

    try {
      const cleanEmail = profile.email.toLowerCase().trim();
      const cleanUsername = profile.username.toLowerCase().trim();
      const profileId = profile.profileId || `PID-${Math.floor(100000 + Math.random() * 900000)}`;

      // Standard payload without strict assumption on password vs password_hash column
      const basePayload = {
        id: profile.id,
        profile_id: profileId,
        username: cleanUsername,
        display_name: profile.displayName.trim(),
        email: cleanEmail,
        college_id: profile.collegeId || null,
        badge: profile.badge || '🎓 Campus Member',
        is_admin: profile.isAdmin || false,
        is_registered: profile.isRegistered ?? true,
        created_at: profile.createdAt || new Date().toISOString(),
      };

      let successCount = 0;
      let lastErrorMessage = '';

      // 1. Try 'users' table
      try {
        let res = await supabase.from('users').upsert({
          ...basePayload,
          password: profile.password || null,
          password_hash: profile.password || null,
        });

        if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('password'))) {
          // Retry without 'password' column if it's missing in schema cache
          res = await supabase.from('users').upsert({
            ...basePayload,
            password_hash: profile.password || null,
          });
          if (res.error) {
            // Retry with base payload only
            res = await supabase.from('users').upsert(basePayload);
          }
        }

        if (!res.error) {
          successCount++;
        } else {
          lastErrorMessage = res.error.message;
        }
      } catch (e: any) {
        lastErrorMessage = e.message;
      }

      // 2. Try 'profiles' table
      try {
        let res = await supabase.from('profiles').upsert({
          ...basePayload,
          password: profile.password || null,
        });

        if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('password'))) {
          res = await supabase.from('profiles').upsert(basePayload);
        }

        if (!res.error) {
          successCount++;
        } else if (!lastErrorMessage) {
          lastErrorMessage = res.error.message;
        }
      } catch (e: any) {
        if (!lastErrorMessage) lastErrorMessage = e.message;
      }

      // 3. Try 'user_profiles' table
      try {
        let res = await supabase.from('user_profiles').upsert({
          ...basePayload,
          password: profile.password || null,
        });

        if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('password'))) {
          res = await supabase.from('user_profiles').upsert(basePayload);
        }

        if (!res.error) {
          successCount++;
        }
      } catch (e) {
        // ignore
      }

      // 4. Try Supabase Auth SignUp as well
      if (profile.email && profile.password) {
        try {
          const authRes = await supabase.auth.signUp({
            email: cleanEmail,
            password: profile.password.trim(),
            options: {
              data: {
                username: cleanUsername,
                display_name: profile.displayName,
              },
            },
          });
          if (authRes.data?.user) {
            successCount++;
          }
        } catch (e) {
          // ignore auth fallback errors if DB write succeeded
        }
      }

      if (successCount > 0) {
        return { success: true };
      }

      return {
        success: false,
        error: lastErrorMessage || 'Database error during registration. Please run the provided SQL script in Supabase SQL Editor.',
      };
    } catch (err: any) {
      console.error('Error saving profile to Supabase:', err);
      return { success: false, error: err.message || 'Error writing registration to Supabase database.' };
    }
  },

  /**
   * Cascade update user profile and replace old username everywhere in DB
   * (old messages, posts, comments, rooms, DMs, notifications)
   */
  async updateUserEverywhere(
    oldUsername: string,
    updatedProfile: UserProfile
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'Supabase is not connected' };

    try {
      const cleanOld = oldUsername.trim().toLowerCase().replace(/^@/, '');
      const cleanNew = updatedProfile.username.trim().toLowerCase().replace(/^@/, '');
      const newDisplayName = updatedProfile.displayName?.trim() || cleanNew;
      const newBadge = updatedProfile.badge || '🎓 Campus Member';

      // 1. Save / Update User Profile in users and profiles tables
      await this.saveProfile(updatedProfile);

      // If username hasn't changed and only display name changed, still update messages/posts
      const isUsernameChanged = cleanOld !== cleanNew && cleanOld !== '';

      // 2. Cascade update in 'messages' table
      try {
        if (isUsernameChanged) {
          await supabase
            .from('messages')
            .update({
              sender_username: cleanNew,
              sender_name: `@${cleanNew}`,
              sender_badge: newBadge,
            })
            .eq('sender_username', cleanOld);
        } else {
          await supabase
            .from('messages')
            .update({
              sender_badge: newBadge,
            })
            .eq('sender_username', cleanNew);
        }
      } catch (e) {
        console.warn('Could not cascade update messages table:', e);
      }

      // 3. Cascade update in 'feed_posts' table
      try {
        if (isUsernameChanged) {
          await supabase
            .from('feed_posts')
            .update({
              author_username: cleanNew,
              author_display_name: newDisplayName,
              author_badge: newBadge,
            })
            .eq('author_username', cleanOld);
        } else {
          await supabase
            .from('feed_posts')
            .update({
              author_display_name: newDisplayName,
              author_badge: newBadge,
            })
            .eq('author_username', cleanNew);
        }
      } catch (e) {
        console.warn('Could not cascade update feed_posts table:', e);
      }

      // 4. Cascade update in 'feed_comments' table
      try {
        if (isUsernameChanged) {
          await supabase
            .from('feed_comments')
            .update({
              author_username: cleanNew,
              author_display_name: newDisplayName,
            })
            .eq('author_username', cleanOld);
        } else {
          await supabase
            .from('feed_comments')
            .update({
              author_display_name: newDisplayName,
            })
            .eq('author_username', cleanNew);
        }
      } catch (e) {
        console.warn('Could not cascade update feed_comments table:', e);
      }

      // 5. Cascade update in 'rooms' table (creator_username & creator_name)
      try {
        if (isUsernameChanged) {
          await supabase
            .from('rooms')
            .update({
              creator_username: cleanNew,
              creator_name: newDisplayName,
            })
            .eq('creator_username', cleanOld);
        } else {
          await supabase
            .from('rooms')
            .update({
              creator_name: newDisplayName,
            })
            .eq('creator_username', cleanNew);
        }
      } catch (e) {
        console.warn('Could not cascade update rooms creator:', e);
      }

      // 6. Cascade update in 'private_messages' table
      try {
        if (isUsernameChanged) {
          await supabase
            .from('private_messages')
            .update({
              sender_username: cleanNew,
              sender_display_name: newDisplayName,
            })
            .eq('sender_username', cleanOld);

          await supabase
            .from('private_messages')
            .update({
              recipient_username: cleanNew,
            })
            .eq('recipient_username', cleanOld);
        }
      } catch (e) {
        console.warn('Could not cascade update private_messages:', e);
      }

      // 7. Cascade update in 'notifications' table
      try {
        if (isUsernameChanged) {
          await supabase
            .from('notifications')
            .update({
              recipient_username: cleanNew,
            })
            .eq('recipient_username', cleanOld);

          await supabase
            .from('notifications')
            .update({
              from_username: cleanNew,
            })
            .eq('from_username', cleanOld);
        }
      } catch (e) {
        console.warn('Could not cascade update notifications:', e);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error cascading user update in Supabase:', err);
      return { success: false, error: err?.message || 'Database error during cascade update' };
    }
  },

  /**
   * Check if username already exists in Supabase DB
   */
  async checkUsernameExists(username: string, currentProfileId?: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !username) return false;

    try {
      const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

      // Query across users, profiles, user_profiles
      let q1 = supabase.from('users').select('id').ilike('username', cleanUsername);
      let q2 = supabase.from('profiles').select('id').ilike('username', cleanUsername);
      let q3 = supabase.from('user_profiles').select('id').ilike('username', cleanUsername);

      if (currentProfileId) {
        q1 = q1.neq('id', currentProfileId);
        q2 = q2.neq('id', currentProfileId);
        q3 = q3.neq('id', currentProfileId);
      }

      const [r1, r2, r3] = await Promise.all([q1, q2, q3]);
      if ((r1.data && r1.data.length > 0) || (r2.data && r2.data.length > 0) || (r3.data && r3.data.length > 0)) {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },

  /**
   * Check if email already exists in Supabase DB
   */
  async checkEmailExists(email: string, currentProfileId?: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !email) return false;

    try {
      const cleanEmail = email.trim().toLowerCase();

      let q1 = supabase.from('users').select('id').ilike('email', cleanEmail);
      let q2 = supabase.from('profiles').select('id').ilike('email', cleanEmail);
      let q3 = supabase.from('user_profiles').select('id').ilike('email', cleanEmail);

      if (currentProfileId) {
        q1 = q1.neq('id', currentProfileId);
        q2 = q2.neq('id', currentProfileId);
        q3 = q3.neq('id', currentProfileId);
      }

      const [r1, r2, r3] = await Promise.all([q1, q2, q3]);
      if ((r1.data && r1.data.length > 0) || (r2.data && r2.data.length > 0) || (r3.data && r3.data.length > 0)) {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },

  /**
   * Authenticate user credentials directly against Supabase DB
   */
  async authenticateUser(loginIdentifier: string, password: string): Promise<UserProfile | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !loginIdentifier || !password) return null;

    try {
      const rawInput = loginIdentifier.trim().toLowerCase();
      const cleanHandle = rawInput.replace(/^@/, '');
      const cleanEmail = rawInput.includes('@') ? rawInput : '';
      const cleanUsername = rawInput.includes('@') ? rawInput.split('@')[0] : cleanHandle;
      const cleanPass = password.trim();

      // Check if developer account login attempt
      const isDevAttempt =
        (cleanHandle === 'muhammedrafii2002' ||
          cleanEmail === 'muhammedrafii2002@gmail.com' ||
          cleanHandle === 'developer') &&
        cleanPass === '!29042002@ifaR';

      // 1. Try Supabase Auth signInWithPassword first if loginIdentifier is email
      if (cleanEmail) {
        try {
          const { data: authData } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPass,
          });
          if (authData?.user) {
            // Fetch user details from DB
            const { data: uData } = await supabase
              .from('users')
              .select('*')
              .eq('email', cleanEmail)
              .maybeSingle();

            if (uData) {
              return {
                id: uData.id,
                profileId: uData.profile_id || `PID-${uData.id.slice(0, 6)}`,
                username: uData.username,
                displayName: uData.display_name,
                email: uData.email,
                password: uData.password || cleanPass,
                collegeId: uData.college_id,
                badge: uData.badge,
                isAdmin: uData.is_admin,
                isRegistered: true,
                createdAt: uData.created_at,
              };
            }
          }
        } catch (e) {
          // ignore auth failure, fallback to direct DB checks
        }
      }

      // 2. Direct query on 'users', 'profiles', and 'user_profiles' tables
      const tables = ['users', 'profiles', 'user_profiles'];
      for (const tableName of tables) {
        try {
          let query = supabase.from(tableName).select('*');
          if (cleanEmail) {
            query = query.or(`email.ilike.${cleanEmail},username.ilike.${cleanUsername}`);
          } else {
            query = query.ilike('username', cleanHandle);
          }

          const { data } = await query.maybeSingle();

          if (data) {
            const passMatch =
              data.password === cleanPass ||
              data.password_hash === cleanPass ||
              (data.password && data.password.trim() === cleanPass);

            if (passMatch) {
              return {
                id: data.id,
                profileId: data.profile_id || `PID-${data.id.slice(0, 6)}`,
                username: data.username,
                displayName: data.display_name,
                email: data.email,
                password: data.password || cleanPass,
                collegeId: data.college_id,
                badge: data.badge,
                isAdmin: data.is_admin,
                isRegistered: true,
                createdAt: data.created_at,
              };
            }
          }
        } catch (e) {
          // ignore table query error
        }
      }

      // 3. Developer account auto-provisioning if credentials match
      if (isDevAttempt) {
        const devProfile: UserProfile = {
          id: 'dev-lead-2026',
          profileId: 'PID-DEV202601',
          username: 'muhammedrafii2002',
          displayName: 'Developer',
          email: 'muhammedrafii2002@gmail.com',
          password: '!29042002@ifaR',
          collegeId: 'sn_cherthala',
          badge: '⚡ Lead Developer & Admin',
          isRegistered: true,
          isAdmin: true,
          createdAt: new Date().toISOString(),
        };

        // Seed dev profile into Supabase DB
        await this.saveProfile(devProfile);
        return devProfile;
      }

      return null;
    } catch (err) {
      console.error('Error authenticating user against Supabase DB:', err);
      return null;
    }
  },

  /**
   * Update Room details in Supabase
   */
  async updateRoom(roomId: string, updates: Partial<TrendingRoom>): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.emoji !== undefined) payload.emoji = updates.emoji;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.locationArea !== undefined) payload.location_area = updates.locationArea;
      if (updates.isLiveNow !== undefined) payload.is_live_now = updates.isLiveNow;
      if (updates.isPrivate !== undefined) payload.is_private = updates.isPrivate;
      if (updates.inviteCode !== undefined) payload.invite_code = updates.inviteCode;
      if (updates.allowedUsers !== undefined) payload.allowed_users = updates.allowedUsers;
      if (updates.activeMembers !== undefined) payload.active_members = updates.activeMembers;
      if (updates.roomLogs !== undefined) payload.room_logs = updates.roomLogs;
      if (updates.pinnedMessageId !== undefined) payload.pinned_message_id = updates.pinnedMessageId;
      if (updates.lastActivityAt !== undefined) payload.last_activity_at = updates.lastActivityAt;
      if (updates.roomAdmins !== undefined) payload.room_admins = updates.roomAdmins;
      if (updates.roomAdminRights !== undefined) payload.room_admin_rights = updates.roomAdminRights;
      if (updates.deletionRequested !== undefined) payload.deletion_requested = updates.deletionRequested;
      if (updates.deletionReason !== undefined) payload.deletion_reason = updates.deletionReason;
      if (updates.hasActivePoll !== undefined) payload.has_active_poll = updates.hasActivePoll;

      let { error } = await supabase.from('rooms').update(payload).eq('id', roomId);

      // Auto-recovery if database has missing optional columns (PGRST204)
      while (error && error.code === 'PGRST204') {
        const match = error.message?.match(/'([^']+)' column/);
        if (match && match[1] && payload[match[1]] !== undefined) {
          delete payload[match[1]];
          const retryRes = await supabase.from('rooms').update(payload).eq('id', roomId);
          error = retryRes.error;
        } else {
          break;
        }
      }

      if (error) {
        console.error('Error updating room in Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Room update error:', err);
      return false;
    }
  },

  /**
   * User explicitly joins a room
   */
  async joinRoom(roomId: string, username: string, displayName?: string): Promise<boolean> {
    return this.addRoomActivityLog(roomId, {
      username,
      displayName: displayName || `@${username}`,
      action: 'joined',
    });
  },

  /**
   * User leaves a room
   */
  async leaveRoom(roomId: string, username: string, displayName?: string): Promise<boolean> {
    return this.addRoomActivityLog(roomId, {
      username,
      displayName: displayName || `@${username}`,
      action: 'left',
    });
  },

  /**
   * Record room join/leave activity log
   */
  async addRoomActivityLog(
    roomId: string,
    logItem: { username: string; displayName: string; action: 'joined' | 'left' }
  ): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { data } = await supabase.from('rooms').select('room_logs, active_members').eq('id', roomId).single();
      const currentLogs = Array.isArray(data?.room_logs) ? data.room_logs : [];
      const currentActive: string[] = Array.isArray(data?.active_members) ? data.active_members : [];

      const newLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        roomId,
        username: logItem.username,
        displayName: logItem.displayName,
        action: logItem.action,
        timestamp: new Date().toISOString(),
      };

      const updatedLogs = [newLog, ...currentLogs].slice(0, 100);
      let updatedActive = [...currentActive];

      if (logItem.action === 'joined') {
        if (!updatedActive.includes(logItem.username)) {
          updatedActive.push(logItem.username);
        }
      } else {
        updatedActive = updatedActive.filter((u) => u !== logItem.username);
      }

      await supabase
        .from('rooms')
        .update({
          room_logs: updatedLogs,
          active_members: updatedActive,
          active_people_count: Math.max(1, updatedActive.length),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      return true;
    } catch (e) {
      console.error('Error recording room log in Supabase:', e);
      return false;
    }
  },

  /**
   * Get single user profile by username
   */
  async getProfileByUsername(username: string): Promise<UserProfile | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !username) return null;

    try {
      const clean = username.trim().toLowerCase().replace(/^@/, '');
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', clean)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          profileId: data.profile_id || `PID-${data.id.slice(0, 6)}`,
          username: data.username,
          displayName: data.display_name || data.username,
          email: data.email,
          collegeId: data.college_id,
          badge: data.badge || (data.is_admin ? '⚡ Admin' : '🎓 Campus Member'),
          isAdmin: Boolean(data.is_admin),
          isRegistered: Boolean(data.is_registered ?? true),
          createdAt: data.created_at,
        };
      }

      // Check users table fallback
      const { data: uData } = await supabase
        .from('users')
        .select('*')
        .eq('username', clean)
        .maybeSingle();

      if (uData) {
        return {
          id: uData.id,
          profileId: uData.profile_id || `PID-${uData.id.slice(0, 6)}`,
          username: uData.username,
          displayName: uData.display_name || uData.username,
          email: uData.email,
          collegeId: uData.college_id,
          badge: uData.badge || (uData.is_admin ? '⚡ Admin' : '🎓 Campus Member'),
          isAdmin: Boolean(uData.is_admin),
          isRegistered: Boolean(uData.is_registered ?? true),
          createdAt: uData.created_at,
        };
      }

      return null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Delete room from Supabase
   */
  async deleteRoom(roomId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase.from('rooms').delete().eq('id', roomId);
    return !error;
  },

  /**
   * Fetch Messages for a given room
   */
  async getMessages(roomId: string): Promise<ChatMessage[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_deleted', false)
      .order('timestamp', { ascending: true });

    if (error || !data) return null;

    return data.map((m) => ({
      id: m.id,
      roomId: m.room_id,
      senderName: m.sender_name,
      senderUsername: m.sender_username,
      senderBadge: m.sender_badge,
      isAnonymous: m.is_anonymous,
      witnessDistanceText: m.witness_distance_text,
      content: m.content,
      mediaUrl: m.media_url,
      mediaType: m.media_type,
      poll: m.poll_data,
      timestamp: m.timestamp,
      reactions: m.reactions || {},
      isWitness: m.is_witness,
      mentions: m.mentions || [],
    }));
  },

  /**
   * Send Message to Supabase room
   */
  async sendMessage(msg: ChatMessage): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase.from('messages').insert({
      id: msg.id,
      room_id: msg.roomId,
      sender_name: msg.senderName,
      sender_username: msg.senderUsername || null,
      sender_badge: msg.senderBadge || null,
      is_anonymous: msg.isAnonymous || false,
      witness_distance_text: msg.witnessDistanceText,
      content: msg.content || null,
      media_url: msg.mediaUrl || null,
      media_type: msg.mediaType || null,
      poll_data: msg.poll || null,
      timestamp: msg.timestamp,
      reactions: msg.reactions || {},
      is_witness: msg.isWitness ?? true,
      mentions: msg.mentions || [],
    });

    if (error) {
      console.error('Error inserting message into Supabase:', error);
      return false;
    }

    // Update last_activity_at on room
    await supabase
      .from('rooms')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', msg.roomId);

    return true;
  },

  /**
   * Delete message in Supabase
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', messageId);

    return !error;
  },

  /**
   * Update poll votes/data on a message in Supabase
   */
  async updateMessagePoll(messageId: string, pollData: PollData): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ poll_data: pollData })
        .eq('id', messageId);

      if (error) {
        console.error('Error updating poll in Supabase:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error updating poll:', e);
      return false;
    }
  },

  /**
   * Update reactions on a message in Supabase
   */
  async updateMessageReactions(messageId: string, reactions: Record<string, number>): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ reactions })
        .eq('id', messageId);

      if (error) {
        console.error('Error updating reactions in Supabase:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Error updating reactions:', e);
      return false;
    }
  },

  /**
   * Fetch Feed Posts
   */
  async getFeedPosts(collegeId: string): Promise<FeedPost[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('feed_posts')
      .select('*')
      .or(`college_id.eq.${collegeId},college_id.is.null`)
      .order('timestamp', { ascending: false });

    if (error || !data) return null;

    return data.map((p) => ({
      id: p.id,
      collegeId: p.college_id,
      authorUsername: p.author_username,
      authorDisplayName: p.author_display_name,
      authorBadge: p.author_badge,
      content: p.content,
      mediaUrl: p.media_url,
      mediaType: p.media_type,
      locationName: p.location_name,
      category: p.category,
      verificationStatus: p.verification_status,
      timestamp: p.timestamp,
      upvotes: p.upvotes || 0,
      upvoters: p.upvoters || [],
      commentsCount: p.comments_count || 0,
    }));
  },

  /**
   * Create Feed Post in Supabase
   */
  async createFeedPost(post: FeedPost): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    if (post.collegeId) {
      await this.ensureCollegeExists(post.collegeId);
    }

    const { error } = await supabase.from('feed_posts').insert({
      id: post.id,
      college_id: post.collegeId,
      author_username: post.authorUsername,
      author_display_name: post.authorDisplayName,
      author_badge: post.authorBadge || null,
      content: post.content,
      media_url: post.mediaUrl || null,
      media_type: post.mediaType || null,
      location_name: post.locationName,
      category: post.category,
      verification_status: post.verificationStatus,
      timestamp: post.timestamp,
      upvotes: post.upvotes,
      upvoters: post.upvoters,
      comments_count: post.commentsCount,
    });

    if (error) {
      console.error('Error creating feed post in Supabase:', error);
      return false;
    }
    return true;
  },

  /**
   * Upvote Feed Post in Supabase
   */
  async upvoteFeedPost(postId: string, username: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    // Fetch existing post upvoters
    const { data, error } = await supabase
      .from('feed_posts')
      .select('upvotes, upvoters')
      .eq('id', postId)
      .single();

    if (error || !data) return false;

    const upvoters: string[] = data.upvoters || [];
    const hasVoted = upvoters.includes(username);

    const newUpvoters = hasVoted
      ? upvoters.filter((u) => u !== username)
      : [...upvoters, username];

    const newCount = newUpvoters.length;

    const { error: updateErr } = await supabase
      .from('feed_posts')
      .update({ upvotes: newCount, upvoters: newUpvoters })
      .eq('id', postId);

    return !updateErr;
  },

  /**
   * Delete Feed Post from Supabase
   */
  async deleteFeedPost(postId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase.from('feed_posts').delete().eq('id', postId);
    if (error) {
      console.error('Error deleting feed post from Supabase:', error);
      return false;
    }
    // Clean up related comments
    try {
      await supabase.from('feed_comments').delete().eq('post_id', postId);
    } catch (e) {
      // Ignore if table missing
    }
    return true;
  },

  /**
   * Fetch Comments for a Feed Post
   */
  async getFeedComments(postId: string): Promise<FeedComment[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      let { data, error } = await supabase
        .from('feed_comments')
        .select('*')
        .eq('post_id', postId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.warn('getFeedComments timestamp order failed, trying default select:', error.message);
        const fallback = await supabase
          .from('feed_comments')
          .select('*')
          .eq('post_id', postId);
        data = fallback.data;
        error = fallback.error;
      }

      if (error || !data) return null;

      return data.map((c) => ({
        id: c.id,
        postId: c.post_id,
        authorUsername: c.author_username,
        authorDisplayName: c.author_display_name,
        content: c.content,
        timestamp: c.timestamp || c.created_at || new Date().toISOString(),
        parentId: c.parent_id || null,
        likesCount: c.likes_count || 0,
        likes: c.likes || [],
      }));
    } catch (e) {
      console.error('Error fetching feed comments:', e);
      return null;
    }
  },

  /**
   * Create Comment or Reply on Feed Post
   */
  async createFeedComment(comment: FeedComment): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      // Primary insert payload
      let { error } = await supabase.from('feed_comments').insert({
        id: comment.id,
        post_id: comment.postId,
        author_username: comment.authorUsername,
        author_display_name: comment.authorDisplayName,
        content: comment.content,
        timestamp: comment.timestamp,
        parent_id: comment.parentId || null,
        likes_count: comment.likesCount || 0,
        likes: comment.likes || [],
      });

      // If error due to missing timestamp column, attempt insert without timestamp column
      if (error && error.message?.includes('timestamp')) {
        const retry = await supabase.from('feed_comments').insert({
          id: comment.id,
          post_id: comment.postId,
          author_username: comment.authorUsername,
          author_display_name: comment.authorDisplayName,
          content: comment.content,
          parent_id: comment.parentId || null,
          likes_count: comment.likesCount || 0,
          likes: comment.likes || [],
        });
        error = retry.error;
      }

      if (error) {
        console.error('Error inserting feed comment into Supabase:', error);
        return false;
      }

      // Increment comments_count on feed_posts
      try {
        const { data: postData } = await supabase
          .from('feed_posts')
          .select('comments_count')
          .eq('id', comment.postId)
          .single();

        if (postData) {
          await supabase
            .from('feed_posts')
            .update({ comments_count: (postData.comments_count || 0) + 1 })
            .eq('id', comment.postId);
        }
      } catch (countErr) {
        // Ignore count update failure
      }

      return true;
    } catch (e) {
      console.error('Error creating feed comment in Supabase:', e);
    }
    return false;
  },

  /**
   * Like / Unlike Feed Comment
   */
  async likeFeedComment(commentId: string, username: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { data } = await supabase
        .from('feed_comments')
        .select('likes')
        .eq('id', commentId)
        .single();

      if (!data) return false;

      const likes: string[] = data.likes || [];
      const hasLiked = likes.includes(username);
      const newLikes = hasLiked
        ? likes.filter((u) => u !== username)
        : [...likes, username];

      const { error } = await supabase
        .from('feed_comments')
        .update({ likes: newLikes, likes_count: newLikes.length })
        .eq('id', commentId);

      return !error;
    } catch (e) {
      return false;
    }
  },

  /**
   * Delete Feed Comment
   */
  async deleteFeedComment(commentId: string, postId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return true; // Local success fallback

    try {
      // Delete comment and its nested child replies
      await supabase.from('feed_comments').delete().or(`id.eq.${commentId},parent_id.eq.${commentId}`);

      // Decrement post comments count
      try {
        const { data: postData } = await supabase
          .from('feed_posts')
          .select('comments_count')
          .eq('id', postId)
          .single();

        if (postData && (postData.comments_count || 0) > 0) {
          await supabase
            .from('feed_posts')
            .update({ comments_count: Math.max(0, (postData.comments_count || 1) - 1) })
            .eq('id', postId);
        }
      } catch (countErr) {
        // Non-blocking
      }

      return true;
    } catch (e) {
      console.error('Error deleting feed comment from Supabase:', e);
      return true;
    }
  },

  /**
   * Delete Private Message
   */
  async deletePrivateMessage(messageId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase.from('private_messages').delete().eq('id', messageId);
    return !error;
  },

  /**
   * Fetch Private Messages
   */
  async getPrivateMessages(username: string): Promise<PrivateMessage[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .or(`sender_username.eq.${username},recipient_username.eq.${username}`)
      .order('timestamp', { ascending: true });

    if (error || !data) return null;

    return data.map((m) => ({
      id: m.id,
      senderUsername: m.sender_username,
      recipientUsername: m.recipient_username,
      content: m.content,
      mediaUrl: m.media_url,
      timestamp: m.timestamp,
      isRead: m.is_read,
    }));
  },

  /**
   * Send Private Message
   */
  async sendPrivateMessage(pm: PrivateMessage): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const { error } = await supabase.from('private_messages').insert({
      id: pm.id,
      sender_username: pm.senderUsername,
      recipient_username: pm.recipientUsername,
      content: pm.content,
      media_url: pm.mediaUrl || null,
      timestamp: pm.timestamp,
      is_read: pm.isRead || false,
    });

    return !error;
  },

  /**
   * Mark all unread private messages from a sender as read
   */
  async markPrivateMessagesAsRead(senderUsername: string, recipientUsername: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('private_messages')
        .update({ is_read: true })
        .eq('sender_username', senderUsername)
        .eq('recipient_username', recipientUsername)
        .eq('is_read', false);

      return !error;
    } catch (e) {
      return false;
    }
  },

  /**
   * Fetch notifications for a user
   */
  async getNotifications(username: string): Promise<AppNotification[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase || !username) return null;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_username', username)
        .order('timestamp', { ascending: false });

      if (error || !data) return null;

      return data.map((n) => ({
        id: n.id,
        recipientUsername: n.recipient_username,
        title: n.title,
        message: n.message,
        type: n.type as AppNotification['type'],
        linkRoomId: n.link_room_id,
        roomId: n.room_id,
        fromUsername: n.from_username,
        timestamp: n.timestamp,
        isRead: n.is_read,
      }));
    } catch (e) {
      return null;
    }
  },

  /**
   * Save notification in Supabase
   */
  async saveNotification(notif: AppNotification): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('notifications').insert({
        id: notif.id,
        recipient_username: notif.recipientUsername,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        link_room_id: notif.linkRoomId || null,
        room_id: notif.roomId || null,
        from_username: notif.fromUsername || null,
        timestamp: notif.timestamp,
        is_read: notif.isRead || false,
      });

      return !error;
    } catch (e) {
      return false;
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markNotificationsAsRead(username: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase || !username) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_username', username);

      return !error;
    } catch (e) {
      return false;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
      return !error;
    } catch (e) {
      return false;
    }
  },

  /**
   * Realtime Subscription to Notifications for a user
   */
  subscribeToNotifications(
    username: string,
    onNotification: (notif: AppNotification) => void
  ) {
    const supabase = getSupabaseClient();
    if (!supabase || !username) return () => {};

    const channel = supabase
      .channel(`user-notifs-${username}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_username=eq.${username}`,
        },
        (payload) => {
          const n = payload.new;
          if (n) {
            onNotification({
              id: n.id,
              recipientUsername: n.recipient_username,
              title: n.title,
              message: n.message,
              type: n.type as AppNotification['type'],
              linkRoomId: n.link_room_id,
              roomId: n.room_id,
              fromUsername: n.from_username,
              timestamp: n.timestamp,
              isRead: n.is_read,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Realtime Subscription to Messages for a Room
   */
  subscribeToMessages(
    roomId: string,
    onMessageEvent: (event: 'INSERT' | 'UPDATE' | 'DELETE', msg: ChatMessage, oldId?: string) => void
  ) {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};

    const channel = supabase
      .channel(`room-messages-rt-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const m = payload.new;
            if (m && !m.is_deleted) {
              onMessageEvent('INSERT', {
                id: m.id,
                roomId: m.room_id,
                senderName: m.sender_name,
                senderUsername: m.sender_username,
                senderBadge: m.sender_badge,
                isAnonymous: m.is_anonymous,
                witnessDistanceText: m.witness_distance_text,
                content: m.content,
                mediaUrl: m.media_url,
                mediaType: m.media_type,
                poll: m.poll_data,
                timestamp: m.timestamp,
                reactions: m.reactions || {},
                isWitness: m.is_witness,
                mentions: m.mentions || [],
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const m = payload.new;
            if (m) {
              if (m.is_deleted) {
                onMessageEvent('DELETE', {} as ChatMessage, m.id);
              } else {
                onMessageEvent('UPDATE', {
                  id: m.id,
                  roomId: m.room_id,
                  senderName: m.sender_name,
                  senderUsername: m.sender_username,
                  senderBadge: m.sender_badge,
                  isAnonymous: m.is_anonymous,
                  witnessDistanceText: m.witness_distance_text,
                  content: m.content,
                  mediaUrl: m.media_url,
                  mediaType: m.media_type,
                  poll: m.poll_data,
                  timestamp: m.timestamp,
                  reactions: m.reactions || {},
                  isWitness: m.is_witness,
                  mentions: m.mentions || [],
                });
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId) {
              onMessageEvent('DELETE', {} as ChatMessage, oldId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Realtime Subscription to Rooms
   */
  subscribeToRooms(onRoomChange: () => void) {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};

    const channel = supabase
      .channel('rooms-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          onRoomChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Realtime Subscription to Feed Posts
   */
  subscribeToFeedPosts(onFeedChange: () => void) {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};

    const channel = supabase
      .channel('feed-posts-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feed_posts' },
        () => {
          onFeedChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Realtime Subscription to Private Messages for a user
   */
  subscribeToPrivateMessages(
    username: string,
    onNewMessage: (pm: PrivateMessage) => void
  ) {
    const supabase = getSupabaseClient();
    if (!supabase || !username) return () => {};

    const channel = supabase
      .channel(`user-pms-${username}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `recipient_username=eq.${username}`,
        },
        (payload) => {
          const m = payload.new;
          if (m) {
            onNewMessage({
              id: m.id,
              senderUsername: m.sender_username,
              recipientUsername: m.recipient_username,
              content: m.content,
              mediaUrl: m.media_url,
              timestamp: m.timestamp,
              isRead: m.is_read,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
