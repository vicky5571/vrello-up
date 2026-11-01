import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("User Branch Assignment UI & Coordinator Invariants", () => {
  it("enforces coordinator file size limit <= 250 LOC for all UsersView components", () => {
    const files = [
      "UsersView.tsx",
      "UsersActiveTab.tsx",
      "UsersPendingTab.tsx",
      "UsersRejectedTab.tsx",
      "UsersHeader.tsx",
      "UserRoleSelect.tsx",
      "UserStatusBadge.tsx",
      "UserActiveRow.tsx",
      "ApproveUserModal.tsx",
      "UserBranchSelectModal.tsx",
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

  it("verifies UsersPendingTab integrates ApproveUserModal with role and branch selection", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "src/components/views/UsersView/UsersPendingTab.tsx"),
      "utf-8"
    );
    assert.match(content, /ApproveUserModal/);
    assert.match(content, /setApprovingUser\(user\)/);
    assert.match(content, /handleConfirmApprove/);
    assert.match(content, /assignedBranchIds/);
  });

  it("verifies UsersActiveTab renders Cabang column and UserBranchSelectModal", () => {
    const activeTabContent = fs.readFileSync(
      path.join(process.cwd(), "src/components/views/UsersView/UsersActiveTab.tsx"),
      "utf-8"
    );
    assert.match(activeTabContent, /<th[^>]*>Cabang<\/th>/);
    assert.match(activeTabContent, /UserBranchSelectModal/);
    assert.match(activeTabContent, /handleBranchSave/);

    const rowContent = fs.readFileSync(
      path.join(process.cwd(), "src/components/views/UsersView/UserActiveRow.tsx"),
      "utf-8"
    );
    assert.match(rowContent, /formatUserBranchBadges/);
    assert.match(rowContent, /Nasional/);
    assert.match(rowContent, /onEditBranches/);
  });

  it("verifies UsersView fetches branches and passes them to child tabs", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "src/components/views/UsersView/UsersView.tsx"),
      "utf-8"
    );
    assert.match(content, /\/api\/marcom\/branches/);
    assert.match(content, /branches=\{branches\}/);
    assert.match(content, /actorBranchIds=\{actorBranchIds\}/);
  });
});

