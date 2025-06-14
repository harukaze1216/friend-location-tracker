import React, { useState } from 'react';
import { Group, UserProfile } from '../types';
import { createGroup, findGroupByCode, joinGroup, leaveGroup } from '../services/groupService';
import { updateUserProfile } from '../services/userService';

interface GroupManagementProps {
  currentUser: UserProfile;
  currentGroup?: Group | null;
  onGroupChange: (group: Group | null) => void;
  onClose: () => void;
}

const GroupManagement: React.FC<GroupManagementProps> = ({
  currentUser,
  currentGroup,
  onGroupChange,
  onClose
}) => {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      // 既存のグループから脱退
      if (currentUser.groupId) {
        await leaveGroup(currentUser.groupId);
      }

      // 新しいグループを作成
      const newGroup = await createGroup(groupName.trim(), currentUser.uid);
      
      // ユーザープロフィールを更新
      await updateUserProfile(currentUser.uid, { groupId: newGroup.id });
      
      onGroupChange(newGroup);
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      setError('グループの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      // グループを検索
      const group = await findGroupByCode(joinCode.trim());
      if (!group) {
        setError('グループコードが見つかりません');
        return;
      }

      // 既存のグループから脱退
      if (currentUser.groupId) {
        await leaveGroup(currentUser.groupId);
      }

      // 新しいグループに参加
      await joinGroup(group.id);
      
      // ユーザープロフィールを更新
      await updateUserProfile(currentUser.uid, { groupId: group.id });
      
      onGroupChange(group);
      onClose();
    } catch (error) {
      console.error('Error joining group:', error);
      setError('グループへの参加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentUser.groupId || !currentGroup) return;
    
    if (!window.confirm(`「${currentGroup.name}」から脱退しますか？`)) return;

    setLoading(true);
    setError('');
    
    try {
      await leaveGroup(currentUser.groupId);
      await updateUserProfile(currentUser.uid, { groupId: undefined });
      
      onGroupChange(null);
      onClose();
    } catch (error) {
      console.error('Error leaving group:', error);
      setError('グループからの脱退に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">グループ管理</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {mode === 'menu' && (
            <div className="space-y-4">
              {currentGroup ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <h4 className="font-medium text-green-800 mb-2">現在のグループ</h4>
                  <p className="text-green-700">
                    <strong>{currentGroup.name}</strong>
                  </p>
                  <p className="text-sm text-green-600 mb-3">
                    参加コード: <code className="bg-green-100 px-2 py-1 rounded font-mono">{currentGroup.code}</code>
                  </p>
                  <p className="text-sm text-green-600 mb-3">
                    メンバー数: {currentGroup.memberCount}人
                  </p>
                  <button
                    onClick={handleLeaveGroup}
                    disabled={loading}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
                  >
                    グループから脱退
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-gray-600 mb-4">まだどのグループにも参加していません</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setMode('create')}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded hover:from-blue-500 hover:to-blue-600 transition-all shadow-sm"
                    >
                      🆕 新しいグループを作成
                    </button>
                    <button
                      onClick={() => setMode('join')}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded hover:from-green-500 hover:to-green-600 transition-all shadow-sm"
                    >
                      🔗 グループに参加
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'create' && (
            <div>
              <h4 className="font-medium mb-4">新しいグループを作成</h4>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    グループ名 *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="例: リベ大友達班"
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    maxLength={30}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {groupName.length}/30文字
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading || !groupName.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {loading ? '作成中...' : '作成'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('menu')}
                    className="px-4 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all"
                  >
                    戻る
                  </button>
                </div>
              </form>
            </div>
          )}

          {mode === 'join' && (
            <div>
              <h4 className="font-medium mb-4">グループに参加</h4>
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    参加コード *
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="例: ABC123"
                    className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-green-400 focus:border-transparent font-mono text-center text-lg tracking-wider"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    グループ作成者から教えてもらった6桁のコードを入力
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading || !joinCode.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded hover:from-green-500 hover:to-green-600 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {loading ? '参加中...' : '参加'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('menu')}
                    className="px-4 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all"
                  >
                    戻る
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupManagement;