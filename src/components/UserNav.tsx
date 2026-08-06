"use client";

import { useUserStore } from "@/providers/user-store-provider";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function UserNav({ fallbackEmail }: { fallbackEmail: string }) {
  const profile = useUserStore((s) => s.profile);

  const displayName = profile?.full_name || fallbackEmail || "User";
  const displayRole = profile?.role || "buyer";
  const avatarLetter = displayName[0].toUpperCase();

  return (
    <div className="flex items-center gap-4">
      {/* Account Information */}
      <div className="hidden sm:flex flex-col items-end text-xs">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {displayName}
        </span>
        <span className="capitalize font-medium text-zinc-500 dark:text-zinc-400">
          {displayRole}
        </span>
      </div>

      {/* Profile Letter Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900">
        {avatarLetter}
      </div>

      {/* Logout Action */}
      <form action={logout}>
        <Button
          variant="outline"
          size="sm"
          type="submit"
          className="cursor-pointer font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700 h-9"
        >
          Log Out
        </Button>
      </form>
    </div>
  );
}
