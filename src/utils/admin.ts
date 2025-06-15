// 管理者権限チェック用のユーティリティ

/**
 * 指定されたUIDが管理者かどうかを判定
 * @param uid - ユーザーUID
 * @returns 管理者の場合true
 */
export const isAdmin = (uid: string): boolean => {
  const adminUids = process.env.REACT_APP_ADMIN_UIDS?.split(',').map(id => id.trim()) || [];
  return adminUids.includes(uid);
};

/**
 * 現在のユーザーが管理者かどうかを判定
 * @param user - Firebase Auth User オブジェクト
 * @returns 管理者の場合true
 */
export const isCurrentUserAdmin = (user: any): boolean => {
  if (!user?.uid) return false;
  return isAdmin(user.uid);
};