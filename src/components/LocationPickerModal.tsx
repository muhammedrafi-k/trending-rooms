import React from 'react';
import { X, MapPin, Navigation, Check, Radio } from 'lucide-react';
import { LocationCoords } from '../types';
import { LOCATIONS } from '../data/mockRooms';

interface LocationPickerModalProps {
  currentLocation: LocationCoords;
  onSelectLocation: (loc: LocationCoords) => void;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  currentLocation,
  onSelectLocation,
  onClose,
}) => {
  const handleUseBrowserGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onSelectLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: 'My GPS Location',
            area: 'Local GPS Coords',
          });
          onClose();
        },
        (err) => {
          alert('Could not retrieve browser GPS location: ' + err.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
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
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Simulate My Location
              </h3>
              <p className="text-xs text-slate-500">
                Test witness tags & distance calculation ("📍 300m away")
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Browser GPS option */}
        <button
          onClick={handleUseBrowserGps}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs flex items-center justify-between shadow-md hover:brightness-105 transition active:scale-98"
        >
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 animate-bounce" />
            <span>Use Real Browser GPS Coordinates</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">
            GEO
          </span>
        </button>

        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center py-1">
          — Or Pick Local Kerala Presets —
        </div>

        {/* Preset Locations */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {Object.entries(LOCATIONS).map(([key, loc]) => {
            const isSelected = currentLocation.name === loc.name;
            return (
              <button
                key={key}
                onClick={() => {
                  onSelectLocation(loc);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl border text-left text-xs transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-orange-50 border-orange-500 text-orange-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-900">{loc.name}</div>
                  <div className="text-[11px] text-slate-500">{loc.area}</div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-orange-600" />}
              </button>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
};
