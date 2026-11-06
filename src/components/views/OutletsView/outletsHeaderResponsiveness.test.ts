import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Typographical Scale & Desktop Invariants (ADR-0059)", () => {
  const outletsHeaderPath = path.resolve(
    process.cwd(),
    "src/components/views/OutletsView/OutletsHeader.tsx"
  );
  const bottomNavPath = path.resolve(
    process.cwd(),
    "src/components/layout/MobileBottomNav.tsx"
  );
  const outletsViewPath = path.resolve(
    process.cwd(),
    "src/components/views/OutletsView/OutletsView.tsx"
  );

  it("verifies OutletsHeader employs responsive title scale text-base sm:text-xl", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("text-base sm:text-xl"),
      "OutletsHeader title must use text-base on mobile and sm:text-xl on desktop"
    );
    assert.ok(
      content.includes("text-[10px] sm:text-[11px]"),
      "OutletsHeader badge must use text-[10px] on mobile and sm:text-[11px] on desktop"
    );
  });

  it("verifies OutletsHeader subtitle uses text-[11px] sm:text-xs", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("text-[11px] sm:text-xs"),
      "OutletsHeader subtitle must use text-[11px] on mobile and sm:text-xs on desktop"
    );
  });

  it("verifies action buttons and search inputs scale to h-8 sm:h-9 text-xs sm:text-sm", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("h-8 sm:h-9"),
      "OutletsHeader buttons/inputs must use h-8 on mobile and sm:h-9 on desktop"
    );
  });

  it("verifies OutletsView table rows use compact mobile padding py-2 sm:py-3.5", () => {
    const content = fs.readFileSync(outletsViewPath, "utf-8");
    assert.ok(
      content.includes("py-2 sm:py-3.5") || content.includes("text-xs sm:text-sm"),
      "OutletsView table cells must scale to text-xs on mobile"
    );
  });

  it("verifies MobileBottomNav uses text-[10.5px] font-medium for label balance", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");
    assert.ok(
      content.includes("text-[10.5px] font-medium"),
      "MobileBottomNav must use text-[10.5px] font-medium"
    );
  });
});

describe("Mobile Filter & Search Proportional Grid (ADR-0060)", () => {
  const outletsHeaderPath = path.resolve(
    process.cwd(),
    "src/components/views/OutletsView/OutletsHeader.tsx"
  );

  it("verifies OutletsHeader dropdowns use 2-column mobile grid: grid grid-cols-2", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("grid grid-cols-2"),
      "Dropdown container must use 'grid grid-cols-2' on mobile"
    );
    assert.ok(
      content.includes("w-full sm:w-44"),
      "Dropdowns must use 'w-full sm:w-44' to span 50% on mobile and fixed 176px on desktop"
    );
  });

  it("verifies OutletsHeader search input uses full width flex-1 on mobile row 2", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("relative flex-1 sm:w-52") || content.includes("flex-1 sm:w-52"),
      "Search container must use flex-1 on mobile and sm:w-52 on desktop"
    );
  });

  it("verifies desktop invariants are strictly preserved (sm:w-44, sm:w-52, sm:flex)", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("sm:flex") && content.includes("sm:items-center"),
      "Dropdown wrapper must switch to 'sm:flex sm:items-center' on desktop"
    );
    assert.ok(
      content.includes("sm:w-44"),
      "Dropdowns must retain 'sm:w-44' on desktop"
    );
    assert.ok(
      content.includes("sm:w-52"),
      "Search box must retain 'sm:w-52' on desktop"
    );
  });
});

describe("Mobile Action Row Alignment & View Switcher (ADR-0061)", () => {
  const outletsHeaderPath = path.resolve(
    process.cwd(),
    "src/components/views/OutletsView/OutletsHeader.tsx"
  );

  it("verifies OutletsHeader action row uses right alignment on mobile: justify-end sm:justify-start w-full sm:w-auto", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("justify-end sm:justify-start") && content.includes("w-full sm:w-auto"),
      "OutletsHeader action row must be right-aligned on mobile"
    );
  });

  it("verifies OutletsHeader view switcher container uses w-full sm:w-auto and items-stretch sm:items-center", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("w-full sm:w-auto flex items-stretch sm:items-center"),
      "OutletsHeader view switcher must use items-stretch on mobile and sm:items-center on desktop"
    );
    assert.ok(
      content.includes("flex-1 sm:flex-initial") && content.includes("justify-center"),
      "OutletsHeader view switcher tabs must use flex-1 sm:flex-initial justify-center"
    );
  });

  it("verifies OutletsHeader view switcher tabs use min-h-[40px] sm:min-h-0 for consistent pill height", () => {
    const content = fs.readFileSync(outletsHeaderPath, "utf-8");
    assert.ok(
      content.includes("min-h-[40px] sm:min-h-0"),
      "OutletsHeader view switcher buttons must use min-h-[40px] on mobile and sm:min-h-0 on desktop"
    );
  });
});

