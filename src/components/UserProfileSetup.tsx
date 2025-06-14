import React, { useState } from 'react';
import { UserProfile } from '../types';
import { uploadAvatar } from '../services/userService';

interface UserProfileSetupProps {
  user: any;
  onProfileComplete: (profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
}

const UserProfileSetup: React.FC<UserProfileSetupProps> = ({ 
  user, 
  onProfileComplete, 
  onCancel 
}) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [libeCityName, setLibeCityName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.photoURL || '');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB制限
        alert('ファイルサイズは5MB以下にしてください');
        return;
      }
      
      setAvatarFile(file);
      
      // プレビュー表示
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      alert('表示名を入力してください');
      return;
    }

    try {
      setLoading(true);
      
      let avatarUrl = user?.photoURL || '';
      
      // アバターがアップロードされている場合
      if (avatarFile) {
        setUploading(true);
        avatarUrl = await uploadAvatar(user.uid, avatarFile);
        setUploading(false);
      }

      const profileData: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
        uid: user.uid,
        displayName: displayName.trim(),
        avatarUrl,
        libeCityName: libeCityName.trim() || undefined,
        profileCompleted: true,
      };

      onProfileComplete(profileData);
    } catch (error) {
      console.error('Profile setup error:', error);
      alert('プロフィール設定に失敗しました');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center mb-2">
            プロフィール設定
          </h2>
          <p className="text-gray-600 text-center mb-6">
            初回設定が必要です
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* アバター設定 */}
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <img
                  src={avatarPreview || '/api/placeholder/100/100'}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
                <label 
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                アイコンをタップして変更
                <br />
                (5MB以下のJPG/PNG)
              </p>
            </div>

            {/* 表示名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                表示名 *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="リベ大フェスで表示される名前"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                maxLength={50}
              />
            </div>

            {/* リベシティでの名前 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                リベシティでの名前 (任意)
              </label>
              <input
                type="text"
                value={libeCityName}
                onChange={(e) => setLibeCityName(e.target.value)}
                placeholder="@username または ニックネーム"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                他の参加者があなたを見つけやすくなります
              </p>
            </div>

            {/* 送信ボタン */}
            <div className="flex gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  キャンセル
                </button>
              )}
              <button
                type="submit"
                disabled={loading || uploading || !displayName.trim()}
                className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'アップロード中...' : loading ? '設定中...' : '完了'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSetup;