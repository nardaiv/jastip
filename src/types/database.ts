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

export const RequestStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "purchased",
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
