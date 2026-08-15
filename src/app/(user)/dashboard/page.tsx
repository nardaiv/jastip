import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardProfileGrid } from "@/components/DashboardProfileGrid";
import { ProfileForm } from "@/components/ProfileForm";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Buyer Quick Action Bar */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Jastip Buyer Central</h2>
          <p className="text-sm text-slate-600">Akses cepat menu titipan barang dan pelacakan kurir.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/"
            className="px-4 py-2 bg-brand-green-light text-brand-green font-bold rounded-xl text-sm hover:bg-emerald-100 transition-colors"
          >
            📋 Daftar Request
          </Link>
          <Link
            href="/request"
            className="px-4 py-2 bg-brand-green text-white font-bold rounded-xl text-sm hover:opacity-90 transition-all shadow-xs"
          >
            + Buat Request
          </Link>
          <Link
            href="/tracking"
            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors"
          >
            📦 Lacak FedEx
          </Link>
        </div>
      </div>

      <div className="card-content bg-white border border-slate-200 p-8 space-y-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 tracking-tight">Akun & Profil Pengguna</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola detail profil pribadi dan informasi akun Supabase Auth Anda.
          </p>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Dynamic client-side reactive profile data grid using Zustand */}
        <DashboardProfileGrid fallbackEmail={user.email || ""} />

        {/* Dynamic profile edit form validating with Zod and updating Zustand store */}
        <ProfileForm />
      </div>
    </div>
  );
}
