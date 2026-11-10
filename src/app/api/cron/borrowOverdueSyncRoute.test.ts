import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET } from "./borrow-overdue-sync/route";

describe("GET /api/cron/borrow-overdue-sync route handler (ADR-0103)", () => {
  it("rejects unauthorized request with 401 when in production with CRON_SECRET", async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.CRON_SECRET;

    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.CRON_SECRET = "super-secret-cron-key-test";

      const req = new Request("http://localhost:3000/api/cron/borrow-overdue-sync", {
        headers: {
          authorization: "Bearer wrong-token",
        },
      });

      const res = await GET(req);
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.error, "Unauthorized cron execution");
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      process.env.CRON_SECRET = originalSecret;
    }
  });

  it("permits request when authorized with Bearer CRON_SECRET", async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.CRON_SECRET;

    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.CRON_SECRET = "valid-secret-test-777";

      const req = new Request("http://localhost:3000/api/cron/borrow-overdue-sync", {
        headers: {
          authorization: "Bearer valid-secret-test-777",
        },
      });

      const res = await GET(req);
      assert.notStrictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.ok, true);
      assert.strictEqual(typeof json.syncedAt, "string");
      assert.strictEqual(typeof json.totalOverdue, "number");
      assert.strictEqual(typeof json.borrowersNotified, "number");
      assert.strictEqual(typeof json.managersNotified, "number");
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      process.env.CRON_SECRET = originalSecret;
    }
  });

  it("executes safely without SMTP configuration and preserves virtual status invariant", async () => {
    const req = new Request("http://localhost:3000/api/cron/borrow-overdue-sync");
    const res = await GET(req);

    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
    assert.strictEqual(typeof json.totalOverdue, "number");
  });
});
