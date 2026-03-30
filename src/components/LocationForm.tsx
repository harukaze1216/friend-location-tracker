import React, { useState } from 'react';
import { MapPoint } from '../types';

interface LocationFormProps {
  selectedPoint: MapPoint | null;
  onSubmit: (data: {
    friendName: string;
    time: string;
    description?: string;
  }) => void;
  onCancel: () => void;
}

const LocationForm: React.FC<LocationFormProps> = ({ selectedPoint, onSubmit, onCancel }) => {
  const [friendName, setFriendName] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (friendName && time) {
      onSubmit({
        friendName,
        time,
        description: description || undefined
      });
      setFriendName('');
      setTime('');
      setDescription('');
    }
  };

  if (!selectedPoint) return null;

  return (
    <div className="fixed inset-0 glass-dark flex items-center justify-center p-4 z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-slate-800 mb-1">位置情報を登録</h3>
        <p className="text-xs text-slate-400 mb-5">
          座標: ({Math.round(selectedPoint.x)}, {Math.round(selectedPoint.y)})
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">友達の名前</label>
            <input
              type="text"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">時間</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">メモ (任意)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm transition-all resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-indigo-500 text-white py-3 rounded-xl hover:bg-indigo-600 transition-colors text-sm font-medium"
            >
              登録
            </button>
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
  );
};

export default LocationForm;
