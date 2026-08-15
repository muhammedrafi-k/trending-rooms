import React, { useState, useEffect } from 'react';
import { X, User, Shield, MessageSquare, School, Calendar, CheckCircle2, AlertCircle, Sparkles, Hash } from 'lucide-react';
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
  const [profile, setProfile] = useState<UserProfile | null>(cachedUser || null);
  const [loading, setLoading] = useState<boolean>(!cachedUser);
  const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

  useEffect(() => {
    let isMounted = true;
    async function loadUserProfile() {
      if (cachedUser && cachedUser.username.toLowerCase() === cleanUsername) {
        setProfile(cachedUser);
        setLoading(false);
        return;
      }
      setLoading(true);
      const user = await supabaseService.getProfileByUsername(cleanUsername);
      if (isMounted) {
        setProfile(user);
        setLoading(false);
      }
    }
    loadUserProfile();
    return () => {
      isMounted = false;
    };
  }, [cleanUsername, cachedUser]);

  const isSelf = currentUser.username.toLowerCase() === cleanUsername;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-slate-100 my-auto">
        {/* Header Background */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white text-orange-600 font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/40 shrink-0 uppercase">
              {profile ? profile.displayName.charAt(0) : cleanUsername.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-black text-white truncate">
                {profile ? profile.displayName : `@${cleanUsername}`}
              </h3>
              <p className="text-xs text-orange-100 font-mono">@{cleanUsername}</p>
              {profile?.badge && (
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  {profile.badge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading member details from database...
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
                    className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Direct Message @{profile.username}</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">
                  Guest / Anonymous Student
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  The user <span className="text-orange-400 font-bold">@{cleanUsername}</span> has not created or registered a permanent profile yet or is participating anonymously.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
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
