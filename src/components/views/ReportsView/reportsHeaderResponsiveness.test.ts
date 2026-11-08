import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Reports Header Mobile Responsiveness & Desktop Invariants", () => {
  const headerPath = path.resolve(
    process.cwd(),
    "src/components/views/ReportsView/ReportsHeader.tsx"
  );
  const posmTabPath = path.resolve(
    process.cwd(),
    "src/components/views/ReportsView/QuarterlyPosmReportTab.tsx"
  );

  it("verifies main header action row aligns right on mobile and left on desktop", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      content.includes("justify-end sm:justify-start"),
      "ReportsHeader action row must use justify-end on mobile and sm:justify-start on desktop"
    );
  });

  it("verifies create report button aligns right on mobile and auto on desktop", () => {
    const content = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      content.includes("self-end sm:self-auto"),
      "Create report button must use self-end on mobile and sm:self-auto on desktop"
    );
  });

  it("verifies POSM quarterly tab action bar uses mobile 2-line layout and executive theme (ADR-0097)", () => {
    const content = fs.readFileSync(posmTabPath, "utf-8");
    assert.ok(
      content.includes("grid-cols-2"),
      "QuarterlyPosmReportTab action bar must use balanced grid-cols-2 on mobile"
    );
    assert.ok(
      content.includes("Cetak Laporan"),
      "QuarterlyPosmReportTab print button must use concise label 'Cetak Laporan'"
    );
    assert.ok(
      !content.includes("Cetak PDF / Laporan"),
      "QuarterlyPosmReportTab must remove verbose label 'Cetak PDF / Laporan'"
    );
    assert.ok(
      content.includes("bg-indigo-600"),
      "QuarterlyPosmReportTab print button must use executive indigo theme"
    );
  });
});
