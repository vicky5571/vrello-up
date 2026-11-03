# ADR-0018 — Thumbnail Generation via Sharp + Supabase Storage

**Status:** Accepted  
**Date:** 2026-11-03  
**Area:** Content Planner — Media Thumbnails  
**Relates to:** ADR-0016 (Multi-File Upload), ADR-0017 (Multi-File UI Adaptation)

---

## Context

Card thumbnails in the Content Planner currently show a dark "Google Drive Media" placeholder with a play icon for every Drive-hosted file, regardless of whether the file is an image or a video. This is because the renderer detects a Drive URL (`parsedDrive.isValid === true`) and returns the placeholder early — it never reaches the `<AppImage>` branch that would render a real preview.

Users upload original-quality footage (images and videos) to Google Drive. They need:
1. A real visual thumbnail on the card — not a placeholder
2. Original files untouched — no compression of source material
3. A way to choose which attachment is the cover/thumbnail

---

## Decision Drivers

- `sharp` v0.33.5 is already installed — no new dependency for server-side image processing
- `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` are already in `.env.local`
- `*.supabase.co` is already in `next.config.ts` `remotePatterns` — `<AppImage>` can render Supabase Storage URLs without config change
- `thumbnailUrl?: string` already exists on `TaskAttachment` type — no type change needed
- `@supabase/supabase-js` is NOT installed — Supabase Storage upload will use the raw REST API (no SDK needed for a single `PUT` call)
- Supabase Storage bucket list currently returns `[]` — a new bucket `content-thumbnails` must be created in the Supabase dashboard before execution

---

## Options Considered

### Thumbnail generation timing

| Option | Description | Decision |
|---|---|---|
| **At upload time** (server-side) | Sharp generates WebP in the same `/api/marcom/drive/upload` request. Original → Drive. Thumbnail → Supabase Storage. Single round trip for the user. | ✅ Chosen |
| At save time (client-side) | Canvas WebP on "Simpan Perubahan" click | ❌ Blocks save button, upload already happened, WebP support inconsistent on Safari |
| At display time | Generate on-the-fly when card renders | ❌ Expensive, can't be cached, no persistence |
| Drive thumbnail API | Use `drive.google.com/thumbnail?id=…&sz=w400` | ❌ Rate-limited, requires file to be publicly shared, breaks for videos |

### Thumbnail storage

| Option | Description | Decision |
|---|---|---|
| **Supabase Storage** | Stable CDN URL, already whitelisted in `next.config.ts` and `appImageHelpers.ts`, service role key available | ✅ Chosen |
| Google Drive (second file) | Two Drive uploads per image, Drive storage quota used | ❌ Wasteful |
| `data:` URL in JSON column | No separate storage, but base64 bloats the DB row (400px WebP ≈ 15–30 KB base64 each) | ❌ DB bloat |
| Local filesystem (`/public`) | Works in dev, breaks in Vercel serverless | ❌ Not viable |

### Cover selection

| Option | Description | Decision |
|---|---|---|
| **"Jadikan Cover" button per attachment row** | Reorders `mediaAttachments[]` so chosen item becomes index 0. `mediaUrl` and `thumbnailUrl` sync to index 0 on save. | ✅ Chosen |
| Drag-to-reorder | More complex, out of scope | ❌ Future enhancement |
| Separate "cover" field on the post | New DB column, more complexity | ❌ Overkill — positional index 0 is sufficient |

---

## Architecture Decision

### Upload flow (new)

```
Browser → POST /api/marcom/drive/upload (multipart: file)
  Server:
    1. Upload ORIGINAL file → Google Drive (unchanged)
    2. If file is a compressible image (JPEG/PNG/WebP):
       a. Sharp: resize to max 800px wide, convert to WebP, quality 0.75
       b. PUT thumbnail bytes → Supabase Storage bucket "content-thumbnails"
          Path: thumbnails/{userId}/{driveFileId}.webp
          Content-Type: image/webp
          Cache-Control: public, max-age=31536000
       c. Construct public URL: {SUPABASE_URL}/storage/v1/object/public/content-thumbnails/thumbnails/{userId}/{driveFileId}.webp
    3. Return { fileId, name, thumbnailUrl? }

Browser → POST /api/marcom/drive/finalize (fileId, name, mimeType, sizeBytes, thumbnailUrl?)
  Server:
    buildDriveAttachment() → now also sets thumbnailUrl if provided
    Return { attachment: TaskAttachment }
```

### Card thumbnail rendering (new priority order)

```
if (attachment.thumbnailUrl)    → <AppImage src={thumbnailUrl} />        ← NEW first branch
else if (parsedDrive.isValid)   → dark placeholder + play icon            ← existing (fallback)
else if (isVideoFile)           → dark placeholder + video icon           ← existing
else                            → <AppImage src={mediaUrl} />             ← existing
```

### Cover selection

The `ContentDrawer` attachment list already shows "Item pertama adalah cover". Add a **"Jadikan Cover"** button on each non-first row. Clicking it moves that item to index 0 via array reorder. On save, `mediaUrl = mediaAttachments[0].url` (existing logic, unchanged).

---

## Consequences

### Positive
- Card thumbnails show real image previews instead of dark placeholders
- Original files at full quality stored in Google Drive — untouched
- Thumbnails are small (≈ 10–30 KB WebP 800px) — fast CDN delivery
- `thumbnailUrl` persists in `mediaAttachments` JSON — survives page reload
- Videos and non-image files gracefully fall back to existing placeholder (Sharp skips them)
- No new npm dependencies — Sharp already installed, Supabase REST API via native `fetch`

### Negative
- Supabase Storage bucket `content-thumbnails` must be manually created in dashboard before execution
- If thumbnail upload to Supabase fails, upload still succeeds (thumbnailUrl is optional) — graceful degradation
- Vercel serverless function memory: Sharp WebP generation of an 800px image uses ~50–80 MB — within Vercel's 1024 MB limit

### Neutral
- `useDirectDriveUpload.ts` passes `thumbnailUrl` from upload response → finalize → returned `TaskAttachment` — two extra field passes, no logic change

---

## Non-Goals

- Video thumbnail extraction (first-frame screenshot) — future enhancement, requires ffmpeg
- Thumbnail regeneration for existing posts — separate batch task
- Supabase Storage bucket creation automation — manual dashboard step
- Drag-to-reorder attachments

---

## Related

- ADR-0016 — Multi-File Media Upload  
- ADR-0017 — Multi-File Media UI Adaptation  
- Spec: `docs/superpowers/specs/2026-11-03-thumbnail-generation-supabase-storage.md`  
- Plan: `docs/superpowers/plans/2026-11-03-thumbnail-generation-supabase-storage.md`
