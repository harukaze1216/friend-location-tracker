import React, { useState } from 'react';
import { UserLocation } from '../types';

interface MyLocationFormProps {
  position: { x: number; y: number };
  currentLocation?: UserLocation;
  onSubmit: (data: {
    time: string;
    comment: string;
  }) => void;
  onCancel: () => void;
}

const MyLocationForm: React.FC<MyLocationFormProps> = ({ 
  position, 
  currentLocation,
  onSubmit, 
  onCancel 
}) => {
  const [time, setTime] = useState(currentLocation?.time || '');
  const [comment, setComment] = useState(currentLocation?.comment || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (time) {
      onSubmit({
        time,
        comment: comment.trim(),
      });
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                時間 *
              </label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
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