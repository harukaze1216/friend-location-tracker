export interface UserProfile {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  libeCityName?: string;
  profileCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserLocation {
  id: string;
  userId: string;
  x: number;
  y: number;
  time: string;
  endTime?: string; // 予定地の場合の終了時間
  comment?: string;
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