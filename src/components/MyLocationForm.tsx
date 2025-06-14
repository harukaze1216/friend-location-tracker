import React, { useState, useEffect } from 'react';
import { UserLocation } from '../types';

interface MyLocationFormProps {
  position: { x: number; y: number };
  currentLocation?: UserLocation;
  onSubmit: (data: {
    date: string;
    time: string;
    endTime?: string;
    comment: string;
    locationType: 'current' | 'scheduled';
  }) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const MyLocationForm: React.FC<MyLocationFormProps> = ({ 
  position, 
  currentLocation,
  onSubmit,
  onDelete, 
  onCancel 
}) => {
  const [locationType, setLocationType] = useState<'current' | 'scheduled'>('scheduled');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState('');
  const showDeleteButton = !!currentLocation;

  // フェス期間の日付リスト（2025年に更新）
  const festivalDates = [
    { value: '2025-08-09', label: '8月9日(土) - Day 1' },
    { value: '2025-08-10', label: '8月10日(日) - Day 2' },
    { value: '2025-08-11', label: '8月11日(月) - Day 3' }
  ];

  // currentLocationが変更されたときに値を更新
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentLocation) {
      setLocationType(currentLocation.locationType);
      setDate(currentLocation.date || festivalDates[0].value); // フェスの初日をデフォルトに
      setTime(currentLocation.time || '');
      setEndTime(currentLocation.endTime || '');
      setComment(currentLocation.comment || '');
      setLocation(currentLocation.location || '');
    } else {
      // 新規作成時はリセット
      setLocationType('scheduled');
      setDate(festivalDates[0].value); // フェスの初日をデフォルトに
      setTime('');
      setEndTime('');
      setComment('');
      setLocation('');
    }
  }, [currentLocation]);

  // 現在の日付を取得（デフォルト値用）
  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // 現在時刻を取得
  function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // 選択された日付が今日かどうかチェック
  function isToday(selectedDate: string) {
    return selectedDate === getTodayDate();
  }

  // 最小時間を取得（今日の場合のみ現在時刻制限）
  function getMinTime(selectedDate: string) {
    // 今日の場合のみ時間制限、それ以外は自由に選択可能
    return isToday(selectedDate) ? getCurrentTime() : undefined;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (time && (locationType === 'current' || endTime)) {
      onSubmit({
        date,
        time,
        endTime: locationType === 'scheduled' ? endTime : undefined,
        comment: comment.trim(),
        locationType,
      });
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">自分の位置を更新</h3>
          <p className="text-sm text-gray-600 mb-4">
            座標: ({Math.round(position.x)}, {Math.round(position.y)})
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 位置タイプ選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                位置の種類 *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocationType('current')}
                  className={`p-3 rounded border text-sm font-medium ${
                    locationType === 'current'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  📍 現在地
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('scheduled')}
                  className={`p-3 rounded border text-sm font-medium ${
                    locationType === 'scheduled'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  📅 予定地
                </button>
              </div>
            </div>

            {/* 日付選択（フェス期間） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日付 *
              </label>
              <select
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {festivalDates.map((festDate) => (
                  <option key={festDate.value} value={festDate.value}>
                    {festDate.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 時間設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {locationType === 'current' ? '現在時間' : '開始時間'} *
              </label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  min={getMinTime(date) || undefined}
                  className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setTime(getCurrentTime())}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                >
                  現在時刻
                </button>
              </div>
            </div>

            {/* 終了時間（予定地の場合のみ） */}
            {locationType === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了時間 *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={time || getMinTime(date) || undefined}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
            )}
            
            {/* 場所フィールド */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                場所 (任意)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例: メインステージ、フードコートなど"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                コメント (任意)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="何をしているか、どこにいるかなど..."
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/200文字
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
              >
                {currentLocation ? '更新' : '登録'}
              </button>
              {showDeleteButton && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition-colors"
                >
                  削除
                </button>
              )}
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyLocationForm;