"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/providers/user-store-provider";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const storeProfile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);

  const [localUser, setLocalUser] = useState<{
    name: string;
    role: string;
    avatarLetter: string;
    avatarUrl?: string | null;
  }>({
    name: "Ahmad Test",
    role: "Buyer",
    avatarLetter: "A",
  });

  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profile) {
            setProfile(profile);
            const name = profile.full_name || user.email?.split("@")[0] || "Buyer";
            setLocalUser({
              name,
              role: profile.role || "Buyer",
              avatarLetter: name.charAt(0).toUpperCase(),
              avatarUrl: profile.avatar_url,
            });
            return;
          }
        }
      } catch (e) {
        console.warn("Navbar auth load:", e);
      }

      // Check stored custom profile name in localStorage
      const savedProfileName = localStorage.getItem("jastip_profile_name");
      const savedProfilePhone = localStorage.getItem("jastip_profile_phone");
      if (savedProfileName) {
        setLocalUser({
          name: savedProfileName,
          role: "Buyer",
          avatarLetter: savedProfileName.charAt(0).toUpperCase(),
        });
      }
    }

    loadUser();
  }, [setProfile, supabase]);

  // Sync with zustand if changed
  useEffect(() => {
    if (storeProfile) {
      const name = storeProfile.full_name || "Buyer";
      setLocalUser({
        name,
        role: storeProfile.role || "Buyer",
        avatarLetter: name.charAt(0).toUpperCase(),
        avatarUrl: storeProfile.avatar_url,
      });
    }
  }, [storeProfile]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    router.push("/login");
  };

  const isActive = (path: string) => {
    if (path === "/" && (pathname === "/" || pathname === "/dashboard")) return true;
    return pathname.startsWith(path) && path !== "/";
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 py-3.5 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* BAGIAN KIRI: Logo & Navigasi */}
        <div className="flex items-center gap-6 sm:gap-10">
          {/* Logo Jastip dengan Icon Kubus Hijau */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center border border-brand-green/20 group-hover:scale-105 transition-all">
              <svg
                className="w-5 h-5 text-brand-green transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <span className="font-extrabold text-2xl text-slate-950 tracking-tight">
              Jastip
            </span>
          </Link>

          {/* Navigasi Menu Kiri */}
          <nav className="flex items-center gap-4 sm:gap-6 text-sm font-semibold">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isActive("/")
                  ? "bg-brand-green-light text-brand-green font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
              }`}
            >
              Dashboard
            </Link>

            <Link
              href="/request"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isActive("/request")
                  ? "bg-brand-green-light text-brand-green font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
              }`}
            >
              Request
            </Link>
          </nav>
        </div>

        {/* BAGIAN KANAN: User Profile & Log Out */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex flex-col items-end text-right leading-tight">
            <p className="text-sm font-bold text-slate-950">{localUser.name}</p>
            <span className="text-xs font-semibold text-brand-green uppercase tracking-wider">{localUser.role}</span>
          </div>

          {/* Klik Photo Profile untuk berpindah ke halaman edit profile */}
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full bg-brand-green-light text-brand-green font-bold text-base flex items-center justify-center hover:ring-2 hover:ring-brand-green transition-all shadow-xs border border-emerald-200 cursor-pointer overflow-hidden"
            title="Edit Profile"
          >
            {localUser.avatarUrl ? (
              <img
                src={localUser.avatarUrl}
                alt={localUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{localUser.avatarLetter}</span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-300 rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Log Out
          </button>
        </div>

      </div>
    </header>
  );
}
export default Navbar;
