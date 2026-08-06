"use client";

import { useUserStore } from "@/providers/user-store-provider";

export function DashboardProfileGrid({ fallbackEmail }: { fallbackEmail: string }) {
  const profile = useUserStore((s) => s.profile);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-1.5 p-4 rounded-xl bg-zinc-50/50 border border-zinc-200/50 dark:bg-zinc-950/20 dark:border-zinc-800/50">
        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Account Email</span>
        <p className="font-semibold text-zinc-800 dark:text-zinc-200">{profile?.email || fallbackEmail}</p>
      </div>
      
      <div className="space-y-1.5 p-4 rounded-xl bg-zinc-50/50 border border-zinc-200/50 dark:bg-zinc-950/20 dark:border-zinc-800/50">
        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Full Name</span>
        <p className="font-semibold text-zinc-800 dark:text-zinc-200">{profile?.full_name || "Not set"}</p>
      </div>

      <div className="space-y-1.5 p-4 rounded-xl bg-zinc-50/50 border border-zinc-200/50 dark:bg-zinc-950/20 dark:border-zinc-800/50">
        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">User Role</span>
        <div>
          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-100 dark:border-blue-900">
            {profile?.role || "buyer"}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 p-4 rounded-xl bg-zinc-50/50 border border-zinc-200/50 dark:bg-zinc-950/20 dark:border-zinc-800/50">
        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Account Status</span>
        <div>
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider border border-emerald-100 dark:border-emerald-900">
            {profile?.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
    </div>
  );
}
