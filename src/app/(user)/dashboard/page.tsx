import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage your personal information and preferences
            </p>
          </div>
          <form action={logout}>
            <Button variant="outline" type="submit" className="cursor-pointer font-medium hover:bg-zinc-50 border-zinc-200">
              Log Out
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Logged in as:{" "}
            <span className="font-semibold text-gray-800">{user.email}</span>
          </p>
          <div>
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-100">
              Role: {profile?.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
