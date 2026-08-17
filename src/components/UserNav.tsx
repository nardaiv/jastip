"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/providers/user-store-provider";
import { logout } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/client";
import { User, Key, MapPin, LogOut, ChevronDown } from "lucide-react";

export function UserNav({ fallbackEmail }: { fallbackEmail: string }) {
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile || s.updateProfile); 
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    if (!showDropdown) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".user-nav-dropdown-container")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [showDropdown]);

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

      {/* KANAN: Informasi Akun & Dropdown */}
      <div className="relative user-nav-dropdown-container flex items-center gap-4">
        {/* Toggle Dropdown Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800/50 p-1.5 rounded-full transition-all focus:outline-none cursor-pointer border border-transparent hover:border-slate-100"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shadow-xs"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green-light text-brand-green font-bold border border-emerald-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 shadow-xs">
              {avatarLetter}
            </div>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Menu (Google Style) */}
        {showDropdown && (
          <div className="absolute right-0 top-12 z-50 w-72 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
            {/* Account Info Profile (Google layout) */}
            <div className="flex flex-col items-center text-center pb-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2 truncate w-full px-2 text-center">
                {fallbackEmail}
              </span>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="h-16 w-16 rounded-full object-cover border-2 border-emerald-100 dark:border-zinc-700 shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-light text-brand-green font-extrabold text-2xl border-2 border-emerald-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 shadow-sm">
                  {avatarLetter}
                </div>
              )}
              <h4 className="text-body-lg font-bold text-slate-900 dark:text-zinc-50 mt-3 truncate w-full">
                {displayName}
              </h4>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase tracking-wider mt-1.5 shadow-xs">
                {displayRole}
              </span>
            </div>

            <div className="border-t border-slate-100 dark:border-zinc-800 my-2"></div>

            {/* Menu Options */}
            <div className="space-y-1">
              <Link
                href="/profile?tab=profile"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-zinc-50 transition-colors"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Edit Profil</span>
              </Link>
              <Link
                href="/profile?tab=addresses"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-zinc-50 transition-colors"
              >
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Kelola Alamat</span>
              </Link>
              <Link
                href="/profile?tab=security"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-zinc-50 transition-colors"
              >
                <Key className="w-4 h-4 text-slate-500" />
                <span>Ganti Password</span>
              </Link>
            </div>

            <div className="border-t border-slate-100 dark:border-zinc-800 my-2"></div>

            {/* Sign Out Button */}
            <form action={logout}>
              <button
                type="submit"
                className="w-full py-3 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 text-slate-700 dark:text-zinc-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-900 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar dari Akun</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}