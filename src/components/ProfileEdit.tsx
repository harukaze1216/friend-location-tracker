import React, { useState } from 'react';
import { UserProfile } from '../types';
import { uploadAvatar, deleteAvatar } from '../services/userService';

interface ProfileEditProps {
  currentProfile: UserProfile;
  onSave: (profile: Partial<UserProfile>) => void;
  onCancel: () => void;
}

const ProfileEdit: React.FC<ProfileEditProps> = ({ 
  currentProfile, 
  onSave, 
  onCancel 
}) => {
  const [displayName, setDisplayName] = useState(currentProfile.displayName);
  const [libeCityName, setLibeCityName] = useState(currentProfile.libeCityName || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(currentProfile.avatarUrl || '');
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

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      alert('表示名を入力してください');
      return;
    }

    try {
      setLoading(true);
      
      let avatarUrl = currentProfile.avatarUrl || '';
      
      // 新しいアバターがアップロードされている場合
      if (avatarFile) {
        setUploading(true);
        // 古いアバターを削除
        if (currentProfile.avatarUrl) {
          try {
            await deleteAvatar(currentProfile.avatarUrl);
          } catch (error) {
            console.warn('Failed to delete old avatar:', error);
          }
        }
        // 新しいアバターをアップロード
        avatarUrl = await uploadAvatar(currentProfile.uid, avatarFile);
        setUploading(false);
      } else if (!avatarPreview && currentProfile.avatarUrl) {
        // アバターが削除された場合
        try {
          await deleteAvatar(currentProfile.avatarUrl);
        } catch (error) {
          console.warn('Failed to delete avatar:', error);
        }
        avatarUrl = '';
      }

      const updatedProfile: Partial<UserProfile> = {
        displayName: displayName.trim(),
        avatarUrl,
        libeCityName: libeCityName.trim() || undefined,
        updatedAt: new Date(),
      };

      onSave(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('プロフィール更新に失敗しました');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold">
              プロフィール編集
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* アバター設定 */}
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg border-4 border-gray-200">
                    {displayName.charAt(0) || '?'}
                  </div>
                )}
                
                {/* カメラアイコン（追加/変更） */}
                <label 
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
                  title="アバターを変更"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>

                {/* 削除アイコン */}
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                    title="アバターを削除"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              
              <p className="text-xs sm:text-sm text-gray-500 text-center">
                カメラアイコンで変更、×で削除
                <br />
                <span className="text-gray-400">(5MB以下)</span>
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="地図上で表示される名前"
                required
                maxLength={50}
              />
            </div>

            {/* リベシティ名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                リベシティ名 (任意)
              </label>
              <input
                type="text"
                value={libeCityName}
                onChange={(e) => setLibeCityName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="リベシティでの名前"
                maxLength={50}
              />
            </div>

            {/* ボタン */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base min-h-[44px]"
                disabled={loading || uploading}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base min-h-[44px] disabled:opacity-50"
                disabled={loading || uploading}
              >
                {uploading ? 'アップロード中...' : loading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;