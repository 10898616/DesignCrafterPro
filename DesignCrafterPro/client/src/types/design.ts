export interface RoomDimensions {
  width: number;
  length: number;
  height: number;
  wallColor: string;
}

export interface FurnitureItem {
  id: string;
  type: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  color: string;
  x: number;
  y: number;
  rotation: number;
}

export interface Design {
  id: number;
  userId: number;
  name: string;
  description: string;
  roomWidth: number;
  roomLength: number;
  roomHeight: number;
  wallColor: string;
  furniture: FurnitureItem[];
  createdAt: string;
  updatedAt: string;
}
