import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabaseService } from '../lib/supabaseService';
import { User, Shield, Check, Lock, AlertCircle, LogOut, KeyRound, UserCheck, X, CheckCircle2, XCircle } from 'lucide-react';

interface UserProfileModalProps {
  currentUser: UserProfile;
  onSaveProfile: (profile: UserProfile, actionType?: 'login' | 'register' | 'update') => void;
  onLogout?: () => void;
  onClose: () => void;
  onOpenAdminPanel?: () => void;
  requiredForAction?: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  onSaveProfile,
  onLogout,
  onClose,
  onOpenAdminPanel,
  requiredForAction,
}) => {
  const [authTab, setAuthTab] = useState<'create' | 'login'>('create');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [username, setUsername] = useState(
    currentUser.username && currentUser.username !== 'guest'
      ? currentUser.username
      : `user_${Math.floor(Math.random() * 8999 + 1000)}`
  );
  const [displayName, setDisplayName] = useState(
    currentUser.displayName && currentUser.displayName !== 'Guest Visitor'
      ? currentUser.displayName
      : ''
  );
  const [email, setEmail] = useState(currentUser.email || '');
  const [badge, setBadge] = useState(currentUser.badge || '🎓 Campus Member');
  const [password, setPassword] = useState(currentUser.password || '');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(currentUser.isAdmin || false);
  const [error, setError] = useState('');

  // Live username & email uniqueness checking
  const cleanUsernameLive = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const cleanEmailLive = email.trim().toLowerCase();

  const [usernameValidation, setUsernameValidation] = useState<{ status: string; message: string }>({
    status: 'idle',
    message: '',
  });
  const [emailValidation, setEmailValidation] = useState<{ status: string; message: string }>({
    status: 'idle',
    message: '',
  });

  // Async username validation effect
  useEffect(() => {
    if (!cleanUsernameLive) {
      setUsernameValidation({ status: 'idle', message: '' });
      return;
    }
    if (cleanUsernameLive.length < 3) {
      setUsernameValidation({ status: 'invalid', message: 'At least 3 characters required' });
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      // Check Supabase DB
      const existsInDb = await supabaseService.checkUsernameExists(cleanUsernameLive, currentUser.id);
      if (isMounted) {
        if (existsInDb) {
          setUsernameValidation({ status: 'taken', message: `Username @${cleanUsernameLive} is already taken in database` });
        } else {
          setUsernameValidation({ status: 'available', message: `Username @${cleanUsernameLive} is available` });
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [cleanUsernameLive, currentUser.id]);

  // Async email validation effect
  useEffect(() => {
    if (!cleanEmailLive) {
      setEmailValidation({ status: 'idle', message: '' });
      return;
    }
    if (!cleanEmailLive.includes('@') || !cleanEmailLive.includes('.')) {
      setEmailValidation({ status: 'invalid', message: 'Please enter a valid email ID' });
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      // Check Supabase DB
      const existsInDb = await supabaseService.checkEmailExists(cleanEmailLive, currentUser.id);
      if (isMounted) {
        if (existsInDb) {
          setEmailValidation({ status: 'taken', message: `Email '${cleanEmailLive}' is already registered in database` });
        } else {
          setEmailValidation({ status: 'available', message: 'Email ID is available' });
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [cleanEmailLive, currentUser.id]);

  const handleEditProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (!displayName.trim()) {
      setError('Please provide a Display Name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid Email address.');
      return;
    }

    if (!password.trim() || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (usernameValidation.status === 'taken') {
      setError(`Username @${cleanUsername} is already taken by another account.`);
      return;
    }

    if (emailValidation.status === 'taken') {
      setError(`Email '${email.trim()}' is already registered to another account.`);
      return;
    }

    // Double check database uniqueness
    const usernameDbTaken = await supabaseService.checkUsernameExists(cleanUsername, currentUser.id);
    if (usernameDbTaken) {
      setError(`Username @${cleanUsername} is already registered in the database.`);
      return;
    }

    const emailDbTaken = await supabaseService.checkEmailExists(email.trim(), currentUser.id);
    if (emailDbTaken) {
      setError(`Email '${email.trim()}' is already registered in the database.`);
      return;
    }

    const updatedProfile: UserProfile = {
      ...currentUser,
      profileId: currentUser.profileId || `PID-${Math.floor(100000 + Math.random() * 900000)}`,
      username: cleanUsername,
      displayName: displayName.trim(),
      email: email.trim(),
      badge: badge.trim(),
      password: password.trim(),
      isRegistered: true,
      isAdmin,
    };

    const saveRes = await supabaseService.saveProfile(updatedProfile);
    if (!saveRes.success) {
      setError(saveRes.error || 'Failed to update profile in database.');
      return;
    }

    onSaveProfile(updatedProfile, 'update');
    setIsEditingProfile(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long (letters, numbers, underscores).');
      return;
    }

    if (!displayName.trim()) {
      setError('Please provide a Display Name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email ID.');
      return;
    }

    if (!password.trim() || password.length < 4) {
      setError('Please set a password (at least 4 characters) to secure your profile.');
      return;
    }

    if (usernameValidation.status === 'taken') {
      setError(`Username @${cleanUsername} is already registered. Please choose a unique username or sign in.`);
      return;
    }

    if (emailValidation.status === 'taken') {
      setError(`Email '${email.trim()}' is already registered to another account. Please use a unique email ID or sign in.`);
      return;
    }

    // Double check database uniqueness
    const usernameDbTaken = await supabaseService.checkUsernameExists(cleanUsername, currentUser.id);
    if (usernameDbTaken) {
      setError(`Username @${cleanUsername} is already registered in the database. Please choose another username or sign in.`);
      return;
    }

    const emailDbTaken = await supabaseService.checkEmailExists(email.trim(), currentUser.id);
    if (emailDbTaken) {
      setError(`Email '${email.trim()}' is already registered in the database. Please sign in or use another email.`);
      return;
    }

    const isDevAccount =
      cleanUsername === 'muhammedrafii2002' ||
      email.trim().toLowerCase() === 'muhammedrafii2002@gmail.com';

    const updatedProfile: UserProfile = {
      ...currentUser,
      profileId: isDevAccount ? 'PID-DEV202601' : `PID-${Math.floor(100000 + Math.random() * 900000)}`,
      username: cleanUsername,
      displayName: displayName.trim(),
      email: email.trim(),
      password: password.trim(),
      badge: isDevAccount ? '⚡ Lead Developer & Admin' : (badge.trim() || '🎓 Campus Member'),
      isRegistered: true,
      isAdmin: isDevAccount ? true : false,
    };

    // Save directly to Supabase DB
    const saveRes = await supabaseService.saveProfile(updatedProfile);
    if (!saveRes.success) {
      setError(saveRes.error || 'Failed to register account in database.');
      return;
    }

    onSaveProfile(updatedProfile, 'register');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = loginIdentifier.trim();

    if (!rawInput) {
      setError('Please enter your username or email.');
      return;
    }

    if (!loginPassword.trim()) {
      setError('Please enter your profile password.');
      return;
    }

    // Authenticate strictly against Supabase DB
    const foundProfile: UserProfile | null = await supabaseService.authenticateUser(rawInput, loginPassword.trim());

    if (foundProfile) {
      onSaveProfile(foundProfile, 'login');
    } else {
      setError('Account not found in Supabase database or password incorrect. Please create a new profile or check your credentials.');
      return;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-slate-800 my-auto max-h-[85vh] sm:max-h-[90vh] flex flex-col">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-5 py-4 text-white relative shrink-0 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                  Registration / Login
                </h2>
                <p className="text-[11px] text-orange-100 mt-0.5">
                  {requiredForAction
                    ? `Set up profile to ${requiredForAction}`
                    : 'Interact in rooms, post updates, and chat privately'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0"
              title="Close window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Auth Tab Toggle */}
          {!currentUser.isRegistered && (
            <div className="mt-3 flex bg-black/20 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setAuthTab('create');
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  authTab === 'create' ? 'bg-white text-orange-600 shadow-xs' : 'text-orange-100 hover:text-white'
                }`}
              >
                Create Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setAuthTab('login');
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  authTab === 'login' ? 'bg-white text-orange-600 shadow-xs' : 'text-orange-100 hover:text-white'
                }`}
              >
                Sign In with Password
              </button>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {requiredForAction && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium">
                Browsing is open to all visitors, but you must set up your profile/password to <span className="font-bold">{requiredForAction}</span>.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl p-3 font-medium">
              {error}
            </div>
          )}

          {/* If already logged in / registered */}
          {currentUser.isRegistered ? (
            isEditingProfile ? (
              /* EDIT PROFILE FORM */
              <form onSubmit={handleEditProfileSave} className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Edit Profile Details</h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold"
                  >
                    Cancel
                  </button>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setError('');
                      setDisplayName(e.target.value);
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username (@handle)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setError('');
                        setUsername(e.target.value);
                      }}
                      className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition"
                    />
                  </div>
                </div>

                {/* Badge / Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Badge / Tag (e.g., 🎓 BSc Physics, ⚡ Tech Lead)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address (Private)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setError('');
                      setEmail(e.target.value);
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setError('');
                        setPassword(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 font-black flex items-center justify-center text-base border border-orange-500/20">
                      @{currentUser.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                        <span>@{currentUser.username}</span>
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{currentUser.displayName}</p>
                      {currentUser.badge && (
                        <p className="text-[10px] text-orange-600 font-bold mt-0.5">{currentUser.badge}</p>
                      )}
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200/80 rounded-md text-[10px] font-mono font-bold text-slate-700">
                        <span>Profile ID:</span>
                        <span className="text-orange-700">{currentUser.profileId || `PID-${Math.floor(100000 + Math.random() * 900000)}`}</span>
                      </div>
                    </div>
                  </div>

                  {currentUser.isAdmin && (
                    <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 font-bold text-[10px] border border-purple-200">
                      Admin
                    </span>
                  )}
                </div>

                {/* Developer Dashboard Shortcut for Admin/Developer */}
                {currentUser.isAdmin && onOpenAdminPanel && (
                  <div className="bg-purple-900/90 text-white rounded-2xl p-4 border border-purple-700 shadow-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-300" />
                        <span className="font-extrabold text-xs text-purple-100">Lead Developer & Admin Authorized</span>
                      </div>
                      <span className="px-2 py-0.5 bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[9px] font-black rounded uppercase">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-200/80 leading-relaxed">
                      You have full universal admin access. Access system reports, room deletion approvals, and live content controls.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAdminPanel();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-xs font-black shadow-md transition transform active:scale-95 border border-purple-400"
                    >
                      <Shield className="w-4 h-4 fill-white/20" />
                      <span>⚡ Launch Developer Dashboard</span>
                    </button>
                  </div>
                )}

                {/* Privacy Shield Info */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Profile Protected & Password Secured</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    You can browse feed and rooms freely. All your posts and chat messages are synced under @{currentUser.username}.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-200 rounded-xl text-xs font-extrabold transition"
                  >
                    <span>✏️ Edit Profile</span>
                  </button>

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        onClose();
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition ml-auto"
                  >
                    Done
                  </button>
                </div>
              </div>
            )
          ) : authTab === 'create' ? (
            /* CREATE PROFILE FORM */
            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Public Handle & Private Password</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Only your handle <strong className="text-slate-800">@{username || 'username'}</strong> is visible to other users.
                </p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username / Public Handle <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setError('');
                      setUsername(e.target.value);
                    }}
                    placeholder="arjun_bsc"
                    className={`w-full pl-8 pr-4 py-2 bg-slate-50 border rounded-xl text-xs font-medium focus:ring-2 outline-none transition ${
                      usernameValidation.status === 'taken'
                        ? 'border-red-400 focus:ring-red-400'
                        : usernameValidation.status === 'available'
                        ? 'border-emerald-400 focus:ring-emerald-400'
                        : 'border-slate-300 focus:ring-orange-500'
                    }`}
                  />
                </div>
                {usernameValidation.status === 'taken' && (
                  <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{usernameValidation.message}</span>
                  </p>
                )}
                {usernameValidation.status === 'available' && (
                  <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{usernameValidation.message}</span>
                  </p>
                )}
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setError('');
                    setDisplayName(e.target.value);
                  }}
                  placeholder="Arjun K. (BSc Physics)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span> (Private)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setError('');
                    setEmail(e.target.value);
                  }}
                  placeholder="user@college.edu"
                  className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-medium focus:ring-2 outline-none transition ${
                    emailValidation.status === 'taken'
                      ? 'border-red-400 focus:ring-red-400'
                      : emailValidation.status === 'available'
                      ? 'border-emerald-400 focus:ring-emerald-400'
                      : 'border-slate-300 focus:ring-orange-500'
                  }`}
                />
                {emailValidation.status === 'taken' && (
                  <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{emailValidation.message}</span>
                  </p>
                )}
                {emailValidation.status === 'available' && (
                  <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{emailValidation.message}</span>
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Set Profile Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setError('');
                      setPassword(e.target.value);
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Use this password to log back in from any browser or device.
                </p>
              </div>

              {/* Submit button */}
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 active:scale-95 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Create Profile & Continue</span>
                </button>
              </div>
            </form>
          ) : (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username or Email
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => {
                    setError('');
                    setLoginIdentifier(e.target.value);
                  }}
                  placeholder="@arjun_bsc or user@college.edu"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Profile Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => {
                      setError('');
                      setLoginPassword(e.target.value);
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 active:scale-95 transition"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
