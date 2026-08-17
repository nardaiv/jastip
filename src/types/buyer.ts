export type RequestStatus =
  | "pending"
  | "accepted"
  | "purchased"
  | "paid"
  | "shipped"
  | "delivered"
  | "rejected"
  | "cancelled";

export interface SellerTrip {
  id: string; // Real trips use UUID
  seller_id: string;
  seller_name: string;
  title: string;
  country: string;
  flag: string;
  departure_date: string;
  return_date: string;
  status: string;
  created_at?: string;
}

export interface BuyerRequest {
  id: string; // Real item_requests use UUID
  user_id?: string | null;
  trip_id: string;
  item_name: string;
  description?: string | null;
  quantity: number;
  seller_name: string;
  country: string;
  estimated_price?: number | null;
  agreed_price?: number | null;
  currency?: string | null;
  jastip_fee?: number | null;
  shipping_fee?: number | null;
  total_price?: number | null;
  reference_link?: string | null;
  image_url?: string | null;
  shipping_address_id?: string | null;
  weight_value?: number | null;
  weight_unit?: string | null;
  status: RequestStatus;
  created_at?: string;
}

export interface Payment {
  id: string;
  request_id: string;
  user_id?: string | null;
  bank_account: string;
  proof_url: string;
  amount: number;
  created_at?: string;
}

export interface TrackingStep {
  id: number;
  title: string;
  date: string;
  status: "completed" | "active" | "pending";
}

export interface TrackingTimelineLog {
  date: string;
  location: string;
  note: string;
}

export interface TrackingShipment {
  id: number;
  shipment_id?: string;
  request_id: string;
  courier: string;
  resi: string;
  service_type: string;
  estimated_delivery: string;
  steps: TrackingStep[];
  timeline_logs: TrackingTimelineLog[];
  created_at?: string;
}
