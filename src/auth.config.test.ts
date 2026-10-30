import test from "node:test";
import assert from "node:assert/strict";
import type { Session } from "next-auth";
import type { UserRole, UserStatus } from "@/types";
import authConfig from "./auth.config";

function buildSession(status: UserStatus, role: UserRole = "staff"): Session {
  return {
    user: {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      image: null,
      role,
      status,
    },
    expires: "2099-01-01T00:00:00.000Z",
  };
}

const authorized = authConfig.callbacks.authorized!;
const request = {} as Parameters<typeof authorized>[0]["request"];

test("authorized rejects unauthenticated requests", async () => {
  assert.equal(await authorized({ auth: null, request }), false);
});

test("authorized returns 401 Response for unauthenticated /api/ requests", async () => {
  const apiRequest = {
    nextUrl: new URL("http://localhost:3000/api/marcom/pipeline"),
  } as unknown as Parameters<typeof authorized>[0]["request"];

  const result = await authorized({ auth: null, request: apiRequest });
  assert.ok(result instanceof Response);
  assert.equal(result.status, 401);
  const json = await (result as Response).json();
  assert.equal(json.error, "Unauthorized");
});

test("authorized returns 401 Response for PENDING sessions on /api/ requests", async () => {
  const apiRequest = {
    nextUrl: new URL("http://localhost:3000/api/marcom/pipeline"),
  } as unknown as Parameters<typeof authorized>[0]["request"];

  const result = await authorized({ auth: buildSession("PENDING"), request: apiRequest });
  assert.ok(result instanceof Response);
  assert.equal(result.status, 401);
});

test("authorized allows APPROVED sessions on /api/ requests", async () => {
  const apiRequest = {
    nextUrl: new URL("http://localhost:3000/api/marcom/pipeline"),
  } as unknown as Parameters<typeof authorized>[0]["request"];

  assert.equal(await authorized({ auth: buildSession("APPROVED"), request: apiRequest }), true);
});

test("authorized rejects PENDING sessions", async () => {
  assert.equal(await authorized({ auth: buildSession("PENDING"), request }), false);
});

test("authorized rejects REJECTED sessions", async () => {
  assert.equal(await authorized({ auth: buildSession("REJECTED"), request }), false);
});

test("authorized allows APPROVED sessions", async () => {
  assert.equal(await authorized({ auth: buildSession("APPROVED"), request }), true);
});

test("session callback exposes id, role and status on session.user", async () => {
  const sessionCallback = authConfig.callbacks.session!;
  // Auth.js types the callback params as a database/JWT union; only the JWT
  // branch is relevant here (this app uses the default JWT strategy).
  const params = {
    session: buildSession("PENDING", "viewer"),
    token: { id: "user-9", role: "admin", status: "APPROVED" },
  } as unknown as Parameters<typeof sessionCallback>[0];

  const session = await sessionCallback(params);

  assert.equal(session.user?.id, "user-9");
  assert.equal(session.user?.role, "admin");
  assert.equal(session.user?.status, "APPROVED");
});
