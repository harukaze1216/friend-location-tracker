import React from 'react';
import { Location } from '../types';

interface LocationListProps {
  locations: Location[];
  selectedTime?: string;
  selectedUser?: string;
  onTimeFilter: (time: string) => void;
  onUserFilter: (userId: string) => void;
  onDelete: (id: string) => void;
}

const LocationList: React.FC<LocationListProps> = ({
  locations,
  selectedTime,
  selectedUser,
  onDelete
}) => {
  let filteredLocations = locations;
  if (selectedTime) {
    filteredLocations = filteredLocations.filter(loc => loc.time === selectedTime);
  }
  if (selectedUser) {
    filteredLocations = filteredLocations.filter(loc => loc.userId === selectedUser);
  }

  return (
    <div className="w-full">
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700">登録済み位置情報 ({filteredLocations.length}件)</h3>
        {filteredLocations.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">位置情報がありません</p>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredLocations.map(location => (
              <div key={location.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800">{location.friendName}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{location.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>{location.userDisplayName}</span>
                      {location.description && (
                        <span className="truncate text-slate-400">{location.description}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(location.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors ml-2 flex-shrink-0"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationList;
