import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, FileText, CheckCircle2, UserCheck, Shield } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">
                  Privacy Policy
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  Verified Safe
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Transparent data practices & privacy protections on Spikes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1.5 text-emerald-950">
            <h4 className="font-extrabold flex items-center gap-1.5 text-sm text-emerald-900">
              <Shield className="w-4 h-4 text-emerald-600" />
              Our Commitment to User Privacy
            </h4>
            <p className="text-xs sm:text-[13px] text-emerald-800/90 leading-relaxed">
              Spikes is built specifically for open, safe, and respectful real-time communication. We do not sell your personal information, inject third-party ad trackers, or profile your activity.
            </p>
          </div>

          {/* Privacy Pillars */}
          <div className="space-y-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                <span>1. Public vs. Private Discussion Rooms</span>
              </div>
              <p className="text-[12px] text-slate-500 leading-normal">
                Public rooms and live broadcasts are open to community members. Private rooms are strictly restricted to members who possess the unique 6-character access code or invite link.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                <EyeOff className="w-4 h-4 text-blue-600 shrink-0" />
                <span>2. Direct Messages & User Safety</span>
              </div>
              <p className="text-[12px] text-slate-500 leading-normal">
                Direct messages (DMs) are private between conversation partners. You can block or report disruptive participants at any time. Room creators and moderators can kick abusive users from live rooms.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                <span>3. Data Storage & Real-Time Sync</span>
              </div>
              <p className="text-[12px] text-slate-500 leading-normal">
                Messages, room logs, and live interactions are transmitted across encrypted real-time channels and stored locally and securely in cloud-backed state stores for reliable synchronization.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>4. User Control & Deletion Requests</span>
              </div>
              <p className="text-[12px] text-slate-500 leading-normal">
                Users maintain control over their content. Room creators can request deletion of rooms they host to free up room slots, delete their own posts, or update their profile handle at will.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-[11px] text-slate-400 font-medium">
            Last Updated: August 2026
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
