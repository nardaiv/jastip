import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch initial addresses for the user
  const { data: addresses } = await supabase
    .from("shipping_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  return (
    <DashboardClient
      userId={user.id}
      userEmail={user.email || ""}
      initialAddresses={addresses || []}
    />
  );
}
