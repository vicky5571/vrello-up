# Mobile Field Event Media Section Upload Action Layout Design Spec

- **Status:** APPROVED
- **Date:** 2026-11-07
- **Author:** Senior Software Engineer
- **ADR Reference:** `docs/adr/0073-mobile-event-media-upload-action-layout.md`

## 1. Executive Summary & Problem Diagnosis

The `EventMediaSection.tsx` component within `EventCreateModal.tsx` enables field operators to attach marketing documentation (banners, venue photos, video clips, and Google Drive archive folders) during event creation.

On mobile viewports (< 640px, e.g. 360px - 390px widths), placing the primary action button `"Upload dari Perangkat"` in the same flex row as the section title `"Media & Dokumentasi Event"` creates severe lateral compression:
1. The title wraps awkwardly onto 2 lines: `Media &` \n `Dokumentasi Event`.
2. The button wraps onto 2 lines: `Upload dari` \n `Perangkat`.
3. In the empty state, the dashed dropzone area already acts as an upload click trigger, creating redundant side-by-side elements while leaving the title cramped.
4. Conversely, once assets are uploaded, the dashed dropzone disappears and only the cramped header button remains to add additional files, forcing operators to tap an uncomfortable target outside the natural thumb zone.

## 2. Component Architecture & Responsive Contracts

All refinements are strictly localized to `src/components/views/EventsView/EventMediaSection.tsx`.

### 2.1 Header Stabilization Contract
- **Title Container:** Spans 100% available width on mobile:
  ```tsx
  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
    <Film className="w-4 h-4 text-blue-500 shrink-0" />
    <span>Media & Dokumentasi Event</span>
  </div>
  ```
- **Header Button Container:** Hidden on mobile, active on desktop:
  ```tsx
  <div className="hidden sm:flex items-center gap-2">
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      disabled={isUploading}
      className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
    >
      <Upload className="w-3.5 h-3.5" />
      <span>Upload dari Perangkat</span>
    </button>
  </div>
  ```

### 2.2 Mobile Bottom Full-Width Action Button Contract
- Positioned immediately beneath the media presentation area (below dashed dropzone when empty, or below attachment list and 16:9 cover when populated):
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
- Positioned above the Google Drive folder fallback row (`<div className="pt-1">...</div>`), ensuring a clean visual hierarchy.

### 2.3 Desktop Parity Invariant
- On viewports $\ge 640\text{px}$ (`sm:`), the header button renders via `sm:flex sm:items-center` at its exact prior coordinates.
- The bottom button is completely hidden from the render tree on desktop via `sm:hidden`.

## 3. Acceptance Criteria & Invariants

1. **AC-1 (Header Typography):** On mobile viewports (< 640px), the title `Media & Dokumentasi Event` renders cleanly on a single row with 0 multi-line wrapping.
2. **AC-2 (Desktop Header Button):** On desktop viewports ($\ge 640\text{px}$), the `"Upload dari Perangkat"` button remains positioned at the top-right header row.
3. **AC-3 (Mobile Bottom Button):** On mobile viewports (< 640px), a full-width `"Upload dari Perangkat"` button is rendered below the media dropzone / list, providing an ergonomic touch target.
4. **AC-4 (Desktop Bottom Invariant):** The bottom button is hidden on desktop viewports (`sm:hidden`).
5. **AC-5 (State & Hook Integrity):** Both buttons trigger `fileInputRef.current?.click()`, disable during `isUploading`, and integrate with existing `useDirectDriveUpload("events")` without modification.
6. **AC-6 (LOC Limit):** `EventMediaSection.tsx` maintains safe coordinator file limits.

## 4. Test Strategy

- Create a targeted structural unit test in `src/components/views/EventsView/eventMediaResponsiveness.test.ts`.
- Assert `EventMediaSection.tsx`:
  - Contains `hidden sm:flex` on the header button container.
  - Contains `w-full sm:hidden` on the bottom upload button.
  - Binds both buttons to `fileInputRef.current?.click()`.



