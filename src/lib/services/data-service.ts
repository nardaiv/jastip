import { createClient } from "@/lib/supabase/client";
import {
  BuyerRequest,
  SellerTrip,
  Payment,
  TrackingShipment,
  Profile,
  RequestStatus,
} from "@/types/database";

// Seed mock trips fallback
export const INITIAL_SELLER_TRIPS: SellerTrip[] = [
  {
    id: 1,
    seller_name: "Budi Santoso",
    country: "🇯🇵 Jepang",
    flag: "🇯🇵",
    departure_date: "20 Agustus 2026",
    return_date: "28 Agustus 2026",
    status: "Aktif",
  },
  {
    id: 2,
    seller_name: "Siti Rahma",
    country: "🇸🇬 Singapura",
    flag: "🇸🇬",
    departure_date: "22 Agustus 2026",
    return_date: "25 Agustus 2026",
    status: "Aktif",
  },
  {
    id: 3,
    seller_name: "Andi Wijaya",
    country: "🇰🇷 Korea Selatan",
    flag: "🇰🇷",
    departure_date: "01 September 2026",
    return_date: "10 September 2026",
    status: "Mendatang",
  },
];

// Seed mock requests fallback
export const INITIAL_BUYER_REQUESTS: BuyerRequest[] = [
  {
    id: "REQ-000",
    model: "Nintendo Switch OLED Joy-Con Red/Blue",
    merk: "Nintendo",
    kuantitas: 1,
    seller_name: "Budi (Jasa Titip JP)",
    country: "🇯🇵 Jepang",
    status: "pending",
    price: 4500000,
    fee: 450000,
    shipping_fee: 40000,
    alamat: "Jl. Mawar No. 12, Jakarta",
  },
  {
    id: "REQ-001",
    model: "Matcha Powder Uji Premium 100g",
    merk: "Ito En",
    kuantitas: 2,
    seller_name: "Budi (Jasa Titip JP)",
    country: "🇯🇵 Jepang",
    status: "accepted",
    price: 265000,
    fee: 26500,
    shipping_fee: 20000,
    alamat: "Jl. Sudirman Kav 25, Jakarta Pusat",
  },
  {
    id: "REQ-002",
    model: "Sony WH-1000XM5 Noise Canceling",
    merk: "Sony",
    kuantitas: 1,
    seller_name: "Budi (Jasa Titip JP)",
    country: "🇯🇵 Jepang",
    status: "purchased",
    price: 3296700,
    fee: 329670,
    shipping_fee: 35000,
    alamat: "Jl. Gatot Subroto No. 88, Jakarta Selatan",
  },
  {
    id: "REQ-003",
    model: "MacBook Air M3 16/512GB",
    merk: "Apple",
    kuantitas: 1,
    seller_name: "Siti (SG Express)",
    country: "🇸🇬 Singapura",
    status: "rejected",
    price: 15999000,
    fee: 1599900,
    shipping_fee: 50000,
    alamat: "Jl. Asia Afrika No. 10, Bandung",
  },
  {
    id: "REQ-004",
    model: "PlayStation 5 Slim Digital Edition",
    merk: "Sony",
    kuantitas: 1,
    seller_name: "Andi (Korea Jastip)",
    country: "🇰🇷 Korea Selatan",
    status: "cancelled",
    price: 7200000,
    fee: 720000,
    shipping_fee: 60000,
    alamat: "Jl. Diponegoro No. 4, Surabaya",
  },
];

// Fallback FedEx tracking data
export const INITIAL_TRACKING_DATA: Record<string, TrackingShipment> = {
  "REQ-002": {
    id: 1,
    request_id: "REQ-002",
    courier: "FedEx Express (International Priority)",
    resi: "7734 9182 0419",
    service_type: "FedEx International Priority®",
    estimated_delivery: "26 Agustus 2026, 18:00 WIB",
    steps: [
      { id: 1, title: "Pembayaran Dikonfirmasi", date: "18 Agt 2026, 14:30", status: "completed" },
      { id: 2, title: "Shipment Picked Up (FedEx Tokyo)", date: "21 Agt 2026, 11:15", status: "completed" },
      { id: 3, title: "In Transit - Flight Departed", date: "23 Agt 2026, 08:00", status: "active" },
      { id: 4, title: "Out for Delivery (FedEx Indonesia)", date: "Estimasi 26 Agt 2026", status: "pending" },
      { id: 5, title: "Delivered", date: "-", status: "pending" },
    ],
    timeline_logs: [
      {
        date: "23 Agt 2026 - 08:00 WIB",
        location: "TOKYO - JAPAN",
        note: "International shipment release - In transit to destination hub (FedEx Express Flight FX-519)",
      },
      {
        date: "22 Agt 2026 - 19:45 WIB",
        location: "NARITA HARBOR - JAPAN",
        note: "At FedEx International Location / Clearance in progress",
      },
      {
        date: "21 Agt 2026 - 11:15 WIB",
        location: "GINZA, TOKYO - JAPAN",
        note: "Picked up by FedEx Courier",
      },
      {
        date: "18 Agt 2026 - 14:30 WIB",
        location: "JAKARTA - INDONESIA",
        note: "Shipment information sent to FedEx / Payment confirmed",
      },
    ],
  },
};

const STORAGE_KEY_REQUESTS = "jastip_buyer_requests";
const STORAGE_KEY_PAYMENTS = "jastip_payments";

// Helper to get local requests cache
function getLocalRequests(): BuyerRequest[] {
  if (typeof window === "undefined") return INITIAL_BUYER_REQUESTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_REQUESTS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Failed to read local requests:", e);
  }
  localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(INITIAL_BUYER_REQUESTS));
  return INITIAL_BUYER_REQUESTS;
}

// Helper to save local requests cache
function saveLocalRequests(requests: BuyerRequest[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  } catch (e) {
    console.warn("Failed to save local requests:", e);
  }
}

/**
 * Fetch list of Seller Trips from Supabase with graceful fallback
 */
export async function fetchSellerTrips(): Promise<SellerTrip[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("seller_trips")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data && data.length > 0) {
      return data as SellerTrip[];
    }
  } catch (e) {
    console.warn("Supabase fetch seller_trips error:", e);
  }
  return INITIAL_SELLER_TRIPS;
}

/**
 * Fetch all Buyer Requests from Supabase with fallback to local cache
 */
export async function fetchBuyerRequests(): Promise<BuyerRequest[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("buyer_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      saveLocalRequests(data as BuyerRequest[]);
      return data as BuyerRequest[];
    }
  } catch (e) {
    console.warn("Supabase fetch buyer_requests error:", e);
  }
  return getLocalRequests();
}

/**
 * Fetch single Buyer Request by ID
 */
export async function fetchBuyerRequestById(id: string): Promise<BuyerRequest | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("buyer_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      return data as BuyerRequest;
    }
  } catch (e) {
    console.warn("Supabase fetch request by id error:", e);
  }

  const local = getLocalRequests();
  return local.find((r) => r.id === id) || null;
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
  const rawIdNum = Math.floor(100 + Math.random() * 900);
  const newId = `REQ-${rawIdNum}`;
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

  const newRequest: BuyerRequest = {
    id: newId,
    user_id: userId,
    model: payload.model,
    merk: payload.merk,
    kuantitas: payload.kuantitas || 1,
    seller_name: payload.seller_name,
    country: payload.country,
    price,
    fee,
    shipping_fee,
    photo_url: payload.photo_url || null,
    alamat: payload.alamat,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  // Try Supabase insert
  try {
    const { error } = await supabase.from("buyer_requests").insert([newRequest]);
    if (error) {
      console.warn("Supabase insert buyer_requests error:", error);
    }
  } catch (e) {
    console.warn("Failed Supabase request insert:", e);
  }

  // Update local cache
  const existing = getLocalRequests();
  const updated = [newRequest, ...existing.filter((r) => r.id !== newId)];
  saveLocalRequests(updated);

  return newRequest;
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
      .from("buyer_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.warn("Supabase updateRequestStatus error:", error);
    }
  } catch (e) {
    console.warn("Supabase update error:", e);
  }

  // Update local cache
  const existing = getLocalRequests();
  const updated = existing.map((item) =>
    item.id === id ? { ...item, status } : item
  );
  saveLocalRequests(updated);
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

  const paymentData: Payment = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `PAY-${Date.now()}`,
    request_id: params.request_id,
    user_id: userId,
    bank_account: params.bank_account,
    proof_url: finalProofUrl,
    amount: params.amount,
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from("payments").insert([paymentData]);
  } catch (e) {
    console.warn("Supabase payments insert error:", e);
  }

  // Update request status to purchased or processing
  await updateRequestStatus(params.request_id, "purchased");

  return paymentData;
}

/**
 * Fetch FedEx Tracking Data for a request
 */
export async function fetchTrackingData(requestId: string): Promise<TrackingShipment> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("tracking_shipments")
      .select("*")
      .eq("request_id", requestId)
      .single();

    if (!error && data) {
      return data as TrackingShipment;
    }
  } catch (e) {
    console.warn("Supabase tracking_shipments fetch error:", e);
  }

  if (INITIAL_TRACKING_DATA[requestId]) {
    return INITIAL_TRACKING_DATA[requestId];
  }

  // Generate dynamic fallback tracking shipment for this ID
  return {
    id: 99,
    request_id: requestId,
    courier: "FedEx Express (International Priority)",
    resi: "7734 9182 0419",
    service_type: "FedEx International Priority®",
    estimated_delivery: "26 Agustus 2026, 18:00 WIB",
    steps: [
      { id: 1, title: "Pembayaran Dikonfirmasi", date: "18 Agt 2026, 14:30", status: "completed" },
      { id: 2, title: "Shipment Picked Up (FedEx Tokyo)", date: "21 Agt 2026, 11:15", status: "completed" },
      { id: 3, title: "In Transit - Flight Departed", date: "23 Agt 2026, 08:00", status: "active" },
      { id: 4, title: "Out for Delivery (FedEx Indonesia)", date: "Estimasi 26 Agt 2026", status: "pending" },
      { id: 5, title: "Delivered", date: "-", status: "pending" },
    ],
    timeline_logs: [
      {
        date: "23 Agt 2026 - 08:00 WIB",
        location: "TOKYO - JAPAN",
        note: "International shipment release - In transit to destination hub (FedEx Express Flight FX-519)",
      },
      {
        date: "22 Agt 2026 - 19:45 WIB",
        location: "NARITA HARBOR - JAPAN",
        note: "At FedEx International Location / Clearance in progress",
      },
      {
        date: "21 Agt 2026 - 11:15 WIB",
        location: "GINZA, TOKYO - JAPAN",
        note: "Picked up by FedEx Courier",
      },
      {
        date: "18 Agt 2026 - 14:30 WIB",
        location: "JAKARTA - INDONESIA",
        note: "Shipment information sent to FedEx / Payment confirmed",
      },
    ],
  };
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
