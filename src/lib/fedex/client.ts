const FEDEX_BASE_URL = 'https://apis-sandbox.fedex.com';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Retrieves an active OAuth 2.0 Bearer token, renewing only when expired.
 */
export async function getFedExToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if valid for at least another 60 seconds
    if (cachedToken && tokenExpiresAt > now + 60_000) {
        return cachedToken;
    }

    const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.FEDEX_CLIENT_ID ?? '',
        client_secret: process.env.FEDEX_CLIENT_SECRET ?? '',
    });

    const res = await fetch(`${FEDEX_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`FedEx OAuth failed (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiresAt = now + data.expires_in * 1000;

    return cachedToken as string;
}

/**
 * Example: Track a package using the FedEx Track API
 */
export async function trackShipment(trackingNumber: string) {
    const token = await getFedExToken();

    const payload = {
        includeDetailedScans: true,
        trackingInfo: [
            {
                trackingNumberInfo: {
                    trackingNumber: trackingNumber.trim(),
                },
            },
        ],
    };

    const res = await fetch(`${FEDEX_BASE_URL}/track/v1/trackingnumbers`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-locale': 'en_US',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.errors?.[0]?.message || 'Failed to track package');
    }

    return res.json();
}

export async function getFedExRates(params: {
  shipperPostalCode: string;
  shipperCountryCode: string;
  recipientPostalCode: string;
  recipientCountryCode: string;
  weightValue: number;
  weightUnit: "KG" | "LB";
}) {
  const token = await getFedExToken();

  const payload = {
    accountNumber: {
      value: process.env.FEDEX_ACCOUNT_NUMBER || "740561073",
    },
    requestedShipment: {
      shipper: {
        address: {
          postalCode: params.shipperPostalCode,
          countryCode: params.shipperCountryCode,
        },
      },
      recipient: {
        address: {
          postalCode: params.recipientPostalCode,
          countryCode: params.recipientCountryCode,
        },
      },
      pickupType: "DROPOFF_AT_FEDEX_LOCATION",
      rateRequestType: ["ACCOUNT", "LIST"],
      requestedPackageLineItems: [
        {
          weight: {
            units: params.weightUnit,
            value: params.weightValue,
          },
        },
      ],
    },
  };

  const res = await fetch(`${FEDEX_BASE_URL}/rate/v1/rates/quotes`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.errors?.[0]?.message || `Rate query failed with status ${res.status}`
    );
  }

  return res.json();
}

/**
 * Creates a FedEx shipment and generates a label.
 */
export async function createFedExShipment(params: {
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
  const token = await getFedExToken();

  const payload = {
    accountNumber: {
      value: process.env.FEDEX_ACCOUNT_NUMBER || "740561073",
    },
    requestedShipment: {
      shipper: {
        contact: {
          personName: params.shipper.personName,
          phoneNumber: params.shipper.phoneNumber,
          companyName: params.shipper.companyName || "Sender Org",
        },
        address: {
          streetLines: params.shipper.streetLines,
          city: params.shipper.city,
          stateOrProvinceCode: params.shipper.stateOrProvinceCode,
          postalCode: params.shipper.postalCode,
          countryCode: params.shipper.countryCode,
        },
      },
      recipients: [
        {
          contact: {
            personName: params.recipient.personName,
            phoneNumber: params.recipient.phoneNumber,
            companyName: params.recipient.companyName || "Recipient Org",
          },
          address: {
            streetLines: params.recipient.streetLines,
            city: params.recipient.city,
            stateOrProvinceCode: params.recipient.stateOrProvinceCode,
            postalCode: params.recipient.postalCode,
            countryCode: params.recipient.countryCode,
          },
        },
      ],
      serviceType: params.serviceType,
      packagingType: params.packagingType,
      pickupType: "DROPOFF_AT_FEDEX_LOCATION",
      shippingChargesPayment: {
        paymentType: "SENDER",
        payor: {
          responsibleParty: {
            accountNumber: {
              value: process.env.FEDEX_ACCOUNT_NUMBER || "740561073",
            },
          },
        },
      },
      requestedPackageLineItems: [
        {
          weight: {
            units: params.weightUnit,
            value: params.weightValue,
          },
        },
      ],
      labelSpecification: {
        labelFormatType: "COMMON2D",
        imageType: "PDF",
        labelStockType: "PAPER_8.5X11_TOP_HALF_LABEL",
      },
    },
  };

  const res = await fetch(`${FEDEX_BASE_URL}/ship/v1/shipments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.errors?.[0]?.message || `Shipment creation failed with status ${res.status}`
    );
  }

  return res.json();
}