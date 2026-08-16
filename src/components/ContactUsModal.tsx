import React, { useState } from 'react';
import { X, MessageSquare, Mail, Shield, Send, CheckCircle2, User, ExternalLink, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onStartChatWithDeveloper: () => void;
  onSendDirectFeedback?: (message: string) => void;
}

export const ContactUsModal: React.FC<ContactUsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onStartChatWithDeveloper,
  onSendDirectFeedback,
}) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    if (onSendDirectFeedback) {
      onSendDirectFeedback(feedbackText.trim());
    }
    setIsSent(true);
    setTimeout(() => {
      setFeedbackText('');
      setIsSent(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg tracking-tight">
                Contact & Developer Support
              </h3>
              <p className="text-xs text-slate-500">
                Connect directly with the creator of Spikes
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

        {/* Developer Profile Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 rounded-2xl text-white shadow-lg space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md border-2 border-white/20">
                MR
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-white text-base">Muhammed Rafi</h4>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-[10px] font-black border border-purple-400/40">
                    Lead Developer
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono">@muhammedrafii2002</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Have questions, feedback, feature requests, or encountered an issue? Chat directly with the developer or drop an instant note.
          </p>

          <div className="pt-2 border-t border-slate-700/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartChatWithDeveloper();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat with Developer</span>
            </button>

            <a
              href="mailto:muhammedrafi042002@gmail.com"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Mail className="w-4 h-4 text-orange-400" />
              <span>Email Support</span>
            </a>
          </div>
        </div>

        {/* Quick Message Form */}
        <form onSubmit={handleSubmitFeedback} className="space-y-3 pt-1">
          <label className="block text-xs font-bold text-slate-700">
            Send Quick Note / Feedback
          </label>
          <textarea
            rows={3}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Type your message, suggestion, or bug report here..."
            className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs text-slate-800 placeholder-slate-400 resize-none font-medium"
          />

          {isSent && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Message sent to developer successfully!</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 font-medium text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!feedbackText.trim() || isSent}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
