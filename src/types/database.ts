import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "seller", "buyer", "Admin", "Seller", "Buyer"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const RequestStatusSchema = z.enum([
  "pending",
  "accepted",
  "purchased",
  "rejected",
  "cancelled",
]);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address").nullable().optional(),
  phone: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  role: z.string().default("Buyer"),
  avatar_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export interface SellerTrip {
  id: number;
  seller_name: string;
  country: string;
  flag: string;
  departure_date: string;
  return_date: string;
  status: "Aktif" | "Mendatang" | string;
  created_at?: string;
}

export interface BuyerRequest {
  id: string; // Format: 'REQ-123'
  user_id?: string | null;
  model: string;
  merk: string;
  kuantitas: number;
  seller_name: string;
  country: string;
  price: number;
  fee: number; // 10% dari price
  shipping_fee: number; // Estimasi ongkir
  photo_url?: string | null;
  alamat: string;
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
  request_id: string;
  courier: string;
  resi: string;
  service_type: string;
  estimated_delivery: string;
  steps: TrackingStep[];
  timeline_logs: TrackingTimelineLog[];
  created_at?: string;
}

// Form Validation Schemas
export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const SignupSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().default("Buyer"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type SignupInput = z.infer<typeof SignupSchema>;

export const BuyerRequestFormSchema = z.object({
  model: z.string().min(2, "Nama/Model barang harus diisi"),
  merk: z.string().min(1, "Merk barang harus diisi"),
  kuantitas: z.coerce.number().min(1, "Kuantitas minimal 1"),
  seller_name: z.string().min(1, "Nama seller harus dipilih"),
  country: z.string().min(1, "Negara asal harus dipilih"),
  alamat: z.string().min(5, "Alamat lengkap pengiriman harus diisi"),
  price: z.coerce.number().optional().default(0),
  fee: z.coerce.number().optional().default(0),
  shipping_fee: z.coerce.number().optional().default(0),
  photo_url: z.string().nullable().optional(),
});
export type BuyerRequestFormInput = z.infer<typeof BuyerRequestFormSchema>;
