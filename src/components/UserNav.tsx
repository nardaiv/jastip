"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/providers/user-store-provider";
import { logout } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/client";

export function UserNav({ fallbackEmail }: { fallbackEmail: string }) {
  const profile = useUserStore((s) => s.profile);
  // Gunakan setProfile atau updateProfile sesuai dengan yang tersedia di store Anda
  const setProfile = useUserStore((s) => s.setProfile || s.updateProfile); 
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Mencegah hydration error saat render pertama kali
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Ambil data profil & role terbaru dari Supabase saat komponen dimuat
  useEffect(() => {
    async function syncProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (userProfile && setProfile) {
          setProfile(userProfile);
        }
      }
    }

    syncProfile();
  }, [setProfile]);

  const displayName = profile?.full_name || fallbackEmail || "User";
  const displayRole = profile?.role || "buyer";
  const avatarLetter = displayName[0].toUpperCase();

  // 1. Menu Default (Semua Role Punya Ini)
  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
  ];

  // 2. Tambahan Menu Khusus Seller
  if (displayRole === "seller") {
    navItems.push(
      { name: "Trip", href: "/seller/trip" },
      { name: "Titipan", href: "/seller/orders" }
    );
  }

  // 3. Tambahan Menu Khusus Admin
  if (displayRole === "admin") {
    navItems.push(
      { name: "Admin", href: "/admin" }
    );
  }

  // Render aman untuk menghindari pergeseran UI
  if (!isClient) return null;

  return (
    <div className="flex w-full items-center justify-between">
      {/* KIRI: Navigasi Dinamis Berdasarkan Role */}
      <nav className="flex items-center gap-6 mr-6">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          
          const isAdminMenu = item.name === "Admin";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors ${
                isAdminMenu
                  ? isActive
                    ? "text-[#FF0000] font-bold" // Admin Aktif (Merah Terang)
                    : "text-[#FF0000]/50 font-medium hover:text-[#FF0000]" // Admin Non-Aktif (Merah Redup, terang saat di-hover)
                  : isActive
                  ? "text-foreground font-bold hover:text-foreground" // Standar Aktif
                  : "text-muted-foreground font-medium hover:text-foreground" // Standar Non-Aktif
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* KANAN: Informasi Akun & Role Asli */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end text-right">
          <span className="text-body-sm-strong text-ink dark:text-zinc-50">
            {displayName}
          </span>
          <span className="capitalize text-caption text-mute">
            {displayRole}
          </span>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas-soft text-ink font-bold border border-canvas-soft dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
          {avatarLetter}
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="button-tertiary text-xs py-1.5 px-3 rounded-xl h-8 font-semibold flex items-center justify-center"
          >
            Log Out
          </button>
        </form>
      </div>
    </div>
  );
}