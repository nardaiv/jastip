import { createClient } from "@/lib/supabase/server";
import { LandingPageClient } from "@/components/LandingPageClient";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch real trips (limit to 3, sorted by earliest start date)
  const { data: dbTrips } = await supabase
    .from("trips")
    .select("*, seller:profiles!seller_id(id, full_name, email)")
    .in("status", ["active", "upcoming"])
    .order("start_date", { ascending: true })
    .limit(3);

  const activeTrips = dbTrips || [];
  const heroTrip = activeTrips.length > 0 ? activeTrips[0] : null;

  return (
    <LandingPageClient
      user={user}
      activeTrips={activeTrips}
      heroTrip={heroTrip}
    />
  );
}
