import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("ROI Charts Mobile Readability & Desktop Invariants (ADR-0098)", () => {
  const chartCardPath = path.resolve(
    process.cwd(),
    "src/components/views/AnalyticsView/charts/ChartCard.tsx"
  );
  const eventChartPath = path.resolve(
    process.cwd(),
    "src/components/views/AnalyticsView/charts/EventEfficiencyChart.tsx"
  );
  const posmChartPath = path.resolve(
    process.cwd(),
    "src/components/views/AnalyticsView/charts/PosmEconomicsChart.tsx"
  );
  const contentChartPath = path.resolve(
    process.cwd(),
    "src/components/views/AnalyticsView/charts/ContentCadenceChart.tsx"
  );

  it("verifies ChartCard implements line-clamp-2 on mobile and single-line truncation on desktop", () => {
    const content = fs.readFileSync(chartCardPath, "utf-8");
    assert.ok(
      content.includes("line-clamp-2 sm:truncate"),
      "ChartCard title must use line-clamp-2 sm:truncate"
    );
    assert.ok(
      content.includes("line-clamp-2 sm:line-clamp-1"),
      "ChartCard subtitle must use line-clamp-2 sm:line-clamp-1"
    );
  });

  it("verifies EventEfficiencyChart applies interval 0, angled ticks, and expanded bottom margin on mobile", () => {
    const content = fs.readFileSync(eventChartPath, "utf-8");
    assert.ok(
      content.includes("interval={0}"),
      "EventEfficiencyChart XAxis must specify interval={0}"
    );
    assert.ok(
      content.includes("-35"),
      "EventEfficiencyChart XAxis must angle ticks to -35deg on mobile"
    );
    assert.ok(
      content.includes("bottom: mobileActive ? 42 : 5"),
      "EventEfficiencyChart must use expanded bottom margin on mobile"
    );
  });

  it("verifies PosmEconomicsChart adopts segmented progress bar list layout (ADR-0110 supersedes ADR-0098)", () => {
    const content = fs.readFileSync(posmChartPath, "utf-8");
    assert.ok(
      !content.includes("h-96 sm:h-72"),
      "PosmEconomicsChart must not use cramped fixed SVG height h-96 sm:h-72"
    );
    assert.ok(
      !content.includes("<YAxis"),
      "PosmEconomicsChart must eliminate cramped YAxis to prevent text collisions"
    );
    assert.ok(
      content.includes("h-3 w-full rounded-full"),
      "PosmEconomicsChart must use full-width segmented progress bar tracks"
    );
    assert.ok(
      content.includes("bg-emerald-500"),
      "PosmEconomicsChart must render emerald done segments"
    );
  });

  it("verifies ContentCadenceChart applies interval 0 on XAxis", () => {
    const content = fs.readFileSync(contentChartPath, "utf-8");
    assert.ok(
      content.includes("interval={0}"),
      "ContentCadenceChart XAxis must specify interval={0}"
    );
  });
});
