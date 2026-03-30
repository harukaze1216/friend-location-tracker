import React from 'react';
import { UserLocation, UserProfile } from '../types';

interface LocationDetailModalProps {
  userLocation: UserLocation;
  userProfile?: UserProfile;
  isCurrentUser: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  userLocation,
  userProfile,
  isCurrentUser,
  onEdit,
  onDelete,
  onClose
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const isPast = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const locationDate = new Date(userLocation.date + 'T00:00:00');
    const todayDate = new Date(today + 'T00:00:00');

    if (locationDate < todayDate) return true;
    if (locationDate > todayDate) return false;

    if (locationDate.getTime() === todayDate.getTime()) {
      if (userLocation.locationType === 'scheduled' && userLocation.endTime) {
        return userLocation.endTime < currentTime;
      } else {
        const [hours, minutes] = userLocation.time.split(':').map(Number);
        const locationMinutes = hours * 60 + minutes;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        return (currentMinutes - locationMinutes) > 120;
      }
    }

    return false;
  };

  const isExpired = isPast();

  return (
    <div className="fixed inset-0 glass-dark flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-3">
              {userProfile?.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.displayName}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white font-bold text-lg ring-2 ring-slate-100">
                  {userProfile?.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {userProfile?.displayName || 'Unknown User'}
                </h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    userLocation.locationType === 'scheduled'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {userLocation.locationType === 'scheduled' ? '予定地' : '現在地'}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      自分
                    </span>
                  )}
                  {isExpired && (
                    <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      終了
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-600 text-xs uppercase tracking-wide mb-2">日時</h3>
              <div className="space-y-1">
                <p className="text-sm text-slate-800">
                  <span className="text-slate-500">日付</span> {formatDate(userLocation.date)}
                </p>
                <p className="text-sm text-slate-800">
                  <span className="text-slate-500">開始</span> {userLocation.time}
                </p>
                {userLocation.endTime && (
                  <p className="text-sm text-slate-800">
                    <span className="text-slate-500">終了</span> {userLocation.endTime}
                  </p>
                )}
              </div>
            </div>

            {userLocation.location && (
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-semibold text-slate-600 text-xs uppercase tracking-wide mb-2">場所</h3>
                <p className="text-sm text-slate-800">{userLocation.location}</p>
              </div>
            )}

            {userLocation.comment && (
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-semibold text-slate-600 text-xs uppercase tracking-wide mb-2">コメント</h3>
                <p className="text-sm text-slate-800">{userLocation.comment}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {isCurrentUser ? (
              <>
                <button
                  onClick={onEdit}
                  className="flex-1 py-3 px-4 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors text-sm"
                >
                  編集
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('この予定を削除しますか？')) {
                      onDelete();
                    }
                  }}
                  className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors text-sm"
                >
                  削除
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm"
              >
                閉じる
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDetailModal;
