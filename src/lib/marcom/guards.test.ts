import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { hasPermission } from "./guards.ts";

test("viewer can only export", () => {
  assert.equal(hasPermission("viewer", "EXPORT_REPORTS"), true);
  assert.equal(hasPermission("viewer", "APPROVE_MOU"), false);
});

test("staff cannot approve, delete, or manage master data", () => {
  assert.equal(hasPermission("staff", "CREATE_MOU"), true);
  assert.equal(hasPermission("staff", "APPROVE_MOU"), false);
  assert.equal(hasPermission("staff", "DELETE_DOCUMENT"), false);
  assert.equal(hasPermission("staff", "MANAGE_MASTER_DATA"), false);
});

test("admin can do everything", () => {
  const all = ["CREATE_MOU","APPROVE_MOU","DELETE_MOU","CREATE_PLACEMENT","UPDATE_PLACEMENT","CREATE_EVENT","UPLOAD_VIDEO_FOOTAGE","UPLOAD_DOCUMENT","DELETE_DOCUMENT","MANAGE_MASTER_DATA","EXPORT_REPORTS"] as const;
  for (const a of all) assert.equal(hasPermission("admin", a), true);
});
