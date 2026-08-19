"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { trackShipment, createFedExShipment, alignFedExAddress } from "@/lib/fedex/client";
import { sendRequestStatusEmail } from "@/app/actions/email";

export interface CreateShipmentParams {
  tripId: string;
  sellerId: string;
  buyerId: string;
  senderAddressId: string | null;
  recipientAddressId: string | null;
  serviceType: string;
  packagingType: string;
  weightValue: number;
  weightUnit: "KG" | "LB";
  lengthValue?: number | null;
  widthValue?: number | null;
  heightValue?: number | null;
  dimensionUnit?: "CM" | "IN" | null;
  declaredValue?: number;
  declaredCurrency?: string;
  fedexTrackingNumber?: string | null;
  itemRequestIds: string[];
  itemQuantities: number[];
}

export interface UpdateShipmentParams {
  shipmentId: string;
  fedexTrackingNumber?: string | null;
  serviceType?: string;
  packagingType?: string;
  status?: string;
  weightValue?: number;
  weightUnit?: "KG" | "LB";
  lengthValue?: number | null;
  widthValue?: number | null;
  heightValue?: number | null;
  dimensionUnit?: "CM" | "IN" | null;
}

/**
 * Creates a new shipment record, maps packed items to it, and updates their status to 'purchased'.
 */
export async function createShipment(params: CreateShipmentParams) {
  const supabase = await createClient();

  // 1. Insert shipment record
  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .insert({
      trip_id: params.tripId,
      seller_id: params.sellerId,
      buyer_id: params.buyerId,
      sender_address_id: params.senderAddressId || null,
      recipient_address_id: params.recipientAddressId || null,
      fedex_tracking_number: params.fedexTrackingNumber || null,
      service_type: params.serviceType,
      packaging_type: params.packagingType,
      weight_value: params.weightValue,
      weight_unit: params.weightUnit,
      length_value: params.lengthValue || null,
      width_value: params.widthValue || null,
      height_value: params.heightValue || null,
      dimension_unit: params.dimensionUnit || "CM",
      declared_value: params.declaredValue || 0,
      declared_currency: params.declaredCurrency || "USD",
      status: params.fedexTrackingNumber ? "label_created" : "draft",
    })
    .select("id")
    .single();

  if (shipmentError || !shipment) {
    throw new Error(`Failed to create shipment record: ${shipmentError?.message}`);
  }

  // 2. Insert items and transition request statuses
  for (let i = 0; i < params.itemRequestIds.length; i++) {
    const requestId = params.itemRequestIds[i];
    const packedQty = params.itemQuantities[i];

    // Insert into shipment_items
    const { error: itemError } = await supabase
      .from("shipment_items")
      .insert({
        shipment_id: shipment.id,
        item_request_id: requestId,
        packed_quantity: packedQty,
      });

    if (itemError) {
      throw new Error(`Failed to associate item request ${requestId} to shipment: ${itemError.message}`);
    }

    // Transition item status to "purchased" (if it is accepted)
    await supabase
      .from("item_requests")
      .update({
        status: "purchased",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    sendRequestStatusEmail(requestId, "purchased").catch((e) =>
      console.error("Email notification error:", e)
    );
  }

  // 3. Trigger initial FedEx tracking query if tracking number is provided
  if (params.fedexTrackingNumber) {
    try {
      await getShipmentTracking(shipment.id);
    } catch (e) {
      console.warn("Initial FedEx tracking sync skipped during creation:", e);
    }
  }

  revalidatePath("/(user)/admin");
  return { success: true, shipmentId: shipment.id };
}

/**
 * Updates shipment metadata such as tracking numbers, status, or parcel attributes.
 */
export async function updateShipmentDetails(params: UpdateShipmentParams) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {
    fedex_tracking_number: params.fedexTrackingNumber || null,
    updated_at: new Date().toISOString(),
  };

  if (params.serviceType) updates.service_type = params.serviceType;
  if (params.packagingType) updates.packaging_type = params.packagingType;
  if (params.status) updates.status = params.status;
  if (params.weightValue) updates.weight_value = params.weightValue;
  if (params.weightUnit) updates.weight_unit = params.weightUnit;
  if (params.lengthValue !== undefined) updates.length_value = params.lengthValue;
  if (params.widthValue !== undefined) updates.width_value = params.widthValue;
  if (params.heightValue !== undefined) updates.height_value = params.heightValue;
  if (params.dimensionUnit !== undefined) updates.dimension_unit = params.dimensionUnit;

  const { error } = await supabase
    .from("shipments")
    .update(updates)
    .eq("id", params.shipmentId);

  if (error) {
    throw new Error(`Failed to update shipment: ${error.message}`);
  }

  // If tracking number is updated, trigger sync
  if (params.fedexTrackingNumber) {
    try {
      await getShipmentTracking(params.shipmentId);
    } catch (e) {
      console.warn("FedEx tracking sync skipped during update:", e);
    }
  }

  revalidatePath("/(user)/admin");
  return { success: true };
}

/**
 * Syncs FedEx Live tracking details for a shipment. Pulls scan logs from the API, 
 * updates the shipment delivery status, and logs tracking events into shipment_tracking_events.
 */
export async function getShipmentTracking(shipmentId: string) {
  const supabase = await createClient();

  // 1. Get tracking number from shipment
  const { data: shipment, error: dbError } = await supabase
    .from("shipments")
    .select("fedex_tracking_number, status")
    .eq("id", shipmentId)
    .single();

  if (dbError || !shipment) {
    return { success: false, error: "Shipment not found in database." };
  }

  const trackingNumber = shipment.fedex_tracking_number;
  if (!trackingNumber) {
    return { success: false, error: "No tracking number assigned to this shipment." };
  }

  try {
    const trackingRes = await trackShipment(trackingNumber);

    const completeTrackResults = trackingRes?.output?.completeTrackResults?.[0];
    const trackResult = completeTrackResults?.trackResults?.[0];

    if (!trackResult) {
      return { success: false, error: "No tracking details returned from FedEx API." };
    }

    const scanEvents = trackResult?.scanEvents || [];
    const latestStatusDesc = trackResult?.latestStatusDetail?.description || "UNKNOWN";
    const estimatedDelivery = trackResult?.dateAndTimes?.find((d: { type: string }) => d.type === "ESTIMATED_DELIVERY")?.dateTime || null;
    const actualDelivery = trackResult?.dateAndTimes?.find((d: { type: string }) => d.type === "ACTUAL_DELIVERY")?.dateTime || null;

    // 2. Map status to enum
    const mappedStatus = mapFedExStatusToShipmentStatus(latestStatusDesc);

    // 3. Save updates to shipment record
    await supabase
      .from("shipments")
      .update({
        status: mappedStatus,
        estimated_delivery_date: estimatedDelivery,
        actual_delivery_date: actualDelivery,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shipmentId);

    // 4. Retrieve existing events to prevent duplicates
    const { data: existingEvents } = await supabase
      .from("shipment_tracking_events")
      .select("event_type, event_timestamp")
      .eq("shipment_id", shipmentId);

    const eventKeySet = new Set(
      (existingEvents || []).map(
        (e) => `${e.event_type}_${new Date(e.event_timestamp).getTime()}`
      )
    );

    // 5. Save scan events
    for (const scan of scanEvents) {
      const eventType = scan.eventDescription?.toUpperCase().replace(/\s+/g, "_") || "SCAN";
      const eventTimestamp = scan.date;
      
      const key = `${eventType}_${new Date(eventTimestamp).getTime()}`;
      if (!eventKeySet.has(key)) {
        await supabase
          .from("shipment_tracking_events")
          .insert({
            shipment_id: shipmentId,
            event_type: eventType,
            event_description: scan.eventDescription || "Package scan update",
            location_city: scan.scanLocation?.city || null,
            location_country: scan.scanLocation?.countryCode || null,
            event_timestamp: eventTimestamp,
          });
      }
    }

    // 6. Fetch updated tracking events history
    const { data: finalEvents } = await supabase
      .from("shipment_tracking_events")
      .select("*")
      .eq("shipment_id", shipmentId)
      .order("event_timestamp", { ascending: false });

    revalidatePath("/(user)/admin");
    return {
      success: true,
      trackingData: {
        latestStatus: latestStatusDesc,
        estimatedDeliveryDate: estimatedDelivery,
        actualDeliveryDate: actualDelivery,
        events: finalEvents || [],
      },
      cached: false,
    };
  } catch (err: unknown) {
    console.error("FedEx Tracking Sync Failure:", err);
    const errMsg = err instanceof Error ? err.message : String(err);

    // Fall back to database cached tracking events
    const { data: cachedEvents } = await supabase
      .from("shipment_tracking_events")
      .select("*")
      .eq("shipment_id", shipmentId)
      .order("event_timestamp", { ascending: false });

    return {
      success: true,
      trackingData: {
        latestStatus: shipment.status,
        events: cachedEvents || [],
      },
      cached: true,
      error: errMsg || "Failed to fetch live updates. Displaying cached records.",
    };
  }
}

/**
 * Maps FedEx API latest status description strings to internal shipment status values.
 */
function mapFedExStatusToShipmentStatus(fedExStatus: string): string {
  const status = fedExStatus.toUpperCase();
  if (status.includes("DELIVERED")) return "delivered";
  if (status.includes("TRANSIT")) return "in_transit";
  if (status.includes("OUT_FOR_DELIVERY") || status.includes("OUT FOR DELIVERY")) return "out_for_delivery";
  if (status.includes("EXCEPTION") || status.includes("DELAY")) return "exception";
  if (status.includes("PICK") || status.includes("SCHEDULED")) return "pickup_scheduled";
  if (status.includes("LABEL") || status.includes("CREATED")) return "label_created";
  if (status.includes("CANCEL")) return "cancelled";
  return "in_transit";
}

/**
 * Creates a new shipping address for a user.
 */
export async function createShippingAddress(addressData: {
  user_id: string;
  contact_name: string;
  company_name?: string | null;
  phone_number: string;
  street_line_1: string;
  street_line_2?: string | null;
  city: string;
  state_or_province_code?: string | null;
  postal_code: string;
  country_code: string;
  is_residential: boolean;
  is_default: boolean;
}) {
  const supabase = await createClient();

  if (addressData.is_default) {
    await supabase
      .from("shipping_addresses")
      .update({ is_default: false })
      .eq("user_id", addressData.user_id);
  }

  const { data, error } = await supabase
    .from("shipping_addresses")
    .insert(addressData)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create shipping address: ${error?.message}`);
  }
  revalidatePath("/(user)/admin");
  revalidatePath("/(user)/dashboard");
  return { success: true, addressId: data.id };
}

/**
 * Updates an existing shipping address.
 */
export async function updateShippingAddress(
  addressId: string,
  userId: string,
  addressData: {
    contact_name: string;
    company_name?: string | null;
    phone_number: string;
    street_line_1: string;
    street_line_2?: string | null;
    city: string;
    state_or_province_code?: string | null;
    postal_code: string;
    country_code: string;
    is_residential: boolean;
    is_default: boolean;
  }
) {
  const supabase = await createClient();

  if (addressData.is_default) {
    await supabase
      .from("shipping_addresses")
      .update({ is_default: false })
      .eq("user_id", userId);
  }

  const { error } = await supabase
    .from("shipping_addresses")
    .update(addressData)
    .eq("id", addressId);

  if (error) {
    throw new Error(`Failed to update shipping address: ${error.message}`);
  }
  revalidatePath("/(user)/admin");
  revalidatePath("/(user)/dashboard");
  return { success: true };
}

/**
 * Deletes a shipping address.
 */
export async function deleteShippingAddress(addressId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("shipping_addresses")
    .delete()
    .eq("id", addressId);

  if (error) {
    throw new Error(`Failed to delete shipping address: ${error.message}`);
  }
  revalidatePath("/(user)/admin");
  revalidatePath("/(user)/dashboard");
  return { success: true };
}

/**
 * Sets a specific address as the default address for a user.
 */
export async function setDefaultShippingAddress(addressId: string, userId: string) {
  const supabase = await createClient();

  // Reset default status on all other addresses of this user
  await supabase
    .from("shipping_addresses")
    .update({ is_default: false })
    .eq("user_id", userId);

  // Set selected address as default
  const { error } = await supabase
    .from("shipping_addresses")
    .update({ is_default: true })
    .eq("id", addressId);

  if (error) {
    throw new Error(`Failed to set default address: ${error.message}`);
  }
  revalidatePath("/(user)/admin");
  revalidatePath("/(user)/dashboard");
  return { success: true };
}

/**
 * Automatically creates a FedEx shipment for a purchased item request, 
 * inserts it into shipments table, and transitions its status to 'shipped'.
 */
export async function shipItemWithFedEx(itemRequestId: string) {
  const supabase = await createClient();

  // 1. Fetch item request details including the trip seller_id
  const { data: req, error: reqError } = await supabase
    .from("item_requests")
    .select(`
      id,
      trip_id,
      buyer_id,
      item_name,
      quantity,
      weight_value,
      weight_unit,
      total_price,
      currency,
      shipping_address_id,
      sender_address_id,
      trips:trip_id (
        seller_id
      )
    `)
    .eq("id", itemRequestId)
    .single();

  if (reqError || !req) {
    throw new Error(`Item request not found: ${reqError?.message || "unknown error"}`);
  }

  if (!req.shipping_address_id || !req.sender_address_id) {
    throw new Error("Alamat pengirim (seller) atau penerima (buyer) belum diatur untuk request ini.");
  }

  // 2. Fetch shipper and recipient addresses
  const { data: shipperAddr, error: shipperError } = await supabase
    .from("shipping_addresses")
    .select("*")
    .eq("id", req.sender_address_id)
    .single();

  const { data: recipientAddr, error: recipientError } = await supabase
    .from("shipping_addresses")
    .select("*")
    .eq("id", req.shipping_address_id)
    .single();

  if (shipperError || !shipperAddr) {
    throw new Error(`Shipper address not found: ${shipperError?.message}`);
  }
  if (recipientError || !recipientAddr) {
    throw new Error(`Recipient address not found: ${recipientError?.message}`);
  }

  const shipper = alignFedExAddress(shipperAddr, "Traveler Seller");
  const recipient = alignFedExAddress(recipientAddr, "Buyer Customer");

  console.log("=== [shipping.ts] Shipper (Raw) ===", shipperAddr);
  console.log("=== [shipping.ts] Recipient (Raw) ===", recipientAddr);
  console.log("=== [shipping.ts] Shipper (Aligned) ===", shipper);
  console.log("=== [shipping.ts] Recipient (Aligned) ===", recipient);

  const isInternational = shipper.countryCode !== recipient.countryCode;
  const serviceType = isInternational 
    ? "INTERNATIONAL_PRIORITY" 
    : (shipper.countryCode === "US" ? "PRIORITY_OVERNIGHT" : "STANDARD_OVERNIGHT");

  // 3. Call FedEx API to create a shipment
  let fedexData;
  try {
    fedexData = await createFedExShipment({
      shipper,
      recipient,
      serviceType,
      packagingType: "YOUR_PACKAGING",
      weightValue: req.weight_value || 1,
      weightUnit: (req.weight_unit as "KG" | "LB") || "KG",
      declaredValue: req.total_price || 10,
      declaredCurrency: "IDR", // Database total_price is always in IDR
    });
  } catch (err: any) {
    console.error("FedEx API Error:", err);
    throw new Error(`Gagal membuat shipment di FedEx: ${err.message || String(err)}`);
  }

  // Parse tracking info from FedEx response
  const transactionShipment = fedexData?.output?.transactionShipments?.[0];
  const masterTrackingNumber = transactionShipment?.masterTrackingNumber || null;
  const trackingNumber = transactionShipment?.pieceResponses?.[0]?.trackingNumber || masterTrackingNumber;
  const shipmentId = transactionShipment?.shipmentAdvisoryDetails?.shipmentId || null;
  const transactionId = fedexData?.transactionId || null;

  // 4. Create the shipment record in our shipments table
  const sellerId = (req.trips as any)?.seller_id || req.buyer_id;

  const { data: dbShipment, error: dbShipmentError } = await supabase
    .from("shipments")
    .insert({
      trip_id: req.trip_id,
      seller_id: sellerId,
      buyer_id: req.buyer_id,
      sender_address_id: req.sender_address_id,
      recipient_address_id: req.shipping_address_id,
      fedex_tracking_number: trackingNumber,
      fedex_master_tracking_number: masterTrackingNumber,
      fedex_shipment_id: shipmentId,
      fedex_transaction_id: transactionId,
      service_type: serviceType,
      packaging_type: "YOUR_PACKAGING",
      weight_value: req.weight_value || 1,
      weight_unit: req.weight_unit || "KG",
      declared_value: req.total_price || 0,
      declared_currency: "IDR",
      status: "label_created",
    })
    .select("id")
    .single();

  if (dbShipmentError || !dbShipment) {
    throw new Error(`Failed to create database shipment record: ${dbShipmentError?.message}`);
  }

  // 5. Associate in shipment_items table
  const { error: assocError } = await supabase
    .from("shipment_items")
    .insert({
      shipment_id: dbShipment.id,
      item_request_id: itemRequestId,
      packed_quantity: req.quantity,
    });

  if (assocError) {
    throw new Error(`Failed to associate request to shipment items: ${assocError.message}`);
  }

  // 6. Transition request status to 'shipped'
  const { error: updateError } = await supabase
    .from("item_requests")
    .update({
      status: "shipped",
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemRequestId);

  sendRequestStatusEmail(itemRequestId, "shipped").catch((e) =>
    console.error("Email notification error:", e)
  );

  if (updateError) {
    throw new Error(`Failed to update item request status: ${updateError.message}`);
  }

  // 7. Trigger initial FedEx tracking sync
  if (trackingNumber) {
    try {
      await getShipmentTracking(dbShipment.id);
    } catch (e) {
      console.warn("Initial FedEx tracking sync skipped:", e);
    }
  }

  revalidatePath("/(user)/admin");
  revalidatePath(`/seller/trip/${req.trip_id}/requests`);
  return { success: true, shipmentId: dbShipment.id, trackingNumber };
}
