# Plan: Relocate Export Center from TopNav to More Apps Menu

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-relocate-export-center-to-more-apps-menu-design.md`
- **Refs:** `docs/adr/0047-relocate-export-center-to-more-apps-menu.md`

---

## 1. Executive Summary & Objective

Remove the redundant Export Center button from the top navigation bar (`TopNav.tsx`) and consolidate off-canvas global access exclusively inside the "More" popover (`MoreAppsMenu.tsx`). This reduces visual clutter in the top bar while preserving complete export workflow access.

---

## 2. File Manifest & Estimated LOC

| Action | File Path | Estimated LOC | Responsibility |
|---|---|---|---|
| **Modify** | `src/components/layout/TopNav.tsx` | -10 LOC diff | Remove Export Center button, `Download` icon import, and `setExportCenterOpen` selector |
| **Modify** | `src/components/modals/MoreAppsMenu.test.ts` | ~15 LOC diff | Add automated assertion confirming `TopNav.tsx` does NOT render the button |
| **Create** | `docs/handover-relocate-export-center-to-more-apps-menu.md` | ~150 LOC | Complete execution-ready handover guide with verbatim code diffs and acceptance checklist |
| **Modify** | `docs/SESSION_STATE.md` | ~20 LOC diff | Record active plan & spec readiness |

---

## 3. Phased Implementation Roadmap

### Phase 1: TopNav Code Cleanup
- [ ] In `src/components/layout/TopNav.tsx`:
  - Remove `Download` from `import { Search, Download } from "lucide-react";`.
  - Remove `const setExportCenterOpen = useWorkspaceStore((s) => s.setExportCenterOpen);`.
  - Remove `<button type="button" onClick={() => setExportCenterOpen(true)} title="Export Center" ...>...</button>`.

### Phase 2: Test Suite Hardening
- [ ] In `src/components/modals/MoreAppsMenu.test.ts`:
  - Add test: `it("verifies TopNav does not render redundant Export Center button (ADR-0047)", () => ...)`
  - Assert that `TopNav.tsx` content does NOT include `title="Export Center"` or `setExportCenterOpen`.

### Phase 3: Non-Negotiable Verification & Handover Documentation
- [ ] Run `npm run drift:check` (verify 74/74 spec-plan pairs and invariants).
- [ ] Run `npm run build:check` (`tsc --noEmit`, 0 errors required).
- [ ] Run `npm test` across all 152 test suites (0 failures required).
- [ ] Create execution handover guide: `docs/handover-relocate-export-center-to-more-apps-menu.md`.
- [ ] Update `docs/SESSION_STATE.md`.
- [ ] Commit planning artifacts with standard git convention.

---

## 4. Risks, Edge Cases & Verification Strategy

| Risk / Edge Case | Impact | Mitigation Strategy |
|---|---|---|
| **User Missing Top Button** | User accustomed to clicking download icon in header | Feature remains available via Global Rail "More", `⌘K`, and contextual headers on Reports, MOUs, and Placements |
| **Dead Code / Unused Imports** | ESLint or TypeScript warnings about unused `Download` or `setExportCenterOpen` | Remove both unused import and hook selector from `TopNav.tsx` |


