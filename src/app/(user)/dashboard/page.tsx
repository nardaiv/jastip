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
    <div className="max-w-3xl mx-auto">
      <div className="card-content bg-white border border-canvas-soft p-8 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
        <div>
          <h1 className="text-display-sm font-bold text-ink dark:text-zinc-50 tracking-tight">User Dashboard</h1>
          <p className="text-caption text-mute mt-1">
            Manage your personal profile and account settings.
          </p>
        </div>

        <div className="h-px bg-canvas-soft dark:bg-zinc-800" />

        {/* Dynamic client-side reactive profile data grid using Zustand */}
        <DashboardProfileGrid fallbackEmail={user.email || ""} />

        {/* Dynamic profile edit form validating with Zod and updating Zustand store */}
        <ProfileForm />
      </div>
    </div>
  );
}
