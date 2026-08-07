import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/AdminDashboard";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("*");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-xs p-8 border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-ink dark:text-white tracking-tight">Admin Control Panel</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Restricted dashboard accessible only to authenticated administrator accounts.
          </p>
        </div>

        <div className="h-px bg-zinc-200/85 dark:bg-zinc-800" />

        <AdminDashboard initialProfiles={profiles} />
      </div>
    </div>
  );
}

