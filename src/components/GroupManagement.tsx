import React, { useState } from 'react';
import { Group, UserProfile } from '../types';
import { createGroup, findGroupByCode, joinGroup, leaveSpecificGroup } from '../services/groupService';
import { updateUserProfile } from '../services/userService';
import { isAdmin } from '../utils/admin';
import { deleteField } from 'firebase/firestore';

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

  const isUserAdmin = isAdmin(currentUser.uid);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const newGroup = await createGroup(groupName.trim(), currentUser.uid);

      const currentGroupIds = currentUser.groupIds || [];
      const updatedGroupIds = [...currentGroupIds, newGroup.id];

      await updateUserProfile(currentUser.uid, {
        groupIds: updatedGroupIds,
        groupId: deleteField()
      } as any);

      onGroupsChange([...currentGroups, newGroup]);
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      const errorMessage = error instanceof Error ? error.message : 'グループの作成に失敗しました';
      setError(`作成エラー: ${errorMessage}`);
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
      const group = await findGroupByCode(joinCode.trim());
      if (!group) {
        setError('グループコードが見つかりません');
        return;
      }

      const currentGroupIds = currentUser.groupIds || [];
      if (currentGroupIds.includes(group.id)) {
        setError('既にこのグループに参加しています');
        return;
      }

      await joinGroup(group.id);

      const updatedGroupIds = [...currentGroupIds, group.id];

      await updateUserProfile(currentUser.uid, {
        groupIds: updatedGroupIds,
        groupId: deleteField()
      } as any);

      onGroupsChange([...currentGroups, group]);
      onClose();
    } catch (error) {
      console.error('Error joining group:', error);
      const errorMessage = error instanceof Error ? error.message : 'グループへの参加に失敗しました';
      setError(`参加エラー: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (group: Group) => {
    if (!window.confirm(`「${group.name}」から脱退しますか？`)) return;

    setLoading(true);
    setError('');

    try {
      try {
        await leaveSpecificGroup(group.id);
      } catch (groupError) {
        if (groupError instanceof Error && groupError.message.includes('Group not found')) {
          console.log('グループは既に削除されています。ユーザープロフィールのみ更新します。');
        } else {
          throw groupError;
        }
      }

      const currentGroupIds = currentUser.groupIds || [];
      const updatedGroupIds = currentGroupIds.filter(id => id !== group.id);

      await updateUserProfile(currentUser.uid, {
        groupIds: updatedGroupIds,
        groupId: deleteField()
      } as any);

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
    <div className="fixed inset-0 glass-dark flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-800">グループ管理</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {mode === 'menu' && (
            <div className="space-y-4">
              {currentGroups.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-600">参加中のグループ</h4>
                  {currentGroups.map((group) => (
                    <div key={group.id} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <p className="text-emerald-800 font-semibold">{group.name}</p>
                      <p className="text-sm text-emerald-600 mt-1">
                        参加コード: <code className="bg-emerald-100 px-2 py-0.5 rounded-lg font-mono text-xs">{group.code}</code>
                      </p>
                      <p className="text-sm text-emerald-600 mt-0.5">
                        メンバー: {group.memberCount}人
                      </p>
                      <button
                        onClick={() => handleLeaveGroup(group)}
                        disabled={loading}
                        className="mt-3 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        脱退
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-xl text-center">
                  <p className="text-slate-500 text-sm">まだどのグループにも参加していません</p>
                </div>
              )}

              <div className="space-y-2 pt-2">
                {isUserAdmin && (
                  <button
                    onClick={() => setMode('create')}
                    className="w-full px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors font-medium text-sm"
                  >
                    新しいグループを作成
                  </button>
                )}
                <button
                  onClick={() => setMode('join')}
                  className="w-full px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium text-sm"
                >
                  グループに参加
                </button>
                {!isUserAdmin && (
                  <p className="text-[11px] text-slate-400 text-center mt-1">
                    グループの作成は管理者のみ可能です
                  </p>
                )}
              </div>
            </div>
          )}

          {mode === 'create' && (
            <div>
              <h4 className="text-sm font-semibold text-slate-600 mb-4">新しいグループを作成</h4>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">グループ名</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="例: リベ大友達班"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 text-sm transition-all"
                    maxLength={30}
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">{groupName.length}/30文字</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading || !groupName.trim()}
                    className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors font-medium text-sm"
                  >
                    {loading ? '作成中...' : '作成'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('menu')}
                    className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
                  >
                    戻る
                  </button>
                </div>
              </form>
            </div>
          )}

          {mode === 'join' && (
            <div>
              <h4 className="text-sm font-semibold text-slate-600 mb-4">グループに参加</h4>
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">参加コード</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 font-mono text-center text-lg tracking-[0.3em] transition-all"
                    maxLength={6}
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    グループ作成者から教えてもらった6桁のコードを入力
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading || !joinCode.trim()}
                    className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium text-sm"
                  >
                    {loading ? '参加中...' : '参加'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('menu')}
                    className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
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
