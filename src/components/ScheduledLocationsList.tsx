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
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.time.localeCompare(b.time);
    });

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
    <div className="fixed inset-0 glass-dark flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">予定地一覧</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              全体 {scheduledLocations.length}件 / 自分 {scheduledLocations.filter(l => l.userId === currentUserId).length}件
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {Object.keys(groupedByDate).length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <p className="text-sm">予定地が登録されていません</p>
              <p className="text-xs mt-1">地図をクリックして予定地を登録してください</p>
            </div>
          ) : (
            Object.entries(groupedByDate).map(([date, locations]) => (
              <div key={date} className="mb-6 last:mb-0">
                <h3 className="text-sm font-bold text-slate-600 mb-3 pb-2 border-b border-slate-100">
                  {formatDate(date)}
                </h3>
                <div className="space-y-2">
                  {locations.map((location) => {
                    const profile = userProfiles[location.userId];
                    const isCurrentUser = location.userId === currentUserId;
                    const isExpired = isPast(location);

                    return (
                      <div
                        key={location.id}
                        className={`bg-slate-50 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-100 border-l-3 ${
                          isCurrentUser ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-slate-200'
                        } ${isExpired ? 'opacity-50' : ''}`}
                        onClick={() => onLocationClick(location)}
                      >
                        <div className="flex items-start gap-3">
                          {profile?.avatarUrl ? (
                            <img
                              src={profile.avatarUrl}
                              alt={profile.displayName}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white">
                              {profile?.displayName?.charAt(0) || 'U'}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="font-semibold text-sm text-slate-800">
                                {profile?.displayName || 'Unknown User'}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] font-medium bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md">
                                  自分
                                </span>
                              )}
                              {isExpired && (
                                <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                                  終了
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-500 mb-1">
                              {location.time}
                              {location.endTime && ` - ${location.endTime}`}
                            </div>

                            {location.location && (
                              <div className="text-xs text-indigo-500 mb-1">
                                {location.location}
                              </div>
                            )}

                            {location.comment && (
                              <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 mt-1">
                                {location.comment}
                              </div>
                            )}
                          </div>

                          <svg className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduledLocationsList;
