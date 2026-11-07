# Implementation Plan: Mobile Field Event Media Section Upload Action Layout

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-event-media-upload-layout-design.md`
- **Refs:** `docs/adr/0073-mobile-event-media-upload-action-layout.md`

## 1. Overview & File Manifest

Relocate the device upload action button in `EventMediaSection.tsx` from the cramped section header to a dedicated full-width action button below the media dropzone / attachment list on mobile viewports (< 640px). This stabilizes the section title on a single line and provides an ergonomic touch target for field operators while preserving 100% desktop presentation invariance.

### File Manifest

| File Path | Responsibility | Estimated Diff |
| :--- | :--- | :--- |
| `src/components/views/EventsView/eventMediaResponsiveness.test.ts` | TDD structural & responsiveness regression tests | ~50 LOC (New) |
| `src/components/views/EventsView/EventMediaSection.tsx` | Header button hide on mobile (`hidden sm:flex`), bottom full-width button (`w-full sm:hidden`) | ~20 LOC modified |
| `CHANGELOG.md` | Document release entry with ADR-0073 reference | ~10 LOC |
| `docs/SESSION_STATE.md` | Session tracking update | ~15 LOC |

## 2. Phased Implementation Plan

### Phase 1: Test-Driven Development (TDD)
- [ ] Create `src/components/views/EventsView/eventMediaResponsiveness.test.ts`
- [ ] Add assertions verifying:
  - Header upload button wrapper contains `hidden sm:flex`.
  - Mobile bottom upload button contains `w-full sm:hidden`.
  - Both buttons trigger `fileInputRef.current?.click()`.
  - Both buttons disable during `isUploading`.
  - `EventMediaSection.tsx` coordinator remains $\le 450$ LOC.
- [ ] Run test suite (`npx tsx --test src/components/views/EventsView/eventMediaResponsiveness.test.ts`) and confirm failure (RED).

### Phase 2: Atomic Component Refactor
- [ ] In `src/components/views/EventsView/EventMediaSection.tsx`:
  - Update header button container to `hidden sm:flex items-center gap-2`.
  - Add full-width mobile button below the media showcase/dropzone container:
    ```tsx
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      disabled={isUploading}
      className="w-full sm:hidden py-2.5 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 active:bg-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center gap-2 border border-blue-200/60 dark:border-blue-900/40 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
    >
      <Upload className="w-4 h-4" />
      <span>Upload dari Perangkat</span>
    </button>
    ```
- [ ] Run test suite and confirm pass (GREEN).

### Phase 3: Verification & Invariant Enforcement
- [ ] Run `npm run drift:check` (verify 0 drift and 100/100 spec-plan pairing).
- [ ] Run `npm run build:check` (verify 0 TypeScript errors).
- [ ] Run `npm run test:smoke` (verify smoke test passing).
- [ ] Run `npm test` (verify full test suite passes).
- [ ] Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.


