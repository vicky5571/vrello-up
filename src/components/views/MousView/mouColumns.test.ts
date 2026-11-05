import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("mouColumns and MarcomTableShell sticky right configuration (ADR-0030)", () => {
  const mouColumnsPath = path.resolve(
    process.cwd(),
    "src/components/views/MousView/mouColumns.tsx"
  );
  const tableShellPath = path.resolve(
    process.cwd(),
    "src/components/views/shared/MarcomTableShell.tsx"
  );

  const mouColumnsContent = fs.readFileSync(mouColumnsPath, "utf-8");
  const tableShellContent = fs.readFileSync(tableShellPath, "utf-8");

  it("verifies mouColumns document column has sticky right with offset 130 and stickyBorder", () => {
    assert.ok(
      mouColumnsContent.includes('id: "document"'),
      "mouColumns must have document column"
    );
    assert.ok(
      mouColumnsContent.includes('sticky: "right"'),
      "mouColumns must define sticky right"
    );
    assert.ok(
      mouColumnsContent.includes("stickyOffset: 130"),
      "document column must have stickyOffset 130"
    );
    assert.ok(
      mouColumnsContent.includes("stickyBorder: true"),
      "document column must have stickyBorder: true"
    );
  });

  it("verifies mouColumns actions column has sticky right with offset 0", () => {
    assert.ok(
      mouColumnsContent.includes('id: "actions"'),
      "mouColumns must have actions column"
    );
    assert.ok(
      mouColumnsContent.includes("stickyOffset: 0"),
      "actions column must have stickyOffset 0"
    );
  });

  it("verifies mouColumns retains column widths and provides ample space for actions", () => {
    assert.ok(
      mouColumnsContent.includes("size: 165"),
      "document column must have size: 165"
    );
    assert.ok(
      mouColumnsContent.includes("size: 130"),
      "actions column must have size: 130 to prevent clipping"
    );
  });

  it("verifies MarcomTableShell exports MarcomColumnMeta interface", () => {
    assert.ok(
      tableShellContent.includes("export interface MarcomColumnMeta"),
      "MarcomTableShell must export MarcomColumnMeta"
    );
    assert.ok(
      tableShellContent.includes('sticky?: "right" | "left"') ||
      tableShellContent.includes('sticky?: "left" | "right"'),
      "MarcomColumnMeta must support sticky left or right"
    );
    assert.ok(
      tableShellContent.includes("stickyOffset?: number"),
      "MarcomColumnMeta must support stickyOffset"
    );
    assert.ok(
      tableShellContent.includes("stickyBorder?: boolean"),
      "MarcomColumnMeta must support stickyBorder"
    );
  });

  it("verifies MarcomTableShell implements sticky right styles with solid backgrounds and shadows", () => {
    assert.ok(
      tableShellContent.includes('meta?.sticky === "right"'),
      "MarcomTableShell must check for sticky right meta"
    );
    assert.ok(
      tableShellContent.includes("bg-slate-50 dark:bg-[#18191B]"),
      "Header sticky cell must have solid background"
    );
    assert.ok(
      tableShellContent.includes("bg-white dark:bg-[#18191B]"),
      "Body sticky cell must have solid background"
    );
    assert.ok(
      tableShellContent.includes("group-hover:bg-slate-50 dark:group-hover:bg-[#202124]") &&
      !tableShellContent.includes("group-hover:bg-slate-50/80"),
      "Body sticky cell must have 100% opaque solid background on hover to prevent bleed-through"
    );
    assert.ok(
      tableShellContent.includes("shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)]"),
      "Sticky border must apply soft drop-shadow"
    );
    assert.ok(
      tableShellContent.includes("z-20") && tableShellContent.includes("z-10"),
      "Sticky cells must have appropriate z-indices"
    );
  });
});
