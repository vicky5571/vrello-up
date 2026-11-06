import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Inventory Header Mobile Responsiveness & Desktop Invariants", () => {
  const headerPath = path.resolve(
    process.cwd(),
    "src/components/views/InventoryView/InventoryHeaderKpis.tsx"
  );
  const tableViewPath = path.resolve(
    process.cwd(),
    "src/components/views/InventoryView/InventoryTableView.tsx"
  );
  const borrowTablePath = path.resolve(
    process.cwd(),
    "src/components/views/InventoryView/BorrowRecordsTable.tsx"
  );

  it("verifies outer padding uses responsive scale (p-4 sm:p-6)", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      content.includes("p-4 sm:p-6"),
      "InventoryHeaderKpis must use p-4 on mobile and sm:p-6 on desktop"
    );
  });

  it("verifies action row aligns right on mobile and left on desktop", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      content.includes("flex items-center gap-2 justify-end sm:justify-start"),
      "Action buttons must use justify-end on mobile and sm:justify-start on desktop"
    );
  });

  it("verifies segmented tabs expand 50/50 full width on mobile and stay inline on desktop", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      content.includes('role="tablist"') && content.includes("w-full sm:w-auto"),
      "Category tabs list must be w-full on mobile and sm:w-auto on desktop"
    );
    assert.ok(
      content.includes("flex-1 sm:flex-initial"),
      "Tab buttons must be flex-1 on mobile and sm:flex-initial on desktop"
    );
  });

  it("verifies search bar is full width on mobile (order-last) and first on desktop (sm:order-first sm:w-56)", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      content.includes("order-last sm:order-first relative w-full sm:w-56 text-xs"),
      "Search container must be full width and order-last on mobile, and sm:order-first sm:w-56 on desktop"
    );
  });

  it("verifies category dropdown expands flexibly on mobile and stays sm:w-44 on desktop", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      content.includes("flex-1 sm:flex-initial sm:w-44 text-xs"),
      "Category dropdown must use flex-1 on mobile to share row with switcher, and sm:w-44 on desktop"
    );
  });

  it("verifies equipment code in table view does not wrap into multiple lines", () => {
    const content = fs.readFileSync(tableViewPath, "utf-8");
    assert.ok(
      content.includes("whitespace-nowrap") && content.includes("{item.code}"),
      "Item code badge in InventoryTableView must have whitespace-nowrap to prevent hyphen splitting"
    );
  });

  it("verifies borrow code in borrow records table does not wrap into multiple lines", () => {
    const content = fs.readFileSync(borrowTablePath, "utf-8");
    assert.ok(
      content.includes("whitespace-nowrap") && content.includes("{r.borrowCode}"),
      "Borrow code in BorrowRecordsTable must have whitespace-nowrap"
    );
  });
});
