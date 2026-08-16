import React, { useState } from 'react';
import { FeedPost, PostCategory, CollegeInfo, UserProfile } from '../types';
import { Radio, Image as ImageIcon, MapPin, X, Check, Sparkles, AlertTriangle } from 'lucide-react';

interface CreatePostModalProps {
  currentCollege: CollegeInfo;
  currentUser: UserProfile;
  onClose: () => void;
  onCreatePost: (post: FeedPost) => void;
}

const CATEGORIES: Array<{ id: PostCategory; label: string; icon: string }> = [
  { id: 'fest', label: 'Fest & Event', icon: '🎉' },
  { id: 'weather', label: 'Rain / Weather', icon: '🌧️' },
  { id: 'traffic', label: 'Traffic / Delay', icon: '🚍' },
  { id: 'incident', label: 'Incident / News', icon: '🚨' },
  { id: 'general', label: 'General Update', icon: '📢' },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  currentCollege,
  currentUser,
  onClose,
  onCreatePost,
}) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('fest');
  const [locationName, setLocationName] = useState(currentCollege.area || currentCollege.name);
  const [mediaUrl, setMediaUrl] = useState('');
  const [error, setError] = useState('');

  const SAMPLE_IMAGES = [
    { label: '🎉 Stage / Concert', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80' },
    { label: '🍛 Canteen / Food', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80' },
    { label: '🌧️ Rain / Gate', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write what is happening right now.');
      return;
    }

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      collegeId: currentCollege.id,
      authorUsername: currentUser.username,
      authorDisplayName: currentUser.displayName,
      authorBadge: currentUser.badge || '⚡ Local Witness',
      content: content.trim(),
      mediaUrl: mediaUrl.trim() || undefined,
      mediaType: mediaUrl.trim() ? 'image' : undefined,
      locationName: locationName.trim() || currentCollege.name,
      category,
      verificationStatus: 'verified',
      timestamp: new Date().toISOString(),
      upvotes: 1,
      upvoters: [currentUser.username],
      commentsCount: 0,
    };

    onCreatePost(newPost);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-orange-400 animate-pulse" />
            <div>
              <h2 className="text-base font-bold">Post Real-Time Update</h2>
              <p className="text-xs text-slate-400">Share what is happening right now</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 font-medium">
              {error}
            </div>
          )}

          {/* Author Badge */}
          <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-600 font-medium">Posting as:</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="text-orange-600">@{currentUser.username}</span>
              <span className="text-slate-400">({currentUser.displayName})</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Event Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition text-left ${
                    category === cat.id
                      ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Post Content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              What is happening right now? <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => {
                setError('');
                setContent(e.target.value);
              }}
              placeholder="e.g., Heavy rain near main bus stop! Or: Pro show sound check starting at main quadrangle stage..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Location Spot
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Main Gate / Canteen Ground"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Media URL Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Photo / Media URL (Optional)
            </label>
            <div className="relative mb-2">
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none"
              />
            </div>

            {/* Quick Attach Samples */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-medium">Quick sample photo:</span>
              {SAMPLE_IMAGES.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMediaUrl(img.url)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] rounded-lg font-semibold transition"
                >
                  {img.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
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
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition"
            >
              <Check className="w-4 h-4" />
              <span>Broadcast Live Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
