# Spec — Migrate Filesystem Uploads to Supabase Storage

**Status:** Ready for Implementation  
**Date:** 2026-11-03  
**ADR:** `docs/adr/0019-migrate-filesystem-uploads-to-supabase-storage.md`  
**Plan:** `docs/superpowers/plans/2026-11-03-migrate-filesystem-uploads-to-supabase-storage.md`

---

## Problem Statement

Three features call `POST /api/marcom/uploads` which writes files to `./uploads/` on the server's local disk using Node.js `fs.writeFile`. On Vercel, the filesystem is read-only and ephemeral — uploads fail immediately with a 500 error in production, making these features completely non-functional outside of local development.

**Affected features:**
1. **MOUs** — MOU contract document upload (PDF, image) in `MouFormModal`
2. **Documents** — Marcom document archive upload (PDF, image, video) in `DocumentsView`
3. **Placements** — Proof-of-placement photo upload (multi-image) in `PlacementPhotoUploader`

---

## Current Architecture

```
Client Component
  │  FormData { kind, id, file }
  ▼
POST /api/marcom/uploads
  │  validateUpload() — extension, size
  │  sanitizeFilename()
  │  fs.mkdir()         ← BROKEN on Vercel (read-only fs)
  │  fs.writeFile()     ← BROKEN on Vercel (read-only fs)
  ▼
Returns { filePath: "/api/marcom/files/{kind}/{id}/{uuid}-{name}" }
  │
  └─► GET /api/marcom/files/[...path]
        fs.readFile()   ← File not found on Vercel (nothing was written)
```

Stored in DB: `/api/marcom/files/documents/abc123/uuid-contract.pdf`  
On Vercel: both write and read fail silently/with 500.

---

## Target Architecture

```
Client Component
  │  FormData { kind, id, file }
  ▼
POST /api/marcom/uploads  (rewritten)
  │  validateUpload()            ← unchanged
  │  sanitizeFilename()          ← unchanged
  │  uploadToSupabase(bucket, path, buffer, mimeType)
  │    └─► fetch PUT to Supabase Storage REST API
  ▼
Returns { filePath: "https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}" }

Stored in DB: https://kkstcawepmqenghaqxzt.supabase.co/storage/v1/object/public/marcom-documents/documents/abc123/uuid-contract.pdf

File access: direct CDN URL, no server proxy needed
```

Legacy `GET /api/marcom/files/[...path]` kept unchanged for existing DB rows with old paths.

---

## Supabase Storage Buckets

Three new public buckets to create manually in Supabase Dashboard before code execution:

| Bucket name | Used by | File types | Max file size |
|---|---|---|---|
| `mou-documents` | MOUs feature | PDF, PNG, JPG, JPEG, WEBP | 25 MB |
| `marcom-documents` | Documents archive | PDF, PNG, JPG, JPEG, WEBP, MP4 | 25 MB |
| `placement-photos` | Placements proof photos | PNG, JPG, JPEG, WEBP | 25 MB |

**Bucket settings:**
- Public: ✅ Yes (files accessible via CDN URL without auth token)
- RLS: Off (service role key used server-side — no client-direct upload)

---

## Storage Path Convention

```
{bucket-name}/{kind-prefix}/{id}/{uuid}-{sanitizedFilename}
```

| Feature | Bucket | Path example |
|---|---|---|
| MOU document | `mou-documents` | `mou-documents/abc123/550e8400-contract.pdf` |
| Document archive | `marcom-documents` | `documents/xyz789/550e8400-quarterly-report.pdf` |
| Placement photo | `placement-photos` | `placements/pla001/550e8400-foto-bukti.jpg` |

`id` can be `"new"` when the record hasn't been saved yet — the storage path is used as a flat key, not for retrieval by ID, so `"new"` is acceptable.

---

## API Contract (unchanged from caller's perspective)

### `POST /api/marcom/uploads`

**Request** (unchanged):
```
Content-Type: multipart/form-data
Fields:
  kind  : "documents" | "mou-documents" | "placements"
  id    : string (record id, or "new")
  file  : File
```

**Response 201** (changed — URL format only):
```json
{
  "filePath": "https://kkstcawepmqenghaqxzt.supabase.co/storage/v1/object/public/marcom-documents/documents/abc123/uuid-report.pdf",
  "filename": "550e8400-quarterly_report.pdf",
  "originalName": "quarterly-report.pdf",
  "sizeBytes": 204800
}
```

**Response 400/403/500**: unchanged format — `{ "error": "..." }`.

**Key change**: `kind: "mou-documents"` is now a valid kind (previously MOUs sent `kind: "documents"` — `mouApi.ts` must be updated).

### Auth
Unchanged — `requireMember()` + `hasPermission()` still guard the route.

### Permissions mapping

| kind | Required permission |
|---|---|
| `"documents"` | `UPLOAD_DOCUMENT` |
| `"mou-documents"` | `UPLOAD_DOCUMENT` |
| `"placements"` | `CREATE_PLACEMENT` |

---

## File Validation Rules (unchanged)

Enforced server-side in `validateUpload()` from `upload.ts`:

| Rule | Value |
|---|---|
| Max file size | 25 MB |
| Allowed extensions | `pdf`, `png`, `jpg`, `jpeg`, `webp`, `mp4` |
| Filename safety | No `..`, `/`, `\`, `\0` |

These rules are applied **before** the Supabase upload — invalid files are rejected at 400 without touching storage.

---

## New Helper: `src/lib/server/supabaseStorage.ts`

A thin, reusable function for server-side Supabase Storage uploads via REST API.

```typescript
export interface SupabaseUploadResult {
  publicUrl: string;
}

export async function uploadToSupabase(
  bucket: string,
  storagePath: string,
  buffer: Buffer,
  mimeType: string
): Promise<SupabaseUploadResult>
```

**Behaviour:**
- `PUT` to `{SUPABASE_URL}/storage/v1/object/{bucket}/{storagePath}`
- Header: `Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}`
- Header: `x-upsert: "true"` (idempotent — same path can be re-uploaded)
- Header: `Content-Type: {mimeType}`
- On non-2xx response: throws `Error("Supabase Storage upload failed: {status} {body}")`
- Returns: `{ publicUrl: "{SUPABASE_URL}/storage/v1/object/public/{bucket}/{storagePath}" }`

This is the same pattern already used in `src/app/api/marcom/drive/upload/route.ts` for thumbnails — extracted into a shared helper.

---

## Rewritten `/api/marcom/uploads/route.ts`

### What changes
- Remove: `import { mkdir, writeFile } from "node:fs/promises"`
- Remove: `import path from "node:path"`
- Remove: `getUploadRootDir`, `resolveUploadPath` from `upload.ts` imports
- Keep: `validateUpload`, `sanitizeFilename`, `MAX_UPLOAD_BYTES` from `upload.ts`
- Add: `import { uploadToSupabase } from "@/lib/server/supabaseStorage"`
- Add: `kind: "mou-documents"` to `VALID_KINDS`
- Add: bucket mapping `kind → bucketName`
- Replace: `mkdir + writeFile` with `await uploadToSupabase(bucket, storagePath, bytes, mimeType)`
- Return: Supabase CDN URL as `filePath`

### What stays the same
- Auth guard (`requireMember`, `hasPermission`)
- Request parsing (`formData.get("kind")`, `"id"`, `"file"`)
- `validateUpload()` check
- `sanitizeFilename()` call
- `randomUUID()` for unique filenames
- Response shape `{ filePath, filename, originalName, sizeBytes }`
- Error response format `{ error: "..." }`

---

## Change to `mouApi.ts`

One line change:
```typescript
// BEFORE:
fd.append("kind", "documents");

// AFTER:
fd.append("kind", "mou-documents");
```

This routes MOU documents to the `mou-documents` bucket, separating them from the Documents archive.

---

## No Changes Required In

| File | Reason |
|---|---|
| `DocumentsView.tsx` | Already calls `POST /api/marcom/uploads` — route changes underneath |
| `PlacementPhotoUploader.tsx` | Same — route changes underneath |
| `MouFormModal.tsx` | Calls `uploadMouDocument()` from `mouApi.ts` — `mouApi.ts` change is sufficient |
| `upload.ts` | `validateUpload`, `sanitizeFilename` reused; `getUploadRootDir` still used by legacy serve route |
| `GET /api/marcom/files/[...path]/route.ts` | Kept for backward compat — no change |
| `isValidDocumentFilePath()` | Already accepts `https://` URLs |
| `isCloudDocumentUrl()` | Already returns `true` for `https://` |
| `DocumentPreviewModal.tsx` | Uses `isCloudDocumentUrl()` to decide rendering — Supabase URLs already pass |
| `DocumentCardsView.tsx` | Same |
| `next.config.ts` remotePatterns | `*.supabase.co` already listed |
| `appImageHelpers.ts` whitelist | Supabase URLs already accepted |

---

## Backward Compatibility

Existing rows in DB with `filePath = "/api/marcom/files/..."`:

| Environment | Old paths | New paths |
|---|---|---|
| Local dev | Work (files on disk) | Work (CDN URLs) |
| Vercel production | Already broken (never worked) | Will work |

The legacy serve route remains. No DB migration needed.

---

## Error Scenarios

| Scenario | Behaviour |
|---|---|
| Supabase env vars missing (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) | `uploadToSupabase` throws — route returns 500 with `"Storage configuration error"` |
| Supabase Storage bucket does not exist | Supabase returns 400 — route returns 500 with descriptive message |
| File exceeds 25 MB | Caught by `validateUpload()` — returns 400 before touching storage |
| Unsupported extension | Caught by `validateUpload()` — returns 400 before touching storage |
| Supabase Storage temporarily unavailable | Route returns 500 — client shows `toast.error` |

---

## Non-Functional Requirements

| Concern | Target |
|---|---|
| Upload latency | Supabase ap-southeast-1 region — p95 < 8s for 10 MB file on mobile |
| File size limit | 25 MB (unchanged) |
| Concurrent uploads (Placements multi-photo) | Each photo is an independent `fetch` — no concurrency change needed |
| Storage cost | Supabase free tier: 1 GB storage — sufficient for current scale |
| File access auth | Public CDN URL — app-level auth protects the metadata/record creation |

---

## Out of Scope

- Deleting Supabase Storage objects when DB records are deleted
- Batch-migrating old `/api/marcom/files/...` paths to CDN URLs
- Private/signed URLs
- Storage usage dashboard update (`/api/marcom/storage/status`)
- Outlets draft photo (uses data: URL, not broken)
- Content Planner media (uses Google Drive, separate system)
