/**
 * src/lib/server/driveAuth.ts
 *
 * Server-only Google Drive OAuth2 token manager.
 * Caches access tokens in memory for the duration of their validity (1 hour).
 */

import {
  buildTokenRequestBody,
  parseTokenResponse,
  isTokenExpired,
} from "@/lib/marcom/driveTokenHelpers";

let cachedAccessToken: string | null = null;
let tokenExpiresAtMs = 0;

/**
 * Resets the in-memory token cache (useful for tests or token invalidation).
 */
export function resetTokenCache(): void {
  cachedAccessToken = null;
  tokenExpiresAtMs = 0;
}

/**
 * Retrieves a valid Google Drive access token on behalf of the developer account.
 * Reuses unexpired tokens from memory, or exchanges the refresh token with Google.
 */
export async function getDriveAccessToken(): Promise<string> {
  if (cachedAccessToken && !isTokenExpired(tokenExpiresAtMs, 120)) {
    return cachedAccessToken;
  }

  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.AUTH_GOOGLE_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "";

  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.AUTH_GOOGLE_SECRET ||
    "";

  const refreshToken =
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN ||
    "";

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Drive centralized upload is not configured. Missing GOOGLE_DRIVE_REFRESH_TOKEN or OAuth credentials in server environment."
    );
  }

  const body = buildTokenRequestBody({
    clientId,
    clientSecret,
    refreshToken,
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const rawJson = await response.json();
  const parsed = parseTokenResponse(rawJson);

  cachedAccessToken = parsed.accessToken;
  tokenExpiresAtMs = Date.now() + parsed.expiresIn * 1000;

  return cachedAccessToken;
}

