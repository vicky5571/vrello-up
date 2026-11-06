# Spec: Mobile Responsiveness Chassis and Navigation Architecture

- **Date:** 2026-11-06
- **Status:** APPROVED
- **Refs:** ADR-0057

---

## 1. Executive Summary & Business Objective

*vrello-up* serves field marketing teams across Indosat Ooredoo Hutchison (IM3 & Tri). Field staff, promoters, and supervisors frequently use smartphones on-site at retail outlets and roadshow venues.

This specification defines **Phase 1: The Mobile Chassis Foundation**. It unlocks mobile usability by introducing:
1. An atomic, fixed **Mobile Bottom Navigation Bar** (`MobileBottomNav.tsx`) dedicated to thumb-reachable field operations.
2. A **TopNav Hamburger Trigger** (`Menu` icon) on small screens (`md:hidden`) that reveals the full `Sidebar` drawer.
3. Responsive viewport offsets in `src/app/page.tsx` incorporating iOS safe-area insets (`env(safe-area-inset-bottom)`).
4. Auto-closing sidebar behavior when a mobile user selects any destination.

---

## 2. UX Navigation Architecture & Design Token Alignment

### 2.1. The 5 Mobile Bottom Tabs
To guarantee exact visual and iconographic parity with desktop navigation (`navConfig.ts` & `GlobalRail.tsx`), the 5 bottom navigation tabs utilize identical icons, colors, and labels:

| Tab Position | Label | Icon | Icon Color Token (Active) | Store Action / Transition |
|---|---|---|---|---|
| **1** | **Home** | `Home` | `text-blue-500 dark:text-blue-400` | `setActiveView("home")` |
| **2** | **Outlets** | `Store` | `text-violet-500 dark:text-violet-400` | `setActiveView("outlets")`, `setAppMode("marcom")` |
| **3** | **Placements** | `MapPin` | `text-emerald-500 dark:text-emerald-400` | `setActiveView("placements")`, `setAppMode("marcom")` |
| **4** | **Events** | `CalendarDays` | `text-blue-500 dark:text-blue-400` | `setActiveView("events")`, `setAppMode("marcom")` |
| **5** | **Menu** | `Menu` | `text-amber-500 dark:text-amber-400` | `toggleSidebar()` |

### 2.2. Visual Styling & Elevation Tokens
- **Bar Dimensions:** Fixed height `h-14` (56px) plus `pb-[env(safe-area-inset-bottom)]`.
- **Surface:** Glassmorphic translucent blur matching desktop rail:
  `bg-white/95 dark:bg-[#0F1115]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 shadow-lg select-none`.
- **Item States:**
  - *Active:* Label is bold (`font-semibold text-slate-900 dark:text-white`), icon receives token tint and micro-scale bounce, with an accent pill highlight dot or indicator underneath.
  - *Inactive:* Label and icon in `text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200`.
- **Touch Target:** Each tab occupies equal flex width (`flex-1 h-full py-1.5 flex flex-col items-center justify-center gap-0.5 min-h-[48px]`).

---

## 3. Component Modifications & Contracts

### 3.1. New Component: `src/components/layout/MobileBottomNav.tsx`
- **Location:** `src/components/layout/MobileBottomNav.tsx`
- **Visibility:** `fixed bottom-0 inset-x-0 z-40 md:hidden`
- **Contract:**
  - Reads `activeView` and `isSidebarOpen` from `useWorkspaceStore`.
  - Dispatches `setActiveView(view)`, `setAppMode("marcom")` when selecting Outlets, Placements, or Events.
  - Dispatches `toggleSidebar()` when tapping Menu.
  - Respects `useReducedMotion()` from Framer Motion for tap animation scaling.
  - Enforces coordinator LOC limit (`< 150 LOC`).

### 3.2. Updates to `src/components/layout/TopNav.tsx`
- Mount hamburger toggle on the left of `TopNav` before breadcrumbs:
  ```tsx
  <button
    type="button"
    onClick={toggleSidebar}
    className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1 cursor-pointer"
    aria-label="Toggle navigation menu"
  >
    <Menu className="w-5 h-5" />
  </button>
  ```
- Import `Menu` from `lucide-react`.
- Bind `toggleSidebar` from `useWorkspaceStore`.
- Coordinator LOC check: Ensure `TopNav.tsx` remains strictly under 250 LOC (currently ~142 LOC).

### 3.3. Updates to `src/components/layout/Sidebar.tsx`
- Mobile overlay auto-dismiss:
  When a user taps any item in `PROJECTS_NAV_ITEMS`, `MARCOM_WORK_ITEMS`, or `MARCOM_MASTER_DATA`, if screen width `< 768px`, automatically invoke `toggleSidebar()`.
  ```tsx
  const handleNavClick = (view: ViewMode) => {
    setActiveView(view);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      toggleSidebar();
    }
  };
  ```

### 3.4. Updates to `src/app/page.tsx`
- Mount `<MobileBottomNav />` in the root tree:
  ```tsx
  const MobileBottomNav = dynamic(
    () => import("@/components/layout/MobileBottomNav").then((m) => m.MobileBottomNav),
    { ssr: false },
  );
  ```
- Adjust root stage responsive classes:
  - From hard `p-2 gap-2 h-dvh flex`
  - To: `flex h-dvh w-full overflow-hidden bg-[#F0F1F4] dark:bg-[#0C0D0F] p-0 md:p-2 gap-0 md:gap-2 text-slate-900 dark:text-slate-100 pb-14 md:pb-0`
- Adjust `<main>` canvas:
  - `rounded-none md:rounded-2xl border-x-0 md:border border-y-0 md:border-y`

---

## 4. Verification & Testing Contracts

### 4.1. Unit Test Suite (`src/components/layout/MobileBottomNav.test.ts`)
Create dedicated smoke test validating:
1. `MobileBottomNav` defines and renders all 5 tabs (Home, Outlets, Placements, Events, Menu).
2. Uses exact canonical icons (`Home`, `Store`, `MapPin`, `CalendarDays`, `Menu`).
3. Outlets, Placements, and Events tabs switch `appMode` to `"marcom"`.
4. File size invariant: `MobileBottomNav.tsx` remains strictly under 150 LOC.
5. All coordinator files (`page.tsx`, `TopNav.tsx`, `Sidebar.tsx`, `GlobalRail.tsx`) remain strictly ≤ 250 LOC.

### 4.2. Acceptance Criteria Checklist
- [ ] On viewports `< 768px`, `MobileBottomNav` renders at the bottom of the screen with 5 touch tabs.
- [ ] On viewports `≥ 768px`, `MobileBottomNav` is hidden (`md:hidden`).
- [ ] Icons and styles for Home, Outlets, Placements, and Events match desktop styling and canonical tokens.
- [ ] Tapping "Menu" in the bottom bar opens the `Sidebar` drawer.
- [ ] `TopNav.tsx` renders a hamburger `Menu` button on mobile viewports (`md:hidden`).
- [ ] Selecting any item in the mobile `Sidebar` automatically closes the sidebar backdrop.
- [ ] The bottom navigation bar includes safe-area padding for mobile devices.
- [ ] `npm run drift:check` passes (84 spec-plan pairs valid, coordinator sizes ≤250 LOC).
- [ ] `npm run build:check` exits with 0 TypeScript errors.
- [ ] `npm run test:smoke` passes with 0 failures.

---

## 5. Non-Goals (Deferred to Phase 2 & 3)
- Refactoring internal table views of Outlets and Placements into cards (Phase 2).
- Refactoring drawer modal widths for field forms (Phase 2).
- Rewriting governance modules (MOUs, Reports, Pipeline) into mobile cards (Phase 3).



