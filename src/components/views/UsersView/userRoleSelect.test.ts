import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { canManageUserTarget, canAssignUserRole, canAccessUserManagement } from "@/lib/marcom/guards";

describe("User Management UI & Coordinator Invariants", () => {
  it("enforces coordinator file size limit <= 250 LOC for all UsersView components", () => {
    const files = [
      "UsersView.tsx",
      "UsersActiveTab.tsx",
      "UsersRejectedTab.tsx",
      "UsersPendingTab.tsx",
      "UsersHeader.tsx",
      "UserRoleSelect.tsx",
    ];

    for (const file of files) {
      const filePath = path.join(process.cwd(), "src/components/views/UsersView", file);
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n").length;
      assert.ok(
        lines <= 250,
        `File ${file} exceeds 250 LOC (${lines} lines)`
      );
    }
  });

  it("verifies UserRoleSelect passes actorRole and disables admin modification for supervisor", () => {
    const activeTabContent = fs.readFileSync(
      path.join(process.cwd(), "src/components/views/UsersView/UsersActiveTab.tsx"),
      "utf-8"
    );
    assert.match(activeTabContent, /actorRole\?: UserRole/);
    assert.match(activeTabContent, /actorRole=\{actorRole\}/);
    assert.match(activeTabContent, /isSupervisorBlocked = actorRole === "supervisor" && isTargetAdmin/);

    const rejectedTabContent = fs.readFileSync(
      path.join(process.cwd(), "src/components/views/UsersView/UsersRejectedTab.tsx"),
      "utf-8"
    );
    assert.match(rejectedTabContent, /actorRole\?: UserRole/);
    assert.match(rejectedTabContent, /isSupervisorBlocked = actorRole === "supervisor" && isTargetAdmin/);

    const usersViewContent = fs.readFileSync(
      path.join(process.cwd(), "src/components/views/UsersView/UsersView.tsx"),
      "utf-8"
    );
    assert.match(usersViewContent, /const actorRole = \(session\?\.user\?\.role as UserRole\) \|\| "viewer"/);
    assert.match(usersViewContent, /<UsersActiveTab[\s\S]*?actorRole=\{actorRole\}/);
    assert.match(usersViewContent, /<UsersRejectedTab[\s\S]*?actorRole=\{actorRole\}/);
  });

  it("verifies pure role guard logic for supervisor actor", () => {
    // Supervisor can access user management
    assert.equal(canAccessUserManagement("supervisor"), true);
    assert.equal(canAccessUserManagement("admin"), true);
    assert.equal(canAccessUserManagement("staff"), false);
    assert.equal(canAccessUserManagement("viewer"), false);

    // Supervisor cannot manage admin targets
    assert.equal(canManageUserTarget("supervisor", "admin"), false);
    assert.equal(canManageUserTarget("supervisor", "supervisor"), true);
    assert.equal(canManageUserTarget("supervisor", "staff"), true);
    assert.equal(canManageUserTarget("supervisor", "viewer"), true);

    // Supervisor cannot assign admin role
    assert.equal(canAssignUserRole("supervisor", "admin"), false);
    assert.equal(canAssignUserRole("supervisor", "supervisor"), true);
    assert.equal(canAssignUserRole("supervisor", "staff"), true);
    assert.equal(canAssignUserRole("supervisor", "viewer"), true);
  });
});

