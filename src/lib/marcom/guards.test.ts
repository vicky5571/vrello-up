import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { hasPermission, hasScopedPermission, canAccessBranch } from "./guards.ts";

test("viewer can only export", () => {
  assert.equal(hasPermission("viewer", "EXPORT_REPORTS"), true);
  assert.equal(hasPermission("viewer", "APPROVE_MOU"), false);
});

test("staff cannot approve, delete, or manage master data in un-scoped checks", () => {
  assert.equal(hasPermission("staff", "CREATE_MOU"), true);
  assert.equal(hasPermission("staff", "APPROVE_MOU"), false);
  assert.equal(hasPermission("staff", "DELETE_DOCUMENT"), false);
  assert.equal(hasPermission("staff", "MANAGE_MASTER_DATA"), false);
});

test("admin can do everything", () => {
  const all = ["CREATE_MOU","APPROVE_MOU","DELETE_MOU","CREATE_PLACEMENT","UPDATE_PLACEMENT","CREATE_EVENT","UPLOAD_VIDEO_FOOTAGE","UPLOAD_DOCUMENT","DELETE_DOCUMENT","MANAGE_MASTER_DATA","EXPORT_REPORTS"] as const;
  for (const a of all) assert.equal(hasPermission("admin", a), true);
});

test("canAccessBranch evaluates branch assignments correctly", () => {
  assert.equal(canAccessBranch("admin", [], "branch-bdg"), true);
  assert.equal(canAccessBranch("staff", ["branch-solo"], "branch-solo"), true);
  assert.equal(canAccessBranch("staff", ["branch-solo"], "branch-bdg"), false);
  assert.equal(canAccessBranch("staff", ["branch-solo", "branch-jogja"], "branch-jogja"), true);
  assert.equal(canAccessBranch("staff", ["branch-solo", "branch-jogja"], "branch-bdg"), false);
});

test("hasScopedPermission enforces branch boundaries for MOU approval", () => {
  // Admin can approve anywhere
  assert.equal(
    hasScopedPermission({ role: "admin", action: "APPROVE_MOU", targetBranchId: "branch-bdg" }),
    true,
  );
  assert.equal(
    hasScopedPermission({ role: "admin", action: "APPROVE_MOU", targetBranchId: "branch-solo" }),
    true,
  );

  // PIC Branch Solo can approve Solo MOU
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "APPROVE_MOU",
      userBranchIds: ["branch-solo"],
      targetBranchId: "branch-solo",
    }),
    true,
  );

  // PIC Branch Solo CANNOT approve Bandung MOU
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "APPROVE_MOU",
      userBranchIds: ["branch-solo"],
      targetBranchId: "branch-bdg",
    }),
    false,
  );

  // Multi-branch PIC (Solo + Jogja) can approve both, but not Bandung
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "APPROVE_MOU",
      userBranchIds: ["branch-solo", "branch-jogja"],
      targetBranchId: "branch-solo",
    }),
    true,
  );
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "APPROVE_MOU",
      userBranchIds: ["branch-solo", "branch-jogja"],
      targetBranchId: "branch-jogja",
    }),
    true,
  );
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "APPROVE_MOU",
      userBranchIds: ["branch-solo", "branch-jogja"],
      targetBranchId: "branch-bdg",
    }),
    false,
  );

  // Staff with no branch assignment cannot approve any MOU
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "APPROVE_MOU",
      userBranchIds: [],
      targetBranchId: "branch-solo",
    }),
    false,
  );

  // Viewer cannot approve any MOU
  assert.equal(
    hasScopedPermission({
      role: "viewer",
      action: "APPROVE_MOU",
      userBranchIds: ["branch-solo"],
      targetBranchId: "branch-solo",
    }),
    false,
  );
});

test("hasScopedPermission preserves admin-only restrictions even for branch PIC", () => {
  // Staff cannot delete MOU or manage master data even in their assigned branch
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "DELETE_MOU",
      userBranchIds: ["branch-solo"],
      targetBranchId: "branch-solo",
    }),
    false,
  );
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "MANAGE_MASTER_DATA",
      userBranchIds: ["branch-solo"],
      targetBranchId: "branch-solo",
    }),
    false,
  );
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "DELETE_DOCUMENT",
      userBranchIds: ["branch-solo"],
      targetBranchId: "branch-solo",
    }),
    false,
  );
});
