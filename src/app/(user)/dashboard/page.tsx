import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClientView, DashboardRawOrder } from "@/components/dashboard/DashboardClientView";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile to know role
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "buyer";
  const userName = profile?.full_name || user.email?.split("@")[0] || "User";
  const userEmail = profile?.email || user.email || "";

  let orders: DashboardRawOrder[] = [];
  let activeTripsCount = 0;

  try {
    if (userRole === "seller") {
      // 1. Get seller's trips
      const { data: sellerTrips } = await supabase
        .from("trips")
        .select("id, status")
        .eq("seller_id", user.id);

      if (sellerTrips) {
        activeTripsCount = sellerTrips.filter((t) => t.status === "active" || t.status === "upcoming").length;
      }

      // 2. Get seller's item requests / orders
      const { data: itemRequests, error } = await supabase
        .from("item_requests")
        .select(`
          id,
          item_name,
          quantity,
          agreed_price,
          jastip_fee,
          shipping_fee,
          total_price,
          status,
          image_url,
          created_at,
          profiles:buyer_id (
            full_name,
            phone_number
          ),
          trips:trip_id!inner (
            title,
            destination_country,
            seller_id
          )
        `)
        .eq("trips.seller_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && itemRequests) {
        orders = (itemRequests as any[]).map((item) => ({
          id: item.id,
          item_name: item.item_name,
          quantity: item.quantity || 1,
          agreed_price: item.agreed_price,
          jastip_fee: item.jastip_fee,
          shipping_fee: item.shipping_fee,
          total_price: item.total_price,
          status: item.status || "pending",
          image_url: item.image_url,
          created_at: item.created_at,
          buyer_name: item.profiles?.full_name || "Buyer",
          trip_title: item.trips?.title || "Trip",
        }));
      }
    } else if (userRole === "admin") {
      // Admin: Fetch platform-wide metrics
      const { data: allTrips } = await supabase.from("trips").select("id, status");
      if (allTrips) {
        activeTripsCount = allTrips.filter((t) => t.status === "active" || t.status === "upcoming").length;
      }

      const { data: allRequests } = await supabase
        .from("item_requests")
        .select(`
          id,
          item_name,
          quantity,
          agreed_price,
          jastip_fee,
          shipping_fee,
          total_price,
          status,
          image_url,
          created_at,
          profiles:buyer_id (
            full_name
          ),
          trips:trip_id (
            title
          )
        `)
        .order("created_at", { ascending: false });

      if (allRequests) {
        orders = (allRequests as any[]).map((item) => ({
          id: item.id,
          item_name: item.item_name,
          quantity: item.quantity || 1,
          agreed_price: item.agreed_price,
          jastip_fee: item.jastip_fee,
          shipping_fee: item.shipping_fee,
          total_price: item.total_price,
          status: item.status || "pending",
          image_url: item.image_url,
          created_at: item.created_at,
          buyer_name: item.profiles?.full_name || "User",
          trip_title: item.trips?.title || "Trip",
        }));
      }
    } else {
      // Buyer: Fetch buyer's requests
      const { data: buyerRequests } = await supabase
        .from("item_requests")
        .select(`
          id,
          item_name,
          quantity,
          agreed_price,
          jastip_fee,
          shipping_fee,
          total_price,
          status,
          image_url,
          created_at,
          trips:trip_id (
            title
          )
        `)
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (buyerRequests) {
        orders = (buyerRequests as any[]).map((item) => ({
          id: item.id,
          item_name: item.item_name,
          quantity: item.quantity || 1,
          agreed_price: item.agreed_price,
          jastip_fee: item.jastip_fee,
          shipping_fee: item.shipping_fee,
          total_price: item.total_price,
          status: item.status || "pending",
          image_url: item.image_url,
          created_at: item.created_at,
          buyer_name: userName,
          trip_title: item.trips?.title || "Trip",
        }));
      }
    }
  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4">
      <DashboardClientView
        userRole={userRole}
        userEmail={userEmail}
        userName={userName}
        orders={orders}
        activeTripsCount={activeTripsCount}
      />
    </div>
  );
}
