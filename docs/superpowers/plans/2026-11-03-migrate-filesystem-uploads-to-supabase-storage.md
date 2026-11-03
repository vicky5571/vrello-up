# Plan — Migrate Filesystem Uploads to Supabase Storage

**Status:** ✅ Executed (commit `ab12035`, 2026-11-03 — all phases complete, 748 tests passing)  
**Date:** 2026-11-03  
**ADR:** `docs/adr/0019-migrate-filesystem-uploads-to-supabase-storage.md`  
**Spec:** `docs/superpowers/specs/2026-11-03-migrate-filesystem-uploads-to-supabase-storage.md`  
**Estimated time:** 45–60 minutes  
**Risk:** Low — API contract unchanged from caller's perspective; only the server-side storage backend changes

---

## Prerequisites (Manual — Supabase Dashboard)

Before executing any code changes, create these three buckets in the Supabase Dashboard at:  
**https://supabase.com/dashboard/project/kkstcawepmqenghaqxzt/storage/buckets**

| Bucket name | Public | File size limit |
|---|---|---|
| `mou-documents` | ✅ Yes | 25 MB |
| `marcom-documents` | ✅ Yes | 25 MB |
| `placement-photos` | ✅ Yes | 25 MB |

**How to create each bucket:**
1. Click "New bucket"
2. Enter bucket name exactly as above
3. Toggle "Public bucket" to ON
4. Leave everything else default
5. Click "Save"

⚠️ **Do not proceed to code execution until all three buckets exist.** The route will return 400/500 on the first upload attempt if the bucket doesn't exist.

---

## Phase 1 — Shared Helper

**File:** `src/lib/server/supabaseStorage.ts` (new file)

```typescript
/**
 * Shared helper for server-side Supabase Storage uploads via REST API.
 * Uses fetch — no @supabase/supabase-js SDK required.
 */

export interface SupabaseUploadResult {
  publicUrl: string;
}

export async function uploadToSupabase(
  bucket: string,
  storagePath: string,
  buffer: Buffer,
  mimeType: string,
): Promise<SupabaseUploadResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase env vars not configured (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  }

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${storagePath}`;

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": mimeType,
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Supabase Storage upload failed: ${res.status} ${errText}`);
  }

  return {
    publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`,
  };
}
```

**Checklist:**
```
[ ] Create src/lib/server/supabaseStorage.ts with above content
[ ] npx tsc --noEmit → 0 errors
```

---

## Phase 2 — Rewrite `/api/marcom/uploads/route.ts`

**File:** `src/app/api/marcom/uploads/route.ts`

Replace the entire file with the following:

```typescript
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireMember } from "@/lib/marcom/auth";
import { hasPermission } from "@/lib/marcom/guards";
import {
  MAX_UPLOAD_BYTES,
  sanitizeFilename,
  validateUpload,
} from "@/lib/marcom/upload";
import { uploadToSupabase } from "@/lib/server/supabaseStorage";

const VALID_KINDS = ["documents", "mou-documents", "placements"] as const;
type UploadKind = (typeof VALID_KINDS)[number];

const BUCKET_MAP: Record<UploadKind, string> = {
  "documents": "marcom-documents",
  "mou-documents": "mou-documents",
  "placements": "placement-photos",
};

const KIND_PREFIX: Record<UploadKind, string> = {
  "documents": "documents",
  "mou-documents": "mou-documents",
  "placements": "placements",
};

const PERMISSION_MAP: Record<UploadKind, string> = {
  "documents": "UPLOAD_DOCUMENT",
  "mou-documents": "UPLOAD_DOCUMENT",
  "placements": "CREATE_PLACEMENT",
};

// Derive MIME type from file extension for storage Content-Type header
const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
};

export async function POST(request: Request) {
  let role;
  try {
    role = await requireMember();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const kind = form.get("kind");
  const id = form.get("id");
  const file = form.get("file");

  if (
    typeof kind !== "string" ||
    !(VALID_KINDS as readonly string[]).includes(kind)
  ) {
    return NextResponse.json(
      { error: "Invalid kind: expected documents, mou-documents, or placements" },
      { status: 400 },
    );
  }

  const uploadKind = kind as UploadKind;

  if (typeof id !== "string" || !id || id.includes("..") || id.includes("/") || id.includes("\\")) {
    return NextResponse.json({ error: "Missing or invalid field: id" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing required field: file" }, { status: 400 });
  }

  if (!hasPermission(role, PERMISSION_MAP[uploadKind] as Parameters<typeof hasPermission>[1])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const validation = validateUpload({ filename: file.name, sizeBytes: file.size });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 400 });
  }

  const stored = `${randomUUID()}-${sanitizeFilename(file.name)}`;
  const storagePath = `${KIND_PREFIX[uploadKind]}/${id}/${stored}`;
  const bucket = BUCKET_MAP[uploadKind];

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = file.type || EXT_TO_MIME[ext] || "application/octet-stream";

  try {
    const { publicUrl } = await uploadToSupabase(bucket, storagePath, bytes, mimeType);
    return NextResponse.json(
      {
        filePath: publicUrl,
        filename: stored,
        originalName: file.name,
        sizeBytes: file.size,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Storage upload failed";
    console.error("[/api/marcom/uploads] Storage error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**What changed vs original:**
- Removed: `mkdir`, `writeFile`, `path` imports
- Removed: `getUploadRootDir`, `resolveUploadPath` imports
- Added: `uploadToSupabase` import
- Added: `"mou-documents"` to `VALID_KINDS`
- Added: `BUCKET_MAP`, `KIND_PREFIX`, `PERMISSION_MAP`, `EXT_TO_MIME` lookup tables
- Replaced: `mkdir + writeFile` with `uploadToSupabase`
- Changed: `filePath` in response from `/api/marcom/files/...` to Supabase CDN URL

**What is unchanged:**
- Auth guard
- Request parsing
- `validateUpload()` logic
- `sanitizeFilename()` call
- `randomUUID()` usage
- Response JSON shape `{ filePath, filename, originalName, sizeBytes }`
- Error response shape `{ error: "..." }`
- HTTP status codes

**Checklist:**
```
[ ] Replace src/app/api/marcom/uploads/route.ts with above content
[ ] npx tsc --noEmit → 0 errors
```

---

## Phase 3 — Update `mouApi.ts`

**File:** `src/components/views/MousView/mouApi.ts`

One line change in `uploadMouDocument`:

```typescript
// BEFORE (line ~73):
fd.append("kind", "documents");

// AFTER:
fd.append("kind", "mou-documents");
```

This routes MOU contracts to the `mou-documents` bucket instead of mixing them with the Documents archive.

**Checklist:**
```
[ ] Change "documents" → "mou-documents" in mouApi.ts uploadMouDocument
[ ] npx tsc --noEmit → 0 errors
```

---

## Phase 4 — Smoke Test (Local)

Run the dev server and test each feature:

### 4a. MOUs — document upload
1. Open MOUs view → open any MOU for edit (or create new)
2. Upload a PDF or image file as the MOU document
3. ✅ Upload completes without error
4. ✅ `docPath` in the saved MOU record is a `https://...supabase.co/...` URL
5. ✅ File renders/downloads correctly (click the document link)
6. Check Supabase Dashboard → Storage → `mou-documents` bucket → file appears

### 4b. Documents — archive upload
1. Open Documents view → create new document → click file upload
2. Upload a PDF
3. ✅ Upload completes without error
4. ✅ `filePath` in form is a `https://...supabase.co/...` URL
5. ✅ `isValidDocumentFilePath(filePath)` accepts the URL (already handles `https://`)
6. Save document → ✅ Saved to DB with Supabase URL
7. Check Supabase Dashboard → Storage → `marcom-documents` bucket → file appears

### 4c. Placements — proof photo upload
1. Open Placements view → open a placement for edit
2. Take or select a photo via "Ambil Foto (Kamera)" or "Pilih dari Galeri"
3. ✅ Upload completes without error
4. ✅ Photo appears in the placement's photo list
5. ✅ `photoUrl` in the saved placement is a `https://...supabase.co/...` URL
6. Check Supabase Dashboard → Storage → `placement-photos` bucket → file appears

### 4d. Backward compat — existing rows
1. Find an existing MOU/Document row that has `filePath = "/api/marcom/files/..."`
2. ✅ The old `GET /api/marcom/files` route still serves it (in local dev where files exist)
3. ✅ No 500 error on page load

**Checklist:**
```
[ ] MOU document upload → Supabase URL ✓, file visible in dashboard ✓
[ ] Documents archive upload → Supabase URL ✓, file visible in dashboard ✓
[ ] Placement photo upload → Supabase URL ✓, file visible in dashboard ✓
[ ] Old /api/marcom/files/... rows still render correctly in local dev ✓
```

---

## Phase 5 — TypeScript and Test Verification

```bash
npx tsc --noEmit
npm test
```

**Expected:**
- 0 TypeScript errors
- 0 test failures

The existing `upload.ts` unit tests (if any) test `validateUpload`, `sanitizeFilename`, `isServableFilePath`, `isValidDocumentFilePath` — none of these functions change, so tests remain green.

---

## Rollback Plan

If anything goes wrong, revert `src/app/api/marcom/uploads/route.ts` to the original `fs.writeFile` version. The three callers (`DocumentsView`, `PlacementPhotoUploader`, `mouApi.ts`) are unchanged except for the one-line `kind` fix in `mouApi.ts` — reverting the route file alone is sufficient to restore original behaviour locally.

---

## Files Changed Summary

| File | Change type | Description |
|---|---|---|
| `src/lib/server/supabaseStorage.ts` | **New** | Shared Supabase Storage upload helper |
| `src/app/api/marcom/uploads/route.ts` | **Rewrite** | Replace fs.writeFile with uploadToSupabase |
| `src/components/views/MousView/mouApi.ts` | **1 line** | `"documents"` → `"mou-documents"` |

---

## Files NOT Changed

| File | Reason |
|---|---|
| `src/app/api/marcom/files/[...path]/route.ts` | Kept — backward compat for old rows |
| `src/lib/marcom/upload.ts` | `validateUpload`, `sanitizeFilename` reused; `getUploadRootDir` used by serve route |
| `src/components/views/DocumentsView/DocumentsView.tsx` | Calls `POST /api/marcom/uploads` — route changes underneath |
| `src/components/views/PlacementsView/PlacementPhotoUploader.tsx` | Same |
| `src/components/views/MousView/MouFormModal.tsx` | Calls `uploadMouDocument()` via `mouApi.ts` |
| `src/lib/marcom/documentWorkflow.ts` (isCloudDocumentUrl) | Already handles `https://` |
| `src/lib/marcom/upload.ts` (isValidDocumentFilePath) | Already handles `https://` |
| `src/components/views/DocumentsView/DocumentPreviewModal.tsx` | Uses `isCloudDocumentUrl` — works |
| `src/components/views/DocumentsView/DocumentCardsView.tsx` | Same |
| `next.config.ts` | `*.supabase.co` already in remotePatterns |

---

## Execution Order

```
Phase 0 (Manual): Create 3 buckets in Supabase Dashboard
Phase 1: Create src/lib/server/supabaseStorage.ts
Phase 2: Rewrite src/app/api/marcom/uploads/route.ts
Phase 3: 1-line fix in src/components/views/MousView/mouApi.ts
Phase 4: Smoke test all three features
Phase 5: npx tsc --noEmit && npm test
```

All phases except Phase 0 can be executed in one sitting in about 30 minutes.
