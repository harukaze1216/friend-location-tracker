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

  const festivalDates = useMemo(() => [
    { value: '2025-08-09', label: '8月9日(土) - Day 1' },
    { value: '2025-08-10', label: '8月10日(日) - Day 2' },
    { value: '2025-08-11', label: '8月11日(月) - Day 3' }
  ], []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentLocation) {
      setLocationType(currentLocation.locationType);
      setDate(currentLocation.date || festivalDates[0].value);
      setTime(currentLocation.time || '');
      setEndTime(currentLocation.endTime || '');
      setComment(currentLocation.comment || '');
      setLocation(currentLocation.location || '');
    } else {
      setLocationType(settings.defaultLocationType);
      setDate(festivalDates[0].value);
      setTime('');
      setEndTime('');
      setComment('');
      setLocation('');
    }
  }, [currentLocation, festivalDates, settings.defaultLocationType]);

  useEffect(() => {
    if (locationType === 'current') {
      setTime(getCurrentTime());
      setDate(getTodayDate());
    } else if (!currentLocation) {
      setTime('');
    }
  }, [locationType, currentLocation]);

  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function isToday(selectedDate: string) {
    return selectedDate === getTodayDate();
  }

  function getMinTime(selectedDate: string) {
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
    <div className="fixed inset-0 glass-dark flex items-center justify-center p-3 sm:p-4 z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">自分の位置を更新</h3>
            <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            座標: ({Math.round(position.x)}, {Math.round(position.y)})
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Location Type */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700">
                  位置の種類
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newDefaultType = settings.defaultLocationType === 'current' ? 'scheduled' : 'current';
                    const newSettings = updateSetting('defaultLocationType', newDefaultType);
                    setSettings(newSettings);
                  }}
                  className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium"
                >
                  デフォルト変更
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocationType('current')}
                  className={`p-2.5 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all ${
                    locationType === 'current'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-400'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  現在地
                  {settings.defaultLocationType === 'current' && (
                    <span className="ml-1 text-indigo-400">*</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('scheduled')}
                  className={`p-2.5 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all ${
                    locationType === 'scheduled'
                      ? 'bg-amber-50 text-amber-700 border-amber-400'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  予定地
                  {settings.defaultLocationType === 'scheduled' && (
                    <span className="ml-1 text-amber-400">*</span>
                  )}
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">日付</label>
              <select
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-xs sm:text-sm transition-all"
                required
              >
                {festivalDates.map((festDate) => (
                  <option key={festDate.value} value={festDate.value}>
                    {festDate.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                {locationType === 'current' ? '現在時間' : '開始時間'}
              </label>
              {locationType === 'current' && (
                <p className="text-[11px] text-indigo-500 mb-1.5">現在地を選択すると自動で現在時刻が設定されます</p>
              )}
              <div className="flex gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  min={getMinTime(date) || undefined}
                  className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-xs sm:text-sm transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setTime(getCurrentTime())}
                  className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 text-xs font-medium whitespace-nowrap transition-colors"
                >
                  現在
                </button>
              </div>
            </div>

            {/* End Time */}
            {locationType === 'scheduled' && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">終了時間</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={time || getMinTime(date) || undefined}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 text-xs sm:text-sm transition-all"
                  required
                />
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">場所 (任意)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例: メインステージ、フードコートなど"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-xs sm:text-sm transition-all"
                maxLength={50}
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">コメント (任意)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="何をしているか、どこにいるかなど..."
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-xs sm:text-sm transition-all resize-none"
                rows={2}
                maxLength={200}
              />
              <p className="text-[11px] text-slate-400 mt-1 text-right">{comment.length}/200</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 bg-indigo-500 text-white py-3 rounded-xl hover:bg-indigo-600 transition-colors text-sm font-medium"
              >
                {currentLocation ? '更新' : '登録'}
              </button>
              {showDeleteButton && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  削除
                </button>
              )}
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium"
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
