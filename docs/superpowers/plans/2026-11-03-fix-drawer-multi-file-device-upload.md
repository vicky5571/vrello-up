# Handover — Fix "Upload dari Perangkat" to Allow Multiple Files in ContentDrawer

**Status:** Complete  
**Date:** 2026-11-03  
**File:** `src/components/views/ContentPlannerView/ContentDrawer.tsx`  
**Estimated time:** 15 minutes  
**Risk:** Low — two small targeted changes, no new logic

---

## What the User Sees

User clicks **"Upload dari Perangkat"** in the ContentDrawer. macOS native file picker opens. User tries to select multiple files — but can only select **one at a time**. Second file replaces first; there is no multi-select.

---

## Root Cause — Exactly Two Problems

### Problem 1 — `<input type="file">` has no `multiple` attribute (line 464)

```tsx
// CURRENT (line 462–472):
<input
  ref={fileInputRef}
  type="file"
  accept="image/*,video/*"
  onChange={(e) => {
    const file = e.target.files?.[0];   // ← only reads index [0]
    if (file) handleDeviceFileUpload(file);
  }}
  className="hidden"
  disabled={isUploading}
/>
```

Without `multiple`, the OS file picker is single-select only. Even if the user somehow picks multiple files, `e.target.files?.[0]` only reads the first one.

### Problem 2 — `handleDeviceFileUpload` handles one `File` at a time (line 117)

```ts
const handleDeviceFileUpload = async (file: File) => { ... }
```

It takes a single `File` object. Even if `multiple` is added to the input, the `onChange` handler still only calls it for `files[0]`.

### Problem 3 — Drop zone also only reads one file (line 148–150)

```ts
const file = e.dataTransfer.files?.[0];   // ← only index 0
if (file) handleDeviceFileUpload(file);
```

---

## The Fix — Three Small Changes in `ContentDrawer.tsx`

### Change 1 — Add `multiple` to the hidden file input + process all files

**Location:** lines 462–472

```tsx
// BEFORE:
<input
  ref={fileInputRef}
  type="file"
  accept="image/*,video/*"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) handleDeviceFileUpload(file);
  }}
  className="hidden"
  disabled={isUploading}
/>

// AFTER:
<input
  ref={fileInputRef}
  type="file"
  accept="image/*,video/*"
  multiple
  onChange={(e) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => handleDeviceFileUpload(file));
  }}
  className="hidden"
  disabled={isUploading}
/>
```

Key changes: add `multiple`, change `files?.[0]` → `Array.from(files).forEach(...)`.

### Change 2 — Fix the drag-and-drop zone to accept multiple files

**Location:** lines 144–151 (`handleDrop` function)

```ts
// BEFORE:
const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setIsDragOver(false);
  if (isUploading) return;
  const file = e.dataTransfer.files?.[0];
  if (file) {
    handleDeviceFileUpload(file);
  }
};

// AFTER:
const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setIsDragOver(false);
  if (isUploading) return;
  const files = Array.from(e.dataTransfer.files ?? []);
  files.forEach((file) => handleDeviceFileUpload(file));
};
```

### Change 3 (Optional but good UX) — Show correct count in upload button label while uploading

Currently the button shows `Mengunggah (${progress}%)...` — when uploading 3 files sequentially, progress resets to 0 after each file, which is confusing.

This is a UX polish, not required for the core fix. Skip for now unless there is time.

---

## How `handleDeviceFileUpload` Works (No Change Needed)

```ts
const handleDeviceFileUpload = async (file: File) => {
  setActiveFileName(file.name);
  const toastId = toast.loading(`Mengunggah "${file.name}" dari perangkat...`);
  try {
    const attachment = await uploadFile(file);
    if (attachment?.url) {
      setMediaAttachments((prev) => {
        const next = [...prev, attachment];      // ← APPENDS, not replaces
        setMediaUrl(next[0]?.url || attachment.url);
        return next;
      });
      toast.success(`"${file.name}" berhasil diunggah!`, { id: toastId });
    }
  } catch { ... }
};
```

It already **appends** each uploaded file to `mediaAttachments` — so calling it N times for N files is correct and safe. Files upload **sequentially** (each `forEach` call is async but the function itself awaits the upload), so there's no server overload risk.

Actually — `forEach` with async does NOT await each call. Files will upload **in parallel**, not sequentially. This is fine for the `/api/marcom/drive/upload` route (it's stateless), but if there are concerns about parallel uploads, change `forEach` to a sequential loop:

```ts
// Sequential (safer):
const files = Array.from(e.target.files ?? []);
for (const file of files) {
  await handleDeviceFileUpload(file);
}
```

The `onChange` callback is not itself async, so wrap it:

```tsx
onChange={(e) => {
  const files = Array.from(e.target.files ?? []);
  (async () => {
    for (const file of files) {
      await handleDeviceFileUpload(file);
    }
  })();
}}
```

**Recommendation:** Use sequential (`for...of` with await) to avoid multiple simultaneous toast notifications overlapping and to show clear progress per file.

---

## Execution Checklist

```
[x] 1. Open: src/components/views/ContentPlannerView/ContentDrawer.tsx

[x] 2. Line 462–472 — file input:
        - Add: multiple
        - Change onChange: files?.[0] → Array.from(files).forEach (or sequential for...of)

[x] 3. Line 144–151 — handleDrop:
        - Change: files?.[0] single call → Array.from(files).forEach (or sequential for...of)

[x] 4. npx tsc --noEmit    → 0 errors
[x] 5. npm test            → 0 failures

[x] 6. Manual test:
        → Open ContentDrawer for any post
        → Click "Upload dari Perangkat"
        → macOS picker opens — hold ⌘ and select 3 files
        → All 3 upload sequentially with individual toast per file
        → Drawer shows all 3 in the attachment list
        → First one has "Cover" badge
        → Save → reload → all 3 still there
```

---

## Also: ContentPostModal (Create Flow)

The create modal (`ContentPostModal`) has a **separate** hidden file input with the same single-file problem. That is covered by a separate handover:

**`docs/superpowers/plans/2026-11-03-multi-file-upload-create-modal.md`**

Do that handover after this one, or in the same session.

---

## Files to Touch

| File | Lines | Change |
|---|---|---|
| `src/components/views/ContentPlannerView/ContentDrawer.tsx` | 144–151 | `handleDrop` — multi-file |
| `src/components/views/ContentPlannerView/ContentDrawer.tsx` | 462–472 | `<input>` — add `multiple`, loop all files |

**Everything else is already correct.**
