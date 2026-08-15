import React, { useState } from 'react';
import { AlertTriangle, X, Check, Shield } from 'lucide-react';
import { ReportItem } from '../types';

interface ReportModalProps {
  targetType: 'room' | 'message' | 'post' | 'user';
  targetId: string;
  roomId?: string;
  reportedBy: string;
  contentPreview?: string;
  onClose: () => void;
  onSubmitReport: (report: ReportItem) => void;
}

const COMMON_REASONS = [
  'Spam / Excessive links',
  'Inappropriate or offensive language',
  'Fake news or misinformation',
  'Harassment or personal targeting',
  'Room topic no longer active / solved',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  targetType,
  targetId,
  roomId,
  reportedBy,
  contentPreview,
  onClose,
  onSubmitReport,
}) => {
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [customDetails, setCustomDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customDetails.trim()
      ? `${reason}: ${customDetails.trim()}`
      : reason;

    const report: ReportItem = {
      id: `rep-${Date.now()}`,
      targetType,
      targetId,
      roomId,
      reportedBy,
      reason: finalReason,
      timestamp: new Date().toISOString(),
      status: 'pending',
      contentPreview,
    };

    onSubmitReport(report);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] my-auto">
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            <h2 className="text-base font-bold">
              Report {targetType === 'room' ? 'Room' : targetType === 'message' ? 'Message' : 'Post'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-red-100 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Report Sent to Moderators</h3>
            <p className="text-xs text-slate-500">
              Thank you. Developer/Admin system will review this report shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {contentPreview && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 italic">
                "{contentPreview}"
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Select Reason for Flagging
              </label>
              <div className="space-y-2">
                {COMMON_REASONS.map((r, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition ${
                      reason === r
                        ? 'border-red-500 bg-red-50/50 text-red-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-red-600"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Additional Details (Optional)
              </label>
              <input
                type="text"
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                placeholder="Explain briefly..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                <Shield className="w-4 h-4" />
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
