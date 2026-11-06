import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Shell UI/UX Polish Invariants (ADR-0058)", () => {
  const bottomNavPath = path.resolve(process.cwd(), "src/components/layout/MobileBottomNav.tsx");
  const topNavPath = path.resolve(process.cwd(), "src/components/layout/TopNav.tsx");
  const breadcrumbsPath = path.resolve(process.cwd(), "src/components/layout/TopNavBreadcrumbs.tsx");
  const sidebarPath = path.resolve(process.cwd(), "src/components/layout/Sidebar.tsx");
  const kpiCardsPath = path.resolve(process.cwd(), "src/components/views/shared/KpiSummaryCards.tsx");
  const pagePath = path.resolve(process.cwd(), "src/app/page.tsx");

  it("verifies TopNav does NOT have a duplicate outer hamburger button", () => {
    const topNavContent = fs.readFileSync(topNavPath, "utf-8");
    assert.strictEqual(
      topNavContent.includes('aria-label="Toggle navigation menu"'),
      false,
      "Expected TopNav not to contain duplicate outer hamburger button"
    );
  });

  it("verifies TopNavBreadcrumbs contains the single canonical hamburger button", () => {
    const breadcrumbsContent = fs.readFileSync(breadcrumbsPath, "utf-8");
    assert.ok(
      breadcrumbsContent.includes('title="Open navigation"'),
      "Expected TopNavBreadcrumbs to retain single canonical hamburger button"
    );
    assert.ok(
      breadcrumbsContent.includes("toggleSidebar"),
      "Expected TopNavBreadcrumbs to call toggleSidebar"
    );
  });

  it("verifies KpiSummaryCards defaults mobileStrip to true", () => {
    const kpiContent = fs.readFileSync(kpiCardsPath, "utf-8");
    assert.ok(
      kpiContent.includes("mobileStrip = true"),
      "Expected KpiSummaryCards to default mobileStrip to true"
    );
  });

  it("verifies Sidebar uses edge-to-edge native sheet positioning on mobile", () => {
    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
    assert.ok(
      sidebarContent.includes("fixed inset-y-0 left-0"),
      "Expected mobile sidebar to use fixed inset-y-0 left-0"
    );
    assert.strictEqual(
      sidebarContent.includes("fixed left-2 top-2 bottom-2"),
      false,
      "Expected mobile sidebar not to have floating gaps (left-2 top-2)"
    );
  });

  it("verifies MobileBottomNav contains 5 canonical tabs and no rigid blue border box", () => {
    const bottomNavContent = fs.readFileSync(bottomNavPath, "utf-8");
    assert.ok(bottomNavContent.includes("Home"), "Must include Home tab");
    assert.ok(bottomNavContent.includes("Outlets"), "Must include Outlets tab");
    assert.ok(bottomNavContent.includes("Placements"), "Must include Placements tab");
    assert.ok(bottomNavContent.includes("Events"), "Must include Events tab");
    assert.ok(bottomNavContent.includes("Menu"), "Must include Menu tab");
    assert.ok(bottomNavContent.includes("md:hidden"), "MobileBottomNav must include md:hidden class");
    assert.ok(
      bottomNavContent.includes('layoutId="activeMobileBottomTab"'),
      "Expected MobileBottomNav to render sliding active pill with layoutId"
    );
    assert.strictEqual(
      bottomNavContent.includes("border border-blue-600"),
      false,
      "Expected MobileBottomNav not to contain rigid border-blue-600 box"
    );
  });

  it("verifies all coordinator files remain under 250 LOC limit", () => {
    const pageLoc = fs.readFileSync(pagePath, "utf-8").split("\n").length;
    assert.ok(pageLoc <= 250, `page.tsx is ${pageLoc} LOC, exceeding 250 LOC limit`);

    const topNavLoc = fs.readFileSync(topNavPath, "utf-8").split("\n").length;
    assert.ok(topNavLoc <= 250, `TopNav.tsx is ${topNavLoc} LOC, exceeding 250 LOC limit`);

    const sidebarLoc = fs.readFileSync(sidebarPath, "utf-8").split("\n").length;
    assert.ok(sidebarLoc <= 250, `Sidebar.tsx is ${sidebarLoc} LOC, exceeding 250 LOC limit`);

    const bottomNavLoc = fs.readFileSync(bottomNavPath, "utf-8").split("\n").length;
    assert.ok(bottomNavLoc <= 150, `MobileBottomNav.tsx is ${bottomNavLoc} LOC, exceeding 150 LOC limit`);
  });
});
