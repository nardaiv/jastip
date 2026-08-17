import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";
import {
  BuyerRequest,
  SellerTrip,
  Payment,
  TrackingShipment,
  RequestStatus,
} from "@/types/buyer";
import { sendRequestStatusEmail, updateRequestStatusAction } from "@/app/actions/email";

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
 * Fetch a single seller trip by its ID from Supabase
 */
export async function fetchTripById(tripId: string): Promise<SellerTrip | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("trips")
      .select("*, profiles:seller_id(full_name)")
      .eq("id", tripId)
      .single();

    if (!error && data) {
      const t = data;
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
    }
  } catch (e) {
    console.warn("Supabase fetch trip by id error:", e);
  }
  return null;
}

/**
 * Fetch shipping addresses for current user
 */
export async function fetchUserShippingAddresses(): Promise<any[]> {
  const supabase = createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("shipping_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });

    if (!error && data) {
      return data;
    }
  } catch (e) {
    console.warn("Supabase fetch shipping addresses error:", e);
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
        trip_id: r.trip_id,
        item_name: r.item_name,
        description: r.description,
        quantity: r.quantity,
        seller_name: r.trips?.profiles?.full_name || "Traveler",
        country: r.trips?.destination_country || "Luar Negeri",
        estimated_price: r.estimated_price || 0,
        currency: r.currency || "IDR",
        jastip_fee: r.jastip_fee || 0,
        shipping_fee: r.shipping_fee || 0,
        total_price: r.total_price || 0,
        reference_link: r.reference_link,
        image_url: r.image_url,
        shipping_address_id: r.shipping_address_id,
        weight_value: r.weight_value,
        weight_unit: r.weight_unit,
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
        trip_id: r.trip_id,
        item_name: r.item_name,
        description: r.description,
        quantity: r.quantity,
        seller_name: r.trips?.profiles?.full_name || "Traveler",
        country: r.trips?.destination_country || "Luar Negeri",
        estimated_price: r.estimated_price || 0,
        currency: r.currency || "IDR",
        jastip_fee: r.jastip_fee || 0,
        shipping_fee: r.shipping_fee || 0,
        total_price: r.total_price || 0,
        reference_link: r.reference_link,
        image_url: r.image_url,
        shipping_address_id: r.shipping_address_id,
        weight_value: r.weight_value,
        weight_unit: r.weight_unit,
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
  payload: Omit<BuyerRequest, "id" | "seller_name" | "country" | "status" | "created_at">
): Promise<BuyerRequest> {
  const supabase = createClient();
  const estimated_price = payload.estimated_price || 0;
  const jastip_fee = Math.round(estimated_price * 0.1); // 10% fee
  const shipping_fee = payload.shipping_fee || 0;
  const total_price = estimated_price * payload.quantity + jastip_fee + shipping_fee;

  let userId: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {}

  const { data: inserted, error } = await supabase
    .from("item_requests")
    .insert({
      trip_id: payload.trip_id,
      buyer_id: userId,
      item_name: payload.item_name,
      description: payload.description,
      quantity: payload.quantity,
      estimated_price: estimated_price,
      currency: payload.currency || "IDR",
      jastip_fee: jastip_fee,
      shipping_fee: shipping_fee,
      total_price: total_price,
      reference_link: payload.reference_link,
      image_url: payload.image_url,
      shipping_address_id: payload.shipping_address_id || null,
      weight_value: payload.weight_value || null,
      weight_unit: payload.weight_unit || "KG",
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
  } else if (inserted?.id) {
    sendRequestStatusEmail(inserted.id, "pending").catch((e) =>
      console.error("Email notification error:", e)
    );
  }

  const r: any = inserted || {};
  return {
    id: r.id || `REQ-${Date.now()}`,
    user_id: r.buyer_id || userId,
    trip_id: r.trip_id || payload.trip_id,
    item_name: r.item_name || payload.item_name,
    description: r.description || payload.description,
    quantity: r.quantity || payload.quantity,
    seller_name: r.trips?.profiles?.full_name || "Traveler",
    country: r.trips?.destination_country || "Luar Negeri",
    estimated_price: r.estimated_price !== undefined ? r.estimated_price : estimated_price,
    currency: r.currency || payload.currency || "IDR",
    jastip_fee: r.jastip_fee !== undefined ? r.jastip_fee : jastip_fee,
    shipping_fee: r.shipping_fee !== undefined ? r.shipping_fee : shipping_fee,
    total_price: r.total_price !== undefined ? r.total_price : total_price,
    reference_link: r.reference_link || payload.reference_link,
    image_url: r.image_url || payload.image_url,
    shipping_address_id: r.shipping_address_id || payload.shipping_address_id,
    weight_value: r.weight_value || payload.weight_value,
    weight_unit: r.weight_unit || payload.weight_unit,
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
  try {
    const res = await updateRequestStatusAction(id, status);
    if (!res.success) {
      console.warn("updateRequestStatusAction failed:", res.error);
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
  bucket: "avatars" | "request-photos" | "payment-proofs" | "item-requests"
): Promise<string> {
  // Validate that the file is an image
  if (!file.type.startsWith("image/")) {
    throw new Error("Tipe file tidak valid. Harap unggah file gambar saja.");
  }
  // Validate that the file size is <= 5MB (5 * 1024 * 1024 bytes)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Ukuran file melebihi batas 5 MB.");
  }

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
          shipment_id: shipment.id,
          request_id: requestId,
          courier: "FedEx Express",
          resi: shipment.fedex_tracking_number || "Pending Courier Assignment",
          service_type: shipment.service_type || "FedEx International Priority®",
          estimated_delivery: shipment.estimated_delivery_date
            ? new Date(shipment.estimated_delivery_date).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "Estimasi Pengiriman Aktif",
          steps: events && events.length > 0
            ? events.map((e, index) => ({
                id: index + 1,
                title: e.event_description || "Update Transit",
                date: new Date(e.event_timestamp || e.created_at).toLocaleDateString("id-ID"),
                status: index === 0 ? "active" : "completed",
              }))
            : [
                {
                  id: 1,
                  title: "Shipment Label Created",
                  date: new Date(shipment.created_at).toLocaleDateString("id-ID"),
                  status: "active",
                },
              ],
          timeline_logs: events && events.length > 0
            ? events.map((e) => {
                const locArr = [e.location_city, e.location_country].filter(Boolean);
                const location = locArr.length > 0 ? locArr.join(", ") : "TRANSIT HUB";
                return {
                  date: new Date(e.event_timestamp || e.created_at).toLocaleString("id-ID"),
                  location,
                  note: e.event_description || "Shipment in transit",
                };
              })
            : [
                {
                  date: new Date(shipment.created_at).toLocaleString("id-ID"),
                  location: "FedEx Origin Facility",
                  note: "Shipping label has been created. The shipment is being prepared for pickup.",
                },
              ],
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
