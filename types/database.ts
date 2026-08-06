export type UserRole = "admin" | "seller" | "buyer";
export type TripStatus =
  | "draft"
  | "upcoming"
  | "active"
  | "completed"
  | "cancelled";
export type RequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "purchased"
  | "delivered"
  | "cancelled";

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
