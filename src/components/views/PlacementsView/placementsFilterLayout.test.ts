import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("ADR-0062 smoke: Placements table header deduplication and filter toolbar unification invariants", async (t) => {
  const placementsViewPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementsView.tsx"
  );
  const filterControlsPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementFilterControls.tsx"
  );

  const placementsViewCode = fs.readFileSync(placementsViewPath, "utf-8");
  const filterControlsCode = fs.readFileSync(filterControlsPath, "utf-8");

  await t.test("PlacementsView.tsx coordinator invariants", () => {
    const loc = placementsViewCode.split("\n").length;
    assert.ok(
      loc <= 250,
      `PlacementsView.tsx LOC must be <= 250, currently ${loc}`
    );

    // Must set hideHeader on MarcomTableShell to eliminate duplicate [📋] Placements title
    assert.match(
      placementsViewCode,
      /<MarcomTableShell[^>]*hideHeader/,
      "MarcomTableShell must declare hideHeader to eliminate duplicate table title"
    );

    // Must NOT pass headerExtra={brandChips} to MarcomTableShell to prevent mobile clipping
    assert.doesNotMatch(
      placementsViewCode,
      /headerExtra=\{brandChips\}/,
      "MarcomTableShell must not pass headerExtra={brandChips} because brand filter is now in the toolbar"
    );

    // Must mount PlacementTableToolbar in filterBar
    assert.match(
      placementsViewCode,
      /<PlacementTableToolbar/,
      "PlacementsView must mount PlacementTableToolbar in filterBar"
    );
  });

  await t.test("PlacementFilterControls.tsx toolbar invariants", () => {
    const loc = filterControlsCode.split("\n").length;
    assert.ok(
      loc <= 250,
      `PlacementFilterControls.tsx LOC must be <= 250, currently ${loc}`
    );

    // Must export PlacementTableToolbar
    assert.match(
      filterControlsCode,
      /export function PlacementTableToolbar/,
      "PlacementFilterControls.tsx must export PlacementTableToolbar"
    );

    // Must support full-width mobile search and compact desktop search
    assert.match(
      filterControlsCode,
      /flex-col sm:flex-row/,
      "Toolbar row 1 must stack on mobile and flex on desktop"
    );
    assert.match(
      filterControlsCode,
      /flex-1 sm:max-w-xs/,
      "Search input container must be flex-1 on mobile and sm:max-w-xs on desktop"
    );

    // Must integrate PlacementBrandChips and PlacementStatusChips
    assert.match(
      filterControlsCode,
      /<PlacementBrandChips/,
      "PlacementTableToolbar must render PlacementBrandChips"
    );
    assert.match(
      filterControlsCode,
      /<PlacementStatusChips/,
      "PlacementTableToolbar must render PlacementStatusChips"
    );
  });
});

