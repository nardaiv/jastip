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
      <div className="flex border-b border-black/[0.04] dark:border-white/[0.05]">
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
          <div className="card-content bg-white dark:bg-zinc-900 border border-black/[0.04] dark:border-white/[0.05] p-8 space-y-6 rounded-3xl shadow-xs">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Pengaturan Profil & Akun</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kelola informasi identitas dan preferensi akun Anda.
              </p>
            </div>
            <div className="h-px bg-muted/40" />
            <DashboardProfileGrid fallbackEmail={userEmail} />
            <ProfileForm />
          </div>
        ) : (
          <div className="card-content bg-white dark:bg-zinc-900 border border-black/[0.04] dark:border-white/[0.05] p-8 rounded-3xl shadow-xs">
            <AddressManager userId={userId} initialAddresses={initialAddresses} />
          </div>
        )}
      </div>

    </div>
  );
}
