# Plan — Simplify Media Upload Entry Points in ContentDrawer

**Status:** Completed  
**Date:** 2026-11-03  
**Estimated time:** 20 minutes  
**Risk:** Low — UI simplification only, no logic changes

---

## Goal

1. **"Upload dari Perangkat"** button opens `GoogleDriveLinkModal` (instead of the hidden `<input>`) — same one-click feel, but leads to the richer multi-file modal
2. **"Link Drive"** button removed everywhere in ContentDrawer
3. **"Tempel Link URL"** tab removed from `GoogleDriveLinkModal` — upload-only modal
4. URL paste inputs in the empty-state drag zone and in the media-set view are also removed (user asked to drop the URL feature)

---

## Exact Changes

### File 1 — `src/components/ui/GoogleDriveLinkModal.tsx`

**Remove the entire tab switcher** (lines 111–141) — the segmented control with "Unggah Langsung" and "Tempel Link URL" buttons.

**Remove the `activeTab` state** — it's no longer needed since there is only one tab.

**Remove the `url` tab panel** — the `else` branch (lines 235–251) that renders `<GoogleDriveUrlForm>`.

**Remove the `activeTab === "upload" ? (...) : (...)` ternary** — replace with just the upload content directly (always shown).

**Remove unused imports** after cleanup: `Link2` from lucide (used only in URL tab button), `GoogleDriveUrlForm` component import, `buildAttachmentFromManualUrl` import.

**Update the header subtitle** — remove the URL reference:
```ts
// BEFORE:
"Unggah berkas langsung ke cloud atau tautkan URL Drive."
// AFTER:
"Unggah berkas langsung ke Google Drive."
```

**Result:** Modal shows only the upload dropzone + file list + "Lampirkan N File" button. No tabs, no URL input.

---

### File 2 — `src/components/views/ContentPlannerView/ContentDrawer.tsx`

**Four changes:**

#### Change A — Top header buttons (lines 498–528)

Replace "Upload dari Perangkat" `onClick` from `fileInputRef.current?.click()` to `onOpenUploadModal(...)`. Remove the "Link Drive" button entirely.

```tsx
// BEFORE:
<button onClick={() => fileInputRef.current?.click()} ...>
  Upload dari Perangkat
</button>
{onOpenUploadModal && (
  <button onClick={() => onOpenUploadModal(...)} ...>
    Link Drive
  </button>
)}

// AFTER:
<button
  type="button"
  onClick={() =>
    onOpenUploadModal?.((attachments) => {
      setMediaAttachments((prev) => {
        const next = [...prev, ...attachments];
        setMediaUrl(next[0]?.url || "");
        return next;
      });
      toast.success(`${attachments.length} file berhasil dilampirkan`);
    })
  }
  disabled={isUploading}
  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
>
  <Upload className="w-3.5 h-3.5" />
  <span>Upload dari Perangkat</span>
</button>
```

#### Change B — "Ganti" button in the media-set view (line 669)

Same swap — replace `fileInputRef.current?.click()` with `onOpenUploadModal?.(...)`:

```tsx
// BEFORE:
<button onClick={() => fileInputRef.current?.click()} ...>
  Ganti
</button>

// AFTER:
<button
  type="button"
  onClick={() =>
    onOpenUploadModal?.((attachments) => {
      setMediaAttachments(attachments);
      setMediaUrl(attachments[0]?.url ?? "");
      toast.success(`${attachments.length} file berhasil dilampirkan`);
    })
  }
  disabled={isUploading}
  ...
>
  Ganti
</button>
```

Note: "Ganti" replaces all attachments (not appends) — so the callback uses `setMediaAttachments(attachments)` not `setMediaAttachments(prev => [...prev, ...attachments])`.

#### Change C — Empty-state upload area buttons (lines 800–826)

Replace "Upload dari Perangkat" button in the drag-drop zone with `onOpenUploadModal` call. Remove "Link Drive" button.

```tsx
// BEFORE:
<button onClick={() => fileInputRef.current?.click()} ...>Upload dari Perangkat</button>
{onOpenUploadModal && (
  <button onClick={() => onOpenUploadModal(...)} ...>Link Drive</button>
)}

// AFTER:
<button
  type="button"
  onClick={() =>
    onOpenUploadModal?.((attachments) => {
      setMediaAttachments((prev) => {
        const next = [...prev, ...attachments];
        setMediaUrl(next[0]?.url || "");
        return next;
      });
      toast.success(`${attachments.length} file berhasil dilampirkan`);
    })
  }
  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl shadow-xs transition-all cursor-pointer"
>
  <Upload className="w-3.5 h-3.5" />
  <span>Upload dari Perangkat</span>
</button>
```

#### Change D — Remove URL paste input from empty-state area (lines 828–836)

Delete this entire block:
```tsx
<div className="pt-2">
  <input
    type="url"
    value={mediaUrl}
    onChange={(e) => setMediaUrl(e.target.value)}
    placeholder="Atau tempel URL Google Drive langsung di sini..."
    className="..."
  />
</div>
```

#### Change E — Remove URL paste input from media-set view (lines 660–665)

Delete the `<input type="url">` in the media-set row (the one next to "Ganti" / "Hapus"):
```tsx
// Remove this:
<input
  type="url"
  value={mediaUrl}
  onChange={(e) => setMediaUrl(e.target.value)}
  placeholder="https://drive.google.com/..."
  className="flex-1 px-3 py-1.5 ..."
/>
```

After removal, the media-set row will only have "Ganti" and "Hapus" buttons side by side.

---

## Cleanup — `ContentDrawer.tsx` Unused Items

After all changes above, check whether these are still used anywhere in the file:

| Item | Used elsewhere? | Action |
|---|---|---|
| `fileInputRef` | Only by `handleDeviceFileUpload` (called from `onChange` and `handleDrop`) | Keep — drag-and-drop still calls `handleDeviceFileUpload` |
| `<input ref={fileInputRef} type="file">` hidden input | Still needed for drag-and-drop `handleDrop` → `handleDeviceFileUpload` | Keep |
| `handleDeviceFileUpload` | Still called by `handleDrop` | Keep |
| `CloudUpload` lucide import | Only used in "Link Drive" buttons (both removed) | Remove |
| `isUploading` / `progress` | Still shown in upload progress bar | Keep |

---

## Execution Checklist

```
[ ] 1. GoogleDriveLinkModal.tsx:
        - Remove activeTab useState
        - Remove segmented tab control JSX (lines 111–141)
        - Remove activeTab ternary — keep only upload content directly
        - Remove GoogleDriveUrlForm import
        - Remove buildAttachmentFromManualUrl import
        - Remove Link2 from lucide import
        - Update header subtitle text
        - npx tsc --noEmit → 0 errors

[ ] 2. ContentDrawer.tsx — Change A (top header):
        - "Upload dari Perangkat" → onOpenUploadModal
        - Remove "Link Drive" button
        - npx tsc --noEmit → 0 errors

[ ] 3. ContentDrawer.tsx — Change B ("Ganti" button):
        - Replace fileInputRef.current?.click() → onOpenUploadModal (replace mode)
        - npx tsc --noEmit → 0 errors

[ ] 4. ContentDrawer.tsx — Change C (empty-state buttons):
        - "Upload dari Perangkat" → onOpenUploadModal
        - Remove "Link Drive" button
        - npx tsc --noEmit → 0 errors

[ ] 5. ContentDrawer.tsx — Change D (remove URL input from empty-state)
[ ] 6. ContentDrawer.tsx — Change E (remove URL input from media-set row)
[ ] 7. ContentDrawer.tsx — Remove CloudUpload import (no longer used)

[ ] 8. npx tsc --noEmit → 0 errors
[ ] 9. npm test → 0 failures

[ ] 10. Manual test:
        → Open ContentDrawer (no media) → drag zone shows "Upload dari Perangkat" only
        → Click "Upload dari Perangkat" → GoogleDriveLinkModal opens (upload tab only, no tabs visible)
        → Upload 2 files → "Lampirkan 2 File" → files appear in drawer
        → Click "Ganti" on existing media → modal opens → upload replaces existing files
        → "Link Drive" button is gone ✓
        → "Tempel Link URL" tab is gone ✓
        → URL paste inputs are gone ✓
        → Drag & drop a file onto the empty zone → still works (handleDrop unchanged) ✓
```

---

## What Is NOT Changed

| Item | Reason |
|---|---|
| `handleDrop` / drag-and-drop | Still calls `handleDeviceFileUpload` directly — fast, no modal needed for drag |
| Hidden `<input type="file">` | Still needed for `handleDrop` |
| Upload progress bar | Unchanged — shown during `handleDeviceFileUpload` (drag-drop path) |
| `GoogleDriveLinkModal` used in other places | Only 2 instances in `ContentPlannerView.tsx` (picker fallback + upload modal) — both unaffected by tab removal since they always default to upload tab |
| `GoogleDriveUrlForm` component | Keep the file — it may be used elsewhere. Only remove its import from `GoogleDriveLinkModal.tsx` |
