# Fix Plan — Drive Upload CORS Error + Restore Picker Upload Tab

**Status:** Complete  
**Date:** 2026-11-03  

---

## Two Separate Issues

| # | Issue | Symptom |
|---|---|---|
| **1** | CORS error on XHR PUT to Google resumable upload URL | `useDirectDriveUpload` fails at Step 2 |
| **2** | Google Picker has no Upload tab | Picker shows only "Google Drive" tab, "No documents" |

---

## Issue 1 — CORS on Resumable Upload

### Error
```
Access to XMLHttpRequest at 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=...'
from origin 'http://localhost:3000' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Root Cause

`useDirectDriveUpload` Step 2 does a direct XHR `PUT` from the **browser** to Google's resumable upload URL:

```ts
// useDirectDriveUpload.ts line 75
xhr.open("PUT", uploadUrl, true);
xhr.send(file);
```

The `uploadUrl` (Google's resumable session URL) was created by the **server** using the **service account token**. Google's resumable upload endpoint enforces CORS — it only allows the PUT from origins that were registered when the session was initiated.

When `POST /api/marcom/drive/upload-session` runs server-side, Google creates a resumable session scoped to the service account. The `Location` URL returned is meant for **server-to-server** use, not browser XHR. Google's CDN does not include `Access-Control-Allow-Origin` on that endpoint for browser requests.

**In short: the resumable PUT cannot be made directly from the browser. It must go through the server.**

### Fix — Proxy the upload through a new API route

Instead of returning `uploadUrl` to the browser and having the browser PUT directly to Google, create a new route `/api/marcom/drive/upload` that:
1. Receives the file bytes from the browser (multipart or raw body)
2. Streams them to Google's resumable URL server-side
3. Returns the `fileId` to the browser

#### New route: `src/app/api/marcom/drive/upload/route.ts`

```
POST /api/marcom/drive/upload
Content-Type: multipart/form-data

Fields:
  file    — the File binary
  name    — original filename (string)
  mimeType — mime type (string)
```

Flow:
```
Browser → POST /api/marcom/drive/upload-session → get uploadUrl (server only, never sent to browser)
        → POST /api/marcom/drive/upload (file bytes) → server streams to Google → returns fileId
        → POST /api/marcom/drive/finalize (fileId) → returns TaskAttachment
```

Or simpler: **combine upload-session + PUT into a single route** `/api/marcom/drive/upload`:
```
Browser → POST /api/marcom/drive/upload (multipart with file)
         Server: 1. creates resumable session with Google
                 2. PUTs file bytes to Google (server-to-server, no CORS)
                 3. returns { fileId }
Browser → POST /api/marcom/drive/finalize (fileId) → returns TaskAttachment
```

This eliminates the browser XHR PUT entirely.

#### Changes to `useDirectDriveUpload.ts`

**BEFORE (current, broken):**
```
Step 1: POST /api/marcom/drive/upload-session → get uploadUrl
Step 2: XHR PUT uploadUrl (browser → Google) ← CORS BLOCKED
Step 3: POST /api/marcom/drive/finalize (fileId)
```

**AFTER (fixed):**
```
Step 1: POST /api/marcom/drive/upload (multipart: file) → get fileId  ← server handles Google PUT
Step 2: POST /api/marcom/drive/finalize (fileId) → get TaskAttachment
```

`useDirectDriveUpload.ts` no longer needs XHR at all — just two `fetch()` calls. Progress tracking moves to a `onUploadProgress` pattern via a streaming response or is simplified to indeterminate (spinner only, no percentage).

---

## Issue 2 — Picker Has No Upload Tab + "No documents"

### Root Cause — Two problems stacked

**A) `docsView.setParent(FOLDER_ID)` scopes Picker to service account folder**

Line 248 of `useGoogleDrivePicker.ts`:
```ts
docsView.setParent(FOLDER_ID);
```
`FOLDER_ID` is the service account's Drive folder. The authenticated user has never put files there → "No documents."

**Fix:** Remove `docsView.setParent(FOLDER_ID)` — let the Picker show all of the user's Drive files.

**B) Upload tab was removed in a previous session**

The `DocsUploadView` was removed. It needs to come back, but now properly — since we're fixing the CORS issue by proxying through the server, the Picker's native Upload tab is still broken (same service account folder ownership problem). The Upload tab in the Picker always uses the user's OAuth token to write to the specified folder — which the user doesn't own.

**Fix:** Keep Upload tab removed from the Picker. The "Upload dari Perangkat" button in ContentDrawer (which opens `GoogleDriveLinkModal` → `DirectDriveUploadDropzone`) is the correct upload path. Once the CORS fix is applied, this path works correctly.

**The screenshot in the request** shows the desired state: Picker with only "Google Drive" tab (no Upload tab), but without the `setParent` scoping so all the user's files are visible — not "No documents."

---

## Summary of All Changes Required

| File | Change | Reason |
|---|---|---|
| `src/app/api/marcom/drive/upload/route.ts` | **CREATE** new route | Proxy file upload server-side to fix CORS |
| `src/app/api/marcom/drive/upload-session/route.ts` | **DELETE or keep** (no longer called from browser) | Replaced by new upload route |
| `src/lib/marcom/useDirectDriveUpload.ts` | **Rewrite** Steps 1+2 → single POST to new route | Remove XHR, fix CORS |
| `src/lib/marcom/useGoogleDrivePicker.ts` line 247–249 | **Remove** `docsView.setParent(FOLDER_ID)` | Show all user's Drive files, not empty scoped folder |

## Files to NOT Touch

| File | Reason |
|---|---|
| `src/app/api/marcom/drive/finalize/route.ts` | Still used in Step 2 of new flow |
| `src/components/ui/DirectDriveUploadDropzone.tsx` | Uses `useDirectDriveUpload` — will work after hook fix |
| `src/components/ui/GoogleDriveLinkModal.tsx` | Correct as-is |
| `src/components/views/ContentPlannerView/ContentDrawer.tsx` | "Tambah Media" button + `onOpenUploadModal` — correct |
| `src/components/views/ContentPlannerView/ContentPlannerView.tsx` | Upload modal wiring — correct |
| `src/components/views/ContentPlannerView/ContentPostModal.tsx` | Uses `useDirectDriveUpload` — will work after hook fix |

---

## New Route Spec: `POST /api/marcom/drive/upload`

```ts
// Request: multipart/form-data
// Fields: file (File), name (string), mimeType (string), sizeBytes (number)

// Server flow:
// 1. auth() check
// 2. getDriveAccessToken() — service account token
// 3. POST to Google resumable session initiation (same as upload-session route)
// 4. PUT file bytes to the resumable uploadUrl (server-to-server, no CORS)
// 5. Parse fileId from Google response
// 6. Return { fileId }

// Response: { fileId: string }
// Error: { error: string } with appropriate status
```

Note: Vercel serverless has a **4.5 MB body size limit** by default. For large files, the route needs `export const config = { api: { bodyParser: false } }` and streaming. Since Next.js App Router is used, `request.formData()` handles the body — but the 4.5 MB limit still applies unless the route is configured with `export const maxDuration` and the deployment uses Pro plan.

**For now (dev):** implement without streaming — will work for files under 4.5 MB. Add a note in the route about the size limit.

---

## Execution Order

```
1. Create: src/app/api/marcom/drive/upload/route.ts
   — auth check, getDriveAccessToken, create resumable session,
     PUT bytes to Google server-side, return { fileId }

2. Edit: src/lib/marcom/useDirectDriveUpload.ts
   — Replace Steps 1+2 (upload-session + XHR PUT) with single
     POST /api/marcom/drive/upload using fetch + FormData
   — Keep Step 3 (finalize) unchanged
   — Remove XHR / XMLHttpRequest entirely
   — Simplify progress to boolean isUploading (no percentage, or fake 50% during upload)

3. Edit: src/lib/marcom/useGoogleDrivePicker.ts line 247–249
   — Remove: if (FOLDER_ID) { docsView.setParent(FOLDER_ID); }
   — Keep: docsView.setIncludeFolders(true)

4. npm run build:check   → 0 TypeScript errors
5. npm test              → 0 failures

6. Manual test:
   → Open ContentDrawer → click "Tambah Media"
   → GoogleDriveLinkModal opens → "Unggah Langsung" tab
   → Upload a PNG from device → no CORS error → success toast
   → mediaUrl set in drawer → save → works

   → Open ContentDrawer → click "Pilih dari Google Drive" (if still present)
   → Picker shows user's own Drive files (not empty folder)
```

---

## Acceptance Criteria

- [x] Uploading a file from device via "Tambah Media" button succeeds — no CORS error
- [x] `GoogleDriveLinkModal` "Unggah Langsung" tab completes upload and closes modal
- [x] `mediaUrl` is set in ContentDrawer after upload
- [x] Google Picker (if opened) shows user's own Drive files — no "No documents"
- [x] `npm test` — 0 failures
- [x] `npm run build:check` — 0 TypeScript errors

---

## Risk

| Area | Risk | Mitigation |
|---|---|---|
| File size limit | Vercel 4.5 MB limit on serverless body | Add comment in route; acceptable for dev. Large file support needs streaming (separate task) |
| Progress bar | XHR removed, no byte-level progress | Show indeterminate spinner during upload — acceptable UX tradeoff |
| `upload-session` route | No longer called from browser | Keep the file — it may be used by other consumers in future |
