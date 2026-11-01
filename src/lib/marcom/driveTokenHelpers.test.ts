import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildTokenRequestBody,
  parseTokenResponse,
  isTokenExpired,
} from "./driveTokenHelpers";

test("buildTokenRequestBody generates valid URLSearchParams payload", () => {
  const body = buildTokenRequestBody({
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    refreshToken: "test-refresh-token",
  });

  const parsed = new URLSearchParams(body);
  assert.equal(parsed.get("grant_type"), "refresh_token");
  assert.equal(parsed.get("client_id"), "test-client-id");
  assert.equal(parsed.get("client_secret"), "test-client-secret");
  assert.equal(parsed.get("refresh_token"), "test-refresh-token");
});

test("buildTokenRequestBody throws error if any parameter is missing", () => {
  assert.throws(
    () =>
      buildTokenRequestBody({
        clientId: "",
        clientSecret: "secret",
        refreshToken: "token",
      }),
    /clientId is required/
  );

  assert.throws(
    () =>
      buildTokenRequestBody({
        clientId: "id",
        clientSecret: "",
        refreshToken: "token",
      }),
    /clientSecret is required/
  );

  assert.throws(
    () =>
      buildTokenRequestBody({
        clientId: "id",
        clientSecret: "secret",
        refreshToken: "",
      }),
    /refreshToken is required/
  );
});

test("parseTokenResponse extracts access_token and expiresIn from valid Google response", () => {
  const raw = {
    access_token: "ya29.a0AfH6SMB...",
    expires_in: 3599,
    token_type: "Bearer",
    scope: "https://www.googleapis.com/auth/drive.file",
  };

  const parsed = parseTokenResponse(raw);
  assert.equal(parsed.accessToken, "ya29.a0AfH6SMB...");
  assert.equal(parsed.expiresIn, 3599);
});

test("parseTokenResponse throws on Google OAuth error response", () => {
  const errorPayload = {
    error: "invalid_grant",
    error_description: "Token has been expired or revoked.",
  };

  assert.throws(
    () => parseTokenResponse(errorPayload),
    /Google OAuth token exchange failed: invalid_grant - Token has been expired or revoked\./
  );
});

test("parseTokenResponse throws when access_token is missing", () => {
  const invalidPayload = {
    token_type: "Bearer",
  };

  assert.throws(
    () => parseTokenResponse(invalidPayload),
    /Invalid token response: access_token is missing/
  );
});

test("isTokenExpired computes expiration accurately with buffer", () => {
  const now = Date.now();
  // Token expiring in 10 seconds, with default 60s buffer -> should be expired
  assert.equal(isTokenExpired(now + 10_000, 60), true);

  // Token expiring in 120 seconds, with default 60s buffer -> not expired
  assert.equal(isTokenExpired(now + 120_000, 60), false);

  // Token already expired in past
  assert.equal(isTokenExpired(now - 1000), true);
});

