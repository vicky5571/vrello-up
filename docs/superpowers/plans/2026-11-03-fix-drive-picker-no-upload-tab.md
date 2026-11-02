# Fix Plan — Google Drive Picker Shows No Upload Tab (Planning Only)

**Status:** Ready to Execute  
**Date:** 2026-11-03  
**Trigger:** "upload from this device" button missing from Google Picker

---

## Observed State

The screenshot shows the Google Picker opens with only a **"Google Drive"** tab — no **"Upload"** tab. The "No documents" message appears because the scoped Drive folder is empty / the user has no files shared with the app.

The **"Upload dari Perangkat"** button was added to ContentDrawer in the previous session. It calls `onOpenUploadModal` → opens `GoogleDriveLinkModal` with `defaultKind="all"`. That modal has an "Unggah Langsung" tab that uses `DirectDriveUploadDropzone` → `useDirectDriveUpload` → service account. This is the correct path.

**The button exists in code. The modal exists. But the user cannot see it in the screenshot.**

---

## Root Cause — The Picker Still Opens First

The screenshot shows the **native Google Picker** — not `GoogleDriveLinkModal`. This means the user clicked **"Pilih dari Google Drive"** (which opens the Picker), not **"Upload dari Perangkat"** (which opens the modal).

**The two buttons exist side-by-side in the drawer header.** The user either:
1. Did not notice the "Upload dari Perangkat" button, OR
2. The button is not visible / legible at the current viewport width (1102px mobile sim per the screenshot)

Looking at the screenshot header area — the drawer is not visible because the Picker opened on top of it. The user used the **Picker** path again.

---

## Second Root Cause — `FOLDER_ID` Scopes Picker to Empty Folder

The Picker's `docsView.setParent(FOLDER_ID)` (line 248 of `useGoogleDrivePicker.ts`) scopes the Google Drive view to the service account's folder. The authenticated **user** likely has no files in that folder — hence "No documents."

This creates a **dead-end UX**: the "Pilih dari Google Drive" button opens a picker scoped to a folder the user has never used, showing "No documents." There is no way for the user to escape to an upload from within the Picker (Upload tab was removed).

---

## The Real Problem: UX — Two Paths, Wrong Entry Point Is More Visible

The current layout in ContentDrawer:

```
[Upload dari Perangkat] | [Pilih dari Google Drive]
```

Both are small text links. The user defaults to "Pilih dari Google Drive" because it's familiar from before. But it now shows an empty folder.

**The fix is not in the code — it's in the UX priority.**

---

## Fix Strategy

### Option A — Remove "Pilih dari Google Drive" button entirely
- Users can only upload via `GoogleDriveLinkModal` (correct path)
- The modal has both "Unggah Langsung" and "Tempel Link URL" tabs — covers both use cases
- Simplest, least confusion

### Option B — Remove FOLDER_ID scoping from the Picker
- Remove `docsView.setParent(FOLDER_ID)` so the Picker shows all of the user's Drive files
- User can browse/select their own existing Drive files
- Upload tab still removed (it will never work with service account folder ownership)
- Keeps "Pilih dari Google Drive" useful for users who already have content in their Drive

### Option C — Replace both text buttons with a single "Tambah Media" button
- Single entry point opens `GoogleDriveLinkModal` directly (which has both Upload + URL tabs)
- Eliminates the confusion between two paths entirely
- Removes the Picker flow completely
- Cleanest UX: one button, one modal, two tabs inside

**Recommended: Option C** — removes the broken Picker path entirely. `GoogleDriveLinkModal` already handles both upload and URL paste, which covers all real use cases.

---

## Files to Change (Option C)

| File | Change |
|---|---|
| `ContentDrawer.tsx` | Replace two buttons (lines 417–452) with single "Tambah Media" button that calls `onOpenUploadModal` |
| `ContentDrawer.tsx` | Remove `onOpenDrivePicker` prop entirely (or keep as optional, just stop using it in this section) |
| `ContentPlannerView.tsx` | Remove `onOpenDrivePicker={openSelector}` from `<ContentDrawer>` props (or leave — it's optional) |
| `useGoogleDrivePicker.ts` | No changes needed |

## Files to NOT Touch

| File | Reason |
|---|---|
| `useGoogleDrivePicker.ts` | Still needed for ContentPostModal via `openSelector` |
| `GoogleDriveLinkModal.tsx` | Already correct — two tabs, both work |
| `DirectDriveUploadDropzone.tsx` | Already correct |
| `useDirectDriveUpload.ts` | Already correct |
| `ContentPostModal.tsx` | Uses `onOpenDriveSelector` → `openSelector` directly, unrelated |

---

## Exact Changes (Option C)

### `ContentDrawer.tsx` — lines 416–453

**BEFORE:**
```tsx
<div className="flex items-center gap-2">
  {onOpenUploadModal && (
    <button ... onClick={() => onOpenUploadModal(...)}>
      <span>Upload dari Perangkat</span>
    </button>
  )}
  {onOpenDrivePicker && onOpenUploadModal && (
    <span ...>|</span>
  )}
  {onOpenDrivePicker && (
    <button ... onClick={() => onOpenDrivePicker(...)}>
      <span>Pilih dari Google Drive</span>
    </button>
  )}
</div>
```

**AFTER:**
```tsx
{onOpenUploadModal && (
  <button
    type="button"
    onClick={() =>
      onOpenUploadModal((url) => {
        setMediaUrl(url);
        toast.success("File berhasil diunggah ke Google Drive");
      })
    }
    className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline cursor-pointer flex items-center gap-1"
  >
    <span>Tambah Media</span>
  </button>
)}
```

Single button. Same `onOpenUploadModal` prop. Same callback. Just removes the Drive picker button and the separator.

### `ContentPlannerView.tsx` — line 1035

Remove `onOpenDrivePicker={openSelector}` from `<ContentDrawer>` (the prop is still declared as optional in the interface — no TypeScript change needed). The `openSelector` from `useGoogleDrivePicker` is still used for `ContentPostModal` at line 822.

---

## Execution Order

```
1. Open: src/components/views/ContentPlannerView/ContentDrawer.tsx
   → Lines 416–453: replace the two-button div with single "Tambah Media" button

2. Open: src/components/views/ContentPlannerView/ContentPlannerView.tsx
   → Line 1035: remove onOpenDrivePicker={openSelector} from <ContentDrawer>

3. npm run build:check   → 0 TypeScript errors
4. npm test              → 0 failures

5. Manual test:
   → Open ContentDrawer → click "Tambah Media"
   → GoogleDriveLinkModal opens with "Unggah Langsung" tab active
   → Upload a PNG → succeeds → mediaUrl set in drawer
   → Click "Tempel Link URL" tab → paste a Drive URL → works
   → Click "Simpan Perubahan" → save succeeds
```

---

## Acceptance Criteria

- [ ] ContentDrawer shows single "Tambah Media" button — no more two competing links
- [ ] Clicking "Tambah Media" opens `GoogleDriveLinkModal` with "Unggah Langsung" tab active
- [ ] Uploading a file from device succeeds — no "Server rejected"
- [ ] Pasting a Drive URL in the URL tab still works
- [ ] `npm test` — 0 failures
- [ ] `npm run build:check` — 0 TypeScript errors

---

## Risk: Low

- `onOpenDrivePicker` prop remains in the interface (optional) — no breaking change
- `openSelector` from `useGoogleDrivePicker` is still passed to `ContentPostModal` — unaffected
- No API routes, state, types, or test files touched
