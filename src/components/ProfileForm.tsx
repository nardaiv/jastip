"use client";

import { useState } from "react";
import { useUserStore } from "@/providers/user-store-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
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
    <Card className="border-zinc-200/80 bg-white/80 shadow-md backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80 mt-6">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Edit Profile Information
        </CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs">
          Interactive demo showing Zustand global state and local Zod form validation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium animate-in fade-in">
              ⚠️ {error}
            </div>
          )}

          {isSuccess && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 font-medium animate-in fade-in">
              ✓ Profile updated successfully in Zustand store!
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-fullname">Full Name</Label>
            <Input
              id="edit-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">Phone Number</Label>
            <Input
              id="edit-phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+62812345678"
              className="w-full"
            />
          </div>

          <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs">
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
