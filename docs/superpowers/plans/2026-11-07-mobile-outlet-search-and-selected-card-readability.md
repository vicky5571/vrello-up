# Implementation Plan: Mobile Outlet Search and Selected Outlet Card Readability

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-outlet-search-and-selected-card-readability-design.md`
- **Refs:** `docs/adr/0075-mobile-outlet-search-and-selected-card-readability.md`

## 1. Overview & File Manifest

Refine mobile readability for outlet search results and the selected target POSM card in `OutletSearchCombobox.tsx`:
1. **Search Results (`results.map`):** Introduce a responsive stacked layout on mobile (< 640px) allowing full outlet name (`break-words line-clamp-2`) and complete address (`line-clamp-2`) without premature text clipping, while preserving single-line desktop presentation.
2. **Selected Outlet Card (`showCard`):** Relocate `[🔄 Ganti Outlet]` on mobile from the top header to a full-width bottom action row, expanding available width for store name and address by >140% and eliminating vertical text collapse (5-line title and 8-line address fragmentation).
3. **Desktop Invariant:** Maintain 100% byte-for-byte visual layout on desktop viewports ($\ge 640\text{px}$).

### File Manifest

| File Path | Responsibility | Estimated Diff |
| :--- | :--- | :--- |
| `src/components/views/PlacementsView/outletSearchResponsiveness.test.ts` | Unit & responsiveness regression test suite | ~75 LOC (New) |
| `src/components/views/PlacementsView/OutletSearchCombobox.tsx` | Mobile-first responsive refactoring of search items, selected card, and header hint | ~40 LOC modified |
| `src/components/views/PlacementsView/wizard/Step1Outlet.tsx` | Hide selected subtitle on mobile to conserve vertical space | ~5 LOC modified |
| `CHANGELOG.md` | Document release entry with ADR-0075 reference | ~10 LOC |
| `docs/SESSION_STATE.md` | Session tracking update | ~15 LOC |

## 2. Phased Implementation Plan

### Phase 1: Test-Driven Development (TDD)
- [ ] Create `src/components/views/PlacementsView/outletSearchResponsiveness.test.ts`.
- [ ] Add assertions verifying:
  - Search result item contains mobile container with `sm:hidden` and desktop container with `hidden sm:flex`.
  - Search result mobile name element applies `break-words` and `line-clamp-2`.
  - Selected outlet card header button container hides `Ganti Outlet` on mobile using `hidden sm:inline-flex`.
  - Selected outlet card mobile bottom button container applies `w-full sm:hidden`.
  - Search results header hides keyboard hint on mobile using `hidden sm:inline`.
  - Step 1 selected subtitle hides on mobile using `hidden sm:block`.
  - Both mobile and desktop buttons trigger `handleChangeClick`.
  - Unselect button triggers `handleClear`.
- [ ] Run test suite (`npx tsx --test src/components/views/PlacementsView/outletSearchResponsiveness.test.ts`) and confirm baseline failure (RED).

### Phase 2: Atomic Component Refactor
- [ ] In `src/components/views/PlacementsView/OutletSearchCombobox.tsx`:
  - Refactor `results.map` list item rendering with mobile stacked section (`sm:hidden`) and desktop row (`hidden sm:flex`).
  - Update selected card header actions: add `hidden sm:inline-flex` to `[🔄 Ganti Outlet]` button.
  - Insert mobile full-width `[🔄 Ganti Outlet Lain]` button (`w-full sm:hidden`) at bottom of card.
  - Add `hidden sm:inline` to keyboard hint in search panel header.
- [ ] In `src/components/views/PlacementsView/wizard/Step1Outlet.tsx`:
  - Add `selectedOutlet && "hidden sm:block"` to the subtitle paragraph.
- [ ] Run test suite and confirm pass (GREEN).

  - Insert mobile full-width `[🔄 Ganti Outlet Lain]` button (`w-full sm:hidden`) at bottom of card.
- [ ] Run test suite and confirm pass (GREEN).

### Phase 3: Verification & Invariant Enforcement
- [ ] Run `npm run drift:check` (verify 0 drift and 102/102 spec-plan pairing).
- [ ] Run `npm run build:check` (verify 0 TypeScript errors).
- [ ] Run `npm test` (verify all placement tests pass).
- [ ] Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

## 3. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Unintended desktop layout drift | High | Strict pairing of `sm:hidden` and `hidden sm:flex` / `hidden sm:inline-flex` guarantees desktop markup executes identical Tailwind styles. |
| Button action handler disconnect | Medium | TDD unit test verifies both mobile and desktop buttons invoke `handleChangeClick` with identical arguments. |
| Card vertical expansion on small screens | Low | Removing lateral choking actually reduces total card vertical height because name and address wrap into 2–3 rows instead of 8 fragmented rows. |



