import test from "node:test";
import assert from "node:assert/strict";
import {
  hasPermission,
  hasScopedPermission,
  canAccessBranch,
  canAccessUserManagement,
  canManageUserTarget,
  canAssignUserRole,
} from "./guards";

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
  const all = [
    "CREATE_MOU",
    "APPROVE_MOU",
    "DELETE_MOU",
    "CREATE_PLACEMENT",
    "UPDATE_PLACEMENT",
    "CREATE_EVENT",
    "UPLOAD_VIDEO_FOOTAGE",
    "UPLOAD_DOCUMENT",
    "DELETE_DOCUMENT",
    "MANAGE_MASTER_DATA",
    "EXPORT_REPORTS",
    "SUBMIT_DRAFT_OUTLET",
    "APPROVE_OUTLET",
  ] as const;
  for (const a of all) assert.equal(hasPermission("admin", a), true);
});

test("staff can submit draft outlet, but cannot approve outlet without branch scope", () => {
  assert.equal(hasPermission("staff", "SUBMIT_DRAFT_OUTLET"), true);
  assert.equal(hasPermission("staff", "APPROVE_OUTLET"), false);
  assert.equal(hasPermission("viewer", "SUBMIT_DRAFT_OUTLET"), false);
  assert.equal(hasPermission("viewer", "APPROVE_OUTLET"), false);
});

test("hasScopedPermission enforces branch boundaries for outlet approval (Four-Eyes Principle)", () => {
  // Admin can approve outlet in any branch
  assert.equal(
    hasScopedPermission({ role: "admin", action: "APPROVE_OUTLET", targetBranchId: "branch-smg" }),
    true
  );

  // PIC Branch Solo can approve Solo outlet
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "APPROVE_OUTLET",
      userBranchIds: ["branch-solo"],
      targetBranchId: "branch-solo",
    }),
    true
  );

  // PIC Branch Solo CANNOT approve Semarang outlet
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "APPROVE_OUTLET",
      userBranchIds: ["branch-solo"],
      targetBranchId: "branch-smg",
    }),
    false
  );

  // Staff with no branch assignment cannot approve any outlet
  assert.equal(
    hasScopedPermission({
      role: "staff",
      action: "APPROVE_OUTLET",
      userBranchIds: [],
      targetBranchId: "branch-solo",
    }),
    false
  );
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

test("supervisor has admin-level operational capabilities in unscoped capability checks", () => {
  assert.equal(hasPermission("supervisor", "CREATE_MOU"), true);
  assert.equal(hasPermission("supervisor", "APPROVE_MOU"), true);
  assert.equal(hasPermission("supervisor", "DELETE_MOU"), true);
  assert.equal(hasPermission("supervisor", "APPROVE_OUTLET"), true);
  assert.equal(hasPermission("supervisor", "APPROVE_BORROW"), true);
  assert.equal(hasPermission("supervisor", "DELETE_DOCUMENT"), true);
  assert.equal(hasPermission("supervisor", "EXPORT_REPORTS"), true);
  assert.equal(hasPermission("supervisor", "VIEW_INVENTORY"), true);
  // MANAGE_MASTER_DATA is forbidden for supervisor
  assert.equal(hasPermission("supervisor", "MANAGE_MASTER_DATA"), false);
});

test("hasScopedPermission grants supervisor admin authority within assigned branches, but blocks outside", () => {
  const supervisorBranches = ["branch-sby", "branch-mlg"];

  // Permitted in assigned branch Surabaya
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "APPROVE_MOU",
      userBranchIds: supervisorBranches,
      targetBranchId: "branch-sby",
    }),
    true
  );
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "DELETE_MOU",
      userBranchIds: supervisorBranches,
      targetBranchId: "branch-sby",
    }),
    true
  );
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "APPROVE_OUTLET",
      userBranchIds: supervisorBranches,
      targetBranchId: "branch-sby",
    }),
    true
  );
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "APPROVE_BORROW",
      userBranchIds: supervisorBranches,
      targetBranchId: "branch-sby",
    }),
    true
  );
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "DELETE_DOCUMENT",
      userBranchIds: supervisorBranches,
      targetBranchId: "branch-sby",
    }),
    true
  );

  // BLOCKED in unassigned branch Jakarta
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "APPROVE_MOU",
      userBranchIds: supervisorBranches,
      targetBranchId: "branch-jkt",
    }),
    false
  );
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "DELETE_MOU",
      userBranchIds: supervisorBranches,
      targetBranchId: "branch-jkt",
    }),
    false
  );
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "APPROVE_OUTLET",
      userBranchIds: supervisorBranches,
      targetBranchId: "branch-jkt",
    }),
    false
  );
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "APPROVE_BORROW",
      userBranchIds: supervisorBranches,
      targetBranchId: "branch-jkt",
    }),
    false
  );

  // MANAGE_MASTER_DATA is ALWAYS forbidden for supervisor, even in assigned branch
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "MANAGE_MASTER_DATA",
      userBranchIds: supervisorBranches,
      targetBranchId: "branch-sby",
    }),
    false
  );

  // Global reporting and inventory viewing are always permitted
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "EXPORT_REPORTS",
      userBranchIds: supervisorBranches,
    }),
    true
  );
  assert.equal(
    hasScopedPermission({
      role: "supervisor",
      action: "VIEW_INVENTORY",
      userBranchIds: supervisorBranches,
    }),
    true
  );
});

test("canAccessBranch strictly bounds supervisor to assigned branches", () => {
  const supervisorBranches = ["branch-sby", "branch-mlg"];
  assert.equal(canAccessBranch("supervisor", supervisorBranches, "branch-sby"), true);
  assert.equal(canAccessBranch("supervisor", supervisorBranches, "branch-mlg"), true);
  assert.equal(canAccessBranch("supervisor", supervisorBranches, "branch-jkt"), false);
  assert.equal(canAccessBranch("supervisor", [], "branch-sby"), false);
});

test("canAccessUserManagement grants access strictly to admin and supervisor", () => {
  assert.equal(canAccessUserManagement("admin"), true);
  assert.equal(canAccessUserManagement("ADMIN"), true);
  assert.equal(canAccessUserManagement("supervisor"), true);
  assert.equal(canAccessUserManagement("SUPERVISOR"), true);
  assert.equal(canAccessUserManagement("staff"), false);
  assert.equal(canAccessUserManagement("viewer"), false);
  assert.equal(canAccessUserManagement(""), false);
  assert.equal(canAccessUserManagement(null), false);
  assert.equal(canAccessUserManagement(undefined), false);
});

test("canManageUserTarget enforces guarded protection for admin accounts", () => {
  // Admin can manage anyone
  assert.equal(canManageUserTarget("admin", "admin"), true);
  assert.equal(canManageUserTarget("admin", "supervisor"), true);
  assert.equal(canManageUserTarget("admin", "staff"), true);
  assert.equal(canManageUserTarget("admin", "viewer"), true);

  // Supervisor can manage supervisor, staff, viewer, but NEVER admin
  assert.equal(canManageUserTarget("supervisor", "admin"), false);
  assert.equal(canManageUserTarget("supervisor", "ADMIN"), false);
  assert.equal(canManageUserTarget("supervisor", "supervisor"), true);
  assert.equal(canManageUserTarget("supervisor", "staff"), true);
  assert.equal(canManageUserTarget("supervisor", "viewer"), true);

  // Staff and viewer cannot manage anyone
  assert.equal(canManageUserTarget("staff", "staff"), false);
  assert.equal(canManageUserTarget("viewer", "viewer"), false);
  assert.equal(canManageUserTarget(null, "staff"), false);
});

test("canAssignUserRole prevents supervisors from assigning admin role", () => {
  // Admin can assign any role
  assert.equal(canAssignUserRole("admin", "admin"), true);
  assert.equal(canAssignUserRole("admin", "supervisor"), true);
  assert.equal(canAssignUserRole("admin", "staff"), true);
  assert.equal(canAssignUserRole("admin", "viewer"), true);

  // Supervisor can assign supervisor, staff, viewer, but CANNOT assign admin
  assert.equal(canAssignUserRole("supervisor", "admin"), false);
  assert.equal(canAssignUserRole("supervisor", "ADMIN"), false);
  assert.equal(canAssignUserRole("supervisor", "supervisor"), true);
  assert.equal(canAssignUserRole("supervisor", "staff"), true);
  assert.equal(canAssignUserRole("supervisor", "viewer"), true);
  assert.equal(canAssignUserRole("supervisor", "invalid"), false);

  // Staff and viewer cannot assign any roles
  assert.equal(canAssignUserRole("staff", "viewer"), false);
  assert.equal(canAssignUserRole("viewer", "viewer"), false);
  assert.equal(canAssignUserRole(null, "staff"), false);
});

