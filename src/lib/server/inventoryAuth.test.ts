import test from "node:test";
import assert from "node:assert/strict";
import { resolveInventoryAuth } from "./inventoryAuth";

test("inventoryAuth: in production mode, x-user-role and x-user-name headers are ignored", async () => {
  const originalEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    const req = new Request("http://localhost:3000/api/marcom/inventory/borrow", {
      headers: {
        "x-user-role": "admin",
        "x-user-name": "Attacker Impersonator",
      },
    });

    const authResult = await resolveInventoryAuth(req);

    assert.equal(authResult.isAuthenticated, false);
    assert.equal(authResult.role, "viewer");
    assert.equal(authResult.userName, "Authorized User");
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  }
});

test("inventoryAuth: in development mode, x-user-role and x-user-name headers are ignored", async () => {
  const originalEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";

    const req = new Request("http://localhost:3000/api/marcom/inventory/borrow", {
      headers: {
        "x-user-role": "warehouse",
        "x-user-name": "Dev Hacker",
      },
    });

    const authResult = await resolveInventoryAuth(req);

    assert.equal(authResult.isAuthenticated, false);
    assert.equal(authResult.role, "viewer");
    assert.equal(authResult.userName, "Authorized User");
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  }
});

test("inventoryAuth: in test mode, x-user-role and x-user-name headers are parsed for test harness", async () => {
  const originalEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";

    const req = new Request("http://localhost:3000/api/marcom/inventory/borrow", {
      headers: {
        "x-user-role": "warehouse",
        "x-user-name": "Warehouse Tester",
      },
    });

    const authResult = await resolveInventoryAuth(req);

    assert.equal(authResult.isAuthenticated, true);
    assert.equal(authResult.role, "warehouse");
    assert.equal(authResult.userName, "Warehouse Tester");
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  }
});

test("inventoryAuth: unknown role string normalizes safely to viewer", async () => {
  const originalEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";

    const req = new Request("http://localhost:3000/api/marcom/inventory/borrow", {
      headers: {
        "x-user-role": "super-hacker-god-role",
        "x-user-name": "Bob",
      },
    });

    const authResult = await resolveInventoryAuth(req);

    assert.equal(authResult.isAuthenticated, true);
    assert.equal(authResult.role, "viewer");
    assert.equal(authResult.userName, "Bob");
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  }
});

test("inventoryAuth: unauthenticated request without session or test headers returns isAuthenticated false", async () => {
  const originalEnv = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";

    const req = new Request("http://localhost:3000/api/marcom/inventory/borrow");

    const authResult = await resolveInventoryAuth(req);

    assert.equal(authResult.isAuthenticated, false);
    assert.equal(authResult.role, "viewer");
    assert.equal(authResult.userName, "Authorized User");
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  }
});
