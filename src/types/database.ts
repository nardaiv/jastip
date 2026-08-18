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

export const TripSchema = z.object({
  id: z.string().uuid(),
  seller_id: z.string().uuid(),
  title: z.string(),
  destination_country: z.string(),
  destination_city: z.string().nullable(),
  start_date: z.string(),
  end_date: z.string(),
  max_request_slots: z.number().nullable(),
  notes: z.string().nullable(),
  status: TripStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
  seller: z
    .object({
      id: z.string(),
      full_name: z.string().nullable(),
      email: z.string().nullable(),
    })
    .optional()
    .nullable(),
});
export type Trip = z.infer<typeof TripSchema>;

export const RequestStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "purchased",
  "paid",       // Ditambahkan: Menandakan Admin sudah konfirmasi pembayaran
  "verifying",  // Ditambahkan: Menandakan Pembayaran sedang diverifikasi oleh Admin
  "shipped",    // Ditambahkan: Menandakan Seller sudah menekan tombol Kirim
  "delivered",
  "cancelled",
]);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

export const ItemRequestSchema = z.object({
  id: z.string().uuid(),
  trip_id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  item_name: z.string(),
  description: z.string().nullable(),
  quantity: z.number().int().positive().default(1),
  estimated_price: z.number().nullable(),
  currency: z.string().default("IDR").nullable(),
  agreed_price: z.number().nullable(),
  jastip_fee: z.number().nullable(),
  shipping_fee: z.number().nullable(),
  total_price: z.number().nullable(),
  reference_link: z.string().nullable(),
  image_url: z.string().nullable(),
  shipping_address_id: z.string().uuid().nullable().optional(),
  sender_address_id: z.string().uuid().nullable().optional(),
  weight_value: z.number().nullable().optional(),
  weight_unit: z.string().nullable().optional(),
  status: RequestStatusSchema,
  rejection_reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  buyer: z
    .object({
      id: z.string(),
      full_name: z.string().nullable(),
      email: z.string().nullable(),
    })
    .optional()
    .nullable(),
  trip: z
    .object({
      id: z.string(),
      title: z.string().nullable(),
      seller_id: z.string().optional(),
      destination_country: z.string().optional(),
      destination_city: z.string().nullable().optional(),
      seller: z
        .object({
          id: z.string(),
          full_name: z.string().nullable(),
          email: z.string().nullable(),
        })
        .optional()
        .nullable(),
    })
    .optional()
    .nullable(),
});
export type ItemRequest = z.infer<typeof ItemRequestSchema>;

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

export const ShippingAddressSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  contact_name: z.string(),
  company_name: z.string().nullable(),
  phone_number: z.string(),
  street_line_1: z.string(),
  street_line_2: z.string().nullable(),
  city: z.string(),
  state_or_province_code: z.string().nullable(),
  postal_code: z.string(),
  country_code: z.string(),
  is_residential: z.boolean(),
  is_default: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;

export const ShipmentStatusSchema = z.enum([
  "draft",
  "label_created",
  "pickup_scheduled",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception",
  "cancelled"
]);
export type ShipmentStatus = z.infer<typeof ShipmentStatusSchema>;

export const ShipmentSchema = z.object({
  id: z.string().uuid(),
  trip_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  sender_address_id: z.string().uuid().nullable(),
  recipient_address_id: z.string().uuid().nullable(),
  fedex_tracking_number: z.string().nullable(),
  fedex_master_tracking_number: z.string().nullable(),
  fedex_shipment_id: z.string().nullable(),
  fedex_transaction_id: z.string().nullable(),
  service_type: z.string(),
  packaging_type: z.string(),
  weight_value: z.number(),
  weight_unit: z.string(),
  length_value: z.number().nullable(),
  width_value: z.number().nullable(),
  height_value: z.number().nullable(),
  dimension_unit: z.string().nullable(),
  declared_value: z.number(),
  declared_currency: z.string(),
  shipping_cost: z.number().nullable(),
  duties_and_taxes: z.number().nullable(),
  label_url: z.string().nullable(),
  status: ShipmentStatusSchema,
  ship_date: z.string().nullable(),
  estimated_delivery_date: z.string().nullable(),
  actual_delivery_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Shipment = z.infer<typeof ShipmentSchema>;

export const ShipmentItemSchema = z.object({
  id: z.string().uuid(),
  shipment_id: z.string().uuid(),
  item_request_id: z.string().uuid(),
  packed_quantity: z.number().int().positive().default(1),
  created_at: z.string(),
});
export type ShipmentItem = z.infer<typeof ShipmentItemSchema>;

export const ShipmentTrackingEventSchema = z.object({
  id: z.string().uuid(),
  shipment_id: z.string().uuid(),
  event_type: z.string(),
  event_description: z.string(),
  location_city: z.string().nullable(),
  location_country: z.string().nullable(),
  event_timestamp: z.string(),
  created_at: z.string(),
});
export type ShipmentTrackingEvent = z.infer<typeof ShipmentTrackingEventSchema>;

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
          shipping_address_id: string | null;
          sender_address_id: string | null;
          weight_value: number | null;
          weight_unit: string | null;
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
          shipping_address_id?: string | null;
          sender_address_id?: string | null;
          weight_value?: number | null;
          weight_unit?: string | null;
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
          shipping_address_id?: string | null;
          sender_address_id?: string | null;
          weight_value?: number | null;
          weight_unit?: string | null;
        };
      };
      shipping_addresses: {
        Row: {
          id: string;
          user_id: string;
          contact_name: string;
          company_name: string | null;
          phone_number: string;
          street_line_1: string;
          street_line_2: string | null;
          city: string;
          state_or_province_code: string | null;
          postal_code: string;
          country_code: string;
          is_residential: boolean;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_name: string;
          company_name?: string | null;
          phone_number: string;
          street_line_1: string;
          street_line_2?: string | null;
          city: string;
          state_or_province_code?: string | null;
          postal_code: string;
          country_code: string;
          is_residential?: boolean;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contact_name?: string;
          company_name?: string | null;
          phone_number?: string;
          street_line_1?: string;
          street_line_2?: string | null;
          city?: string;
          state_or_province_code?: string | null;
          postal_code?: string;
          country_code?: string;
          is_residential?: boolean;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      shipments: {
        Row: {
          id: string;
          trip_id: string;
          seller_id: string;
          buyer_id: string;
          sender_address_id: string | null;
          recipient_address_id: string | null;
          fedex_tracking_number: string | null;
          fedex_master_tracking_number: string | null;
          fedex_shipment_id: string | null;
          fedex_transaction_id: string | null;
          service_type: string;
          packaging_type: string;
          weight_value: number;
          weight_unit: string;
          length_value: number | null;
          width_value: number | null;
          height_value: number | null;
          dimension_unit: string | null;
          declared_value: number;
          declared_currency: string;
          shipping_cost: number | null;
          duties_and_taxes: number | null;
          label_url: string | null;
          status: "draft" | "label_created" | "pickup_scheduled" | "in_transit" | "out_for_delivery" | "delivered" | "exception" | "cancelled";
          ship_date: string | null;
          estimated_delivery_date: string | null;
          actual_delivery_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          seller_id: string;
          buyer_id: string;
          sender_address_id?: string | null;
          recipient_address_id?: string | null;
          fedex_tracking_number?: string | null;
          fedex_master_tracking_number?: string | null;
          fedex_shipment_id?: string | null;
          fedex_transaction_id?: string | null;
          service_type?: string;
          packaging_type?: string;
          weight_value: number;
          weight_unit?: string;
          length_value?: number | null;
          width_value?: number | null;
          height_value?: number | null;
          dimension_unit?: string | null;
          declared_value?: number;
          declared_currency?: string;
          shipping_cost?: number | null;
          duties_and_taxes?: number | null;
          label_url?: string | null;
          status?: "draft" | "label_created" | "pickup_scheduled" | "in_transit" | "out_for_delivery" | "delivered" | "exception" | "cancelled";
          ship_date?: string | null;
          estimated_delivery_date?: string | null;
          actual_delivery_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          seller_id?: string;
          buyer_id?: string;
          sender_address_id?: string | null;
          recipient_address_id?: string | null;
          fedex_tracking_number?: string | null;
          fedex_master_tracking_number?: string | null;
          fedex_shipment_id?: string | null;
          fedex_transaction_id?: string | null;
          service_type?: string;
          packaging_type?: string;
          weight_value?: number;
          weight_unit?: string;
          length_value?: number | null;
          width_value?: number | null;
          height_value?: number | null;
          dimension_unit?: string | null;
          declared_value?: number;
          declared_currency?: string;
          shipping_cost?: number | null;
          duties_and_taxes?: number | null;
          label_url?: string | null;
          status?: "draft" | "label_created" | "pickup_scheduled" | "in_transit" | "out_for_delivery" | "delivered" | "exception" | "cancelled";
          ship_date?: string | null;
          estimated_delivery_date?: string | null;
          actual_delivery_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      shipment_items: {
        Row: {
          id: string;
          shipment_id: string;
          item_request_id: string;
          packed_quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          item_request_id: string;
          packed_quantity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          shipment_id?: string;
          item_request_id?: string;
          packed_quantity?: number;
          created_at?: string;
        };
      };
      shipment_tracking_events: {
        Row: {
          id: string;
          shipment_id: string;
          event_type: string;
          event_description: string;
          location_city: string | null;
          location_country: string | null;
          event_timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          event_type: string;
          event_description: string;
          location_city?: string | null;
          location_country?: string | null;
          event_timestamp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          shipment_id?: string;
          event_type?: string;
          event_description?: string;
          location_city?: string | null;
          location_country?: string | null;
          event_timestamp?: string;
          created_at?: string;
        };
      };
    };
  };
}