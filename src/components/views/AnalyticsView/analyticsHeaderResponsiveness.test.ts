import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Analytics Header Mobile Responsiveness & Desktop Invariants (ADR-0065)", () => {
  const headerPath = path.resolve(
    process.cwd(),
    "src/components/views/AnalyticsView/AnalyticsHeader.tsx"
  );
  const content = fs.readFileSync(headerPath, "utf-8");

  it("verifies action button container aligns right on mobile and left on desktop", () => {
    assert.ok(
      content.includes("justify-end sm:justify-start"),
      "AnalyticsHeader action row must use justify-end on mobile and sm:justify-start on desktop"
    );
  });

  it("verifies filter dropdowns are organized in a 50/50 2-column grid on mobile", () => {
    assert.ok(
      content.includes("grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center"),
      "Filter dropdowns must use a 50/50 grid on mobile and flex on desktop"
    );
    assert.ok(
      content.includes('className="w-full sm:w-44 text-xs"'),
      "Branch dropdown must use w-full on mobile and sm:w-44 on desktop"
    );
    assert.ok(
      content.includes('className="w-full sm:w-36 text-xs"'),
      "Quarter dropdown must use w-full on mobile and sm:w-36 on desktop"
    );
  });

  it("verifies filter row 2 pairs brand pills and reset button with justify-between on mobile", () => {
    assert.ok(
      content.includes("flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto"),
      "Row 2 must use justify-between on mobile and sm:justify-start on desktop"
    );
  });

  it("verifies KPI cards container renders horizontal scroll strip on mobile and grid on desktop", () => {
    assert.ok(
      content.includes(
        "flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 scrollbar-none"
      ),
      "KPI container must be flex overflow-x-auto on mobile and sm:grid on desktop"
    );
  });

  it("verifies KPI cards use min-w-[210px] shrink-0 on mobile and reset on desktop", () => {
    assert.ok(
      content.includes("min-w-[210px] shrink-0 sm:min-w-0 sm:shrink"),
      "KPI cards must use min-w-[210px] shrink-0 on mobile to avoid text truncation"
    );
  });

  it("verifies Live Metrics pill is removed from page header", () => {
    assert.ok(
      !content.includes("Live Metrics"),
      "AnalyticsHeader must not render 'Live Metrics' pill"
    );
  });
});
