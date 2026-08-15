"use server";

import { getFedExRates, createFedExShipment } from "@/lib/fedex/client";

export async function getFedExRatesAction(params: {
  shipperPostalCode: string;
  shipperCountryCode: string;
  recipientPostalCode: string;
  recipientCountryCode: string;
  weightValue: number;
  weightUnit: "KG" | "LB";
}) {
  try {
    const data = await getFedExRates(params);
    return { success: true, data };
  } catch (error: any) {
    console.error("getFedExRatesAction error:", error);
    return { success: false, error: error?.message || "Failed to fetch rates" };
  }
}

export async function createFedExShipmentAction(params: {
  shipper: {
    personName: string;
    phoneNumber: string;
    companyName?: string;
    streetLines: string[];
    city: string;
    stateOrProvinceCode: string;
    postalCode: string;
    countryCode: string;
  };
  recipient: {
    personName: string;
    phoneNumber: string;
    companyName?: string;
    streetLines: string[];
    city: string;
    stateOrProvinceCode: string;
    postalCode: string;
    countryCode: string;
  };
  serviceType: string;
  packagingType: string;
  weightValue: number;
  weightUnit: "KG" | "LB";
}) {
  try {
    const data = await createFedExShipment(params);
    return { success: true, data };
  } catch (error: any) {
    console.error("createFedExShipmentAction error:", error);
    return { success: false, error: error?.message || "Failed to create shipment" };
  }
}
