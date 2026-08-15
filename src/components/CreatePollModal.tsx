import React, { useState } from 'react';
import { X, BarChart2, Plus, Trash2, Sparkles } from 'lucide-react';
import { PollData } from '../types';

interface CreatePollModalProps {
  onClose: () => void;
  onCreatePoll: (question: string, options: string[], isAnonymous: boolean) => void;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  onClose,
  onCreatePoll,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOptionField = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const removeOptionField = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2) {
      alert('Please enter a question and at least 2 poll options.');
      return;
    }

    onCreatePoll(question.trim(), validOptions, isAnonymous);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 shrink-0 sticky top-0 z-10 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Create Campus Live Poll
              </h3>
              <p className="text-xs text-slate-500">
                Students love voting! Get instant real-time feedback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Question */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Poll Question
            </label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Is today's canteen biryani worth ₹70?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm text-slate-900 placeholder-slate-400 font-medium"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Poll Options (min 2)
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  required={idx < 2}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1} (e.g. ${
                    idx === 0 ? '🔥 Worth it!' : idx === 1 ? '👎 Overpriced' : 'Option'
                  })`}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-purple-500"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOptionField(idx)}
                    className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {options.length < 5 && (
              <button
                type="button"
                onClick={addOptionField}
                className="text-xs font-bold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 pt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add another option</span>
              </button>
            )}
          </div>

          {/* Anonymous toggle */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <label htmlFor="poll-anon" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
              <span>🕵️ Create Anonymously</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (Hide your student name)
              </span>
            </label>
            <input
              id="poll-anon"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 font-medium text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition"
            >
              📊 Launch Campus Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
