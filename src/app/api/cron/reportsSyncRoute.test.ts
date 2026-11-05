import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET } from "./reports-sync/route";

describe("GET /api/cron/reports-sync route handler (ADR-0036)", () => {
  it("rejects unauthorized request with 401 when in production with CRON_SECRET", async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.CRON_SECRET;

    try {
      (process.env as any).NODE_ENV = "production";
      process.env.CRON_SECRET = "super-secret-cron-key-123";

      const req = new Request("http://localhost:3000/api/cron/reports-sync", {
        headers: {
          authorization: "Bearer wrong-token",
        },
      });

      const res = await GET(req);
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.error, "Unauthorized cron execution");
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
      process.env.CRON_SECRET = originalSecret;
    }
  });

  it("permits request when authorized with Bearer CRON_SECRET", async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.CRON_SECRET;

    try {
      (process.env as any).NODE_ENV = "production";
      process.env.CRON_SECRET = "valid-secret-999";

      const req = new Request("http://localhost:3000/api/cron/reports-sync?month=December&year=2099", {
        headers: {
          authorization: "Bearer valid-secret-999",
        },
      });

      const res = await GET(req);
      // It should process the request without throwing 401
      assert.notStrictEqual(res.status, 401);
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
      process.env.CRON_SECRET = originalSecret;
    }
  });
});

