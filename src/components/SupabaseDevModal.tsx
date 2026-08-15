import React, { useState } from 'react';
import { X, Database, Check, Copy, Terminal, ExternalLink, Key, AlertTriangle } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, isSecretKey } from '../lib/supabaseClient';

interface SupabaseDevModalProps {
  onClose: () => void;
}

export const SupabaseDevModal: React.FC<SupabaseDevModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const config = getSupabaseConfig();
  const [urlInput, setUrlInput] = useState(config.url);
  const [keyInput, setKeyInput] = useState(config.key);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sqlSchema = `-- Supabase PostgreSQL Production Schema for Trending Rooms
-- Lead Developer: Muhammed Rafi (muhammedrafii2002@gmail.com)

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
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
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

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write on colleges" ON colleges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on feed_posts" ON feed_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on feed_comments" ON feed_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on private_messages" ON private_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on reports" ON reports FOR ALL USING (true) WITH CHECK (true);

-- 11. SEED DEFAULT LEAD DEVELOPER ACCOUNT
INSERT INTO users (id, username, display_name, email, password_hash, badge, is_admin, is_registered)
VALUES ('dev-lead-2026', 'muhammedrafii2002', 'Muhammed Rafi (Lead Dev)', 'muhammedrafii2002@gmail.com', '!29042002@ifaR', '⚡ Lead Developer & Admin', TRUE, TRUE)
ON CONFLICT (username) DO UPDATE SET email = 'muhammedrafii2002@gmail.com', password_hash = '!29042002@ifaR', is_admin = TRUE, badge = '⚡ Lead Developer & Admin';
`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!urlInput.trim() || !keyInput.trim()) {
      setErrorMessage('Please enter both Supabase URL and Key.');
      return;
    }
    if (isSecretKey(keyInput)) {
      setErrorMessage(
        '⚠️ You entered a Secret / Service Role Key (sbp_... or service_role). Supabase blocks secret keys in browsers! Please use the public "anon" API key from Supabase Dashboard > Project Settings > API.'
      );
      return;
    }
    saveSupabaseConfig(urlInput, keyInput);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-3xl w-full max-h-[85vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-slate-800 my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Developer Guide & Supabase Integration</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  {config.isConnected ? 'Connected' : 'Local Engine Ready'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                React Frontend + Supabase Database & Realtime Channel blueprint
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Quick Config Form */}
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Connect your Supabase Project Credentials</span>
              </h4>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Supabase Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {config.isSecret && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  ⚠️ Currently saved Supabase key is a Secret/Service Role key. Replace it below with your public <strong>anon</strong> key to enable live database requests.
                </span>
              </div>
            )}

            <form onSubmit={handleSaveKeys} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  SUPABASE_URL
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://xyzproject.supabase.co"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  SUPABASE_ANON_KEY
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-xs font-mono text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  Or set variables in <code className="text-emerald-300 font-mono">.env.example</code>
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Credentials</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* SQL Schema Copy Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>1. Run SQL Schema in Supabase SQL Editor</span>
              </h4>
              <button
                onClick={copySql}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] leading-relaxed text-emerald-400 overflow-x-auto max-h-56">
              {sqlSchema}
            </pre>
          </div>

          {/* Code Snippet */}
          <div className="space-y-2">
            <h4 className="font-bold text-white">2. React Supabase Realtime Subscription Code Pattern</h4>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
              <p className="text-slate-500">// Listen to live chat messages in Supabase</p>
              <p className="text-amber-300">
                supabase.channel('room-channel')
              </p>
              <p className="text-slate-300 ml-4">
                .on('postgres_changes', &#123; event: 'INSERT', schema: 'public', table: 'messages' &#125;, (payload) =&gt; &#123;
              </p>
              <p className="text-emerald-400 ml-8">
                setMessages((prev) =&gt; [...prev, payload.new]);
              </p>
              <p className="text-slate-300 ml-4">&#125;)</p>
              <p className="text-slate-300 ml-4">.subscribe();</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
