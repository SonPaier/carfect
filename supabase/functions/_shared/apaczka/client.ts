import type { ApaczkaCredentials, ApaczkaApiResponse } from "./types.ts";

const BASE_URL = "https://www.apaczka.pl/api/v2";
const EXPIRES_MINUTES = 25;

/**
 * Compute HMAC-SHA256 signature using Web Crypto API.
 */
async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Create Apaczka HMAC-SHA256 signature.
 * Signs: "{appId}:{route}:{requestJson}:{expires}"
 */
export async function createApaczkaSignature(
  appId: string,
  appSecret: string,
  route: string,
  requestJson: string,
  expires: number,
): Promise<string> {
  const stringToSign = `${appId}:${route}:${requestJson}:${expires}`;
  return hmacSha256(appSecret, stringToSign);
}

/**
 * Build the full Apaczka API payload with signature.
 */
export async function buildApaczkaPayload(
  credentials: ApaczkaCredentials,
  route: string,
  request: Record<string, unknown> | unknown[],
): Promise<{
  app_id: string;
  request: string;
  expires: number;
  signature: string;
}> {
  const expires = Math.floor(Date.now() / 1000) + EXPIRES_MINUTES * 60;
  const requestJson = JSON.stringify(request);
  const signature = await createApaczkaSignature(
    credentials.appId,
    credentials.appSecret,
    route,
    requestJson,
    expires,
  );
  return {
    app_id: credentials.appId,
    request: requestJson,
    expires,
    signature,
  };
}

/**
 * Make a signed POST request to Apaczka API.
 * @param route - endpoint route without leading slash, e.g. "order_send"
 */
export async function apaczkaFetch<T>(
  credentials: ApaczkaCredentials,
  route: string,
  request: Record<string, unknown> | unknown[],
): Promise<ApaczkaApiResponse<T>> {
  // Ensure route has trailing slash for URL, but sign with the route as-is
  const urlRoute = route.endsWith("/") ? route : `${route}/`;
  const payload = await buildApaczkaPayload(credentials, urlRoute, request);

  console.log("[Apaczka] Route for signature:", urlRoute);
  console.log("[Apaczka] URL:", `${BASE_URL}/${urlRoute}`);
  console.log("[Apaczka] Expires:", payload.expires);
  console.log("[Apaczka] Signature:", payload.signature);
  console.log("[Apaczka] Request length:", payload.request.length);

  // Apaczka PHP backend expects form-urlencoded, not JSON
  const formBody = new URLSearchParams({
    app_id: payload.app_id,
    request: payload.request,
    expires: String(payload.expires),
    signature: payload.signature,
  });

  const url = `${BASE_URL}/${urlRoute}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody.toString(),
  });

  const data = (await response.json()) as ApaczkaApiResponse<T>;

  if (!response.ok || data.status !== 200) {
    const errorMsg = data.message || `Apaczka API error: HTTP ${response.status}`;
    const error = new Error(errorMsg);
    (error as any).apaczkaResponse = data;
    throw error;
  }

  return data;
}

/**
 * Extract Apaczka credentials from instance data (per-instance secrets).
 */
export function getApaczkaCredentials(
  instance: Record<string, unknown>,
): ApaczkaCredentials {
  const appId = instance.apaczka_app_id as string | undefined;
  const appSecret = instance.apaczka_app_secret as string | undefined;

  if (!appId || !appSecret) {
    throw new Error(
      "Brak konfiguracji Apaczka (apaczka_app_id / apaczka_app_secret) na instancji",
    );
  }

  return { appId, appSecret };
}
