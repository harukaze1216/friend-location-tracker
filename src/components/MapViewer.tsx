import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Location, MapPoint, UserLocation, UserProfile } from '../types';

// Import pdfjs worker legacy
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker - use CDN for better reliability
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

interface MapViewerProps {
  pdfFile: File | null;
  pdfUrl?: string;
  locations: Location[];
  userLocations: UserLocation[];
  userProfiles: { [uid: string]: UserProfile };
  currentUserId?: string;
  onMapClick: (point: MapPoint) => void;
  onUserLocationDrag?: (userLocationId: string, point: MapPoint) => void;
  onUserLocationClick?: (userLocation: UserLocation) => void;
}

const MapViewer: React.FC<MapViewerProps> = ({ 
  pdfFile, 
  pdfUrl, 
  locations, 
  userLocations,
  userProfiles,
  currentUserId,
  onMapClick,
  onUserLocationDrag,
  onUserLocationClick
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully:', numPages, 'pages');
    setNumPages(numPages);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF Load Error:', error);
    console.log('Worker source:', pdfjs.GlobalWorkerOptions.workerSrc);
    console.log('PDF URL:', pdfFile || pdfUrl);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isDragging || hasDragged) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
    onMapClick({ x, y });
  };

  const handleUserIconMouseDown = (event: React.MouseEvent, userLocationId: string) => {
    event.stopPropagation();
    const userLocation = userLocations.find(ul => ul.id === userLocationId);
    if (!userLocation || userLocation.userId !== currentUserId) return; // 自分のアイコンのみドラッグ可能
    
    setIsDragging(userLocationId);
    setDragStart({ x: event.clientX, y: event.clientY });
    setHasDragged(false);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !containerRef.current) return;
    
    event.preventDefault();
    
    // ドラッグを検出
    const threshold = 5; // 5px以上動いたらドラッグとみなす
    const deltaX = Math.abs(event.clientX - dragStart.x);
    const deltaY = Math.abs(event.clientY - dragStart.y);
    
    if (deltaX > threshold || deltaY > threshold) {
      setHasDragged(true);
    }
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
    // ドラッグ中の位置を更新（DOM操作で一時的に表示）
    const marker = document.getElementById(`user-marker-${isDragging}`);
    if (marker) {
      marker.style.left = `${x * scale}px`;
      marker.style.top = `${y * scale}px`;
      marker.style.transform = 'translate(-50%, -50%)';
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
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

  const handleUserIconClick = (event: React.MouseEvent, userLocation: UserLocation) => {
    event.stopPropagation();
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

  const renderUserMarkers = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return userLocations.map((userLocation) => {
      const profile = userProfiles[userLocation.userId];
      const isCurrentUser = userLocation.userId === currentUserId;
      const isDraggingThis = isDragging === userLocation.id;
      const isScheduled = userLocation.locationType === 'scheduled';
      
      // 時間が過ぎているかチェック
      const isPast = (() => {
        if (!userLocation.date || !userLocation.time) return false;
        
        // 今日以前の日付は過去
        if (userLocation.date < today) return true;
        
        // 今日で、現在時刻より前の時間は過去
        if (userLocation.date === today) {
          if (isScheduled && userLocation.endTime) {
            // 予定地の場合は終了時間で判定
            return userLocation.endTime < currentTime;
          } else {
            // 現在地の場合は開始時間で判定
            return userLocation.time < currentTime;
          }
        }
        
        return false;
      })();
      
      // プロフィールが見つからない場合はスキップ
      if (!profile) {
        console.warn('Profile not found for user:', userLocation.userId, 'skipping marker');
        return null;
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
          onClick={(e) => handleUserIconClick(e, userLocation)}
          title={`${profile?.displayName || 'Unknown'} - ${userLocation.date} ${userLocation.time}${isScheduled && userLocation.endTime ? ` - ${userLocation.endTime}` : ''}${userLocation.comment ? ': ' + userLocation.comment : ''}${isPast ? ' (過去)' : ''}`}
        >
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className={`w-full h-full rounded-full object-cover border-2 shadow-lg ${borderColor}`}
              draggable={false}
            />
          ) : (
            <div className={`w-full h-full rounded-full ${
              isScheduled 
                ? 'bg-gradient-to-br from-orange-400 to-red-500' 
                : 'bg-gradient-to-br from-blue-400 to-purple-500'
            } flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg`}>
              {profile?.displayName?.charAt(0) || '?'}
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

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            縮小
          </button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            拡大
          </button>
        </div>
        
        {numPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50"
            >
              前
            </button>
            <span className="text-sm">
              {pageNumber} / {numPages}
            </span>
            <button
              onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
              className="px-3 py-1 bg-gray-500 text-white rounded disabled:opacity-50"
            >
              次
            </button>
          </div>
        )}
      </div>

      <div 
        ref={containerRef}
        className="relative border border-gray-300 overflow-auto max-h-[400px] sm:max-h-[500px] md:max-h-[600px] lg:max-h-[700px] touch-manipulation"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={(e) => {
          // タッチ開始時の処理
          const touch = e.touches[0];
          if (touch) {
            const mouseEvent = new MouseEvent('mousedown', {
              clientX: touch.clientX,
              clientY: touch.clientY,
            });
            e.currentTarget.dispatchEvent(mouseEvent);
          }
        }}
        style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
      >
        {(pdfFile || pdfUrl) && (
          <Document
            file={pdfFile || pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div className="p-4">PDF読み込み中...</div>}
            error={
              <div className="p-4 text-red-500">
                <p>PDFの読み込みに失敗しました</p>
                <p className="text-sm">URL: {pdfUrl}</p>
                <p className="text-sm">ブラウザのコンソールでエラー詳細を確認してください</p>
              </div>
            }
            options={{
              cMapUrl: `https://unpkg.com/pdfjs-dist@3.11.174/cmaps/`,
              cMapPacked: true,
              standardFontDataUrl: `https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/`,
              disableWorker: false,
              isEvalSupported: false,
            }}
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        )}
        {renderLocationMarkers()}
        {renderUserMarkers()}
      </div>
    </div>
  );
};

export default MapViewer;