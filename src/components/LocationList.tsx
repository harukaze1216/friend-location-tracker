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
  onTimeFilter,
  onUserFilter,
  onDelete 
}) => {
  const uniqueTimes = Array.from(new Set(locations.map(loc => loc.time))).sort();
  const uniqueUsers = Array.from(new Set(locations.map(loc => ({ id: loc.userId, name: loc.userDisplayName })))).sort((a, b) => a.name.localeCompare(b.name));
  
  let filteredLocations = locations;
  if (selectedTime) {
    filteredLocations = filteredLocations.filter(loc => loc.time === selectedTime);
  }
  if (selectedUser) {
    filteredLocations = filteredLocations.filter(loc => loc.userId === selectedUser);
  }

  return (
    <div className="w-full">
      <div className="mb-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">時間でフィルタ</label>
          <select
            value={selectedTime || ''}
            onChange={(e) => onTimeFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">すべての時間</option>
            {uniqueTimes.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">ユーザーでフィルタ</label>
          <select
            value={selectedUser || ''}
            onChange={(e) => onUserFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">すべてのユーザー</option>
            {uniqueUsers.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold">登録済み位置情報</h3>
        {filteredLocations.length === 0 ? (
          <p className="text-gray-500">位置情報がありません</p>
        ) : (
          filteredLocations.map(location => (
            <div key={location.id} className="border border-gray-200 rounded p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold">{location.friendName}</h4>
                  <p className="text-sm text-gray-600">時間: {location.time}</p>
                  <p className="text-sm text-blue-600">登録者: {location.userDisplayName}</p>
                  <p className="text-xs text-gray-500">
                    座標: ({Math.round(location.x)}, {Math.round(location.y)})
                  </p>
                  {location.description && (
                    <p className="text-sm mt-1">{location.description}</p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(location.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LocationList;