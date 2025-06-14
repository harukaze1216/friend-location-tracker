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
        return (currentMinutes - locationMinutes) > 120; // 現在地は2時間後に過去扱い
      }
    }
    
    return false;
  };

  const isExpired = isPast();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* ヘッダー */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              {userProfile?.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold border-2 border-gray-200">
                  {userProfile?.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {userProfile?.displayName || 'Unknown User'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    userLocation.locationType === 'scheduled' 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {userLocation.locationType === 'scheduled' ? '📅 予定地' : '📍 現在地'}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      自分
                    </span>
                  )}
                  {isExpired && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                      終了
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* 詳細情報 */}
          <div className="space-y-4">
            {/* 日付・時間 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">📅 日時</h3>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">日付:</span> {formatDate(userLocation.date)}
                </p>
                <p className="text-sm">
                  <span className="font-medium">開始:</span> {userLocation.time}
                </p>
                {userLocation.endTime && (
                  <p className="text-sm">
                    <span className="font-medium">終了:</span> {userLocation.endTime}
                  </p>
                )}
              </div>
            </div>

            {/* 場所 */}
            {userLocation.location && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">📍 場所</h3>
                <p className="text-sm">{userLocation.location}</p>
              </div>
            )}

            {/* コメント */}
            {userLocation.comment && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">💬 コメント</h3>
                <p className="text-sm">{userLocation.comment}</p>
              </div>
            )}

            {/* 座標情報 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">🗺️ 座標</h3>
              <p className="text-sm text-gray-600">
                X: {Math.round(userLocation.x)}, Y: {Math.round(userLocation.y)}
              </p>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3 mt-6">
            {isCurrentUser ? (
              <>
                <button
                  onClick={onEdit}
                  className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  ✏️ 編集
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('この予定を削除しますか？')) {
                      onDelete();
                    }
                  }}
                  className="flex-1 py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  🗑️ 削除
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
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