export interface UserProfile {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  libeCityName?: string;
  profileCompleted: boolean;
  groupIds?: string[]; // 参加中のグループIDリスト（複数グループ対応）
  groupId?: string; // 後方互換性のため残す（非推奨）
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  code: string; // 6桁の参加コード
  createdBy: string; // 作成者のUID
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserLocation {
  id: string;
  userId: string;
  x: number;
  y: number;
  date: string; // 日付 (YYYY-MM-DD)
  time: string;
  endTime?: string; // 予定地の場合の終了時間
  comment?: string;
  location?: string; // 場所名
  timestamp: Date;
  isActive: boolean;
  locationType: 'current' | 'scheduled'; // 現在地 or 予定地
}

export interface Location {
  id: string;
  friendName: string;
  x: number;
  y: number;
  time: string;
  description?: string;
  timestamp: Date;
  userId: string;
  userDisplayName: string;
}

export interface MapPoint {
  x: number;
  y: number;
}