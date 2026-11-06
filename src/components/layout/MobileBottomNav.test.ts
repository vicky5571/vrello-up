import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Responsiveness Chassis Invariants (ADR-0057)", () => {
  const bottomNavPath = path.resolve(
    process.cwd(),
    "src/components/layout/MobileBottomNav.tsx"
  );
  const topNavPath = path.resolve(
    process.cwd(),
    "src/components/layout/TopNav.tsx"
  );
  const sidebarPath = path.resolve(
    process.cwd(),
    "src/components/layout/Sidebar.tsx"
  );
  const pagePath = path.resolve(
    process.cwd(),
    "src/app/page.tsx"
  );

  it("verifies MobileBottomNav component file exists and enforces 150 LOC limit", () => {
    assert.ok(fs.existsSync(bottomNavPath), "MobileBottomNav.tsx must exist");
    const content = fs.readFileSync(bottomNavPath, "utf-8");
    const loc = content.split("\n").length;
    assert.ok(loc <= 150, `MobileBottomNav.tsx is ${loc} LOC, exceeding 150 LOC limit`);
  });

  it("verifies MobileBottomNav contains all 5 canonical tabs and matching icons", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");
    assert.ok(content.includes("Home"), "Must include Home tab");
    assert.ok(content.includes("Outlets"), "Must include Outlets tab");
    assert.ok(content.includes("Placements"), "Must include Placements tab");
    assert.ok(content.includes("Events"), "Must include Events tab");
    assert.ok(content.includes("Menu"), "Must include Menu tab");

    // Canonical icons check
    assert.ok(content.includes("Home"), "Must use Home icon");
    assert.ok(content.includes("Store"), "Must use Store icon for Outlets");
    assert.ok(content.includes("MapPin"), "Must use MapPin icon for Placements");
    assert.ok(content.includes("CalendarDays"), "Must use CalendarDays icon for Events");
    assert.ok(content.includes("Menu"), "Must use Menu icon for Menu tab");
  });

  it("verifies MobileBottomNav is restricted to mobile viewports via md:hidden", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");
    assert.ok(content.includes("md:hidden"), "MobileBottomNav must include md:hidden class");
    assert.ok(content.includes("fixed bottom-0"), "MobileBottomNav must be fixed at bottom");
  });

  it("verifies TopNav contains hamburger menu trigger on mobile", () => {
    const content = fs.readFileSync(topNavPath, "utf-8");
    assert.ok(content.includes("toggleSidebar"), "TopNav must bind toggleSidebar");
    assert.ok(content.includes("md:hidden"), "TopNav hamburger must be md:hidden");
  });

  it("verifies page.tsx mounts MobileBottomNav and coordinator sizes stay under 250 LOC", () => {
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    assert.ok(pageContent.includes("MobileBottomNav"), "page.tsx must mount MobileBottomNav");

    const pageLoc = pageContent.split("\n").length;
    assert.ok(pageLoc <= 250, `page.tsx is ${pageLoc} LOC, exceeding 250 LOC coordinator limit`);

    const topNavContent = fs.readFileSync(topNavPath, "utf-8");
    const topNavLoc = topNavContent.split("\n").length;
    assert.ok(topNavLoc <= 250, `TopNav.tsx is ${topNavLoc} LOC, exceeding 250 LOC limit`);

    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
    const sidebarLoc = sidebarContent.split("\n").length;
    assert.ok(sidebarLoc <= 250, `Sidebar.tsx is ${sidebarLoc} LOC, exceeding 250 LOC limit`);
  });
});

