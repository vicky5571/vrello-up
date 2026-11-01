import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node strip-types runner requires explicit extension
import { normalizeMarcomRole, resolveEffectivePermissionsUser } from "./permissionsHelpers.ts";

test("normalizeMarcomRole parses standard roles case-insensitively with trimming", () => {
  assert.equal(normalizeMarcomRole("admin"), "admin");
  assert.equal(normalizeMarcomRole("ADMIN"), "admin");
  assert.equal(normalizeMarcomRole("  Admin  "), "admin");

  assert.equal(normalizeMarcomRole("supervisor"), "supervisor");
  assert.equal(normalizeMarcomRole("SUPERVISOR"), "supervisor");

  assert.equal(normalizeMarcomRole("staff"), "staff");
  assert.equal(normalizeMarcomRole("STAFF"), "staff");

  assert.equal(normalizeMarcomRole("viewer"), "viewer");
  assert.equal(normalizeMarcomRole("VIEWER"), "viewer");
});

test("normalizeMarcomRole returns null for unknown or empty roles", () => {
  assert.equal(normalizeMarcomRole(null), null);
  assert.equal(normalizeMarcomRole(undefined), null);
  assert.equal(normalizeMarcomRole(""), null);
  assert.equal(normalizeMarcomRole("   "), null);
  assert.equal(normalizeMarcomRole("owner"), null);
  assert.equal(normalizeMarcomRole("guest"), null);
  assert.equal(normalizeMarcomRole("manager"), null);
});

test("resolveEffectivePermissionsUser prioritizes active sessionUser", () => {
  const result = resolveEffectivePermissionsUser({
    sessionUser: {
      id: "u-admin",
      role: "ADMIN",
      assignedBranchIds: ["branch-1", "branch-2"],
    },
    fallbackUser: {
      id: "u-fallback",
      role: "viewer",
      assignedBranchIds: [],
    },
  });

  assert.deepEqual(result, {
    role: "admin",
    assignedBranchIds: ["branch-1", "branch-2"],
    isAuthenticated: true,
  });
});

test("resolveEffectivePermissionsUser handles sessionUser with staff role and branch scopes", () => {
  const result = resolveEffectivePermissionsUser({
    sessionUser: {
      id: "u-staff",
      role: "staff",
      assignedBranchIds: ["branch-3"],
    },
  });

  assert.deepEqual(result, {
    role: "staff",
    assignedBranchIds: ["branch-3"],
    isAuthenticated: true,
  });
});

test("resolveEffectivePermissionsUser defaults undefined assignedBranchIds to empty array", () => {
  const result = resolveEffectivePermissionsUser({
    sessionUser: {
      id: "u-admin",
      role: "admin",
      assignedBranchIds: null,
    },
  });

  assert.deepEqual(result, {
    role: "admin",
    assignedBranchIds: [],
    isAuthenticated: true,
  });
});

test("resolveEffectivePermissionsUser falls back to fallbackUser when sessionUser is missing", () => {
  const result = resolveEffectivePermissionsUser({
    sessionUser: null,
    fallbackUser: {
      id: "user-1",
      role: "admin",
      assignedBranchIds: ["branch-global"],
    },
  });

  assert.deepEqual(result, {
    role: "admin",
    assignedBranchIds: ["branch-global"],
    isAuthenticated: false,
  });
});

test("resolveEffectivePermissionsUser falls back to fallbackUser when sessionUser has no role", () => {
  const result = resolveEffectivePermissionsUser({
    sessionUser: { id: "u-no-role", role: null },
    fallbackUser: {
      id: "user-4",
      role: "supervisor",
      assignedBranchIds: ["branch-1"],
    },
  });

  assert.deepEqual(result, {
    role: "supervisor",
    assignedBranchIds: ["branch-1"],
    isAuthenticated: false,
  });
});

test("resolveEffectivePermissionsUser fails closed to viewer when both session and fallback are missing or invalid", () => {
  const emptyResult = resolveEffectivePermissionsUser({});
  assert.deepEqual(emptyResult, {
    role: "viewer",
    assignedBranchIds: [],
    isAuthenticated: false,
  });

  const invalidResult = resolveEffectivePermissionsUser({
    sessionUser: { id: "u-x", role: "unknown-role" },
    fallbackUser: { id: "u-y", role: "also-unknown" },
  });
  assert.deepEqual(invalidResult, {
    role: "viewer",
    assignedBranchIds: [],
    isAuthenticated: false,
  });
});
