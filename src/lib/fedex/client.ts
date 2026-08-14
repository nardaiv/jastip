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