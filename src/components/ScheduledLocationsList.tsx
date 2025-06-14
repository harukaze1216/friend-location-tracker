import React from 'react';
import { UserLocation, UserProfile } from '../types';

interface ScheduledLocationsListProps {
  userLocations: UserLocation[];
  userProfiles: { [uid: string]: UserProfile };
  currentUserId?: string;
  onLocationClick: (userLocation: UserLocation) => void;
  onLocationDelete: (userLocation: UserLocation) => void;
  onClose: () => void;
}

const ScheduledLocationsList: React.FC<ScheduledLocationsListProps> = ({
  userLocations,
  userProfiles,
  currentUserId,
  onLocationClick,
  onLocationDelete,
  onClose
}) => {
  const scheduledLocations = userLocations
    .filter(ul => ul.locationType === 'scheduled')
    .sort((a, b) => {
      // 日付順、時間順でソート
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.time.localeCompare(b.time);
    });

  // 日付でグループ化
  const groupedByDate = scheduledLocations.reduce((groups, location) => {
    const date = location.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(location);
    return groups;
  }, {} as { [date: string]: UserLocation[] });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const isPast = (location: UserLocation) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const locationDate = new Date(location.date + 'T00:00:00');
    const todayDate = new Date(today + 'T00:00:00');
    
    if (locationDate < todayDate) return true;
    if (locationDate > todayDate) return false;
    
    if (locationDate.getTime() === todayDate.getTime()) {
      const endTime = location.endTime || location.time;
      return endTime < currentTime;
    }
    
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">📅 予定地一覧</h2>
            <p className="text-sm text-gray-500 mt-1">
              全体: {scheduledLocations.length}件 | 自分: {scheduledLocations.filter(l => l.userId === currentUserId).length}件
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {Object.keys(groupedByDate).length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>予定地が登録されていません</p>
              <p className="text-sm mt-2">地図をクリックして予定地を登録してください</p>
            </div>
          ) : (
            Object.entries(groupedByDate).map(([date, locations]) => (
              <div key={date} className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                  {formatDate(date)}
                </h3>
                <div className="space-y-3">
                  {locations.map((location) => {
                    const profile = userProfiles[location.userId];
                    const isCurrentUser = location.userId === currentUserId;
                    const isExpired = isPast(location);
                    
                    return (
                      <div
                        key={location.id}
                        className={`bg-gray-50 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-gray-100 border-l-4 ${
                          isCurrentUser ? 'border-orange-400' : 'border-gray-300'
                        } ${isExpired ? 'opacity-50' : 'opacity-100'}`}
                        onClick={() => onLocationClick(location)}
                      >
                        <div className="flex items-start gap-3">
                          {profile?.avatarUrl ? (
                            <img
                              src={profile.avatarUrl}
                              alt={profile.displayName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200">
                              {profile?.displayName?.charAt(0) || 'U'}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-800">
                                {profile?.displayName || 'Unknown User'}
                              </span>
                              {isCurrentUser && (
                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                                  自分
                                </span>
                              )}
                              {isExpired && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                                  終了
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-2">
                              🕐 {location.time}
                              {location.endTime && ` - ${location.endTime}`}
                            </div>
                            
                            {location.location && (
                              <div className="text-sm text-blue-600 mb-2">
                                📍 {location.location}
                              </div>
                            )}
                            
                            {location.comment && (
                              <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                                {location.comment}
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-400 mt-2">
                              📍 座標: ({Math.round(location.x)}, {Math.round(location.y)})
                            </div>
                          </div>
                          
                          <div className="text-blue-500 text-sm">
                            詳細 →
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduledLocationsList;