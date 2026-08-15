"use client";

import { useState } from "react";
import { User, MapPin } from "lucide-react";
import { DashboardProfileGrid } from "@/components/DashboardProfileGrid";
import { ProfileForm } from "@/components/ProfileForm";
import { AddressManager } from "@/components/AddressManager";

interface DashboardClientProps {
  userId: string;
  userEmail: string;
  initialAddresses: any[];
}

export function DashboardClient({ userId, userEmail, initialAddresses }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "addresses">("profile");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Premium Tabs navigation */}
      <div className="flex border-b border-canvas-soft dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 outline-none ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4" />
          Profil & Akun
        </button>
        <button
          onClick={() => setActiveTab("addresses")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 outline-none ${
            activeTab === "addresses"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapPin className="w-4 h-4" />
          Alamat Pengiriman
        </button>
      </div>

      {/* Tab Contents */}
      <div className="transition-all duration-300">
        {activeTab === "profile" ? (
          <div className="card-content bg-white dark:bg-zinc-900 border border-canvas-soft dark:border-zinc-800 p-8 space-y-6 rounded-3xl shadow-sm">
            <div>
              <h2 className="text-display-xs text-ink dark:text-zinc-50 font-bold tracking-tight">User Dashboard</h2>
              <p className="text-caption text-mute mt-1">
                Manage your personal profile and account settings.
              </p>
            </div>
            <div className="h-px bg-canvas-soft dark:bg-zinc-800" />
            <DashboardProfileGrid fallbackEmail={userEmail} />
            <ProfileForm />
          </div>
        ) : (
          <div className="card-content bg-white dark:bg-zinc-900 border border-canvas-soft dark:border-zinc-800 p-8 rounded-3xl shadow-sm">
            <AddressManager userId={userId} initialAddresses={initialAddresses} />
          </div>
        )}
      </div>

    </div>
  );
}
