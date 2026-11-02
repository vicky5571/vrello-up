# Fix Plan — Google Drive Picker "Server rejected" on Image Upload

**Status:** Ready to Execute  
**Date:** 2026-11-03  

---

## Observed Symptoms

1. User opens Google Drive Picker from ContentDrawer (Upload tab)
2. Selects `IMG_9048.PNG` (1.18M image file)
3. Picker shows: **"Server rejected"** on the file row
4. Dialog: **"All your files failed to upload. Please retry or remove the failed files."**
5. Console shows (unrelated): `layout.css:1 Failed to load resource: 404`
6. Console also shows: `Permissions policy violation: unload is not allowed` (from Google iframe — harmless, Google-side)

The upload path being used is the **Google Picker's native Upload tab** → the Picker itself tries to upload the file directly to Google Drive using the **user's OAuth token** (`drive.file` scope) — NOT through `useDirectDriveUpload`.

---

## Upload Path Clarification

There are **two separate upload paths** in this system:

| Path | Trigger | Token used | Goes through our server? |
|---|---|---|---|
| **A — Native Picker Upload tab** | User clicks "Upload" tab inside the Google Picker iframe | User's OAuth token (`drive.file` scope via GSI) | ❌ No — browser → Google directly |
| **B — `useDirectDriveUpload`** | Used by `DirectDriveUploadDropzone` (not in ContentDrawer) | Service account refresh token via `/api/marcom/drive/upload-session` | ✅ Yes — proxied through our server |

**The "Server rejected" error is from Path A — the native Picker Upload tab.** It is not from our server at all. The word "Server" in the Picker UI means Google's server rejected the browser's upload request.

---

## Root Cause

The Google Picker is opened with `scope: "https://www.googleapis.com/auth/drive.file"` (line 316 of `useGoogleDrivePicker.ts`).

**`drive.file` scope only grants access to files that the application itself created.** When the user tries to upload a new file via the Picker's Upload tab, the Picker uses the same `drive.file`-scoped token. Google's server rejects the upload because `drive.file` does NOT grant permission to create new files via the Picker upload UI — it only covers files the app already created through the Drive API.

To allow the Picker's native Upload tab to work, the OAuth scope needs to be `https://www.googleapis.com/auth/drive` (full Drive access) or at minimum `https://www.googleapis.com/auth/drive.file` combined with a pre-created upload folder — but practically, **the Picker Upload tab requires broader scope**.

### Secondary Issue: PNG image via Picker Videos view

The Picker is initialized with `google.picker.ViewId.DOCS_VIDEOS` (because `defaultKind === "video"` is hardcoded in ContentDrawer's `onOpenDrivePicker` call). This means:
- The **Videos tab** only shows video files — a PNG will not appear there
- The **Upload tab** tries to upload as a video — a PNG upload into a Videos view may also be rejected by Google's type enforcement

---

## Two Issues to Fix

| # | Issue | Fix |
|---|---|---|
| **1** | `drive.file` scope too restrictive for Picker Upload tab | Change scope to `drive` or remove Upload tab from Picker |
| **2** | `defaultKind: "video"` hardcoded for ContentDrawer media — blocks image uploads | Change `defaultKind` to `"all"` for ContentDrawer |

---

## Fix 1 — Change OAuth Scope in `useGoogleDrivePicker.ts`

**File:** `src/lib/marcom/useGoogleDrivePicker.ts`

**Line 316 — change scope:**
```ts
// BEFORE:
scope: "https://www.googleapis.com/auth/drive.file",

// AFTER:
scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly",
```

> **Alternatively (simpler but broader):** Use `drive` scope — but this requires the Google Cloud OAuth consent screen to be configured for sensitive scopes and may show a scary permission warning to users.

**Best approach for this use case:** Remove the Upload tab from the Picker entirely. The ContentDrawer already has a manual URL input + the `useDirectDriveUpload` path (Path B above) available via `DirectDriveUploadDropzone` (in `GoogleDriveLinkModal`). The native Picker Upload tab is redundant and uses the wrong token architecture.

**Recommended fix — disable the Upload tab in the Picker:**

**File:** `src/lib/marcom/useGoogleDrivePicker.ts`, `createAndShowPicker` function (lines 251–254)

```ts
// BEFORE (lines 251–254):
const uploadView = new google.picker.DocsUploadView();
if (FOLDER_ID) {
  uploadView.setParent(FOLDER_ID);
}
// ...
.addView(uploadView)   // ← line 262

// AFTER — remove these lines entirely:
// (delete the uploadView declaration and the .addView(uploadView) call)
```

This removes the Upload tab from the Picker UI. Users who want to upload a file use the `GoogleDriveLinkModal` fallback which goes through our controlled `useDirectDriveUpload` path (Path B) with the service account token.

---

## Fix 2 — Change `defaultKind` for ContentDrawer

**File:** `src/components/views/ContentPlannerView/ContentDrawer.tsx`

**Lines 417–421 — change `defaultKind`:**
```ts
// BEFORE:
onOpenDrivePicker({
  defaultKind: "video",
  onSelect: (atts) => { ... }
})

// AFTER:
onOpenDrivePicker({
  defaultKind: "all",    // ← allows images, docs, any file type
  onSelect: (atts) => { ... }
})
```

ContentDrawer is used for general content posts (images, videos, carousels, articles). Restricting the Picker view to videos-only blocks users from selecting image files. `"all"` shows `DOCS` view (all file types) instead of `DOCS_VIDEOS`.

---

## Fix 3 — Also update `ContentPlannerView.tsx` `<GoogleDriveLinkModal>`

**File:** `src/components/views/ContentPlannerView/ContentPlannerView.tsx`

**Line 841 — change `defaultKind`:**
```tsx
// BEFORE:
<GoogleDriveLinkModal
  ...
  defaultKind="video"
/>

// AFTER:
<GoogleDriveLinkModal
  ...
  defaultKind="all"
/>
```

The fallback modal also restricts to video-only with `accept="video/*"` in `DirectDriveUploadDropzone`. Changing to `"all"` removes that restriction.

---

## Files to Change

| File | Line(s) | Change |
|---|---|---|
| `src/lib/marcom/useGoogleDrivePicker.ts` | 251–254 + 262 | Remove `DocsUploadView` and `.addView(uploadView)` |
| `src/components/views/ContentPlannerView/ContentDrawer.tsx` | ~419 | `defaultKind: "video"` → `"all"` |
| `src/components/views/ContentPlannerView/ContentPlannerView.tsx` | 841 | `defaultKind="video"` → `"all"` |

---

## Files to NOT Touch

| File | Reason |
|---|---|
| `src/lib/marcom/useDirectDriveUpload.ts` | Path B works correctly — not involved in this bug |
| `src/app/api/marcom/drive/upload-session/route.ts` | Server-side upload session is not the failing path |
| `src/app/api/marcom/drive/finalize/route.ts` | Not reached in the failing path |
| `src/lib/server/driveAuth.ts` | Service account token is not involved |
| Any test files | No tests cover Picker UI behavior |

---

## Execution Order

```
1. Open: src/lib/marcom/useGoogleDrivePicker.ts
   → Find createAndShowPicker (line 232)
   → Delete: const uploadView = new google.picker.DocsUploadView() + setParent + .addView(uploadView)

2. Open: src/components/views/ContentPlannerView/ContentDrawer.tsx
   → Find onOpenDrivePicker({ defaultKind: "video", ... })
   → Change: "video" → "all"

3. Open: src/components/views/ContentPlannerView/ContentPlannerView.tsx
   → Find: <GoogleDriveLinkModal ... defaultKind="video" />  (line 841)
   → Change: "video" → "all"

4. npm run build:check   → 0 TypeScript errors
5. npm test             → 0 failures
6. Manual test: open ContentDrawer → click "Pilih dari Google Drive"
   → Picker should open showing all file types (Videos + Docs, no Upload tab)
   → Select an image → mediaUrl should be set in drawer
   → Click "Simpan Perubahan" → save succeeds
```

---

## Acceptance Criteria

- [ ] Google Picker opens without an Upload tab (no more "Server rejected" possible)
- [ ] Picker shows all file types (images, videos, docs) — not videos-only
- [ ] Selecting an image from Drive sets `mediaUrl` in the drawer correctly
- [ ] `GoogleDriveLinkModal` fallback accepts all file types (not video-only)
- [ ] Save after selecting a Drive file succeeds with no error toast
- [ ] `npm test` — 0 failures
- [ ] `npm run build:check` — 0 TypeScript errors

---

## Risk: Low

- Removing the Upload tab only removes a broken feature — the fallback modal already handles uploads correctly via Path B
- Changing `"video"` to `"all"` is a one-word change with no logic impact
- No API routes, state management, or type definitions are touched
