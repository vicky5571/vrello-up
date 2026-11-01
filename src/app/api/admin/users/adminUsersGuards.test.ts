import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  canAccessUserManagement,
  canManageUserTarget,
  canAssignUserRole,
} from "@/lib/marcom/guards";

describe("Admin Users API Guard Invariants", () => {
  it("enforces canAccessUserManagement in GET /api/admin/users", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/app/api/admin/users/route.ts"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(
      content.includes("canAccessUserManagement(session.user.role)"),
      "Expected GET /api/admin/users to check canAccessUserManagement"
    );
  });

  it("enforces canAccessUserManagement in PATCH and DELETE /api/admin/users/[id]", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/app/api/admin/users/[id]/route.ts"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(
      content.includes("canAccessUserManagement(session.user.role)"),
      "Expected route to check canAccessUserManagement"
    );
  });

  it("enforces canManageUserTarget and canAssignUserRole in PATCH /api/admin/users/[id]", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/app/api/admin/users/[id]/route.ts"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(
      content.includes("canManageUserTarget(session.user.role, targetUser.role)"),
      "Expected PATCH to check canManageUserTarget"
    );
    assert.ok(
      content.includes("canAssignUserRole(session.user.role, role)"),
      "Expected PATCH to check canAssignUserRole"
    );
    assert.ok(
      content.includes("Supervisor tidak diizinkan mengubah akun Administrator."),
      "Expected error message for supervisor admin tampering"
    );
    assert.ok(
      content.includes("Supervisor tidak diizinkan memberikan role Administrator."),
      "Expected error message for supervisor privilege escalation"
    );
  });

  it("enforces canManageUserTarget in DELETE /api/admin/users/[id]", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/app/api/admin/users/[id]/route.ts"
    );
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(
      content.includes("canManageUserTarget(session.user.role, targetUser.role)"),
      "Expected DELETE to check canManageUserTarget"
    );
    assert.ok(
      content.includes("Supervisor tidak diizinkan menghapus akun Administrator."),
      "Expected error message for supervisor admin deletion"
    );
  });

  it("verifies supervisor role management invariants", () => {
    // Supervisor can access user management
    assert.equal(canAccessUserManagement("supervisor"), true);

    // Supervisor can manage staff and viewer
    assert.equal(canManageUserTarget("supervisor", "staff"), true);
    assert.equal(canManageUserTarget("supervisor", "viewer"), true);
    assert.equal(canManageUserTarget("supervisor", "supervisor"), true);

    // Supervisor cannot manage admin
    assert.equal(canManageUserTarget("supervisor", "admin"), false);
    assert.equal(canManageUserTarget("supervisor", "ADMIN"), false);

    // Supervisor can assign staff, viewer, supervisor
    assert.equal(canAssignUserRole("supervisor", "staff"), true);
    assert.equal(canAssignUserRole("supervisor", "viewer"), true);
    assert.equal(canAssignUserRole("supervisor", "supervisor"), true);

    // Supervisor cannot assign admin
    assert.equal(canAssignUserRole("supervisor", "admin"), false);
    assert.equal(canAssignUserRole("supervisor", "ADMIN"), false);
  });
});

