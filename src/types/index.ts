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
  comment?: string;
  timestamp: Date;
  isActive: boolean;
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