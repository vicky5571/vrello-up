# Implementation Plan: Mobile Placement Modal Viewport Height Stabilization and Search Results Expansion

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-placement-modal-fixed-height-design.md`
- **Refs:** `docs/adr/0076-mobile-placement-modal-fixed-height-and-search-expansion.md`

## 1. Overview & File Manifest

Stabilize mobile viewport ergonomics in the POSM Placement workflow by:
1. Anchoring the modal container in `PlacementFormModal.tsx` to `h-[88dvh] sm:h-auto sm:max-h-[92vh]`, permanently pinning the wizard footer ("Batal" and "Lanjut") and eliminating button jumping layout shifts.
2. Expanding the search results dropdown list container in `OutletSearchCombobox.tsx` from `max-h-60` to `max-h-80 sm:max-h-72`, allowing 3–4 detailed outlet cards to be visible at once.
3. Preserving 100% desktop presentation invariance.

### File Manifest

| File Path | Responsibility | Estimated Diff |
| :--- | :--- | :--- |
| `src/components/views/PlacementsView/placementModalResponsiveness.test.ts` | Unit & responsiveness regression test suite | ~60 LOC (New) |
| `src/components/views/PlacementsView/PlacementFormModal.tsx` | Anchor modal chassis height to `h-[88dvh] sm:h-auto sm:max-h-[92vh]` | ~5 LOC modified |
| `src/components/views/PlacementsView/OutletSearchCombobox.tsx` | Expand mobile list height to `max-h-80 sm:max-h-72` | ~5 LOC modified |
| `CHANGELOG.md` | Document release entry with ADR-0076 reference | ~10 LOC |
| `docs/SESSION_STATE.md` | Session tracking update | ~15 LOC |

## 2. Phased Implementation Plan

### Phase 1: Test-Driven Development (TDD)
- [ ] Create `src/components/views/PlacementsView/placementModalResponsiveness.test.ts`.
- [ ] Add assertions verifying:
  - `PlacementFormModal.tsx` modal dialog container contains `h-[88dvh] sm:h-auto sm:max-h-[92vh]`.
  - `PlacementFormModal.tsx` form wrapper contains `flex flex-col flex-1 min-h-0`.
  - `PlacementFormModal.tsx` scroll container contains `flex-1 min-h-0 overflow-y-auto`.
  - `OutletSearchCombobox.tsx` results list container contains `max-h-80 sm:max-h-72`.
- [ ] Run test suite (`npx tsx --test src/components/views/PlacementsView/placementModalResponsiveness.test.ts`) and confirm baseline failure (RED).

### Phase 2: Atomic Component Refactor
- [ ] In `src/components/views/PlacementsView/PlacementFormModal.tsx`:
  - Line 210: Replace `max-h-[92vh]` with `h-[88dvh] sm:h-auto sm:max-h-[92vh]`.
  - Line 239: Ensure `min-h-0` is present alongside `overflow-y-auto flex-1`.
- [ ] In `src/components/views/PlacementsView/OutletSearchCombobox.tsx`:
  - Line 674: Replace `max-h-60 sm:max-h-72` with `max-h-80 sm:max-h-72`.
- [ ] Run test suite and confirm pass (GREEN).

### Phase 3: Verification & Invariant Enforcement
- [ ] Run `npm run drift:check` (verify 0 drift and 103/103 spec-plan pairing).
- [ ] Run `npm run build:check` (verify 0 TypeScript errors).
- [ ] Run `npm test` (verify all placement tests pass).
- [ ] Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

## 3. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Mobile browser address bar shifts on scroll | Low | Using `dvh` (Dynamic Viewport Height) ensures the chassis dynamically adapts when URL bars collapse/expand. |
| Nested scroll container trapping | Medium | Applying `min-h-0 flex-1 overflow-y-auto` strictly scopes scrolling to the form body, preventing outer modal clipping. |
| Desktop modal height deformation | High | Strict `sm:h-auto sm:max-h-[92vh]` preserves exact desktop auto-height behavior. |



