import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Action Row Alignment & View Switcher (ADR-0061)", () => {
  const placementsHeaderPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementsHeader.tsx"
  );
  const switcherPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementFilterControls.tsx"
  );
  const outletsHeaderPath = path.resolve(
    process.cwd(),
    "src/components/views/OutletsView/OutletsHeader.tsx"
  );
  const eventsHeaderPath = path.resolve(
    process.cwd(),
    "src/components/views/EventsView/EventsHeader.tsx"
  );

  it("verifies PlacementsHeader action row uses right alignment on mobile: justify-end sm:justify-start w-full sm:w-auto", () => {
    const content = fs.readFileSync(placementsHeaderPath, "utf-8");
    assert.ok(
      content.includes("justify-end sm:justify-start") && content.includes("w-full sm:w-auto"),
      "PlacementsHeader action row must be right-aligned on mobile"
    );
  });

  it("verifies PlacementViewSwitcher uses full width w-full on mobile with flex-1 tabs", () => {
    const content = fs.readFileSync(switcherPath, "utf-8");
    assert.ok(
      content.includes("w-full sm:w-auto"),
      "PlacementViewSwitcher must use w-full sm:w-auto"
    );
    assert.ok(
      content.includes("flex-1 sm:flex-initial") && content.includes("justify-center"),
      "PlacementViewSwitcher tab buttons must use flex-1 sm:flex-initial justify-center"
    );
  });

  it("verifies OutletsHeader action row and view switcher use full-width and right alignment on mobile", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("justify-end sm:justify-start") && content.includes("w-full sm:w-auto"),
      "OutletsHeader action row must be right-aligned on mobile"
    );
    assert.ok(
      content.includes("w-full sm:w-auto flex items-center") || (content.includes("w-full sm:w-auto") && content.includes("flex-1 sm:flex-initial")),
      "OutletsHeader view switcher must stretch on mobile with flex-1 tabs"
    );
  });

  it("verifies EventsHeader action row and view switcher use full-width and right alignment on mobile", () => {
    const content = fs.readFileSync(eventsHeaderPath, "utf-8");
    assert.ok(
      content.includes("justify-end sm:justify-start") && content.includes("w-full sm:w-auto"),
      "EventsHeader action row must be right-aligned on mobile"
    );
    assert.ok(
      content.includes("w-full sm:w-auto flex items-center") || (content.includes("w-full sm:w-auto") && content.includes("flex-1 sm:flex-initial")),
      "EventsHeader view switcher must stretch on mobile with flex-1 tabs"
    );
  });
});

