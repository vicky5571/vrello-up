# Plan — Thumbnail Generation via Sharp + Supabase Storage

**Spec:** `docs/superpowers/specs/2026-11-03-thumbnail-generation-supabase-storage.md`  
**ADR:** `docs/adr/0018-thumbnail-generation-supabase-storage.md`  
**Status:** Completed  
**Date:** 2026-11-03

---

## File Manifest

| File | Action | Notes |
|---|---|---|
| Supabase Dashboard | Manual step | Create bucket `content-thumbnails` (public) |
| `src/app/api/marcom/drive/upload/route.ts` | Edit | Add Sharp thumbnail generation + Supabase Storage upload |
| `src/app/api/marcom/drive/finalize/route.ts` | Edit | Accept and pass `thumbnailUrl` to `buildDriveAttachment` |
| `src/lib/marcom/driveUploadHelpers.ts` | Edit | Add `thumbnailUrl?` to `BuildDriveAttachmentParams` and return value |
| `src/lib/marcom/useDirectDriveUpload.ts` | Edit | Pass `thumbnailUrl` from upload response → finalize body |
| `src/components/views/ContentPlannerView/ContentPlannerView.tsx` | Edit | Add `thumbnailUrl` as first branch in card thumbnail renderer |
| `src/components/views/ContentPlannerView/ContentDrawer.tsx` | Edit | Add "Jadikan Cover" button on non-first attachment rows |

No new npm packages. No DB/schema changes. No new API routes.

---

## Phase 0 — Manual Pre-requisite (Dashboard)

**Do this before writing any code.**

1. Open Supabase Dashboard → **Storage** → **New Bucket**
2. Name: `content-thumbnails`
3. Public: **Yes**
4. File size limit: 5 MB
5. Allowed MIME types: `image/webp`
6. Save

Verify the public URL pattern works:
```
https://kkstcawepmqenghaqxzt.supabase.co/storage/v1/object/public/content-thumbnails/test
```
Should return 404 (not 401/403) — confirms bucket is public.

---

## Phase 1 — `driveUploadHelpers.ts` — Add `thumbnailUrl` to attachment builder

**File:** `src/lib/marcom/driveUploadHelpers.ts`

**Step 1A** — Add `thumbnailUrl?` to `BuildDriveAttachmentParams` interface:

```ts
// BEFORE:
export interface BuildDriveAttachmentParams {
  fileId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

// AFTER:
export interface BuildDriveAttachmentParams {
  fileId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  thumbnailUrl?: string;
}
```

**Step 1B** — Set `thumbnailUrl` in the returned object inside `buildDriveAttachment()`:

```ts
// BEFORE (return statement):
return {
  id: generateAttachmentId(),
  name: cleanName,
  sizeBytes: sizeBytes >= 0 ? sizeBytes : 0,
  type,
  url: `https://drive.google.com/file/d/${fileId}/view`,
  embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
  source: "gdrive",
  driveFileId: fileId,
  uploadedAt: new Date().toISOString(),
};

// AFTER:
return {
  id: generateAttachmentId(),
  name: cleanName,
  sizeBytes: sizeBytes >= 0 ? sizeBytes : 0,
  type,
  url: `https://drive.google.com/file/d/${fileId}/view`,
  embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
  source: "gdrive",
  driveFileId: fileId,
  uploadedAt: new Date().toISOString(),
  thumbnailUrl: params.thumbnailUrl,
};
```

**Verify:** `npx tsc --noEmit` → 0 errors

---

## Phase 2 — `finalize/route.ts` — Accept and pass `thumbnailUrl`

**File:** `src/app/api/marcom/drive/finalize/route.ts`

**Step 2A** — Read `thumbnailUrl` from request body (add after existing `sizeBytes` read):

```ts
// After:
const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : 0;

// Add:
const thumbnailUrl = typeof body.thumbnailUrl === "string" && body.thumbnailUrl.trim()
  ? body.thumbnailUrl.trim()
  : undefined;
```

**Step 2B** — Pass `thumbnailUrl` to `buildDriveAttachment`:

```ts
// BEFORE:
const attachment = buildDriveAttachment({
  fileId,
  name,
  mimeType,
  sizeBytes,
});

// AFTER:
const attachment = buildDriveAttachment({
  fileId,
  name,
  mimeType,
  sizeBytes,
  thumbnailUrl,
});
```

**Verify:** `npx tsc --noEmit` → 0 errors

---

## Phase 3 — `useDirectDriveUpload.ts` — Thread `thumbnailUrl` through client hook

**File:** `src/lib/marcom/useDirectDriveUpload.ts`

**Step 3A** — Capture `thumbnailUrl` from upload response (after `const fileId = uploadData.fileId`):

```ts
// After:
const fileId = uploadData.fileId;

// Add:
const thumbnailUrl = typeof uploadData.thumbnailUrl === "string"
  ? uploadData.thumbnailUrl
  : undefined;
```

**Step 3B** — Include `thumbnailUrl` in the finalize request body:

```ts
// BEFORE:
body: JSON.stringify({
  fileId,
  name: file.name,
  mimeType: file.type || "application/octet-stream",
  sizeBytes: file.size,
}),

// AFTER:
body: JSON.stringify({
  fileId,
  name: file.name,
  mimeType: file.type || "application/octet-stream",
  sizeBytes: file.size,
  thumbnailUrl,
}),
```

Note: `JSON.stringify` silently omits `undefined` values — so when `thumbnailUrl` is `undefined` (video/PDF), nothing changes in the finalize request body.

**Verify after Phase 3:** `npx tsc --noEmit` → 0 errors

---

## Phase 4 — `drive/upload/route.ts` — Sharp generation + Supabase Storage upload

**File:** `src/app/api/marcom/drive/upload/route.ts`

**Step 4A** — Add `sharp` import at the top of the file (after existing imports):

```ts
import sharp from "sharp";
```

**Step 4B** — Add constant after imports, before the `POST` export:

```ts
const COMPRESSIBLE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
```

**Step 4C** — Add the `generateAndUploadThumbnail` helper function directly before the `POST` export:

```ts
async function generateAndUploadThumbnail(
  fileBuffer: Buffer,
  mimeType: string,
  fileId: string,
  userId: string,
): Promise<string | undefined> {
  if (!COMPRESSIBLE_IMAGE_TYPES.has(mimeType.toLowerCase())) {
    return undefined;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("[Thumbnail] Supabase env vars not set — skipping thumbnail");
    return undefined;
  }

  try {
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    const storagePath = `thumbnails/${userId}/${fileId}.webp`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/content-thumbnails/${storagePath}`;

    const storageRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000",
        "x-upsert": "true",
      },
      body: thumbnailBuffer,
    });

    if (!storageRes.ok) {
      const errText = await storageRes.text().catch(() => "");
      console.warn("[Thumbnail] Supabase Storage upload failed:", storageRes.status, errText);
      return undefined;
    }

    return `${supabaseUrl}/storage/v1/object/public/content-thumbnails/${storagePath}`;
  } catch (err) {
    console.warn("[Thumbnail] Generation failed — skipping:", err);
    return undefined;
  }
}
```

**Step 4D** — Call the helper after Drive upload succeeds and before the return.

Find the existing return at the end of the `POST` handler:
```ts
return NextResponse.json({
  success: true,
  fileId,
  name,
});
```

Replace with:
```ts
const userId = session.user.id;
const thumbnailUrl = await generateAndUploadThumbnail(
  fileBuffer,
  mimeType,
  fileId,
  userId,
);

return NextResponse.json({
  success: true,
  fileId,
  name,
  thumbnailUrl,
});
```

**Verify after Phase 4:** `npx tsc --noEmit` → 0 errors

---

## Phase 5 — `ContentPlannerView.tsx` — Render thumbnail on card

**File:** `src/components/views/ContentPlannerView/ContentPlannerView.tsx`

**Step 5A** — Inside the card thumbnail IIFE (the `{(() => { ... })()}` block around line 660), add a new **first branch** before the existing `if (parsedDrive.isValid)` check:

```ts
// Add at the very top of the IIFE, before existing checks:
const coverAttachment = post.mediaAttachments?.[0];
const coverThumbnailUrl = coverAttachment?.thumbnailUrl;

if (coverThumbnailUrl) {
  return (
    <div className="relative w-full h-full bg-slate-100 dark:bg-slate-900">
      <AppImage
        src={coverThumbnailUrl}
        alt={post.title}
        fill
        sizes="card"
        className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-black/20 group-hover/media:bg-black/0 transition-colors flex items-center justify-center opacity-0 group-hover/media:opacity-100">
        <span className="px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-medium backdrop-blur-xs flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Preview
        </span>
      </div>
    </div>
  );
}
// ... existing parsedDrive.isValid branch unchanged below
```

**Verify after Phase 5:** `npx tsc --noEmit` → 0 errors

---

## Phase 6 — `ContentDrawer.tsx` — "Jadikan Cover" button

**File:** `src/components/views/ContentPlannerView/ContentDrawer.tsx`

In the attachment list map (around line 686), each row currently has a "Cover" badge on index 0 and a remove `×` button on all rows. Add a "Cover" action button on non-first rows, **before the existing `×` button**:

```tsx
{/* Cover button — only shown on non-first items */}
{i !== 0 && (
  <button
    type="button"
    onClick={() => {
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

When clicked: the chosen item moves to index 0 → the "COVER" badge appears on it → `mediaUrl` updates to its URL → on "Simpan Perubahan" the new cover (and its `thumbnailUrl`) becomes the post's card thumbnail.

**Verify after Phase 6:** `npx tsc --noEmit` → 0 errors

---

## Final Checklist

```
Phase 0 — Pre-requisite
[ ] Create bucket "content-thumbnails" in Supabase Dashboard (public, image/webp)
[ ] Verify public URL returns 404 not 403

Phase 1 — driveUploadHelpers.ts
[ ] Add thumbnailUrl? to BuildDriveAttachmentParams
[ ] Set thumbnailUrl in buildDriveAttachment() return object
[ ] npx tsc --noEmit → 0 errors

Phase 2 — finalize/route.ts
[ ] Read thumbnailUrl from request body
[ ] Pass thumbnailUrl to buildDriveAttachment()
[ ] npx tsc --noEmit → 0 errors

Phase 3 — useDirectDriveUpload.ts
[ ] Capture thumbnailUrl from upload response
[ ] Include thumbnailUrl in finalize request body
[ ] npx tsc --noEmit → 0 errors

Phase 4 — drive/upload/route.ts
[ ] Add sharp import
[ ] Add COMPRESSIBLE_IMAGE_TYPES constant
[ ] Add generateAndUploadThumbnail() helper
[ ] Call helper after Drive upload, pass thumbnailUrl in response
[ ] npx tsc --noEmit → 0 errors

Phase 5 — ContentPlannerView.tsx
[ ] Add coverThumbnailUrl first branch in card thumbnail IIFE
[ ] npx tsc --noEmit → 0 errors

Phase 6 — ContentDrawer.tsx
[ ] Add "Jadikan Cover" button on non-first attachment rows
[ ] npx tsc --noEmit → 0 errors

Final
[ ] npm test → 0 failures
[ ] npm run build:check → 0 errors
[ ] Manual test:
    → Upload JPEG image via ContentDrawer
    → Check server log: "[Thumbnail]" entries (no errors)
    → Save post → card thumbnail shows real image (not dark placeholder)
    → Upload second image → "Jadikan Cover" button appears on row 2
    → Click "Jadikan Cover" → row 2 becomes row 1 with COVER badge
    → Save → card thumbnail updates to new cover image
    → Upload PDF/video → no thumbnail generated (placeholder shown) ✓
    → Existing posts without thumbnailUrl → placeholder unchanged ✓
```

---

## Risk

| Risk | Mitigation |
|---|---|
| Supabase bucket not created | Phase 0 is a pre-requisite — `generateAndUploadThumbnail` returns `undefined` gracefully if bucket missing (403 → logged as warning, upload still completes) |
| Sharp unavailable in Vercel Edge runtime | Route uses Node.js runtime (default for App Router API routes) — Sharp works fine. Do NOT add `export const runtime = "edge"` to this route |
| `session.user.id` undefined | Already checked by `if (!session?.user?.id)` guard at top of route — will 401 before reaching thumbnail code |
| Large image Sharp OOM | 800px max dimension means max ~2 MB canvas — well within Vercel 1024 MB limit |
| Thumbnail URL stored but Supabase file deleted | `thumbnailUrl` becomes a broken image — falls back to `<AppImage>` 404 behaviour (empty space). Acceptable edge case |
