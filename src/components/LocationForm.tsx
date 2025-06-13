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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-80">
        <h3 className="text-lg font-bold mb-4">位置情報を登録</h3>
        <p className="text-sm text-gray-600 mb-4">
          座標: ({Math.round(selectedPoint.x)}, {Math.round(selectedPoint.y)})
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              友達の名前 *
            </label>
            <input
              type="text"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              時間 *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              メモ
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              登録
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
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