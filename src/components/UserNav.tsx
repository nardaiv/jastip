"use client";

import { useUserStore } from "@/providers/user-store-provider";
import { logout } from "@/app/login/actions";

export function UserNav({ fallbackEmail }: { fallbackEmail: string }) {
  const profile = useUserStore((s) => s.profile);

  const displayName = profile?.full_name || fallbackEmail || "User";
  const displayRole = profile?.role || "buyer";
  const avatarLetter = displayName[0].toUpperCase();

  return (
    <div className="flex items-center gap-4">
      {/* Account Information */}
      <div className="hidden sm:flex flex-col items-end text-right">
        <span className="text-body-sm-strong text-ink dark:text-zinc-50">
          {displayName}
        </span>
        <span className="capitalize text-caption text-mute">
          {displayRole}
        </span>
      </div>

      {/* Profile Letter Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas-soft text-ink font-bold border border-canvas-soft dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
        {avatarLetter}
      </div>

      {/* Logout Action */}
      <form action={logout}>
        <button
          type="submit"
          className="button-tertiary text-xs py-1.5 px-3 rounded-xl h-8 font-semibold flex items-center justify-center"
        >
          Log Out
        </button>
      </form>
    </div>
  );
}
