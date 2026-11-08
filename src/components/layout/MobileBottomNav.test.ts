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
    assert.ok(bottomNavContent.includes("Pipeline"), "Must include Pipeline tab");
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

  it("verifies MobileBottomNav wraps tabs in LayoutGroup for projection tree isolation", () => {
    const bottomNavContent = fs.readFileSync(bottomNavPath, "utf-8");
    assert.ok(
      bottomNavContent.includes("LayoutGroup") &&
        bottomNavContent.includes('id="mobile-bottom-nav"'),
      "Expected MobileBottomNav to wrap tabs in LayoutGroup with id mobile-bottom-nav"
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

describe("Mobile Sidebar Slide Transition & Desktop Invariants (ADR-0063)", () => {
  const sidebarPath = path.resolve(process.cwd(), "src/components/layout/Sidebar.tsx");

  it("verifies Sidebar.tsx imports motion, AnimatePresence, and useReducedMotion", () => {
    const content = fs.readFileSync(sidebarPath, "utf-8");
    assert.ok(
      content.includes("AnimatePresence") && content.includes("motion") && content.includes("useReducedMotion"),
      "Sidebar.tsx must import AnimatePresence, motion, and useReducedMotion from framer-motion"
    );
  });

  it("verifies Sidebar.tsx wraps mobile backdrop and drawer in AnimatePresence", () => {
    const content = fs.readFileSync(sidebarPath, "utf-8");
    assert.ok(
      content.includes("<AnimatePresence>"),
      "Sidebar.tsx must wrap render elements in AnimatePresence"
    );
  });

  it("verifies Sidebar.tsx uses motion.div for backdrop fade and motion.aside for drawer slide", () => {
    const content = fs.readFileSync(sidebarPath, "utf-8");
    assert.ok(
      content.includes("<motion.div") && content.includes("opacity: 0"),
      "Sidebar.tsx must use motion.div with opacity fade for backdrop"
    );
    assert.ok(
      content.includes("<motion.aside") && content.includes('x: "-100%"'),
      "Sidebar.tsx must use motion.aside with x: '-100%' for mobile drawer slide"
    );
  });

  it("verifies Sidebar.tsx guards motion props with isMobile to protect desktop static layout", () => {
    const content = fs.readFileSync(sidebarPath, "utf-8");
    assert.ok(
      content.includes("isMobile"),
      "Sidebar.tsx must include isMobile check"
    );
    assert.ok(
      content.includes("isMobile && isSidebarOpen") || content.includes("isSidebarOpen && isMobile") || content.includes("isMobile && !shouldReduceMotion"),
      "Sidebar.tsx must guard mobile-only motion props with isMobile"
    );
  });

  it("verifies Sidebar.tsx uses a non-overshooting tween for mobile drawer motion", () => {
    const content = fs.readFileSync(sidebarPath, "utf-8");
    assert.ok(
      content.includes('type: "tween"') && content.includes("duration: 0.24"),
      "Sidebar.tsx must use a 240ms tween for mobile drawer motion"
    );
    assert.strictEqual(
      content.includes('type: "spring"') || content.includes("damping") || content.includes("stiffness"),
      false,
      "Sidebar.tsx must not use spring physics (overshoot exposes the page background on the left edge)"
    );
  });

  it("verifies mobile backdrop fade shares the drawer tween timing", () => {
    const content = fs.readFileSync(sidebarPath, "utf-8");
    const tweenDurations = content.match(/duration: 0\.24/g) ?? [];
    assert.ok(
      tweenDurations.length >= 2,
      "Backdrop fade and drawer slide must share the same 240ms duration"
    );
  });

  it("verifies desktop motion remains instant and untranslated", () => {
    const content = fs.readFileSync(sidebarPath, "utf-8");
    assert.ok(
      content.includes('initial={isMobile && !shouldReduceMotion ? { x: "-100%" } : false}'),
      "Desktop must keep initial={false} so the sidebar never slides in"
    );
    assert.ok(
      content.includes("shouldReduceMotion || !isMobile") && content.includes("{ duration: 0 }"),
      "Desktop and reduced-motion transitions must stay at duration 0"
    );
  });

  it("verifies Sidebar.tsx coordinator remains strictly <= 250 LOC", () => {
    const sidebarLoc = fs.readFileSync(sidebarPath, "utf-8").split("\n").length;
    assert.ok(sidebarLoc <= 250, `Sidebar.tsx is ${sidebarLoc} LOC, exceeding 250 LOC limit`);
  });
});

describe("Decouple Mobile Menu Drawer from Desktop Sidebar State (ADR-0099)", () => {
  const bottomNavPath = path.resolve(process.cwd(), "src/components/layout/MobileBottomNav.tsx");
  const sidebarPath = path.resolve(process.cwd(), "src/components/layout/Sidebar.tsx");
  const typesPath = path.resolve(process.cwd(), "src/lib/store/slices/types.ts");
  const slicePath = path.resolve(process.cwd(), "src/lib/store/slices/createUiSlice.ts");

  it("verifies store slice defines and initializes isMobileMenuOpen to false", () => {
    const typesContent = fs.readFileSync(typesPath, "utf-8");
    assert.ok(
      typesContent.includes("isMobileMenuOpen: boolean"),
      "types.ts must define isMobileMenuOpen: boolean in UiState"
    );
    assert.ok(
      typesContent.includes("toggleMobileMenu: () => void"),
      "types.ts must define toggleMobileMenu in UiActions"
    );
    assert.ok(
      typesContent.includes("setMobileMenuOpen: (open: boolean) => void"),
      "types.ts must define setMobileMenuOpen in UiActions"
    );

    const sliceContent = fs.readFileSync(slicePath, "utf-8");
    assert.ok(
      sliceContent.includes("isMobileMenuOpen: false"),
      "createUiSlice.ts must initialize isMobileMenuOpen: false"
    );
    assert.ok(
      sliceContent.includes("toggleMobileMenu: () =>"),
      "createUiSlice.ts must implement toggleMobileMenu"
    );
    assert.ok(
      sliceContent.includes("setMobileMenuOpen: (open) =>"),
      "createUiSlice.ts must implement setMobileMenuOpen"
    );
  });

  it("verifies MobileBottomNav uses isMobileMenuOpen and toggleMobileMenu", () => {
    const content = fs.readFileSync(bottomNavPath, "utf-8");
    assert.ok(
      content.includes("isMobileMenuOpen"),
      "MobileBottomNav must select and use isMobileMenuOpen"
    );
    assert.ok(
      content.includes("toggleMobileMenu"),
      "MobileBottomNav must bind Menu tab to toggleMobileMenu"
    );
    assert.ok(
      content.includes("setMobileMenuOpen(false)"),
      "MobileBottomNav operational tabs must dismiss drawer via setMobileMenuOpen(false)"
    );
  });

  it("verifies Sidebar renders mobile drawer based on isMobileMenuOpen", () => {
    const content = fs.readFileSync(sidebarPath, "utf-8");
    assert.ok(
      content.includes("isMobileMenuOpen"),
      "Sidebar must select isMobileMenuOpen"
    );
    assert.ok(
      content.includes("isMobileMenuOpen && isMobile"),
      "Sidebar mobile backdrop must guard on isMobileMenuOpen && isMobile"
    );
    assert.ok(
      content.includes("setMobileMenuOpen(false)"),
      "Sidebar backdrop and item navigation must dismiss drawer via setMobileMenuOpen(false)"
    );
  });
});
