import React from 'react';
import { X, Radio, Zap, Shield, MessageSquare, Lock, Globe, Cpu, Users } from 'lucide-react';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContactUs?: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({
  isOpen,
  onClose,
  onOpenContactUs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">
                  About Spikes
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Real-time discussions, spikes & decentralized community network
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
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
              <Zap className="w-4 h-4 text-orange-500" />
              What is Spikes?
            </h4>
            <p className="text-slate-600 text-xs sm:text-[13px]">
              <strong>Spikes</strong> is a modern, high-speed real-time platform designed for instant local discussions, live updates, decentralized room chats, and interactive polls.
            </p>
          </div>

          {/* Key Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2 text-orange-600 font-bold text-xs">
                <MessageSquare className="w-4 h-4" />
                <span>Live Spikes & Rooms</span>
              </div>
              <p className="text-[12px] text-slate-500 leading-normal">
                Join active public rooms or create secure invite-only private rooms with customized moderation.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <Cpu className="w-4 h-4" />
                <span>Instant Multi-Tab Sync</span>
              </div>
              <p className="text-[12px] text-slate-500 leading-normal">
                Sub-second message broadcast engine backed by persistent real-time database channels.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2 text-purple-600 font-bold text-xs">
                <Lock className="w-4 h-4" />
                <span>Secure Privacy</span>
              </div>
              <p className="text-[12px] text-slate-500 leading-normal">
                Guest privacy protection, encrypted invite codes, and fine-grained room administrator controls.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                <Users className="w-4 h-4" />
                <span>Direct Messaging</span>
              </div>
              <p className="text-[12px] text-slate-500 leading-normal">
                Connect one-on-one with other registered members with real-time notifications.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              Community Safety & Clean Experience
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Every room features real-time keyword moderation, granular kick & admin privilege controls, and direct report pipelines.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 text-center sm:text-left flex items-center gap-1">
            <span>Powered with</span>
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400 inline" />
            <span>by Muhammed Rafi</span>
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenContactUs && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenContactUs();
                }}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs border border-orange-200 transition cursor-pointer"
              >
                Contact Developer
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
