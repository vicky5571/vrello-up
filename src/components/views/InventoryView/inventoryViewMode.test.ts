import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Inventory View Mode Switcher and Default View Invariants", () => {
  const inventoryViewPath = path.resolve(
    process.cwd(),
    "src/components/views/InventoryView/InventoryView.tsx"
  );
  const headerKpisPath = path.resolve(
    process.cwd(),
    "src/components/views/InventoryView/InventoryHeaderKpis.tsx"
  );

  const inventoryViewContent = fs.readFileSync(inventoryViewPath, "utf-8");
  const headerKpisContent = fs.readFileSync(headerKpisPath, "utf-8");

  it("verifies InventoryView sets table as the default catalog view mode", () => {
    assert.ok(
      inventoryViewContent.includes(
        'const [catalogViewMode, setCatalogViewMode] = useState<"grid" | "table">("table")'
      ),
      'catalogViewMode must default to "table"'
    );
  });

  it("verifies switcher container and active pill background colors are swapped", () => {
    assert.ok(
      headerKpisContent.includes("bg-slate-100 dark:bg-slate-800"),
      "Switcher container must use bg-slate-100 dark:bg-slate-800 background"
    );
    assert.ok(
      headerKpisContent.includes("bg-white dark:bg-slate-900 rounded shadow-xs"),
      "Active pill must use bg-white dark:bg-slate-900 rounded shadow-xs"
    );
  });

  it("verifies button order has table on the left and card/grid on the right", () => {
    // In catalog view switcher: table button should appear before grid button
    const catalogBranchIndex = headerKpisContent.indexOf('activeTab === "catalog"');
    assert.ok(catalogBranchIndex !== -1, "Must contain catalog tab condition");

    const afterCatalog = headerKpisContent.slice(catalogBranchIndex);
    const tableIndex = afterCatalog.indexOf('title="Table View"');
    const gridIndex = afterCatalog.indexOf('title="Grid View"');

    assert.ok(tableIndex !== -1, "Must contain Table View button");
    assert.ok(gridIndex !== -1, "Must contain Grid View button");
    assert.ok(
      tableIndex < gridIndex,
      "Table View button must be on the left (precede Grid View button in DOM order)"
    );
  });
});

