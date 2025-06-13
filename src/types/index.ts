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