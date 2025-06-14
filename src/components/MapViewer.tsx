import React, { useState, useRef } from 'react';
import { Location, MapPoint, UserLocation, UserProfile } from '../types';

type MapMode = 'navigation' | 'interaction';

interface MapViewerProps {
  mapImageUrl: string;
  locations: Location[];
  userLocations: UserLocation[];
  userProfiles: { [uid: string]: UserProfile };
  currentUserId?: string;
  onMapClick: (point: MapPoint) => void;
  onUserLocationDrag?: (userLocationId: string, point: MapPoint) => void;
  onUserLocationClick?: (userLocation: UserLocation) => void;
}

const MapViewer: React.FC<MapViewerProps> = ({ 
  mapImageUrl, 
  locations, 
  userLocations,
  userProfiles,
  currentUserId,
  onMapClick,
  onUserLocationDrag,
  onUserLocationClick
}) => {
  // モバイルデバイスを検出
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  };
  
  const [scale, setScale] = useState<number>(isMobile() ? 0.7 : 1.0);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('navigation');
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleImageLoad = () => {
    console.log('Map image loaded successfully');
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error('Map image load error:', mapImageUrl);
    setImageError(true);
    setImageLoaded(false);
  };


  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // インタラクションモードの場合のみ位置登録を許可
    if (mapMode !== 'interaction') return;
    if (!containerRef.current || !imageRef.current || isDragging || hasDragged) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
    onMapClick({ x, y });
  };

  const handleUserIconMouseDown = (event: React.MouseEvent, userLocationId: string) => {
    event.stopPropagation();
    // インタラクションモードの場合のみドラッグを許可
    if (mapMode !== 'interaction') return;
    
    const userLocation = userLocations.find(ul => ul.id === userLocationId);
    if (!userLocation || userLocation.userId !== currentUserId) return; // 自分のアイコンのみドラッグ可能
    
    setIsDragging(userLocationId);
    setDragStart({ x: event.clientX, y: event.clientY });
    setHasDragged(false);
  };

  const handleUserIconTouchStart = (event: React.TouchEvent, userLocationId: string) => {
    event.stopPropagation();
    // インタラクションモードの場合のみドラッグを許可
    if (mapMode !== 'interaction') return;
    
    event.preventDefault(); // タッチ時のスクロールを防ぐ
    const userLocation = userLocations.find(ul => ul.id === userLocationId);
    if (!userLocation || userLocation.userId !== currentUserId) return;
    
    const touch = event.touches[0];
    setIsDragging(userLocationId);
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setHasDragged(false);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !containerRef.current || !imageRef.current) return;
    
    event.preventDefault();
    
    // ドラッグを検出
    const threshold = 3;
    const deltaX = Math.abs(event.clientX - dragStart.x);
    const deltaY = Math.abs(event.clientY - dragStart.y);
    
    if (deltaX > threshold || deltaY > threshold) {
      setHasDragged(true);
    }
    
    // 画像要素基準で位置を計算（スクロール位置に関係なく正確）
    const imageRect = imageRef.current.getBoundingClientRect();
    const x = (event.clientX - imageRect.left) / scale;
    const y = (event.clientY - imageRect.top) / scale;
    
    // ドラッグ中の位置を更新（カーソル位置と完全に同期）
    const marker = document.getElementById(`user-marker-${isDragging}`);
    if (marker) {
      marker.style.left = `${x * scale}px`;
      marker.style.top = `${y * scale}px`;
      marker.style.transform = 'translate(-50%, -50%)';
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    // インタラクションモード且つマーカードラッグ中の場合のみ処理
    if (mapMode !== 'interaction' || !isDragging || !dragStart || !containerRef.current || !imageRef.current) return;
    
    event.preventDefault(); // スクロールを防ぐ
    
    const touch = event.touches[0];
    if (!touch) return;
    
    // ドラッグを検出
    const threshold = 3;
    const deltaX = Math.abs(touch.clientX - dragStart.x);
    const deltaY = Math.abs(touch.clientY - dragStart.y);
    
    if (deltaX > threshold || deltaY > threshold) {
      setHasDragged(true);
    }
    
    // 画像要素基準で位置を計算（スクロール位置に関係なく正確）
    const imageRect = imageRef.current.getBoundingClientRect();
    const x = (touch.clientX - imageRect.left) / scale;
    const y = (touch.clientY - imageRect.top) / scale;
    
    // ドラッグ中の位置を更新（指の位置と完全に同期）
    const marker = document.getElementById(`user-marker-${isDragging}`);
    if (marker) {
      marker.style.left = `${x * scale}px`;
      marker.style.top = `${y * scale}px`;
      marker.style.transform = 'translate(-50%, -50%)';
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current || !imageRef.current) return;
    
    // 画像要素基準で位置を計算
    const imageRect = imageRef.current.getBoundingClientRect();
    const x = (event.clientX - imageRect.left) / scale;
    const y = (event.clientY - imageRect.top) / scale;
    
    // 実際にドラッグした場合のみ位置更新
    if (hasDragged && onUserLocationDrag && isDragging) {
      const userLocation = userLocations.find(ul => ul.id === isDragging);
      if (userLocation) {
        onUserLocationDrag(userLocation.id, { x, y });
      }
    }
    
    setIsDragging(null);
    setDragStart(null);
    
    // hasDraggedを少し遅延させてリセット（クリックイベントの後に実行）
    setTimeout(() => setHasDragged(false), 100);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    // マーカードラッグ中だった場合の処理
    if (isDragging && containerRef.current && imageRef.current) {
      event.preventDefault();
      
      const touch = event.changedTouches[0];
      if (!touch) return;
      
      // 画像要素基準で位置を計算
      const imageRect = imageRef.current.getBoundingClientRect();
      const x = (touch.clientX - imageRect.left) / scale;
      const y = (touch.clientY - imageRect.top) / scale;
      
      // 実際にドラッグした場合のみ位置更新
      if (hasDragged && onUserLocationDrag && isDragging) {
        const userLocation = userLocations.find(ul => ul.id === isDragging);
        if (userLocation) {
          onUserLocationDrag(userLocation.id, { x, y });
        }
      }
      
      setIsDragging(null);
      setDragStart(null);
      
      // hasDraggedを少し遅延させてリセット
      setTimeout(() => setHasDragged(false), 100);
    }
  };

  const handleUserIconClick = (event: React.MouseEvent, userLocation: UserLocation) => {
    event.stopPropagation();
    // インタラクションモードの場合のみクリックを許可
    if (mapMode !== 'interaction') return;
    // ドラッグ直後の場合はクリックイベントを無視
    if (hasDragged) return;
    
    if (onUserLocationClick && userLocation.userId === currentUserId) {
      onUserLocationClick(userLocation);
    }
  };

  const renderLocationMarkers = () => {
    return locations.map((location) => (
      <div
        key={location.id}
        className="absolute bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer"
        style={{
          left: `${location.x * scale}px`,
          top: `${location.y * scale}px`,
          transform: 'translate(-50%, -50%)'
        }}
        title={`${location.friendName} - ${location.time}`}
      >
        {location.friendName.charAt(0)}
      </div>
    ));
  };

  const renderCurrentLocationMarkers = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    return userLocations
      .filter(ul => ul.locationType === 'current')
      .map((userLocation) => {
      const profile = userProfiles[userLocation.userId];
      const isCurrentUser = userLocation.userId === currentUserId;
      const isDraggingThis = isDragging === userLocation.id;
      const isScheduled = false; // 現在地のみ
      
      // 現在地の時間が過ぎているかチェック（修正版）
      const isPast = (() => {
        if (!userLocation.date || !userLocation.time) {
          return false;
        }
        
        // 日付文字列をDateオブジェクトに変換して比較
        const locationDate = new Date(userLocation.date + 'T00:00:00');
        const todayDate = new Date(today + 'T00:00:00');
        
        // 今日以前の日付は過去
        if (locationDate < todayDate) {
          return true;
        }
        
        // 今日より後の日付は未来
        if (locationDate > todayDate) {
          return false;
        }
        
        // 今日で、現在時刻より2時間以上過去
        if (locationDate.getTime() === todayDate.getTime()) {
          const [hours, minutes] = userLocation.time.split(':').map(Number);
          const locationMinutes = hours * 60 + minutes;
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          return (currentMinutes - locationMinutes) > 120;
        }
        
        return false;
      })();
      
      // プロフィールが見つからない場合はデフォルトプロフィールを作成
      if (!profile) {
        console.warn('Profile not found for user:', userLocation.userId, 'using default profile');
        // デフォルトプロフィールを作成
        const defaultProfile: UserProfile = {
          uid: userLocation.userId,
          displayName: 'Unknown User',
          profileCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        // 一時的にプロフィールに追加（次回のため）
        userProfiles[userLocation.userId] = defaultProfile;
      }
      
      // 位置タイプに応じた色とアイコン
      const ringColor = isScheduled ? 'ring-orange-400' : 'ring-blue-400';
      const borderColor = isScheduled ? 'border-orange-300' : 'border-blue-300';
      
      return (
        <div
          key={userLocation.id}
          id={`user-marker-${userLocation.id}`}
          className={`absolute rounded-full cursor-pointer transition-all duration-200 hover:scale-110 ${
            isCurrentUser ? `ring-4 ${ringColor} ring-opacity-50` : ''
          } ${isDraggingThis ? 'scale-110 z-50' : 'z-40'} ${
            isPast ? 'opacity-50' : 'opacity-100'
          }`}
          style={{
            left: `${userLocation.x * scale}px`,
            top: `${userLocation.y * scale}px`,
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
          }}
          onMouseDown={(e) => handleUserIconMouseDown(e, userLocation.id)}
          onTouchStart={(e) => handleUserIconTouchStart(e, userLocation.id)}
          onClick={(e) => handleUserIconClick(e, userLocation)}
          title={`${(profile || userProfiles[userLocation.userId])?.displayName || 'Unknown'} - ${userLocation.date} ${userLocation.time}${isScheduled && userLocation.endTime ? ` - ${userLocation.endTime}` : ''}${userLocation.location ? ' @ ' + userLocation.location : ''}${userLocation.comment ? ': ' + userLocation.comment : ''}${isPast ? ' (過去)' : ''}`}
        >
          {(profile || userProfiles[userLocation.userId])?.avatarUrl ? (
            <img
              src={(profile || userProfiles[userLocation.userId])?.avatarUrl}
              alt={(profile || userProfiles[userLocation.userId])?.displayName || 'User'}
              className={`w-full h-full rounded-full object-cover border-2 shadow-lg ${borderColor}`}
              draggable={false}
            />
          ) : (
            <div className={`w-full h-full rounded-full ${
              isScheduled 
                ? 'bg-gradient-to-br from-orange-400 to-red-500' 
                : 'bg-gradient-to-br from-blue-400 to-purple-500'
            } flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg`}>
              {((profile || userProfiles[userLocation.userId])?.displayName || 'U').charAt(0)}
            </div>
          )}
          
          {/* 位置タイプアイコン */}
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white shadow-lg flex items-center justify-center text-xs">
            {isScheduled ? '📅' : '📍'}
          </div>
          
          {/* 時間表示 */}
          <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 ${
            isScheduled ? 'bg-orange-600' : 'bg-blue-600'
          } bg-opacity-90 text-white text-xs px-2 py-1 rounded whitespace-nowrap`}>
            {userLocation.time}
            {isScheduled && userLocation.endTime && ` - ${userLocation.endTime}`}
          </div>
          
          {/* 現在のユーザーを示すドラッグヒント */}
          {isCurrentUser && !isDraggingThis && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              ドラッグで移動
            </div>
          )}
        </div>
      );
    }).filter(Boolean);
  };

  const renderScheduledLocationCards = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    
    return userLocations
      .filter(ul => ul.locationType === 'scheduled')
      .map((userLocation) => {
        const profile = userProfiles[userLocation.userId];
        const isCurrentUser = userLocation.userId === currentUserId;
        
        // プロフィールが見つからない場合はデフォルトプロフィールを作成
        if (!profile) {
          console.warn('Profile not found for user:', userLocation.userId, 'using default profile');
          const defaultProfile: UserProfile = {
            uid: userLocation.userId,
            displayName: 'Unknown User',
            profileCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          userProfiles[userLocation.userId] = defaultProfile;
        }
        
        // 予定地の時間が過ぎているかチェック（修正版）
        const isPast = (() => {
          if (!userLocation.date || !userLocation.time) {
            return false;
          }
          
          // 日付文字列をDateオブジェクトに変換して比較
          const locationDate = new Date(userLocation.date + 'T00:00:00');
          const todayDate = new Date(today + 'T00:00:00');
          
          // 今日以前の日付は過去
          if (locationDate < todayDate) {
            return true;
          }
          
          // 今日より後の日付は未来
          if (locationDate > todayDate) {
            return false;
          }
          
          // 今日で、終了時間が過ぎているかチェック
          if (locationDate.getTime() === todayDate.getTime()) {
            const endTime = userLocation.endTime || userLocation.time;
            return endTime < currentTime;
          }
          
          return false;
        })();
        
        return (
          <div
            key={userLocation.id}
            className={`absolute bg-white rounded-lg shadow-md border ${
              isCurrentUser ? 'border-orange-400' : 'border-gray-200'
            } p-1.5 cursor-pointer transition-all duration-200 hover:scale-105 ${
              isPast ? 'opacity-50' : 'opacity-100'
            }`}
            style={{
              left: `${userLocation.x * scale + 20}px`,
              top: `${userLocation.y * scale - 5}px`,
              width: '80px',
              fontSize: '10px',
              zIndex: 30
            }}
            onClick={(e) => {
              e.stopPropagation();
              onUserLocationClick && onUserLocationClick(userLocation);
            }}
            title={`${(profile || userProfiles[userLocation.userId])?.displayName || 'Unknown'} - ${userLocation.date} ${userLocation.time}${userLocation.endTime ? ` - ${userLocation.endTime}` : ''}${userLocation.location ? ' @ ' + userLocation.location : ''}${userLocation.comment ? ': ' + userLocation.comment : ''}${isPast ? ' (過去)' : ''}`}
          >
            {/* アバターと時間のみ */}
            <div className="flex items-center gap-1 mb-1">
              {(profile || userProfiles[userLocation.userId])?.avatarUrl ? (
                <img
                  src={(profile || userProfiles[userLocation.userId])?.avatarUrl}
                  alt={(profile || userProfiles[userLocation.userId])?.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover border border-gray-300"
                  draggable={false}
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xs border border-gray-300">
                  {((profile || userProfiles[userLocation.userId])?.displayName || 'U').charAt(0)}
                </div>
              )}
              <div className="text-orange-500 text-xs">
                📅
              </div>
            </div>
            <div className="text-xs text-gray-700 font-medium leading-tight">
              {userLocation.time}
            </div>
            {userLocation.endTime && (
              <div className="text-xs text-gray-500 leading-tight">
                ~{userLocation.endTime}
              </div>
            )}
          </div>
        );
      })
      .filter(Boolean);
  };

  return (
    <div className="w-full">
      {/* モード切り替えUI */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMapMode('navigation')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              mapMode === 'navigation'
                ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🗺️ 地図移動
          </button>
          <button
            onClick={() => setMapMode('interaction')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              mapMode === 'interaction'
                ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📍 位置操作
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            className="px-2 py-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded shadow-sm hover:from-blue-500 hover:to-blue-600 transition-all text-xs"
          >
            縮小
          </button>
          <span className="text-xs text-gray-500">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
            className="px-2 py-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded shadow-sm hover:from-blue-500 hover:to-blue-600 transition-all text-xs"
          >
            拡大
          </button>
        </div>
      </div>
      
      {/* モード説明 */}
      <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
        {mapMode === 'navigation' ? (
          <span>🗺️ <strong>地図移動モード:</strong> 指でスクロール・ピンチズーム可能。位置登録は長押しで可能です。</span>
        ) : (
          <span>📍 <strong>位置操作モード:</strong> タップで位置登録、ドラッグでマーカー移動可能。地図の移動は無効です。</span>
        )}
      </div>

      <div 
        ref={containerRef}
        className={`relative border border-gray-300 max-h-[400px] sm:max-h-[500px] md:max-h-[600px] lg:max-h-[700px] ${
          mapMode === 'navigation' ? 'overflow-auto touch-manipulation' : 'overflow-hidden'
        }`}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={(e) => {
          // ナビゲーションモードでは長押しで位置登録を許可
          if (mapMode === 'navigation' && e.touches.length === 1) {
            const touch = e.touches[0];
            if (touch && imageRef.current) {
              const initialRect = imageRef.current.getBoundingClientRect();
              const initialX = touch.clientX;
              const initialY = touch.clientY;
              
              // 長押し判定開始（500ms）
              longPressTimeoutRef.current = setTimeout(() => {
                // 長押し実行時に再度位置を計算（より正確）
                const currentRect = imageRef.current!.getBoundingClientRect();
                const x = (initialX - currentRect.left) / scale;
                const y = (initialY - currentRect.top) / scale;
                onMapClick({ x, y });
              }, 500);
            }
          }
          
          // インタラクションモードの場合は即座にタッチでの位置登録を許可
          if (mapMode === 'interaction' && !isDragging && e.touches.length === 1) {
            e.preventDefault(); // デフォルトのタッチ動作を防ぐ
            const touch = e.touches[0];
            if (touch && imageRef.current) {
              // 画像基準で位置を計算
              const rect = imageRef.current.getBoundingClientRect();
              const x = (touch.clientX - rect.left) / scale;
              const y = (touch.clientY - rect.top) / scale;
              onMapClick({ x, y });
            }
          }
        }}
        onTouchMove={(e) => {
          // 長押し中に指が動いたらキャンセル
          if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
          
          // 通常のタッチムーブ処理
          handleTouchMove(e);
        }}
        onTouchEnd={(e) => {
          // 長押しタイマーをクリア
          if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
          
          // 通常のタッチエンド処理
          handleTouchEnd(e);
        }}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'crosshair',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          touchAction: mapMode === 'navigation' ? 'manipulation' : 'none'
        }}
      >
        {mapImageUrl && !imageError && (
          <img
            ref={imageRef}
            src={mapImageUrl}
            alt="Festival Map"
            className="block"
            style={{
              width: `${1200 * scale}px`,
              height: 'auto',
              maxWidth: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserDrag: 'none',
              KhtmlUserDrag: 'none',
              MozUserDrag: 'none',
              msUserDrag: 'none',
              userDrag: 'none'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
        )}
        
        {imageError && (
          <div className="p-4 text-red-500 text-center">
            <p className="mb-2">地図画像の読み込みに失敗しました</p>
            <button 
              onClick={() => {
                setImageError(false);
                setImageLoaded(false);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              再読み込み
            </button>
          </div>
        )}
        
        {!imageLoaded && !imageError && mapImageUrl && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p>地図読み込み中...</p>
          </div>
        )}
        
        {imageLoaded && (
          <>
            {renderLocationMarkers()}
            {renderCurrentLocationMarkers()}
            {renderScheduledLocationCards()}
          </>
        )}
      </div>
    </div>
  );
};

export default MapViewer;