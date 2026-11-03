# Spec — Thumbnail Generation via Sharp + Supabase Storage

**ADR:** `docs/adr/0018-thumbnail-generation-supabase-storage.md`  
**Status:** Implemented  
**Date:** 2026-11-03

---

## Overview

When a user uploads an image file via "Upload dari Perangkat", the server generates a compressed WebP thumbnail using Sharp and stores it in Supabase Storage. The thumbnail URL is persisted on the `TaskAttachment` object. Card thumbnails display the real image instead of a dark placeholder.

Videos and non-image files are unaffected — they continue showing the existing placeholder. Original files are never compressed or altered.

---

## Pre-requisite: Supabase Storage Bucket

Before any code is executed, a bucket named **`content-thumbnails`** must be created manually:

1. Go to Supabase Dashboard → Storage → New Bucket
2. Name: `content-thumbnails`
3. Public: **Yes** (files served via public CDN URL)
4. File size limit: 5 MB (thumbnails will be ≤ 100 KB)
5. Allowed MIME types: `image/webp`

Public URL format:
```
https://kkstcawepmqenghaqxzt.supabase.co/storage/v1/object/public/content-thumbnails/{path}
```

---

## Data Flow

```
[Browser]
  ↓  POST /api/marcom/drive/upload  (multipart: file, name, mimeType, sizeBytes)
[Server — drive/upload/route.ts]
  ↓  1. Upload ORIGINAL to Google Drive → get fileId
  ↓  2. Is image (JPEG/PNG/WebP)?
        YES → Sharp: resize to ≤800px wide, convert to WebP q=0.75 → buffer
              PUT buffer → Supabase Storage bucket "content-thumbnails"
              path: thumbnails/{userId}/{fileId}.webp
              → thumbnailUrl = "{SUPABASE_URL}/storage/v1/object/public/content-thumbnails/thumbnails/{userId}/{fileId}.webp"
        NO  → thumbnailUrl = undefined
  ↓  Return { fileId, name, thumbnailUrl? }
[Browser — useDirectDriveUpload.ts]
  ↓  POST /api/marcom/drive/finalize  (fileId, name, mimeType, sizeBytes, thumbnailUrl?)
[Server — drive/finalize/route.ts]
  ↓  buildDriveAttachment() → sets thumbnailUrl if provided
  ↓  Return { attachment: TaskAttachment }
[Browser]
  ↓  TaskAttachment.thumbnailUrl = "https://…supabase.co/…"
  ↓  Stored in mediaAttachments[] → saved to DB on "Simpan Perubahan"
```

---

## Server Changes

### `src/app/api/marcom/drive/upload/route.ts`

**New helper function** (inline or in `driveUploadHelpers.ts`):

```ts
async function generateAndUploadThumbnail(
  fileBuffer: Buffer,
  mimeType: string,
  fileId: string,
  userId: string,
): Promise<string | undefined>
```

Logic:
1. Check if `mimeType` is compressible: `["image/jpeg", "image/png", "image/webp", "image/jpg"]`
2. If not compressible → return `undefined` (skip for videos, PDFs, etc.)
3. Use Sharp:
   ```ts
   const thumbnailBuffer = await sharp(fileBuffer)
     .resize({ width: 800, withoutEnlargement: true })
     .webp({ quality: 75 })
     .toBuffer();
   ```
4. Build path: `thumbnails/${userId}/${fileId}.webp`
5. PUT to Supabase Storage REST API:
   ```
   PUT {SUPABASE_URL}/storage/v1/object/content-thumbnails/{path}
   Headers:
     Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
     Content-Type: image/webp
     Cache-Control: public, max-age=31536000
   Body: thumbnailBuffer
   ```
6. If PUT fails → log warning, return `undefined` (graceful degradation — upload still succeeds)
7. Return public URL: `{SUPABASE_URL}/storage/v1/object/public/content-thumbnails/{path}`

**Modified response** — add `thumbnailUrl` to existing return:
```ts
// BEFORE:
return NextResponse.json({ success: true, fileId, name });

// AFTER:
return NextResponse.json({ success: true, fileId, name, thumbnailUrl });
// thumbnailUrl is string | undefined
```

**Environment variables used** (already in `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` — base URL for Supabase REST calls
- `SUPABASE_SERVICE_ROLE_KEY` — auth for Storage write operations

---

### `src/app/api/marcom/drive/finalize/route.ts`

Accept optional `thumbnailUrl` from request body and pass to `buildDriveAttachment`:

```ts
// New field read from body:
const thumbnailUrl = typeof body.thumbnailUrl === "string" ? body.thumbnailUrl : undefined;

// Pass to buildDriveAttachment:
const attachment = buildDriveAttachment({ fileId, name, mimeType, sizeBytes, thumbnailUrl });
```

---

### `src/lib/marcom/driveUploadHelpers.ts`

Add `thumbnailUrl` to `BuildDriveAttachmentParams` and set it on the returned object:

```ts
// Interface:
export interface BuildDriveAttachmentParams {
  fileId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  thumbnailUrl?: string;   // ← ADD
}

// In buildDriveAttachment():
return {
  ...existingFields,
  thumbnailUrl: params.thumbnailUrl,   // ← ADD (undefined if not provided)
};
```

---

## Client Changes

### `src/lib/marcom/useDirectDriveUpload.ts`

Pass `thumbnailUrl` from upload response through to finalize:

```ts
// After upload response:
const uploadData = await uploadRes.json();
const fileId = uploadData.fileId;
const thumbnailUrl = uploadData.thumbnailUrl as string | undefined;  // ← ADD

// In finalize request body:
body: JSON.stringify({
  fileId,
  name: file.name,
  mimeType: file.type || "application/octet-stream",
  sizeBytes: file.size,
  thumbnailUrl,   // ← ADD (undefined is fine — JSON.stringify omits undefined)
}),
```

---

## Display Changes

### Card thumbnail renderer — `ContentPlannerView.tsx` (line ~660)

Add `thumbnailUrl` check as the **first branch** before existing `parsedDrive.isValid` check:

```ts
// Resolve cover attachment thumbnailUrl
const coverAttachment = post.mediaAttachments?.[0];
const thumbnailUrl = coverAttachment?.thumbnailUrl;

// NEW first branch:
if (thumbnailUrl) {
  return (
    <div className="relative w-full h-full bg-slate-100 dark:bg-slate-900">
      <AppImage
        src={thumbnailUrl}
        alt={post.title}
        fill
        sizes="card"
        className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
      />
      {/* Play overlay for videos (if cover is a video with thumbnailUrl) */}
      {coverAttachment?.type === "video" && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-pink-600/90 text-white flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}
// ... existing parsedDrive.isValid branch unchanged below
```

---

## Cover Selection UI

### `ContentDrawer.tsx` — attachment list (lines ~664–725)

Each non-first item row currently has only a remove `×` button. Add a **"Jadikan Cover"** button:

```tsx
{i !== 0 && (
  <button
    type="button"
    onClick={() => {
      // Move item at index i to index 0
      const reordered = [
        mediaAttachments[i],
        ...mediaAttachments.filter((_, j) => j !== i),
      ];
      setMediaAttachments(reordered);
      setMediaUrl(reordered[0]?.url ?? "");
    }}
    className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-950/40 dark:hover:text-pink-400 font-semibold transition-colors cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
    title="Jadikan file ini sebagai thumbnail cover"
  >
    Cover
  </button>
)}
```

When user clicks → item moves to index 0 → "COVER" badge appears on it → `mediaUrl` updates → on save the new cover and its `thumbnailUrl` become the post's primary thumbnail.

---

## Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Image uploads (JPEG/PNG/WebP) generate a WebP thumbnail ≤ 800px wide stored in Supabase Storage |
| FR-02 | Original file uploaded to Google Drive is unmodified — full quality preserved |
| FR-03 | `TaskAttachment.thumbnailUrl` is set to the Supabase CDN URL after successful thumbnail upload |
| FR-04 | Card thumbnail renders `<AppImage src={thumbnailUrl}>` when `thumbnailUrl` is present |
| FR-05 | Videos, PDFs, and other non-image files skip thumbnail generation — existing placeholder shown |
| FR-06 | Supabase thumbnail upload failure is non-fatal — upload still completes, `thumbnailUrl` is undefined |
| FR-07 | "Jadikan Cover" button in drawer attachment list reorders `mediaAttachments[]` so chosen item becomes index 0 |
| FR-08 | After cover change, card thumbnail updates on next save + page refresh |
| FR-09 | Existing posts without `thumbnailUrl` continue showing existing placeholder — no regression |

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | Thumbnail size target: ≤ 50 KB WebP at 800px wide, quality 0.75 |
| NFR-02 | Sharp processing adds ≤ 500ms to upload time for typical smartphone images |
| NFR-03 | Supabase Storage path pattern: `thumbnails/{userId}/{driveFileId}.webp` — unique per user+file |
| NFR-04 | `npm run build:check` — 0 TypeScript errors |
| NFR-05 | `npm test` — 0 failures |
| NFR-06 | No new npm packages required |

---

## Non-Goals

- Video thumbnail (first frame extraction) — needs ffmpeg, separate task
- Thumbnail regeneration for existing posts — separate batch script
- Client-side WebP generation — server-side Sharp is more reliable
- Supabase bucket creation automation — manual dashboard step
- Thumbnail deletion when post is deleted — future enhancement
