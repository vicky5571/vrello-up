# Implementation Plan: Step 2 Material Selector Unification and Emoji Sanitization

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-step2-material-selector-unification-design.md`
- **Refs:** `docs/adr/0078-step2-material-selector-unification-and-emoji-sanitization.md`

## 1. Overview & File Manifest

Eliminate redundant material chips in `Step2MaterialTheme.tsx`, unify POSM material catalog selection using the platform's searchable [`CustomDropdown`](file:///Users/mac/Web%20Development/vrello-up/src/components/ui/CustomDropdown.tsx) across all viewports, and replace raw emojis on costing buttons with Lucide SVG icons.

### File Manifest

| File Path | Responsibility | Estimated Diff |
| :--- | :--- | :--- |
| `src/components/views/PlacementsView/step2MaterialResponsiveness.test.ts` | Unit & responsiveness regression test suite | ~60 LOC (New) |
| `src/components/views/PlacementsView/wizard/Step2MaterialTheme.tsx` | Replace chips & native select with `CustomDropdown`, sanitize emojis | ~35 LOC modified |
| `CHANGELOG.md` | Document release entry with ADR-0078 reference | ~10 LOC |
| `docs/SESSION_STATE.md` | Session tracking update | ~15 LOC |

## 2. Phased Implementation Plan

### Phase 1: Test-Driven Development (TDD)
- [ ] Create `src/components/views/PlacementsView/step2MaterialResponsiveness.test.ts`.
- [ ] Add assertions verifying:
  - `Step2MaterialTheme.tsx` imports and renders `CustomDropdown`.
  - `Step2MaterialTheme.tsx` does NOT render hardcoded chip buttons (`POSM_MATERIALS.map`).
  - `Step2MaterialTheme.tsx` does NOT contain raw Unicode emojis (`🏷️`, `💰`).
  - Costing buttons render Lucide `<Tag />` and `<CreditCard />`.
  - Material selection via `CustomDropdown` updates `placement.materialId`.
- [ ] Run test suite (`npx tsx --test src/components/views/PlacementsView/step2MaterialResponsiveness.test.ts`) and confirm baseline failure (RED).

### Phase 2: Atomic Component Refactor
- [ ] In `src/components/views/PlacementsView/wizard/Step2MaterialTheme.tsx`:
  - Import `CustomDropdown` from `@/components/ui/CustomDropdown`.
  - Import `Tag` and `CreditCard` from `lucide-react`.
  - Replace lines 137–174 with `<CustomDropdown searchable ... />`.
  - Replace line 272 `<span>🏷️ Bebas Biaya (Rp 0)</span>` with `<Tag className="w-3.5 h-3.5 shrink-0" /> <span>Bebas Biaya (Rp 0)</span>`.
  - Replace line 293 `<span>💰 Pemasangan Berbayar</span>` with `<CreditCard className="w-3.5 h-3.5 shrink-0" /> <span>Pemasangan Berbayar</span>`.
  - Prune dead imports and handlers (`activeChipLabel`, `handleSelectPosmChip`).
- [ ] Run test suite and confirm pass (GREEN).

### Phase 3: Verification & Invariant Enforcement
- [ ] Run `npm run drift:check` (verify 0 drift and 105/105 spec-plan pairing).
- [ ] Run `npm run build:check` (verify 0 TypeScript errors).
- [ ] Run `npm test` (verify all placement tests pass).
- [ ] Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

## 3. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Disruption to MoU automated logic | High | Selecting via `CustomDropdown` sets `placement.materialId` identically to previous behavior, ensuring `isPermanentMaterial` and `shouldShowMouSection` evaluate seamlessly. |
| CustomDropdown z-index stacking in modal | Medium | `CustomDropdown` internally utilizes elevated portal / z-index stacking with viewport boundary detection. |
| File size budget in `Step2MaterialTheme.tsx` | Low | Removing chip rendering actually reduces file complexity and eliminates ~25 LOC. |



