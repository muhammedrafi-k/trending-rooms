import React, { useState, useEffect } from 'react';
import { X, UserX, MessageSquare, School, Calendar, CheckCircle2, AlertCircle, Hash, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';
import { supabaseService } from '../lib/supabaseService';

interface UserDetailsModalProps {
  username: string;
  currentUser: UserProfile;
  cachedUser?: UserProfile | null;
  onClose: () => void;
  onOpenPrivateChat?: (partnerUsername: string) => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  username,
  currentUser,
  cachedUser,
  onClose,
  onOpenPrivateChat,
}) => {
  const cleanUsername = (username || '').trim().toLowerCase().replace(/^@/, '');
  const isInvalidUsername = !cleanUsername || cleanUsername === 'anonymous' || cleanUsername === 'guest';

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (isInvalidUsername) return null;
    if (cachedUser && cachedUser.username.toLowerCase() === cleanUsername) return cachedUser;
    if (currentUser && currentUser.username.toLowerCase() === cleanUsername) return currentUser;
    if (cleanUsername === 'muhammedrafii2002') {
      return {
        id: 'dev-muhammedrafii2002',
        profileId: 'PID-DEV-001',
        username: 'muhammedrafii2002',
        displayName: 'Developer',
        email: 'muhammedrafii2002@gmail.com',
        collegeId: 'sn_cherthala',
        badge: '⚡ Lead Developer & Admin',
        isAdmin: true,
        isRegistered: true,
        createdAt: '2026-01-01T00:00:00Z',
      };
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(!profile && !isInvalidUsername);

  useEffect(() => {
    if (isInvalidUsername) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadUserProfile() {
      if (cachedUser && cachedUser.username.toLowerCase() === cleanUsername) {
        setProfile(cachedUser);
        setLoading(false);
        return;
      }
      if (currentUser && currentUser.username.toLowerCase() === cleanUsername) {
        setProfile(currentUser);
        setLoading(false);
        return;
      }
      if (cleanUsername === 'muhammedrafii2002') {
        setProfile({
          id: 'dev-muhammedrafii2002',
          profileId: 'PID-DEV-001',
          username: 'muhammedrafii2002',
          displayName: 'Developer',
          email: 'muhammedrafii2002@gmail.com',
          collegeId: 'sn_cherthala',
          badge: '⚡ Lead Developer & Admin',
          isAdmin: true,
          isRegistered: true,
          createdAt: '2026-01-01T00:00:00Z',
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      const user = await supabaseService.getProfileByUsername(cleanUsername);
      if (isMounted) {
        if (user) {
          setProfile(user);
        } else {
          // User does not exist in database. Do NOT generate fake profiles!
          setProfile(null);
        }
        setLoading(false);
      }
    }
    loadUserProfile();
    return () => {
      isMounted = false;
    };
  }, [cleanUsername, cachedUser, currentUser, isInvalidUsername]);

  const isSelf = currentUser.username.toLowerCase() === cleanUsername;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-slate-100 my-auto">
        {/* Header Background */}
        {profile ? (
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white text-orange-600 font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/40 shrink-0 uppercase">
                {profile.displayName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-black text-white truncate">
                  {profile.displayName}
                </h3>
                <p className="text-xs text-orange-100 font-mono">@{cleanUsername}</p>
                {profile.badge && (
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                    {profile.badge}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 border-b border-slate-800 p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/60 text-rose-400 border border-rose-800/60 flex items-center justify-center font-bold shrink-0">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  User Not Found
                </h3>
                <p className="text-xs text-slate-400 font-mono">@{cleanUsername || 'unknown'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Verifying user profile...
            </div>
          ) : profile ? (
            <div className="space-y-3.5">
              {/* Account Status Badge */}
              <div className="flex items-center justify-between p-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200">
                    {profile.isAdmin ? 'Campus Admin & Dev' : 'Verified Campus Student'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>

              {/* Profile Details List */}
              <div className="space-y-2 text-xs">
                {profile.profileId && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-orange-400" />
                      <span>Permanent Profile ID</span>
                    </span>
                    <span className="font-mono font-bold text-slate-200">{profile.profileId}</span>
                  </div>
                )}

                {profile.collegeId && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <School className="w-3.5 h-3.5 text-amber-400" />
                      <span>Campus</span>
                    </span>
                    <span className="font-semibold text-slate-200 uppercase">{profile.collegeId.replace(/_/g, ' ')}</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>Member Since</span>
                  </span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {profile.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Active Campus Member'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                {!isSelf && onOpenPrivateChat && (
                  <button
                    onClick={() => {
                      onOpenPrivateChat(profile.username);
                      onClose();
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Direct Message @{profile.username}</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs text-left space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-200">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>This user does not exist</span>
                </div>
                <p className="text-[11px] text-rose-300/80 leading-relaxed">
                  No registered student was found with the handle <strong className="text-white">@{cleanUsername || 'unknown'}</strong>. You cannot view profile details or initiate direct private chats with non-existent users.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
