# ADR-0019 — Migrate Filesystem Uploads to Supabase Storage

**Status:** Accepted  
**Date:** 2026-11-03  
**Area:** MOUs, Documents, Placements — File Upload Infrastructure  
**Relates to:** ADR-0018 (Thumbnail Generation via Supabase Storage)

---

## Context

Three features currently upload files to the server's local filesystem via `POST /api/marcom/uploads` → `node:fs/promises writeFile` → `./uploads/{kind}/{id}/{uuid}-{filename}`. Files are served back via `GET /api/marcom/files/[...path]` → `readFile` from the same disk.

### What callers send today

| Feature | Component | `kind` field | `id` field |
|---|---|---|---|
| MOUs document upload | `MouFormModal` → `mouApi.uploadMouDocument` | `"documents"` | MOU id or `"new"` |
| Documents archive upload | `DocumentsView.handleFileUpload` | `"documents"` | Document id or `"new"` |
| Placements proof photos | `PlacementPhotoUploader.handleFiles` | `"placements"` | Placement id |

### Why this is broken in production

| Problem | Impact on Vercel |
|---|---|
| Vercel serverless filesystem is **read-only** | `fs.writeFile` / `mkdir` throw immediately — upload returns HTTP 500 |
| Each function instance has its own **ephemeral** isolated filesystem | Files written by Instance A are invisible to Instance B |
| Every deployment wipes all function instances | All previously uploaded files are permanently lost on each deploy |
| Horizontal scaling across instances | User A uploads to Instance 1, User B's GET request goes to Instance 2 — 404 |

All three features are **dev-only** in their current form. They appear to work locally (single machine, shared disk) but fail completely in any cloud deployment.

### What is NOT affected

- **Outlets draft photo** (`SubmitDraftOutletModal`) — uses `FileReader` + `data:` URL stored in the JSON POST body to `/api/marcom/outlets/draft`. Never calls `fs.writeFile`. Not in scope.
- **Settings JSON import** — browser-side only (`file.text()` + `JSON.parse`). No server involvement. Not in scope.
- **Content Planner media** — uploads to Google Drive via `/api/marcom/drive/upload`. Not in scope.

---

## Decision Drivers

- Supabase project already exists; `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already in `.env.local`
- Supabase Storage already used for thumbnails (ADR-0018) — the `fetch`-based upload pattern is established and working
- `*.supabase.co` is already in `next.config.ts` `remotePatterns` — `<AppImage>` renders Supabase CDN URLs without config changes
- `isCloudDocumentUrl()` already returns `true` for `https://` URLs — Documents view validation requires zero changes
- `isValidDocumentFilePath()` already accepts `https://` URLs — zero validation changes needed
- `@supabase/supabase-js` is NOT installed — uploads use raw `fetch` to Supabase Storage REST API (consistent with thumbnail route)
- No new npm packages required

---

## Decision

Replace `fs.writeFile` in `/api/marcom/uploads` with Supabase Storage uploads. Files stored at stable CDN URLs. The `GET /api/marcom/files` serve route is kept unchanged for backward compatibility with existing rows that have `/api/marcom/files/...` paths.

### Key structural change: separate MOU kind

Currently MOUs pass `kind: "documents"` — the same kind as the Documents archive. After migration, MOUs will pass `kind: "mou-documents"`. This isolates MOU contracts from general Documents in separate buckets and makes the storage layout semantically clear.

Change required in `mouApi.ts`: `fd.append("kind", "mou-documents")` (one line).

### Storage bucket layout

| Feature | Bucket name | Path pattern | Bucket type |
|---|---|---|---|
| MOUs | `mou-documents` | `mou-documents/{id}/{uuid}-{filename}` | Public |
| Documents archive | `marcom-documents` | `documents/{id}/{uuid}-{filename}` | Public |
| Placements photos | `placement-photos` | `placements/{id}/{uuid}-{filename}` | Public |

All buckets: public read (CDN delivery without auth token), 25 MB file size limit, MIME types matching `ALLOWED_UPLOAD_EXTENSIONS` in `upload.ts`.

### Returned URL shape

```
https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
```

This replaces `/api/marcom/files/{kind}/{id}/{filename}` as the stored value in DB columns (`docPath`, `filePath`, `photoUrl`).

---

## Options Considered

| Option | Pros | Cons | Decision |
|---|---|---|---|
| **Supabase Storage** | Already integrated, free tier 1 GB, no new credentials | Public buckets (no per-file auth) | ✅ Chosen |
| Google Drive | Already used for Content Planner | Drive is for user content, no folder org for documents, quota concerns | ❌ |
| AWS S3 | Industry standard, flexible | New credentials, new SDK, no existing setup | ❌ |
| Vercel Blob | Native Vercel integration | Paid tier required, new SDK | ❌ |
| Cloudinary | Great for images | No PDF/document support, new credentials | ❌ |

---

## Migration Strategy for Existing Rows

Existing DB rows have `filePath`/`docPath`/`photoUrl` = `"/api/marcom/files/..."`. These continue to work via the kept `GET /api/marcom/files` route which reads from the local `./uploads/` directory.

- In **local development**: files still exist on disk — fully functional
- In **production** (Vercel): these paths are already broken (files were never written) — no regression introduced by this migration

**No DB migration needed.** The `filePath`, `docPath`, and `photoUrl` columns are already `String` type and accept any URL.

---

## Consequences

### Positive
- File uploads and downloads work in production (Vercel) — persistent across instances and deployments
- All users access the same files regardless of which function instance handles their request
- Supabase CDN delivers files globally without going through the Next.js server
- `isCloudDocumentUrl()` and `isValidDocumentFilePath()` already accept `https://` — zero view-layer validation change
- No new npm dependencies

### Negative
- `GET /api/marcom/files` route becomes legacy — must be kept indefinitely for backward compat
- Supabase free tier: 1 GB storage, 2 GB bandwidth/month — sufficient for current scale; monitor if usage grows
- Three buckets must be manually created in Supabase Dashboard before code execution (no Terraform/IaC)
- Files are publicly accessible by URL (no per-file auth) — acceptable for this app's model where app-level auth protects the upload/metadata API

### Neutral
- `upload.ts` helper functions (`sanitizeFilename`, `validateUpload`, `MAX_UPLOAD_BYTES`) remain — reused in new route for server-side validation before uploading to Supabase
- `getUploadRootDir`, `resolveUploadPath` remain in `upload.ts` — still used by the legacy `GET /api/marcom/files` route

---

## Non-Goals

- Batch-migrating existing `/api/marcom/files/...` paths to Supabase CDN URLs (future task)
- Deleting files from Supabase Storage when records are deleted from DB (future enhancement)
- Private buckets with signed URLs (app-level auth is sufficient)
- Outlets draft photo — not broken, not in scope
- Storage metrics dashboard (`/api/marcom/storage/status`) — remains as disk metrics for local dev; updating it to reflect Supabase stats is a future task

---

## Related

- ADR-0018 — Thumbnail Generation via Supabase Storage
- Spec: `docs/superpowers/specs/2026-11-03-migrate-filesystem-uploads-to-supabase-storage.md`
- Plan: `docs/superpowers/plans/2026-11-03-migrate-filesystem-uploads-to-supabase-storage.md`
