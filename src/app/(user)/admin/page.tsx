import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/AdminDashboard";

export default async function AdminPage() {
  const supabase = await createClient();
  const [{ data: profiles }, { data: trips }, { data: itemRequests }] =
    await Promise.all([
      supabase.from("profiles").select("*"),
      supabase
        .from("trips")
        .select("*, seller:profiles(id, full_name, email)"),
      supabase
        .from("item_requests")
        .select(
          "*, buyer:profiles(id, full_name, email), trip:trips(id, title, destination_country, destination_city, seller_id, seller:profiles(id, full_name, email))",
        ),
    ]);

  // Fallback if joined queries failed or returned no relations
  let safeTrips = trips;
  if (!safeTrips) {
    const { data: fallbackTrips } = await supabase.from("trips").select("*");
    safeTrips = fallbackTrips;
  }

  let safeRequests = itemRequests;
  if (!safeRequests) {
    const { data: fallbackRequests } = await supabase
      .from("item_requests")
      .select("*");
    safeRequests = fallbackRequests;
  }

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

        <AdminDashboard
          initialProfiles={profiles}
          initialTrips={safeTrips}
          initialItemRequests={safeRequests}
        />
      </div>
    </div>
  );
}

