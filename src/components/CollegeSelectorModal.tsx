import React, { useState } from 'react';
import { X, School, Search, Check, Users, MapPin, Sparkles, Plus } from 'lucide-react';
import { CollegeInfo } from '../types';
import { COLLEGES } from '../data/mockRooms';

interface CollegeSelectorModalProps {
  currentCollege: CollegeInfo;
  onSelectCollege: (college: CollegeInfo) => void;
  onClose: () => void;
}

export const CollegeSelectorModal: React.FC<CollegeSelectorModalProps> = ({
  currentCollege,
  onSelectCollege,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [customCollegeName, setCustomCollegeName] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const filteredColleges = COLLEGES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.shortName.toLowerCase().includes(search.toLowerCase()) ||
      c.district.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddCustomCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCollegeName.trim()) return;

    const custom: CollegeInfo = {
      id: `custom_col_${Date.now()}`,
      name: customCollegeName.trim(),
      shortName: customCollegeName.trim().slice(0, 18),
      district: 'Kerala Campus',
      studentCount: 1500,
      area: 'Main Campus',
      lat: 9.9312,
      lng: 76.2673,
    };

    onSelectCollege(custom);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5 shrink-0 sticky top-0 z-10 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                <span>Select Your College Network</span>
              </h3>
              <p className="text-xs text-slate-500">
                Join campus-specific live rooms, polls & local event spikes
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

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search college (e.g., SN Cherthala, SD Alappuzha, TKM, CET)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* List of Colleges */}
          <div className="space-y-2 pr-1">
          {filteredColleges.map((col) => {
            const isSelected = currentCollege.id === col.id;
            return (
              <button
                key={col.id}
                onClick={() => {
                  onSelectCollege(col);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-orange-50/90 border-orange-500 text-orange-950 font-bold shadow-xs'
                    : 'bg-slate-50/80 border-slate-200/80 text-slate-800 hover:bg-slate-100/90'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>🎓</span>
                    <span>{col.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {col.area} ({col.district})
                    </span>
                    {col.studentCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-slate-600">
                          <Users className="w-3 h-3 text-emerald-600" />
                          {col.studentCount} users
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-orange-600 hover:underline">
                    Enter
                  </span>
                )}
              </button>
            );
          })}

          {filteredColleges.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-500 space-y-2">
              <p>No college found matching "{search}".</p>
              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="text-xs font-bold text-orange-600 hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add your College Network</span>
              </button>
            </div>
          )}
        </div>

        {/* Custom College Input form toggle */}
        {showCustomForm ? (
          <form onSubmit={handleAddCustomCollege} className="pt-2 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Add Your Campus / Institution
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={customCollegeName}
                onChange={(e) => setCustomCollegeName(e.target.value)}
                placeholder="e.g. St. Thomas College, Kozhencherry"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition shrink-0"
              >
                Join
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              onClick={() => setShowCustomForm(true)}
              className="text-[11px] font-semibold text-slate-500 hover:text-orange-600 transition inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Don't see your college? Add custom campus network</span>
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
