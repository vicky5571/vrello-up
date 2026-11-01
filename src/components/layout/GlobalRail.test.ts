import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { formatPendingBadgeCount } from "@/lib/marcom/pendingUsersHelpers";

describe("GlobalRail Pending Users Badge", () => {
  it("enforces GlobalRail file size under 250 LOC coordinator limit", () => {
    const globalRailPath = path.resolve(
      process.cwd(),
      "src/components/layout/GlobalRail.tsx"
    );
    const content = fs.readFileSync(globalRailPath, "utf-8");
    const loc = content.split("\n").length;
    assert.ok(
      loc <= 250,
      `GlobalRail.tsx is ${loc} LOC, exceeding coordinator limit of 250`
    );
  });

  it("imports and invokes usePendingUsers with canManageUsers", () => {
    const globalRailPath = path.resolve(
      process.cwd(),
      "src/components/layout/GlobalRail.tsx"
    );
    const content = fs.readFileSync(globalRailPath, "utf-8");
    assert.ok(
      content.includes("usePendingUsers({ isAdmin: canManageUsers })"),
      "Expected GlobalRail to call usePendingUsers with { isAdmin: canManageUsers }"
    );
  });

  it("passes pendingUsersCount to the users item badge", () => {
    const globalRailPath = path.resolve(
      process.cwd(),
      "src/components/layout/GlobalRail.tsx"
    );
    const content = fs.readFileSync(globalRailPath, "utf-8");
    assert.ok(
      content.includes("badge: pendingUsersCount"),
      "Expected users nav item to receive badge: pendingUsersCount"
    );
  });

  it("renders small red dot badge with rose-500 background and proper typography", () => {
    const globalRailPath = path.resolve(
      process.cwd(),
      "src/components/layout/GlobalRail.tsx"
    );
    const content = fs.readFileSync(globalRailPath, "utf-8");
    assert.ok(
      content.includes('data-testid="users-pending-badge"'),
      "Expected badge to have testid users-pending-badge"
    );
    assert.ok(
      content.includes("bg-rose-500"),
      "Expected badge to have bg-rose-500 red styling"
    );
    assert.ok(
      content.includes("text-[9px]"),
      "Expected badge to have small text-[9px] font size"
    );
    assert.ok(
      content.includes("ring-2 ring-[#0F1115]"),
      "Expected badge to have ring-2 ring-[#0F1115] contrast separation"
    );
  });

  it("formats badge counts correctly across boundary thresholds", () => {
    assert.equal(formatPendingBadgeCount(0), null);
    assert.equal(formatPendingBadgeCount(1), "1");
    assert.equal(formatPendingBadgeCount(99), "99");
    assert.equal(formatPendingBadgeCount(100), "99+");
  });
});

