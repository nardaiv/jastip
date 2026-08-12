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
