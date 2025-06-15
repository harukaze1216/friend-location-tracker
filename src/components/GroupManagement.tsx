import React, { useState } from 'react';
import { Group, UserProfile } from '../types';
import { createGroup, findGroupByCode, joinGroup, leaveSpecificGroup } from '../services/groupService';
import { updateUserProfile } from '../services/userService';
import { isAdmin } from '../utils/admin';

interface GroupManagementProps {
  currentUser: UserProfile;
  currentGroups: Group[];
  onGroupsChange: (groups: Group[]) => void;
  onClose: () => void;
}

const GroupManagement: React.FC<GroupManagementProps> = ({
  currentUser,
  currentGroups,
  onGroupsChange,
  onClose
}) => {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 現在のユーザーが管理者かどうか
  const isUserAdmin = isAdmin(currentUser.uid);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      // 新しいグループを作成
      const newGroup = await createGroup(groupName.trim(), currentUser.uid);
      
      // 現在のグループリストに追加
      const currentGroupIds = currentUser.groupIds || [];
      const updatedGroupIds = [...currentGroupIds, newGroup.id];
      
      // ユーザープロフィールを更新（古いgroupIdフィールドも削除）
      await updateUserProfile(currentUser.uid, { 
        groupIds: updatedGroupIds,
        groupId: undefined // 古いフィールドを明示的に削除
      });
      
      onGroupsChange([...currentGroups, newGroup]);
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

      // 既に参加しているかチェック
      const currentGroupIds = currentUser.groupIds || [];
      if (currentGroupIds.includes(group.id)) {
        setError('既にこのグループに参加しています');
        return;
      }

      // 新しいグループに参加
      await joinGroup(group.id);
      
      // グループIDリストに追加
      const updatedGroupIds = [...currentGroupIds, group.id];
      
      // ユーザープロフィールを更新（古いgroupIdフィールドも削除）
      await updateUserProfile(currentUser.uid, { 
        groupIds: updatedGroupIds,
        groupId: undefined // 古いフィールドを明示的に削除
      });
      
      onGroupsChange([...currentGroups, group]);
      onClose();
    } catch (error) {
      console.error('Error joining group:', error);
      setError('グループへの参加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (group: Group) => {
    if (!window.confirm(`「${group.name}」から脱退しますか？`)) return;

    setLoading(true);
    setError('');
    
    try {
      await leaveSpecificGroup(group.id);
      
      // グループIDリストから削除
      const currentGroupIds = currentUser.groupIds || [];
      const updatedGroupIds = currentGroupIds.filter(id => id !== group.id);
      
      // ユーザープロフィールを更新
      await updateUserProfile(currentUser.uid, { 
        groupIds: updatedGroupIds,
        groupId: undefined // 古いフィールドを明示的に削除
      });
      
      // グループリストから削除
      const updatedGroups = currentGroups.filter(g => g.id !== group.id);
      onGroupsChange(updatedGroups);
    } catch (error) {
      console.error('Error leaving group:', error);
      const errorMessage = error instanceof Error ? error.message : 'グループからの脱退に失敗しました';
      setError(`脱退エラー: ${errorMessage}`);
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
              {currentGroups.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800 mb-2">参加中のグループ</h4>
                  {currentGroups.map((group) => (
                    <div key={group.id} className="p-4 bg-green-50 border border-green-200 rounded">
                      <p className="text-green-700 font-medium">{group.name}</p>
                      <p className="text-sm text-green-600 mb-2">
                        参加コード: <code className="bg-green-100 px-2 py-1 rounded font-mono">{group.code}</code>
                      </p>
                      <p className="text-sm text-green-600 mb-3">
                        メンバー数: {group.memberCount}人
                      </p>
                      <button
                        onClick={() => handleLeaveGroup(group)}
                        disabled={loading}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
                      >
                        脱退
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-gray-600 mb-4">まだどのグループにも参加していません</p>
                </div>
              )}
              
              {/* 新規作成・参加ボタン（常に表示） */}
              <div className="space-y-2">
                {isUserAdmin && (
                  <button
                    onClick={() => setMode('create')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded hover:from-blue-500 hover:to-blue-600 transition-all shadow-sm"
                  >
                    🆕 新しいグループを作成
                  </button>
                )}
                <button
                  onClick={() => setMode('join')}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded hover:from-green-500 hover:to-green-600 transition-all shadow-sm"
                >
                  🔗 グループに参加
                </button>
                {!isUserAdmin && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    グループの作成は管理者のみ可能です
                  </p>
                )}
              </div>
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