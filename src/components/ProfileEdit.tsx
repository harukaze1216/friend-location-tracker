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
      if (file.size > 5 * 1024 * 1024) {
        alert('ファイルサイズは5MB以下にしてください');
        return;
      }

      setAvatarFile(file);

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

      if (avatarFile) {
        setUploading(true);
        if (currentProfile.avatarUrl) {
          try {
            await deleteAvatar(currentProfile.avatarUrl);
          } catch (error) {
            console.warn('Failed to delete old avatar (external URL):', error);
          }
        }
        avatarUrl = await uploadAvatar(currentProfile.uid, avatarFile);
        setUploading(false);
      } else if (!avatarPreview && currentProfile.avatarUrl) {
        try {
          await deleteAvatar(currentProfile.avatarUrl);
        } catch (error) {
          console.warn('Failed to delete avatar (external URL):', error);
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
    <div className="fixed inset-0 glass-dark flex items-center justify-center p-4 z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 sm:p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-slate-800">プロフィール編集</h2>
            <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl ring-4 ring-slate-100">
                    {displayName.charAt(0) || '?'}
                  </div>
                )}

                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-indigo-500 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-600 transition-colors shadow-lg"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
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
              <p className="text-xs text-slate-400 text-center">5MB以下のJPG/PNG</p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">表示名</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm transition-all"
                placeholder="地図上で表示される名前"
                required
                maxLength={50}
              />
            </div>

            {/* Libe City Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">リベシティ名 (任意)</label>
              <input
                type="text"
                value={libeCityName}
                onChange={(e) => setLibeCityName(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm transition-all"
                placeholder="リベシティでの名前"
                maxLength={50}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium min-h-[44px]"
                disabled={loading || uploading}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors text-sm font-medium min-h-[44px] disabled:opacity-50"
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
