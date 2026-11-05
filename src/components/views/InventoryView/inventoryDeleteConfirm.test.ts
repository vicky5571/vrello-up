import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Inventory View Delete Confirmation Integration (ADR-0040)", () => {
  const inventoryViewPath = path.resolve(
    process.cwd(),
    "src/components/views/InventoryView/InventoryView.tsx"
  );

  it("verifies InventoryView imports and mounts ConfirmDialog", () => {
    const content = fs.readFileSync(inventoryViewPath, "utf-8");

    assert.ok(
      content.includes("ConfirmDialog"),
      "InventoryView must import ConfirmDialog"
    );
    assert.ok(
      content.includes("<ConfirmDialog"),
      "InventoryView must render <ConfirmDialog />"
    );
  });

  it("verifies InventoryView completely eliminates browser-native confirm()", () => {
    const content = fs.readFileSync(inventoryViewPath, "utf-8");

    // Match confirm( or window.confirm( but not ConfirmDialog
    const hasWindowConfirm = /window\.confirm\s*\(/.test(content);
    const hasBareConfirm = /(?<![A-Za-z0-9_])confirm\s*\(/.test(content);

    assert.ok(
      !hasWindowConfirm && !hasBareConfirm,
      "InventoryView must NOT call window.confirm() or confirm()"
    );
  });

  it("verifies InventoryView tracks deletingItem state and wraps deletion in try...finally", () => {
    const content = fs.readFileSync(inventoryViewPath, "utf-8");

    assert.ok(
      content.includes("deletingItem"),
      "InventoryView must declare and track deletingItem state"
    );
    assert.ok(
      content.includes("isDeleting"),
      "InventoryView must declare and track isDeleting loading state"
    );
    assert.ok(
      content.includes("finally") && content.includes("setIsDeleting(false)"),
      "InventoryView must reset isDeleting to false inside a finally block"
    );
  });
});
