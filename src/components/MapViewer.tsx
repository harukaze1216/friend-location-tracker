import React, { useState, useRef } from 'react';
import { Location, MapPoint, UserLocation, UserProfile } from '../types';


interface MapViewerProps {
  mapImageUrl: string;
  locations: Location[];
  userLocations: UserLocation[];
  userProfiles: { [uid: string]: UserProfile };
  currentUserId?: string;
  onMapClick: (point: MapPoint) => void;
  onUserLocationClick?: (userLocation: UserLocation) => void;
}

const MapViewer: React.FC<MapViewerProps> = ({
  mapImageUrl,
  locations,
  userLocations,
  userProfiles,
  currentUserId,
  onMapClick,
  onUserLocationClick
}) => {
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  };

  const [scale, setScale] = useState<number>(isMobile() ? 0.7 : 1.0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    onMapClick({ x, y });
  };

  const handleUserIconClick = (event: React.MouseEvent, userLocation: UserLocation) => {
    event.stopPropagation();

    if (onUserLocationClick) {
      onUserLocationClick(userLocation);
    }
  };

  const renderLocationMarkers = () => {
    return locations.map((location) => (
      <div
        key={location.id}
        className="absolute bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer shadow-md"
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

      const isPast = (() => {
        if (!userLocation.date || !userLocation.time) {
          return false;
        }

        const locationDate = new Date(userLocation.date + 'T00:00:00');
        const todayDate = new Date(today + 'T00:00:00');

        if (locationDate < todayDate) return true;
        if (locationDate > todayDate) return false;

        if (locationDate.getTime() === todayDate.getTime()) {
          const [hours, minutes] = userLocation.time.split(':').map(Number);
          const locationMinutes = hours * 60 + minutes;
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          return (currentMinutes - locationMinutes) > 120;
        }

        return false;
      })();

      if (!profile) return null;

      return (
        <div
          key={userLocation.id}
          id={`user-marker-${userLocation.id}`}
          className={`absolute rounded-full cursor-pointer transition-all duration-200 hover:scale-110 z-40 ${
            isCurrentUser ? 'ring-4 ring-indigo-400/40' : ''
          } ${
            isPast ? 'opacity-50' : 'opacity-100'
          }`}
          style={{
            left: `${userLocation.x * scale}px`,
            top: `${userLocation.y * scale}px`,
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
          }}
          onClick={(e) => handleUserIconClick(e, userLocation)}
          title={`${profile?.displayName || 'Unknown'} - ${userLocation.date} ${userLocation.time}${userLocation.endTime ? ` - ${userLocation.endTime}` : ''}${userLocation.location ? ' @ ' + userLocation.location : ''}${userLocation.comment ? ': ' + userLocation.comment : ''}${isPast ? ' (過去)' : ''}`}
        >
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName || 'User'}
              className="w-full h-full rounded-full object-cover border-2 border-white shadow-lg"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg">
              {(profile?.displayName || 'U').charAt(0)}
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-indigo-500 shadow flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>

          {/* Time Label */}
          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-indigo-600/90 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap shadow-sm">
            {userLocation.time}
          </div>
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

        if (!profile) return null;

        const isPast = (() => {
          if (!userLocation.date || !userLocation.time) return false;

          const locationDate = new Date(userLocation.date + 'T00:00:00');
          const todayDate = new Date(today + 'T00:00:00');

          if (locationDate < todayDate) return true;
          if (locationDate > todayDate) return false;

          if (locationDate.getTime() === todayDate.getTime()) {
            const endTime = userLocation.endTime || userLocation.time;
            return endTime < currentTime;
          }

          return false;
        })();

        return (
          <div
            key={userLocation.id}
            className={`absolute bg-white rounded-xl shadow-md border ${
              isCurrentUser ? 'border-amber-300' : 'border-slate-200'
            } p-1.5 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
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
            title={`${profile?.displayName || 'Unknown'} - ${userLocation.date} ${userLocation.time}${userLocation.endTime ? ` - ${userLocation.endTime}` : ''}${userLocation.location ? ' @ ' + userLocation.location : ''}${userLocation.comment ? ': ' + userLocation.comment : ''}${isPast ? ' (過去)' : ''}`}
          >
            <div className="flex items-center gap-1 mb-0.5">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                  draggable={false}
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white font-bold text-[9px] ring-1 ring-slate-200">
                  {(profile?.displayName || 'U').charAt(0)}
                </div>
              )}
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
            </div>
            <div className="text-[11px] text-slate-700 font-medium leading-tight">
              {userLocation.time}
            </div>
            {userLocation.endTime && (
              <div className="text-[10px] text-slate-400 leading-tight">
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
      {/* Controls */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400 flex-1 min-w-0">
          PC: クリックで位置登録 / スマホ: 長押しで位置登録
        </p>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-bold flex items-center justify-center"
          >
            -
          </button>
          <span className="text-xs text-slate-400 min-w-[3rem] text-center font-medium">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
            className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-bold flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative border border-slate-200 rounded-xl max-h-[400px] sm:max-h-[500px] md:max-h-[600px] lg:max-h-[700px] overflow-auto touch-manipulation"
        onClick={handleMapClick}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            const touch = e.touches[0];
            if (touch && imageRef.current) {
              const initialX = touch.clientX;
              const initialY = touch.clientY;

              longPressTimeoutRef.current = setTimeout(() => {
                const currentRect = imageRef.current!.getBoundingClientRect();
                const x = (initialX - currentRect.left) / scale;
                const y = (initialY - currentRect.top) / scale;
                onMapClick({ x, y });
              }, 500);
            }
          }
        }}
        onTouchMove={() => {
          if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
        }}
        onTouchEnd={() => {
          if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
          }
        }}
        style={{
          cursor: 'crosshair',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          touchAction: 'manipulation'
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
              WebkitTouchCallout: 'none'
            } as React.CSSProperties}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
        )}

        {imageError && (
          <div className="p-8 text-center">
            <p className="text-sm text-red-500 mb-3">地図画像の読み込みに失敗しました</p>
            <button
              onClick={() => {
                setImageError(false);
                setImageLoaded(false);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-medium"
            >
              再読み込み
            </button>
          </div>
        )}

        {!imageLoaded && !imageError && mapImageUrl && (
          <div className="p-8 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-400">地図読み込み中...</p>
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
