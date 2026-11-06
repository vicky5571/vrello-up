# Implementation Plan: Mobile Bottom Navigation — Replace Home with Pipeline & Status

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-bottom-nav-pipeline-design.md`
- **ADR:** `docs/adr/0066-mobile-bottom-nav-replace-home-with-pipeline.md`

## 1. Executive Summary & File Manifest

Replace the redundant `Home` tab in Slot 1 of `MobileBottomNav.tsx` with `Pipeline` (`id: "pipeline"`, icon: `Layers`, activeColor: `text-indigo-500`), creating an ergonomic, 100% Marcom operational bottom bar for field teams while preserving desktop layout invariants and coordinator LOC constraints.

### File Manifest

| Action | File Path | Estimated LOC Impact | Description |
|---|---|---|---|
| Modify | `src/components/layout/MobileBottomNav.test.ts` | +2, -2 | Update canonical 5-tab assertion to verify `"Pipeline"` instead of `"Home"`. |
| Modify | `src/components/layout/MobileBottomNav.tsx` | +8, -8 | Replace `Home` import with `Layers`, replace Slot 1 tab item with `pipeline` configuration. |
| Modify | `CHANGELOG.md` | +12, -0 | Document change with spec and ADR references. |
| Modify | `docs/SESSION_STATE.md` | +15, -2 | Update active feature and session progress. |
| Create | `docs/handover-mobile-bottom-nav-pipeline.md` | +120 | Detailed execution guide and verification handover. |

## 2. Phased Implementation Steps

### Phase 1: Test-Driven Development (TDD) Baseline & Red State
- [ ] In `src/components/layout/MobileBottomNav.test.ts`:
  - Locate test `it("verifies MobileBottomNav contains 5 canonical tabs and no rigid blue border box")`.
  - Replace assertion `assert.ok(bottomNavContent.includes("Home"), "Must include Home tab");` with:
    ```ts
    assert.ok(bottomNavContent.includes("Pipeline"), "Must include Pipeline tab");
    ```
- [ ] Run targeted test:
  ```bash
  npx tsx --test src/components/layout/MobileBottomNav.test.ts
  ```
- [ ] Verify test fails on line 58 with assertion error expecting `"Pipeline"` (RED state confirmed).

### Phase 2: Mobile Bottom Navigation Implementation (Green State)
- [ ] In `src/components/layout/MobileBottomNav.tsx`:
  - Replace `Home` import from `lucide-react` with `Layers`:
    ```tsx
    import {
      Layers,
      Store,
      MapPin,
      CalendarDays,
      Menu,
    } from "lucide-react";
    ```
  - In `BOTTOM_TABS` array, update item 1:
    ```tsx
    {
      id: "pipeline",
      label: "Pipeline",
      icon: Layers,
      activeColor: "text-indigo-500 dark:text-indigo-400",
      isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "pipeline",
      onClick: ({ setActiveView, setAppMode }) => {
        setAppMode("marcom");
        setActiveView("pipeline");
      },
    },
    ```
- [ ] Re-run targeted test:
  ```bash
  npx tsx --test src/components/layout/MobileBottomNav.test.ts
  ```
- [ ] Verify 100% tests pass (GREEN state confirmed).

### Phase 3: Comprehensive Quality Verification Gates
- [ ] Run drift check to verify architectural invariants and 93/93 spec-plan pairing:
  ```bash
  npm run drift:check
  ```
- [ ] Run build check for TypeScript compilation:
  ```bash
  npm run build:check
  ```
- [ ] Run smoke test suite:
  ```bash
  npm run test:smoke
  ```
- [ ] Run complete test suite:
  ```bash
  npm test
  ```

### Phase 4: Documentation & Session Handoff
- [ ] Create execution handover file: `docs/handover-mobile-bottom-nav-pipeline.md`.
- [ ] Update `CHANGELOG.md` with:
  ```markdown
  - `feat(navigation)`: Replace mobile bottom nav Home tab with Pipeline & Status (ADR-0066)
  ```
- [ ] Update `docs/SESSION_STATE.md` with completed feature and verification evidence.
- [ ] Git commit with standard convention.



