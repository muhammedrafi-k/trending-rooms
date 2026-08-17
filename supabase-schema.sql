

-- 1. COLLEGES TABLE
CREATE TABLE IF NOT EXISTS colleges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  district TEXT NOT NULL,
  student_count INT DEFAULT 0,
  area TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  profile_id TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  password_hash TEXT,
  college_id TEXT REFERENCES colleges(id) ON DELETE SET NULL,
  badge TEXT DEFAULT '🎓 Campus Member',
  is_admin BOOLEAN DEFAULT FALSE,
  is_registered BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  college_id TEXT REFERENCES colleges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  room_type TEXT DEFAULT 'student_created',
  emoji TEXT NOT NULL DEFAULT '📍',
  location_area TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  active_people_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  description TEXT,
  is_live_now BOOLEAN DEFAULT TRUE,
  has_active_poll BOOLEAN DEFAULT FALSE,
  creator_name TEXT,
  creator_username TEXT,
  room_admins JSONB DEFAULT '[]'::jsonb,
  room_admin_rights JSONB DEFAULT '{}'::jsonb,
  pinned_message_id TEXT,
  deletion_requested BOOLEAN DEFAULT FALSE,
  deletion_reason TEXT,
  deletion_requested_by TEXT,
  top_contributor JSONB DEFAULT NULL
);

-- 4. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_username TEXT,
  sender_badge TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  witness_distance_text TEXT NOT NULL DEFAULT '📍 On Campus',
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  poll_data JSONB DEFAULT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  reactions JSONB DEFAULT '{}'::jsonb,
  is_witness BOOLEAN DEFAULT TRUE,
  mentions JSONB DEFAULT '[]'::jsonb,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- 5. FEED POSTS TABLE
CREATE TABLE IF NOT EXISTS feed_posts (
  id TEXT PRIMARY KEY,
  college_id TEXT REFERENCES colleges(id) ON DELETE CASCADE,
  author_username TEXT NOT NULL,
  author_display_name TEXT NOT NULL,
  author_badge TEXT,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  location_name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  verification_status TEXT DEFAULT 'verified',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  upvotes INT DEFAULT 0,
  upvoters JSONB DEFAULT '[]'::jsonb,
  comments_count INT DEFAULT 0
);

-- 6. FEED COMMENTS TABLE
CREATE TABLE IF NOT EXISTS feed_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  author_username TEXT NOT NULL,
  author_display_name TEXT,
  content TEXT NOT NULL,
  parent_id TEXT REFERENCES feed_comments(id) ON DELETE CASCADE,
  likes_count INT DEFAULT 0,
  likes TEXT[] DEFAULT '{}'::text[],
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PRIVATE MESSAGES TABLE
CREATE TABLE IF NOT EXISTS private_messages (
  id TEXT PRIMARY KEY,
  sender_username TEXT NOT NULL,
  sender_display_name TEXT,
  recipient_username TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_username TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link_room_id TEXT,
  room_id TEXT,
  from_username TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- 9. REPORTS / MODERATION TABLE
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  room_id TEXT,
  reported_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  content_preview TEXT
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_rooms_college ON rooms(college_id);
CREATE INDEX IF NOT EXISTS idx_rooms_last_activity ON rooms(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_college ON feed_posts(college_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_timestamp ON feed_posts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post_id ON feed_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_parent_id ON feed_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_recipient ON private_messages(recipient_username);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_username);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write on colleges" ON colleges;
DROP POLICY IF EXISTS "Allow public read/write on users" ON users;
DROP POLICY IF EXISTS "Allow public read/write on rooms" ON rooms;
DROP POLICY IF EXISTS "Allow public read/write on messages" ON messages;
DROP POLICY IF EXISTS "Allow public read/write on feed_posts" ON feed_posts;
DROP POLICY IF EXISTS "Allow public read/write on feed_comments" ON feed_comments;
DROP POLICY IF EXISTS "Allow public read/write on private_messages" ON private_messages;
DROP POLICY IF EXISTS "Allow public read/write on notifications" ON notifications;
DROP POLICY IF EXISTS "Allow public read/write on reports" ON reports;

CREATE POLICY "Allow public read/write on colleges" ON colleges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on feed_posts" ON feed_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on feed_comments" ON feed_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on private_messages" ON private_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on reports" ON reports FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- REALTIME PUBLICATION
-- ====================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms, messages, feed_posts, feed_comments, private_messages, notifications;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- ignore publication error if table already in publication
END $$;

