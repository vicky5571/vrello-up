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

  it("verifies MarcomTableShell implements responsive desktop-only sticky right (static md:sticky) (ADR-0085)", () => {
    assert.ok(
      !tableShellContent.includes('position: "sticky"'),
      "MarcomTableShell must not hardcode inline position: sticky so mobile viewports are not covered"
    );
    assert.ok(
      tableShellContent.includes("static md:sticky"),
      "MarcomTableShell must apply static md:sticky responsive classes to sticky cells"
    );
    assert.ok(
      tableShellContent.includes("md:border-l"),
      "MarcomTableShell must restrict left border on sticky cells to md breakpoint and above"
    );
    assert.ok(
      tableShellContent.includes("md:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)]"),
      "MarcomTableShell must restrict drop shadow on sticky cells to md breakpoint and above"
    );
  });

  it("verifies MousHeader status pill horizontal scroll and responsive search input (ADR-0085)", () => {
    const mousHeaderPath = path.resolve(
      process.cwd(),
      "src/components/views/MousView/MousHeader.tsx"
    );
    const mousHeaderContent = fs.readFileSync(mousHeaderPath, "utf-8");

    assert.ok(
      mousHeaderContent.includes("w-full sm:flex-1 sm:min-w-[200px] sm:max-w-xs"),
      "MousHeader search input wrapper must be full-width on mobile and constrained on sm/desktop"
    );
    assert.ok(
      mousHeaderContent.includes("w-full sm:w-auto max-w-full") &&
      mousHeaderContent.includes("overflow-hidden"),
      "MousHeader status pill container must wrap the label and scroll rail cleanly with overflow-hidden"
    );
    assert.ok(
      mousHeaderContent.includes("self-stretch") &&
      mousHeaderContent.includes("border-r border-slate-200/60 dark:border-slate-700/60") &&
      mousHeaderContent.includes("Status:"),
      "MousHeader Status: label must be full top-left-bottom (self-stretch) with a vertical divider border so no chips can be exposed behind it"
    );
    assert.ok(
      mousHeaderContent.includes("overflow-x-auto no-scrollbar p-1"),
      "MousHeader chip rail must have isolated horizontal scroll to cleanly clip scrolling chips at the Status divider"
    );
    assert.ok(
      mousHeaderContent.includes("relative shrink-0 whitespace-nowrap px-2.5 py-1"),
      "MousHeader status chip buttons must have shrink-0 whitespace-nowrap to avoid breaking sliding pill"
    );
  });

  it("verifies row-scoped loading animation and state guard for quick approve (ADR-0038)", () => {
    const mousViewPath = path.resolve(
      process.cwd(),
      "src/components/views/MousView/MousView.tsx"
    );
    const mousViewContent = fs.readFileSync(mousViewPath, "utf-8");

    // 1. Column contract imports and interface
    assert.ok(
      mouColumnsContent.includes("RefreshCw"),
      "mouColumns must import RefreshCw icon from lucide-react"
    );
    assert.ok(
      mouColumnsContent.includes("approvingMouId?: string | null"),
      "MouColumnDeps must define approvingMouId optional prop"
    );

    // 2. Row-scoped loading logic in actions column
    assert.ok(
      mouColumnsContent.includes("approvingMouId === row.original.id"),
      "mouColumns must compute isApproving based on row.original.id"
    );
    assert.ok(
      mouColumnsContent.includes("animate-spin"),
      "mouColumns must apply animate-spin class to RefreshCw when isApproving is true"
    );
    assert.ok(
      mouColumnsContent.includes("Menyetujui..."),
      "mouColumns must show Menyetujui... text when isApproving is true"
    );
    assert.ok(
      mouColumnsContent.includes("disabled={isApproving}"),
      "Quick approve button must have disabled={isApproving}"
    );

    // 3. MousView coordinator state and resilient recovery
    assert.ok(
      mousViewContent.includes("approvingMouId"),
      "MousView must declare and pass approvingMouId state"
    );
    assert.ok(
      mousViewContent.includes("finally") && mousViewContent.includes("setApprovingMouId(null)"),
      "MousView must reset approvingMouId to null inside a finally block"
    );
  });
});
