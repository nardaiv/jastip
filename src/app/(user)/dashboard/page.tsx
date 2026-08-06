import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardProfileGrid } from "@/components/DashboardProfileGrid";
import { ProfileForm } from "@/components/ProfileForm";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-xs p-8 border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">User Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Manage your personal profile and account settings.
          </p>
        </div>

        <div className="h-px bg-zinc-200/85 dark:bg-zinc-800" />

        {/* Dynamic client-side reactive profile data grid using Zustand */}
        <DashboardProfileGrid fallbackEmail={user.email || ""} />

        {/* Dynamic profile edit form validating with Zod and updating Zustand store */}
        <ProfileForm />
      </div>
    </div>
  );
}
