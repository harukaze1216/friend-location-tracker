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
      <div className="space-y-2">
        <h3 className="text-md font-bold">登録済み位置情報 ({filteredLocations.length}件)</h3>
        {filteredLocations.length === 0 ? (
          <p className="text-gray-500">位置情報がありません</p>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredLocations.map(location => (
              <div key={location.id} className="border border-gray-200 rounded p-2 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{location.friendName}</span>
                      <span className="text-xs text-gray-500">{location.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>登録者: {location.userDisplayName}</span>
                      {location.description && (
                        <span className="truncate">• {location.description}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(location.id)}
                    className="text-red-500 hover:text-red-700 text-xs ml-2 flex-shrink-0"
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