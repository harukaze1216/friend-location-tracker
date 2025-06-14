import React, { useState, useEffect, useMemo } from 'react';
import { UserLocation } from '../types';
import { getSettings, updateSetting } from '../utils/settings';

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
  const [settings, setSettings] = useState(getSettings());
  const [locationType, setLocationType] = useState<'current' | 'scheduled'>(
    currentLocation?.locationType || settings.defaultLocationType
  );
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState('');
  const showDeleteButton = !!currentLocation;

  // フェス期間の日付リスト（2025年に更新）
  const festivalDates = useMemo(() => [
    { value: '2025-08-09', label: '8月9日(土) - Day 1' },
    { value: '2025-08-10', label: '8月10日(日) - Day 2' },
    { value: '2025-08-11', label: '8月11日(月) - Day 3' }
  ], []);

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
      // 新規作成時は設定に基づいた初期値
      setLocationType(settings.defaultLocationType);
      setDate(festivalDates[0].value); // フェスの初日をデフォルトに
      setTime('');
      setEndTime('');
      setComment('');
      setLocation('');
    }
  }, [currentLocation, festivalDates, settings.defaultLocationType]);

  // locationTypeが変更された時に時刻を自動設定
  useEffect(() => {
    if (locationType === 'current') {
      // 現在地の場合は現在時刻を自動設定
      setTime(getCurrentTime());
      setDate(getTodayDate());
    } else if (!currentLocation) {
      // 新規で予定地の場合は時刻をクリア
      setTime('');
    }
  }, [locationType, currentLocation]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">自分の位置を更新</h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            座標: ({Math.round(position.x)}, {Math.round(position.y)})
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* 位置タイプ選択 */}
            <div>
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  位置の種類 *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newDefaultType = settings.defaultLocationType === 'current' ? 'scheduled' : 'current';
                    const newSettings = updateSetting('defaultLocationType', newDefaultType);
                    setSettings(newSettings);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                  title={`デフォルトを「${settings.defaultLocationType === 'current' ? '現在地' : '予定地'}」から切り替え`}
                >
                  📝 デフォルト変更
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocationType('current')}
                  className={`p-2 sm:p-3 rounded border text-xs sm:text-sm font-medium ${
                    locationType === 'current'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  📍 現在地
                  {settings.defaultLocationType === 'current' && (
                    <span className="ml-1 text-xs">★</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('scheduled')}
                  className={`p-2 sm:p-3 rounded border text-xs sm:text-sm font-medium ${
                    locationType === 'scheduled'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  📅 予定地
                  {settings.defaultLocationType === 'scheduled' && (
                    <span className="ml-1 text-xs">★</span>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ★がデフォルト設定（新規登録時の初期値）
              </p>
            </div>

            {/* 日付選択（フェス期間） */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                日付 *
              </label>
              <select
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent text-xs sm:text-sm"
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                {locationType === 'current' ? '現在時間' : '開始時間'} *
              </label>
              {locationType === 'current' && (
                <p className="text-xs text-blue-600 mb-1 sm:mb-2">現在地を選択すると自動で現在時刻が設定されます</p>
              )}
              <div className="flex gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  min={getMinTime(date) || undefined}
                  className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent text-xs sm:text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setTime(getCurrentTime())}
                  className="px-2 sm:px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs sm:text-sm whitespace-nowrap"
                >
                  現在時刻
                </button>
              </div>
            </div>

            {/* 終了時間（予定地の場合のみ） */}
            {locationType === 'scheduled' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  終了時間 *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={time || getMinTime(date) || undefined}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs sm:text-sm"
                  required
                />
              </div>
            )}
            
            {/* 場所フィールド */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                場所 (任意)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例: メインステージ、フードコートなど"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent text-xs sm:text-sm"
                maxLength={50}
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                コメント (任意)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="何をしているか、どこにいるかなど..."
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent text-xs sm:text-sm"
                rows={2}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/200文字
              </p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white py-2 sm:py-3 rounded hover:from-blue-500 hover:to-blue-600 transition-all shadow-sm text-xs sm:text-sm font-medium"
              >
                {currentLocation ? '更新' : '登録'}
              </button>
              {showDeleteButton && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-3 sm:px-4 bg-gradient-to-r from-red-400 to-red-500 text-white py-2 sm:py-3 rounded hover:from-red-500 hover:to-red-600 transition-all shadow-sm text-xs sm:text-sm font-medium"
                >
                  削除
                </button>
              )}
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white py-2 sm:py-3 rounded hover:from-gray-500 hover:to-gray-600 transition-all shadow-sm text-xs sm:text-sm font-medium"
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