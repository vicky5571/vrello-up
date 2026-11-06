import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("ADR-0062 smoke: Placements table header deduplication and brand filter invariants", async (t) => {
  const placementsViewPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementsView.tsx"
  );
  const filterControlsPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementFilterControls.tsx"
  );
  const tableShellPath = path.resolve(
    process.cwd(),
    "src/components/views/shared/MarcomTableShell.tsx"
  );

  const placementsViewCode = fs.readFileSync(placementsViewPath, "utf-8");
  const filterControlsCode = fs.readFileSync(filterControlsPath, "utf-8");
  const tableShellCode = fs.readFileSync(tableShellPath, "utf-8");

  await t.test("PlacementsView.tsx coordinator invariants", () => {
    const loc = placementsViewCode.split("\n").length;
    assert.ok(
      loc <= 250,
      `PlacementsView.tsx LOC must be <= 250, currently ${loc}`
    );

    // Must set hideTitle on MarcomTableShell to eliminate duplicate [📋] Placements title
    assert.match(
      placementsViewCode,
      /<MarcomTableShell[^>]*hideTitle/,
      "MarcomTableShell must declare hideTitle to eliminate duplicate table title beside brand filter"
    );

    // Must pass headerExtra={brandChips} to keep the compact brand filter in the header
    assert.match(
      placementsViewCode,
      /headerExtra=\{brandChips\}/,
      "MarcomTableShell must pass headerExtra={brandChips} to keep the brand filter in the table header"
    );

    // Must pass filterBar={statusFilterChips}
    assert.match(
      placementsViewCode,
      /filterBar=\{statusFilterChips\}/,
      "PlacementsView must pass statusFilterChips into filterBar"
    );
  });

  await t.test("MarcomTableShell.tsx hideTitle support", () => {
    assert.match(
      tableShellCode,
      /hideTitle\?: boolean/,
      "MarcomTableShellProps must declare hideTitle?: boolean"
    );
    assert.match(
      tableShellCode,
      /\{!hideTitle && \(/,
      "MarcomTableShell must conditionally render title block based on hideTitle"
    );
    assert.match(
      tableShellCode,
      /hideTitle && "justify-end"/,
      "MarcomTableShell must right-align headerExtra when title is hidden"
    );
  });

  await t.test("PlacementFilterControls.tsx brand chips invariants", () => {
    const loc = filterControlsCode.split("\n").length;
    assert.ok(
      loc <= 250,
      `PlacementFilterControls.tsx LOC must be <= 250, currently ${loc}`
    );

    // Must retain compact pill design for brand chips (not stretched full width)
    assert.match(
      filterControlsCode,
      /export function PlacementBrandChips/,
      "PlacementFilterControls.tsx must export PlacementBrandChips"
    );
    assert.match(
      filterControlsCode,
      /shrink-0/,
      "PlacementBrandChips must have shrink-0 to preserve compact pill width"
    );
    assert.match(
      filterControlsCode,
      /inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap/,
      "PlacementBrandChips button must use compact inline-flex styling"
    );
  });
});
