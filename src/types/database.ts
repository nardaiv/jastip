import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "seller", "buyer"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const TripStatusSchema = z.enum([
  "draft",
  "upcoming",
  "active",
  "completed",
  "cancelled",
]);
export type TripStatus = z.infer<typeof TripStatusSchema>;

// Tambahkan "paid" dan "shipped" di sini
export const RequestStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "purchased",
  "paid",       // Ditambahkan: Menandakan Admin sudah konfirmasi pembayaran
  "shipped",    // Ditambahkan: Menandakan Seller sudah menekan tombol Kirim
  "delivered",
  "cancelled",
]);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address").nullable(),
  phone_number: z.string().nullable(),
  role: UserRoleSchema,
  avatar_url: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;

// Form Validation Schemas
export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const SignupSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  role: UserRoleSchema.default("buyer"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type SignupInput = z.infer<typeof SignupSchema>;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone_number: string | null;
          role: "admin" | "seller" | "buyer";
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone_number?: string | null;
          role?: "admin" | "seller" | "buyer";
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone_number?: string | null;
          role?: "admin" | "seller" | "buyer";
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          destination_country: string;
          destination_city: string;
          start_date: string;
          end_date: string;
          max_request_slots: number | null;
          notes: string | null;
          status: "draft" | "upcoming" | "active" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          destination_country: string;
          destination_city: string;
          start_date: string;
          end_date: string;
          max_request_slots?: number | null;
          notes?: string | null;
          status?: "draft" | "upcoming" | "active" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          title?: string;
          destination_country?: string;
          destination_city?: string;
          start_date?: string;
          end_date?: string;
          max_request_slots?: number | null;
          notes?: string | null;
          status?: "draft" | "upcoming" | "active" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
      };
      item_requests: {
        Row: {
          id: string;
          trip_id: string;
          buyer_id: string;
          item_name: string;
          description: string | null;
          quantity: number;
          estimated_price: number | null;
          currency: string | null;
          agreed_price: number | null;
          jastip_fee: number | null;
          shipping_fee: number | null;
          total_price: number | null;
          reference_link: string | null;
          image_url: string | null;
          status: "pending" | "accepted" | "rejected" | "purchased" | "paid" | "shipped" | "delivered" | "cancelled";
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          buyer_id: string;
          item_name: string;
          description?: string | null;
          quantity?: number;
          estimated_price?: number | null;
          currency?: string | null;
          agreed_price?: number | null;
          jastip_fee?: number | null;
          shipping_fee?: number | null;
          total_price?: number | null;
          reference_link?: string | null;
          image_url?: string | null;
          status?: "pending" | "accepted" | "rejected" | "purchased" | "paid" | "shipped" | "delivered" | "cancelled";
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          buyer_id?: string;
          item_name?: string;
          description?: string | null;
          quantity?: number;
          estimated_price?: number | null;
          currency?: string | null;
          agreed_price?: number | null;
          jastip_fee?: number | null;
          shipping_fee?: number | null;
          total_price?: number | null;
          reference_link?: string | null;
          image_url?: string | null;
          status?: "pending" | "accepted" | "rejected" | "purchased" | "paid" | "shipped" | "delivered" | "cancelled";
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}