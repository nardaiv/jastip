"use client";

import { useUserStore } from "@/providers/user-store-provider";

export function DashboardProfileGrid({ fallbackEmail }: { fallbackEmail: string }) {
  const profile = useUserStore((s) => s.profile);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card-feature-sage flex flex-col justify-center gap-1.5 border border-ink/5 dark:bg-zinc-800/50 dark:border-zinc-700/50">
        <span className="text-caption font-semibold text-mute uppercase tracking-wider">Account Email</span>
        <p className="text-body-md-strong text-ink dark:text-zinc-200">{profile?.email || fallbackEmail}</p>
      </div>
      
      <div className="card-feature-sage flex flex-col justify-center gap-1.5 border border-ink/5 dark:bg-zinc-800/50 dark:border-zinc-700/50">
        <span className="text-caption font-semibold text-mute uppercase tracking-wider">Full Name</span>
        <p className="text-body-md-strong text-ink dark:text-zinc-200">{profile?.full_name || "Not set"}</p>
      </div>

      <div className="card-feature-sage flex flex-col justify-center gap-2 border border-ink/5 dark:bg-zinc-800/50 dark:border-zinc-700/50">
        <span className="text-caption font-semibold text-mute uppercase tracking-wider">User Role</span>
        <div>
          <span className="badge-positive inline-block capitalize">
            {profile?.role || "buyer"}
          </span>
        </div>
      </div>

      <div className="card-feature-sage flex flex-col justify-center gap-2 border border-ink/5 dark:bg-zinc-800/50 dark:border-zinc-700/50">
        <span className="text-caption font-semibold text-mute uppercase tracking-wider">Account Status</span>
        <div>
          <span className={profile?.is_active ? "badge-positive" : "badge-negative"}>
            {profile?.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
    </div>
  );
}
