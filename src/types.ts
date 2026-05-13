export type UserRole = 'student' | 'driver';
export type RideStatus = 'active' | 'completed' | 'cancelled';
export type RequestStatus = 'seeking' | 'filled' | 'cancelled';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  name: string;
  avatarUrl?: string;
  universityId: string;
  universityDomain: string;
  rideCount: number;
  isVerified: boolean;
  bio?: string;
  createdAt: any;
}

export interface Ride {
  id: string;
  driverId: string;
  universityDomain: string;
  origin: string;
  destination: string;
  departureTime: any;
  price: number;
  vehicle: string;
  seats: number;
  availableSeats: number;
  status: RideStatus;
  passengerIds: string[];
  requestedPassengerIds: string[];
  isDriverVerified?: boolean;
  createdAt: any;
}

export interface PassengerRequest {
  id: string;
  ownerId: string;
  universityDomain: string;
  origin: string;
  destination: string;
  preferredTime: any;
  status: RequestStatus;
  joinerIds: string[];
  acceptedIds: string[];
  isOwnerVerified?: boolean;
  createdAt: any;
}

export interface Message {
  id: string;
  rideId: string;
  senderId: string;
  content: string;
  timestamp: any;
}
