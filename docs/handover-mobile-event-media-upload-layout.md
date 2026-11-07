# Execution Handover: Mobile Field Event Media Section Upload Action Layout

- **Target ADR:** `docs/adr/0073-mobile-event-media-upload-action-layout.md`
- **Target Spec:** `docs/superpowers/specs/2026-11-07-mobile-event-media-upload-layout-design.md`
- **Target Plan:** `docs/superpowers/plans/2026-11-07-mobile-event-media-upload-layout.md`
- **Status:** EXECUTION-READY

## 1. File Manifest

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/EventsView/eventMediaResponsiveness.test.ts` | Unit & structural regression test suite for mobile media upload button layout |
| `src/components/views/EventsView/EventMediaSection.tsx` | Atomic component rendering event media uploads, cover preview, and Google Drive attachments |

---

## 2. Current Code Snippets

From `src/components/views/EventsView/EventMediaSection.tsx`:

### Current Header Button (Lines 166–190):
```tsx
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
          <Film className="w-4 h-4 text-blue-500" />
          <span>Media & Dokumentasi Event</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload dari Perangkat</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleDeviceFilesSelected}
          />
        </div>
      </div>
```

### Current Bottom Zone (Lines 402–415):
```tsx
        </div>
      )}

      {/* Folder Archive Input Fallback */}
      <div className="pt-1">
        {!showFolderInput ? (
          <button
            type="button"
            onClick={() => setShowFolderInput(true)}
            className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Folder className="w-3 h-3" />
            <span>+ Tempel Link Folder Drive untuk Raw Documentation</span>
          </button>

---

## 3. Exact Change Instructions

### Change 1: In `src/components/views/EventsView/EventMediaSection.tsx`
Update the header button container to hide on mobile (`hidden sm:flex`):
```tsx
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
          <Film className="w-4 h-4 text-blue-500 shrink-0" />
          <span>Media & Dokumentasi Event</span>
        </div>
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleDeviceFilesSelected}
        />
      </div>
```

### Change 2: In `src/components/views/EventsView/EventMediaSection.tsx`
Immediately after the closing `)}` of the media area (below attachments list / dropzone) and before `{/* Folder Archive Input Fallback */}`:
```tsx
      {/* Mobile-Only Full-Width Upload Button */}
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

---

## 4. Explicit "Do Not Touch" List

1. **`useDirectDriveUpload("events")` hook:** Do NOT modify the Google Drive upload pipeline, progress tracking, or cancel callback.
2. **`handleDeviceFilesSelected` & `processFiles`:** Do NOT alter the file processing, thumbnail generation, or event attachment state mapping.
3. **Desktop Presentation ($\ge 640\text{px}$):** Do NOT alter the desktop header button position (`sm:flex sm:items-center`) or reveal the bottom button on desktop (`sm:hidden`).
4. **Google Drive Folder Drawer / Link Input:** Do NOT touch the folder link input toggle or attachment logic.

---

## 5. Numbered Execution Order

1. **Phase 1 (Test Suite):** Create `src/components/views/EventsView/eventMediaResponsiveness.test.ts` asserting responsive breakpoints (`hidden sm:flex` on header button, `w-full sm:hidden` on bottom button). Verify RED status.
2. **Phase 2 (Implementation):** Apply the exact changes to `src/components/views/EventsView/EventMediaSection.tsx`. Verify GREEN status.
3. **Phase 3 (Quality Gates):**
   - Run `npx tsx --test src/components/views/EventsView/eventMediaResponsiveness.test.ts`
   - Run `npm run drift:check` (100/100 pairs)
   - Run `npm run build:check` (0 errors)
   - Run `npm run test:smoke` (150/150 pass)
   - Run `npm test` (0 failures)
   - Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

---

## 6. Acceptance Criteria Checklist

- [ ] Mobile (< 640px) header title `Media & Dokumentasi Event` spans 100% on a single row without wrapping.
- [ ] Desktop ($\ge 640\text{px}$) header button remains positioned on the right row (`hidden sm:flex`).
- [ ] Mobile (< 640px) bottom full-width button renders below the media area (`w-full sm:hidden`).
- [ ] Desktop ($\ge 640\text{px}$) hides the bottom full-width button.
- [ ] Both buttons trigger `fileInputRef.current?.click()` and disable while `isUploading`.
- [ ] `EventMediaSection.tsx` maintains safe coordinator file limits.

```

