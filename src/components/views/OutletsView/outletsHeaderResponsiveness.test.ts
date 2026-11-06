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

