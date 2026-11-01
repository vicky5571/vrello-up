/**
 * src/lib/marcom/driveTokenHelpers.ts
 *
 * Pure helpers for Google OAuth token exchanges and expiration evaluation.
 */

export interface TokenExchangeParams {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface ParsedTokenResult {
  accessToken: string;
  expiresIn: number;
}

/**
 * Builds the URL-encoded request body to exchange a refresh token for an access token.
 */
export function buildTokenRequestBody(params: TokenExchangeParams): string {
  const { clientId, clientSecret, refreshToken } = params;

  if (!clientId || !clientId.trim()) {
    throw new Error("clientId is required for token exchange");
  }
  if (!clientSecret || !clientSecret.trim()) {
    throw new Error("clientSecret is required for token exchange");
  }
  if (!refreshToken || !refreshToken.trim()) {
    throw new Error("refreshToken is required for token exchange");
  }

  return new URLSearchParams({
    client_id: clientId.trim(),
    client_secret: clientSecret.trim(),
    refresh_token: refreshToken.trim(),
    grant_type: "refresh_token",
  }).toString();
}

/**
 * Validates and extracts the access token and duration from a Google token endpoint response.
 */
export function parseTokenResponse(payload: unknown): ParsedTokenResult {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid token response: response body is not an object");
  }

  const record = payload as Record<string, unknown>;

  if (record.error) {
    const errorStr = String(record.error);
    const desc = record.error_description ? ` - ${String(record.error_description)}` : "";
    throw new Error(`Google OAuth token exchange failed: ${errorStr}${desc}`);
  }

  if (typeof record.access_token !== "string" || !record.access_token) {
    throw new Error("Invalid token response: access_token is missing");
  }

  const expiresIn = typeof record.expires_in === "number" ? record.expires_in : 3600;

  return {
    accessToken: record.access_token,
    expiresIn,
  };
}

/**
 * Checks whether a token is expired given an expiration timestamp in milliseconds,
 * with an optional safety buffer in seconds (default: 60s).
 */
export function isTokenExpired(expiresAtMs: number, bufferSeconds = 60): boolean {
  const bufferMs = bufferSeconds * 1000;
  return Date.now() >= expiresAtMs - bufferMs;
}

