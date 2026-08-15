import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";
import {
  BuyerRequest,
  SellerTrip,
  Payment,
  TrackingShipment,
  RequestStatus,
} from "@/types/buyer";

// Empty mock data arrays for Supabase compatibility
export const INITIAL_SELLER_TRIPS: SellerTrip[] = [];
export const INITIAL_BUYER_REQUESTS: BuyerRequest[] = [];
export const INITIAL_TRACKING_DATA: Record<string, TrackingShipment> = {};

/**
 * Fetch list of Seller Trips from Supabase
 */
export async function fetchSellerTrips(): Promise<SellerTrip[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("trips")
      .select("*, profiles:seller_id(full_name)")
      .in("status", ["active", "upcoming"]);

    if (!error && data) {
      return (data || []).map((t: any) => {
        let flag = "✈️";
        const country = t.destination_country || "";
        if (country.includes("Jepang") || country.includes("Japan")) flag = "🇯🇵";
        else if (country.includes("Singapura") || country.includes("Singapore")) flag = "🇸🇬";
        else if (country.includes("Korea")) flag = "🇰🇷";

        return {
          id: t.id,
          seller_id: t.seller_id,
          seller_name: t.profiles?.full_name || "Traveler",
          country: t.destination_country || "Luar Negeri",
          flag,
          departure_date: new Date(t.start_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
          return_date: new Date(t.end_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }),
          status: t.status === "active" ? "Aktif" : "Mendatang",
        };
      });
    }
  } catch (e) {
    console.warn("Supabase fetch seller_trips error:", e);
  }
  return [];
}

/**
 * Fetch all Buyer Requests from Supabase
 */
export async function fetchBuyerRequests(): Promise<BuyerRequest[]> {
  const supabase = createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("item_requests")
      .select(`
        *,
        trips (
          destination_country,
          profiles:seller_id (
            full_name
          )
        )
      `)
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      return (data || []).map((r: any) => ({
        id: r.id,
        user_id: r.buyer_id,
        model: r.item_name,
        merk: "-",
        kuantitas: r.quantity,
        seller_name: r.trips?.profiles?.full_name || "Traveler",
        country: r.trips?.destination_country || "Luar Negeri",
        price: r.agreed_price || r.estimated_price || 0,
        fee: r.jastip_fee || 0,
        shipping_fee: r.shipping_fee || 0,
        photo_url: r.image_url,
        alamat: r.description || "",
        status: r.status,
        created_at: r.created_at,
      }));
    }
  } catch (e) {
    console.warn("Supabase fetch buyer_requests error:", e);
  }
  return [];
}

/**
 * Fetch single Buyer Request by ID
 */
export async function fetchBuyerRequestById(id: string): Promise<BuyerRequest | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("item_requests")
      .select(`
        *,
        trips (
          destination_country,
          profiles:seller_id (
            full_name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (!error && data) {
      const r: any = data;
      return {
        id: r.id,
        user_id: r.buyer_id,
        model: r.item_name,
        merk: "-",
        kuantitas: r.quantity,
        seller_name: r.trips?.profiles?.full_name || "Traveler",
        country: r.trips?.destination_country || "Luar Negeri",
        price: r.agreed_price || r.estimated_price || 0,
        fee: r.jastip_fee || 0,
        shipping_fee: r.shipping_fee || 0,
        photo_url: r.image_url,
        alamat: r.description || "",
        status: r.status,
        created_at: r.created_at,
      };
    }
  } catch (e) {
    console.warn("Supabase fetch request by id error:", e);
  }
  return null;
}

/**
 * Create a new Buyer Request
 */
export async function createBuyerRequest(
  payload: Omit<BuyerRequest, "id" | "fee" | "status" | "created_at"> & {
    price?: number;
    shipping_fee?: number;
  }
): Promise<BuyerRequest> {
  const supabase = createClient();
  const price = payload.price || 0;
  const fee = Math.round(price * 0.1); // 10% fee
  const shipping_fee = payload.shipping_fee || 35000;

  let userId: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {}

  // Match active trip
  let tripId: string | null = null;
  try {
    const { data: matchedTrip } = await supabase
      .from("trips")
      .select("id")
      .eq("destination_country", payload.country)
      .eq("status", "active")
      .limit(1)
      .single();
    tripId = matchedTrip?.id || null;
  } catch {}

  if (!tripId) {
    try {
      const { data: anyTrip } = await supabase
        .from("trips")
        .select("id")
        .eq("status", "active")
        .limit(1)
        .single();
      tripId = anyTrip?.id || null;
    } catch {}
  }

  const { data: inserted, error } = await supabase
    .from("item_requests")
    .insert({
      trip_id: tripId,
      buyer_id: userId,
      item_name: `${payload.model} (${payload.merk})`,
      description: payload.alamat,
      quantity: payload.kuantitas,
      estimated_price: price,
      jastip_fee: fee,
      shipping_fee: shipping_fee,
      image_url: payload.photo_url,
      status: "pending",
    })
    .select(`
      *,
      trips (
        destination_country,
        profiles:seller_id (
          full_name
        )
      )
    `)
    .single();

  if (error) {
    console.warn("Supabase insert item_requests error:", error);
  }

  const r: any = inserted || {};
  return {
    id: r.id || `REQ-${Date.now()}`,
    user_id: r.buyer_id || userId,
    model: payload.model,
    merk: payload.merk,
    kuantitas: payload.kuantitas,
    seller_name: r.trips?.profiles?.full_name || payload.seller_name,
    country: r.trips?.destination_country || payload.country,
    price,
    fee,
    shipping_fee,
    photo_url: payload.photo_url,
    alamat: payload.alamat,
    status: (r.status as RequestStatus) || "pending",
    created_at: r.created_at || new Date().toISOString(),
  };
}

/**
 * Update request status (e.g. cancel, accept, purchase)
 */
export async function updateRequestStatus(
  id: string,
  status: RequestStatus
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("item_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.warn("Supabase updateRequestStatus error:", error);
    }
  } catch (e) {
    console.warn("Supabase update error:", e);
  }

  return true;
}

/**
 * Upload file to Supabase Storage with local data URL fallback
 */
export async function uploadToStorage(
  file: File,
  bucket: "avatars" | "request-photos" | "payment-proofs"
): Promise<string> {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${fileName}`;

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    } else {
      console.warn(`Storage upload to ${bucket} error:`, error);
    }
  } catch (e) {
    console.warn(`Failed storage upload to ${bucket}:`, e);
  }

  // Fallback: Convert to object URL or base64
  return URL.createObjectURL(file);
}

/**
 * Submit Payment Proof
 */
export async function submitBuyerPayment(params: {
  request_id: string;
  bank_account: string;
  proof_file?: File | null;
  proof_url?: string;
  amount: number;
}): Promise<Payment> {
  const supabase = createClient();

  let finalProofUrl = params.proof_url || "";
  if (params.proof_file) {
    finalProofUrl = await uploadToStorage(params.proof_file, "payment-proofs");
  }

  let userId: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {}

  // Update request status to paid
  await updateRequestStatus(params.request_id, "paid");

  return {
    id: `PAY-${Date.now()}`,
    request_id: params.request_id,
    user_id: userId,
    bank_account: params.bank_account,
    proof_url: finalProofUrl,
    amount: params.amount,
  };
}

/**
 * Fetch FedEx Tracking Data for a request
 */
export async function fetchTrackingData(requestId: string): Promise<TrackingShipment | null> {
  const supabase = createClient();

  try {
    // 1. Get shipment_id from shipment_items
    const { data: item, error: err1 } = await supabase
      .from("shipment_items")
      .select("shipment_id")
      .eq("item_request_id", requestId)
      .maybeSingle();

    if (!err1 && item?.shipment_id) {
      // 2. Query shipments details
      const { data: shipment, error: err2 } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", item.shipment_id)
        .single();

      if (!err2 && shipment) {
        // 3. Query tracking events
        const { data: events } = await supabase
          .from("shipment_tracking_events")
          .select("*")
          .eq("shipment_id", shipment.id)
          .order("created_at", { ascending: false });

        return {
          id: 1,
          request_id: requestId,
          courier: "FedEx Express",
          resi: shipment.fedex_tracking_number || "Pending Courier Assignment",
          service_type: "FedEx International Priority®",
          estimated_delivery: "Estimasi Pengiriman Aktif",
          steps: (events || []).map((e, index) => ({
            id: index + 1,
            title: e.status_details || "Update Transit",
            date: new Date(e.created_at).toLocaleDateString("id-ID"),
            status: index === 0 ? "active" : "completed",
          })),
          timeline_logs: (events || []).map((e) => ({
            date: new Date(e.created_at).toLocaleString("id-ID"),
            location: e.location || "TRANSIT HUB",
            note: e.status_details || "Shipment in transit",
          })),
        };
      }
    }
  } catch (e) {
    console.warn("Supabase fetch tracking error:", e);
  }

  return null;
}

/**
 * Fetch Current User Profile
 */
export async function fetchUserProfile(): Promise<Profile | null> {
  const supabase = createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      return data as Profile;
    }
  } catch (e) {
    console.warn("Supabase fetch profile error:", e);
  }
  return null;
}

/**
 * Update Current User Profile
 */
export async function updateUserProfile(updates: Partial<Profile>): Promise<boolean> {
  const supabase = createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return !error;
  } catch (e) {
    console.warn("Supabase update profile error:", e);
    return false;
  }
}
