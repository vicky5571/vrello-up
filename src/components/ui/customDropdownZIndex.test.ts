import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Z-Index Stacking Context Standardization Invariants (ADR-0039)", () => {
  it("verifies CustomDropdown elevates container to z-50 when open", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/components/ui/CustomDropdown.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(
      content.includes('isOpen ? "z-50" : "z-auto"'),
      "CustomDropdown container must apply z-50 when isOpen is true"
    );
  });

  it("verifies MarcomTableShell root container has isolate class", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/components/views/shared/MarcomTableShell.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(
      content.includes('"h-full w-full isolate"'),
      "MarcomTableShell container must include isolate class to create an isolated stacking context"
    );
  });

  it("verifies MousView table wrapper has isolate class", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/components/views/MousView/MousView.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(
      content.includes("p-4 sm:p-6 flex-1 min-h-0 space-y-4 isolate"),
      "MousView table wrapper must include isolate class"
    );
  });

  it("verifies TopNav has relative z-40 class", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/components/layout/TopNav.tsx"
    );
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(
      content.includes("relative z-40"),
      "TopNav must use relative z-40 to stack above view headers"
    );
  });

  it("verifies Marcom view headers use relative z-30", () => {
    const headerFiles = [
      "src/components/views/MousView/MousHeader.tsx",
      "src/components/views/OutletsView/OutletsHeader.tsx",
      "src/components/views/BranchesView/BranchesHeader.tsx",
      "src/components/views/DocumentsView/DocumentsHeader.tsx",
      "src/components/views/EventsView/EventsHeader.tsx",
      "src/components/views/ReportsView/ReportsHeader.tsx",
      "src/components/views/AnalyticsView/AnalyticsHeader.tsx",
      "src/components/views/InventoryView/InventoryHeaderKpis.tsx",
      "src/components/views/UsersView/UsersHeader.tsx",
      "src/components/views/ProfileView/ProfileHeader.tsx",
      "src/components/layout/ProjectsFilterBar.tsx",
      "src/components/views/PipelineView/PipelineFilterBar.tsx",
    ];

    for (const relPath of headerFiles) {
      const fullPath = path.resolve(process.cwd(), relPath);
      const content = fs.readFileSync(fullPath, "utf-8");
      assert.ok(
        content.includes("relative z-30"),
        `${relPath} must use relative z-30`
      );
    }
  });
});
