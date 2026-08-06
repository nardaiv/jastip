"use client";

import { useState } from "react";
import { useUserStore } from "@/providers/user-store-provider";
import { z } from "zod";

// Local schema for validation
const ProfileUpdateSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  phone_number: z.string().nullable().or(z.string().min(5, "Phone number must be at least 5 digits")),
});

export function ProfileForm() {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || "");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);

    // Validate with Zod
    const validationResult = ProfileUpdateSchema.safeParse({
      full_name: fullName,
      phone_number: phoneNumber || null,
    });

    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message);
      return;
    }

    // Save to global Zustand store (in a real app, this would also write to Supabase)
    updateProfile({
      full_name: validationResult.data.full_name,
      phone_number: validationResult.data.phone_number,
    });

    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className="card-content mt-6 bg-white dark:bg-zinc-900 border border-canvas-soft dark:border-zinc-800">
      <div className="space-y-1.5 pb-4">
        <h3 className="text-display-xs text-ink dark:text-zinc-50 font-bold">
          Edit Profile Information
        </h3>
        <p className="text-caption text-mute">
          Interactive demo showing Zustand global state and local Zod form validation.
        </p>
      </div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="badge-negative rounded-lg p-3 text-xs font-semibold animate-in fade-in block text-center w-full">
              ⚠️ {error}
            </div>
          )}

          {isSuccess && (
            <div className="badge-positive rounded-lg p-3 text-xs font-semibold animate-in fade-in block text-center w-full">
              ✓ Profile updated successfully in Zustand store!
            </div>
          )}

          <div className="space-y-1.5 flex flex-col">
            <label htmlFor="edit-fullname" className="text-body-sm-strong text-ink dark:text-zinc-300">
              Full Name
            </label>
            <input
              id="edit-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="bg-canvas border border-ink rounded-md px-4 py-2.5 text-body-md text-ink outline-none focus:ring-2 focus:ring-primary/40 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
            />
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label htmlFor="edit-phone" className="text-body-sm-strong text-ink dark:text-zinc-300">
              Phone Number
            </label>
            <input
              id="edit-phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+62812345678"
              className="bg-canvas border border-ink rounded-md px-4 py-2.5 text-body-md text-ink outline-none focus:ring-2 focus:ring-primary/40 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
            />
          </div>

          <button type="submit" className="button-primary w-full h-11 text-sm font-semibold">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
