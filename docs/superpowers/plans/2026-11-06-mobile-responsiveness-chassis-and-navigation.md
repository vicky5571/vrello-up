# Implementation Plan: Mobile Responsiveness Chassis and Navigation Architecture

- **Date:** 2026-11-06
- **Status:** COMPLETE
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-responsiveness-chassis-and-navigation-design.md
- **Refs:** ADR-0057

---

## 1. Executive Summary & Phasing Overview

This plan implements **Phase 1: The Mobile Chassis Foundation** for *vrello-up*, introducing a dedicated, ergonomic mobile navigation experience for field staff and area supervisors across mobile viewports (< 768px).

The implementation follows strict Test-Driven Development (TDD):
1. Write smoke tests for mobile bottom navigation invariants.
2. Build the atomic `MobileBottomNav` component matching canonical icon and style tokens.
3. Integrate the mobile hamburger button in `TopNav`.
4. Add auto-dismissal logic to `Sidebar` mobile overlay.
5. Update `page.tsx` with responsive layout padding and safe-area margins.
6. Verify against all non-negotiable verification gates.

---

## 2. File Manifest & Responsibility Mapping

| File Path | Responsibility | Estimated LOC Change |
|---|---|---|
| `src/components/layout/MobileBottomNav.test.ts` | Unit tests for mobile bottom navigation invariants and coordinator limits | +75 (New) |
| `src/components/layout/MobileBottomNav.tsx` | Atomic 5-tab mobile bottom navigation bar with iOS safe-area support | +115 (New) |
| `src/components/layout/TopNav.tsx` | Hamburger menu trigger before breadcrumbs on `md:hidden` screens | +12 / -2 |
| `src/components/layout/Sidebar.tsx` | Auto-dismiss mobile sidebar overlay upon navigation click | +10 / -4 |
| `src/app/page.tsx` | Responsive canvas layout padding (`p-0 md:p-2`, `pb-14 md:pb-0`) & mount `MobileBottomNav` | +8 / -3 |
| `docs/SESSION_STATE.md` | Session tracking and planning status update | +25 |

---

## 3. Implementation Phasing & Tasks

### Phase 1: Test-Driven Development (Red Phase)
- [x] Task 1.1: Create `src/components/layout/MobileBottomNav.test.ts` to test:
  - Canonical 5 tabs metadata: `home` (Home), `outlets` (Store), `placements` (MapPin), `events` (CalendarDays), `menu` (Menu).
  - Proper styling and active color token mappings matching desktop `navConfig.ts`.
  - Coordinator LOC limits: `page.tsx` ≤ 250, `TopNav.tsx` ≤ 250, `Sidebar.tsx` ≤ 250, `MobileBottomNav.tsx` ≤ 150.
- [x] Task 1.2: Run `npx tsx --test src/components/layout/MobileBottomNav.test.ts` to confirm failing test state.

### Phase 2: Component Implementation & Layout Integration (Green Phase)
- [x] Task 2.1: Implement `src/components/layout/MobileBottomNav.tsx`:
  - Fixed bottom styling: `fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-[#0F1115]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10`.
  - Safe-area inset: `pb-[env(safe-area-inset-bottom)]`.
  - 5 interactive tabs with active indicators, micro-scaling on tap, and label tokens.
  - Auto-switching to `appMode: "marcom"` when Outlets, Placements, or Events is tapped.
  - Tapping "Menu" calls `toggleSidebar()`.
- [x] Task 2.2: Update `src/components/layout/TopNav.tsx`:
  - Import `Menu` from `lucide-react`.
  - Add hamburger button before breadcrumbs on `md:hidden` viewports.
  - Bind click handler to `toggleSidebar()`.
- [x] Task 2.3: Update `src/components/layout/Sidebar.tsx`:
  - Wrap navigation button clicks with a handler that auto-closes the sidebar when on mobile screen viewports (`window.innerWidth < 768`).
- [x] Task 2.4: Update `src/app/page.tsx`:
  - Dynamically import `<MobileBottomNav />`.
  - Adjust canvas padding: `p-0 md:p-2`, `pb-14 md:pb-0`, and `<main>` border tokens.
  - Render `<MobileBottomNav />` inside the root layout.

### Phase 3: Verification & Execution Handover
- [x] Task 3.1: Run `npx tsx --test src/components/layout/MobileBottomNav.test.ts` and verify all tests pass.
- [x] Task 3.2: Run `npm run drift:check` (verify 84 spec-plan pairs and coordinator limits ≤ 250 LOC).
- [x] Task 3.3: Run `npm run build:check` (verify 0 TypeScript compilation errors).
- [x] Task 3.4: Run `npm run test:smoke` (verify all smoke suites pass).
- [x] Task 3.5: Author execution-ready handover document `docs/handover-mobile-responsiveness-chassis-and-navigation.md`.
- [x] Task 3.6: Update `docs/SESSION_STATE.md`.


