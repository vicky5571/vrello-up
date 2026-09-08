import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { resolveMarcomRole } from "./guards.ts";

const roster = [
  { id: "user-1", role: "admin" as const },
  { id: "user-2", role: "staff" as const },
  { id: "user-3", role: "viewer" as const },
];

test("resolves the active member's role", () => {
  assert.equal(resolveMarcomRole(roster, "user-1"), "admin");
  assert.equal(resolveMarcomRole(roster, "user-2"), "staff");
  assert.equal(resolveMarcomRole(roster, "user-3"), "viewer");
});

test("unknown members default to staff (demo/signed-in fallback)", () => {
  assert.equal(resolveMarcomRole(roster, "google-user-9"), "staff");
  assert.equal(resolveMarcomRole([], "user-1"), "staff");
});

test("members without a recognized role default to staff", () => {
  assert.equal(
    resolveMarcomRole([{ id: "user-x", role: "owner" }], "user-x"),
    "staff",
  );
  assert.equal(
    resolveMarcomRole([{ id: "user-x", role: undefined }], "user-x"),
    "staff",
  );
});
