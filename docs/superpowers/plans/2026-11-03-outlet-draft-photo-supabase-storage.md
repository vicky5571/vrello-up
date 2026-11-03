# Plan — Outlet Draft Photo: Supabase Storage Migration

**Status:** ✅ Executed  
**Date:** 2026-11-03  
**ADR:** `docs/adr/0020-outlet-draft-photo-supabase-storage.md`  
**Spec:** `docs/superpowers/specs/2026-11-03-outlet-draft-photo-supabase-storage.md`

---

## Prerequisite — ADR-0019 (✅ ALREADY SATISFIED)

This plan was originally blocked on `docs/superpowers/plans/2026-11-03-migrate-filesystem-uploads-to-supabase-storage.md`. **That work has shipped** (commit `ab12035`). Verified 2026-11-03:

| Requirement | Verified state |
|---|---|
| `src/lib/server/supabaseStorage.ts` with `uploadToSupabase()` | ✅ Exists |
| `/api/marcom/uploads` rewritten to Supabase Storage | ✅ Imports `uploadToSupabase`, uses `BUCKET_MAP` / `KIND_PREFIX` / `PERMISSION_MAP` |
| `mouApi.ts` sends `kind: "mou-documents"` | ✅ Line 70 |
| `uploadsApi.test.ts` forbids `writeFile` | ✅ Present |

No prerequisite work remains. Start at Phase 0.

> Note: the shipped helper uses `POST` with `x-upsert: true` (not `PUT` as originally sketched). Follow the shipped signature — `uploadToSupabase(bucket, storagePath, buffer, mimeType)`.

---

## Phase 0 — Supabase Bucket (Manual)

**Dashboard:** https://supabase.com/dashboard/project/kkstcawepmqenghaqxzt/storage/buckets

Buckets verified to already exist (do not recreate): `content-thumbnails`, `mou-documents`, `marcom-documents`, `placement-photos`.

The only missing bucket:

| Setting | Value |
|---|---|
| Bucket name | `outlet-photos` |
| Public bucket | ✅ Yes |
| File size limit | 25 MB |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |

Storage path convention:
```
outlet-photos/outlets/{branchId}/{uuid}-{sanitizedFilename}
```

`branchId` is used instead of a user id because `requireMember()` returns only a role (`"admin"` stub), not a user id. The branch is known at submit time and gives the bucket a meaningful hierarchy.

**Checklist:**
```
[ ] Create public bucket "outlet-photos" (25 MB limit)
[ ] Confirm 5 buckets total in Dashboard → Storage
```

---

## Phase 1 — Add `outlets` Kind to `/api/marcom/uploads`

**File:** `src/app/api/marcom/uploads/route.ts` (current shipped version, 119 lines)

Eight one-line additions across four maps — no other changes:

```typescript
// line 12
const VALID_KINDS = ["documents", "mou-documents", "placements", "outlets"] as const;

// line 15
const BUCKET_MAP: Record<UploadKind, string> = {
  documents: "marcom-documents",
  "mou-documents": "mou-documents",
  placements: "placement-photos",
  outlets: "outlet-photos",          // ← new
};

// line 21
const KIND_PREFIX: Record<UploadKind, string> = {
  documents: "documents",
  "mou-documents": "mou-documents",
  placements: "placements",
  outlets: "outlets",                // ← new
};

// line 27
const PERMISSION_MAP: Record<UploadKind, string> = {
  documents: "UPLOAD_DOCUMENT",
  "mou-documents": "UPLOAD_DOCUMENT",
  placements: "CREATE_PLACEMENT",
  outlets: "SUBMIT_DRAFT_OUTLET",    // ← new
};
```

Also update the 400 error message at line 68:
```typescript
{ error: "Invalid kind: expected documents, mou-documents, placements, or outlets" },
```

**No other change to this file.** `UploadKind` widens automatically from `VALID_KINDS`.

**Checklist:**
```
[ ] Add "outlets" to VALID_KINDS (line 12)
[ ] Add outlets → "outlet-photos" in BUCKET_MAP (line 15)
[ ] Add outlets → "outlets" in KIND_PREFIX (line 21)
[ ] Add outlets → "SUBMIT_DRAFT_OUTLET" in PERMISSION_MAP (line 27)
[ ] Update the invalid-kind error message (line 68)
[ ] npx tsc --noEmit → 0 errors
[ ] Confirm uploadsApi.test.ts still passes — it asserts presence only (no exclusivity), so adding "outlets" cannot break it. Optionally extend it to assert the outlets → outlet-photos mapping.
```

---

## Phase 2 — Modal State + Format Guard

**File:** `src/components/views/OutletsView/SubmitDraftOutletModal.tsx`

### 2a. Add state

```tsx
const [errors, setErrors] = useState<Record<string, string>>({});
const [isLocating, setIsLocating] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const [photoFile, setPhotoFile] = useState<File | null>(null);           // ← new
const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);         // ← new
```

### 2b. Replace `handleFileChange`

Current implementation (lines 102–121) reads the file, compresses it, and converts to a data URL. Replace with:

```tsx
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const rawFile = e.target.files?.[0];
  if (!rawFile) return;

  // Reject formats that cannot be compressed or rendered consistently.
  // iOS may hand us image/heic for accept="image/*" — that would bypass
  // compression and produce a multi-MB payload.
  if (rawFile.type && !ALLOWED_PHOTO_TYPES.has(rawFile.type.toLowerCase())) {
    toast.error("Format foto tidak didukung. Gunakan JPG, PNG, atau WebP.");
    e.target.value = "";
    return;
  }

  // Optimasi ukuran foto kamera (8-15MB -> ~500KB) sebelum diunggah
  const file = await compressImageFile(rawFile);
  setPhotoFile(file);

  // Local preview only — this data URL is never transmitted to the server
  const reader = new FileReader();
  reader.onload = (event) => {
    const dataUrl = event.target?.result as string;
    setFormData((prev) => ({ ...prev, photoUrl: dataUrl }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.photoUrl;
      return next;
    });
  };
  reader.readAsDataURL(file);
};
```

**What stays identical:** `compressImageFile(rawFile)`, `FileReader.readAsDataURL`, the `setFormData` preview assignment, clearing the `photoUrl` error.

**What is new:** the type guard, `setPhotoFile(file)`, and `e.target.value = ""` on rejection.

**Checklist:**
```
[ ] Add photoFile and isUploadingPhoto state
[ ] Add ALLOWED_PHOTO_TYPES set (module scope, outside component)
[ ] Add format guard at the top of handleFileChange
[ ] Call setPhotoFile(file) after compression
[ ] npx tsc --noEmit → 0 errors
```

---

## Phase 3 — Upload Before Create

### 3a. Insert the upload step into `handleSubmit`

Current (lines 123–163):

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const validation = validateDraftForm(formData);
  if (!validation.isValid) {
    setErrors(validation.errors);
    toast.error("Mohon lengkapi seluruh data wajib pengajuan outlet baru.");
    return;
  }

  setIsSubmitting(true);
  try {
    const payload = buildDraftSubmissionPayload(formData);
    const res = await fetch("/api/marcom/outlets/draft", { ... });
```

New:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const validation = validateDraftForm(formData);
  if (!validation.isValid) {
    setErrors(validation.errors);
    toast.error("Mohon lengkapi seluruh data wajib pengajuan outlet baru.");
    return;
  }

  setIsSubmitting(true);
  try {
    let uploadedPhotoUrl = formData.photoUrl.trim();

    // Upload the compressed file to Supabase Storage before creating the record.
    if (photoFile) {
      setIsUploadingPhoto(true);
      const fd = new FormData();
      fd.append("kind", "outlets");
      fd.append("id", formData.branchId);
      fd.append("file", photoFile);

      const uploadRes = await fetch("/api/marcom/uploads", {
        method: "POST",
        body: fd,
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json().catch(() => ({}));
        throw new Error(
          uploadErr.error || `Gagal mengunggah foto (${uploadRes.status})`,
        );
      }

      const uploadData = await uploadRes.json();
      uploadedPhotoUrl = uploadData.filePath as string;
      setIsUploadingPhoto(false);
    }

    // Safety net: a data:/blob: URL must never reach the database.
    if (uploadedPhotoUrl.startsWith("data:") || uploadedPhotoUrl.startsWith("blob:")) {
      throw new Error("Foto belum selesai diunggah. Silakan coba lagi.");
    }

    const payload = buildDraftSubmissionPayload({
      ...formData,
      photoUrl: uploadedPhotoUrl,
    });
    const res = await fetch("/api/marcom/outlets/draft", { ... });
```

Everything after `const res = await fetch("/api/marcom/outlets/draft"` is **unchanged**.

### 3b. Ensure `isUploadingPhoto` resets on failure

The existing `finally` block already resets `isSubmitting`. Add the photo flag there:

```tsx
} finally {
  setIsUploadingPhoto(false);
  setIsSubmitting(false);
}
```

### 3c. Submit button label

Show upload progress before "Mengirim Pengajuan...":

```tsx
{isSubmitting ? (
  <>
    <Loader2 className="w-3.5 h-3.5 animate-spin" />
    <span>{isUploadingPhoto ? "Mengunggah Foto..." : "Mengirim Pengajuan..."}</span>
  </>
) : ( ... )}
```

**Checklist:**
```
[ ] Add upload step before buildDraftSubmissionPayload
[ ] Add data:/blob: safety net
[ ] Pass { ...formData, photoUrl: uploadedPhotoUrl } to buildDraftSubmissionPayload
[ ] Reset isUploadingPhoto in finally
[ ] Update submit button label
[ ] npx tsc --noEmit → 0 errors
```

---

## Phase 4 — Interaction Cleanup

Two places mutate `photoUrl` and must also clear `photoFile`, otherwise a stale file could be upload-boosted over a user's explicit choice.

### 4a. Remove-photo button (line 413)

```tsx
// BEFORE:
onClick={() => setFormData((prev) => ({ ...prev, photoUrl: "" }))}

// AFTER:
onClick={() => {
  setPhotoFile(null);
  setFormData((prev) => ({ ...prev, photoUrl: "" }));
}}
```

### 4b. Manual URL input (lines 394–397)

If the user pastes a URL after picking a file, the pasted URL wins:

```tsx
// BEFORE:
onChange={(e) => {
  setFormData((prev) => ({ ...prev, photoUrl: e.target.value }));
  if (errors.photoUrl) setErrors((prev) => ({ ...prev, photoUrl: "" }));
}}

// AFTER:
onChange={(e) => {
  setPhotoFile(null);
  setFormData((prev) => ({ ...prev, photoUrl: e.target.value }));
  if (errors.photoUrl) setErrors((prev) => ({ ...prev, photoUrl: "" }));
}}
```

### 4c. Modal reset on open

`useEffect` currently resets `formData.name`, `branchId`, and `errors`. Add:

```tsx
setPhotoFile(null);
setIsUploadingPhoto(false);
```

Without this, closing and reopening the modal could carry a previously selected file into a new submission.

**Checklist:**
```
[ ] Clear photoFile in remove-photo onClick
[ ] Clear photoFile in manual URL onChange
[ ] Reset photoFile + isUploadingPhoto in the isOpen useEffect
[ ] npx tsc --noEmit → 0 errors
```

---

## Phase 5 — Verification

### 5a. Type check and tests

```bash
npx tsc --noEmit
npm test
```

Expected: 0 TypeScript errors, 0 test failures.

`draftOutletHelpers.test.ts` uses `photoUrl: "https://example.com/storefront.jpg"` — unaffected by this change, since the payload contract is unchanged.

### 5b. Manual test matrix

| # | Scenario | Expected |
|---|---|---|
| 1 | Fill all fields, pick a JPG, submit | Photo uploads → CDN URL saved → outlet created → toast success |
| 2 | Pick a JPG, then click ✕ to remove, pick another JPG, submit | Only the second photo is uploaded |
| 3 | Pick a JPG, then paste a `https://` URL, submit | Pasted URL saved; the file is **not** uploaded |
| 4 | Paste a `https://` URL without picking a file, submit | No upload request; URL saved as-is |
| 5 | Pick a HEIC file | Toast "Format foto tidak didukung..." — no crash, input cleared |
| 6 | Submit with no photo | Field error "Foto tampak depan toko wajib..." — unchanged |
| 7 | Abort the network mid-upload (devtools throttle) | Error toast, no outlet created |
| 8 | Approve the draft in the approval queue | Photo thumbnail renders from the CDN URL |
| 9 | Click the thumbnail in the approval queue | Enlarged photo renders from the CDN URL |
| 10 | Open the modal twice in a row | Second open starts with no photo selected |

### 5c. Verify the DB actually holds a URL

```sql
SELECT id, code, name, LEFT("photoUrl", 60) AS photo_prefix, LENGTH("photoUrl") AS url_len
FROM "Outlet"
WHERE status = 'PENDING_APPROVAL'
ORDER BY "createdAt" DESC
LIMIT 10;
```

Expected: `photo_prefix` starts with `https://` and `url_len` is well under 300. If any row starts with `data:` after a fresh submission, the upload step was skipped — inspect `photoFile` state handling.

**Checklist:**
```
[ ] npx tsc --noEmit → 0 errors
[ ] npm test → 0 failures
[ ] Manual scenarios 1–10 pass
[ ] DB query confirms https:// prefix and short length
[ ] Supabase Dashboard → Storage → outlet-photos → file present
```

---

## Phase 6 — Optional Backfill of Existing Base64 Rows

**Only run this if the live database already contains draft outlets with `photoUrl LIKE 'data:%'`.**

```sql
SELECT COUNT(*) FROM "Outlet" WHERE "photoUrl" LIKE 'data:%';
SELECT COUNT(*), pg_size_pretty(SUM(LENGTH("photoUrl"))::bigint) AS total_photo_bytes
FROM "Outlet" WHERE "photoUrl" LIKE 'data:%';
```

If the count is zero — skip this phase entirely.

Otherwise write a **one-off script** (not part of the app runtime) that:
1. Selects `id, photoUrl` for rows matching `data:%`
2. Decodes the base64 payload to a `Buffer`
3. Calls `uploadToSupabase("outlet-photos", `outlets/backfill/${id}.jpg`, buffer, "image/jpeg")`
4. Updates the row's `photoUrl` to the returned `publicUrl`
5. Logs each migration and is safe to re-run (idempotent by `id`)

⚠️ Mark clearly: this is a maintenance script, **not** an API route. Do not ship it as an endpoint.

**Checklist (only if applicable):**
```
[ ] Count base64 rows — if 0, stop
[ ] Write scripts/backfill-outlet-photos.ts
[ ] Dry run on a single row
[ ] Run on all rows
[ ] Re-run to confirm idempotency
[ ] Verify count of LIKE 'data:%' is 0
```

---

## Rollback

| Step | Action |
|---|---|
| Revert the modal | Restore `SubmitDraftOutletModal.tsx` — the data URL flow returns intact |
| Revert the route | Remove the four `"outlets"` map entries |
| Data | Already-migrated rows keep working — `https://` URLs render fine with the old code |
| Bucket | Leave `outlet-photos` in place; unused objects are harmless |

The change is forward- and backward-compatible: the old client and new client both produce values that `Outlet.photoUrl` accepts, and `AppImage` renders both `data:` and `https://`.

---

## Files Changed

| File | Type | Description |
|---|---|---|
| `src/app/api/marcom/uploads/route.ts` | 4 map entries | Add `outlets` kind → `outlet-photos` bucket |
| `src/components/views/OutletsView/SubmitDraftOutletModal.tsx` | Modify | `photoFile` state, format guard, upload-before-create, cleanup |

**Files NOT changed:**

| File | Reason |
|---|---|
| `prisma/schema.prisma` | `Outlet.photoUrl` is already `String` |
| `src/app/api/marcom/outlets/draft/route.ts` | JSON contract unchanged |
| `src/app/api/marcom/outlets/draft/draftOutletHelpers.ts` | `photoUrl` stays a trimmed string |
| `src/components/views/OutletsView/submitDraftOutletHelpers.ts` | `validateDraftForm` / `buildDraftSubmissionPayload` unchanged |
| `src/components/views/OutletsView/OutletApprovalQueueTab.tsx` | `AppImage` already renders Supabase URLs |
| `src/components/ui/AppImage.tsx` / `appImageHelpers.ts` | `supabase.co` already whitelisted |
| `next.config.ts` | `*.supabase.co` already in `remotePatterns` |
| `src/lib/marcom/imageCompression.ts` | Compression logic untouched |
| `src/app/api/marcom/outlets/route.ts` | No `select` change required |

---

## Risks & Dependencies

### Dependencies (all satisfied)

| Dependency | Source | Verified |
|---|---|---|
| `uploadToSupabase()` helper | ADR-0019 Phase 1 | ✅ `src/lib/server/supabaseStorage.ts` |
| `/api/marcom/uploads` with map-based kinds | ADR-0019 Phase 2 | ✅ `BUCKET_MAP` present |
| `outlet-photos` bucket | Supabase dashboard | ❌ **Still to create (Phase 0)** |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Starting before ADR-0019 is executed | ~~Medium~~ **N/A** | — | Resolved — ADR-0019 shipped in `ab12035` |
| Orphan objects on failed record creation | Medium | Low | Accept; add a cleanup job later |
| Forgetting to clear `photoFile` on manual URL paste | Medium | Uploads a file the user did not intend to submit | Phase 4b is mandatory, not optional |
| Forgetting to reset state on modal reopen | Medium | Stale file from a previous submission gets uploaded | Phase 4c is mandatory |
| HEIC rejected where JPEG was previously accepted | Low | UX friction | Clear toast naming supported formats |
| Double-charging uploads if user retries after a create failure | Low | Duplicate objects | Filenames are UUID-prefixed; duplicates are harmless |

---

## Estimated Effort

| Phase | Effort |
|---|---|
| Phase 0 (bucket) | 2 min |
| Phase 1 (route maps) | 5 min |
| Phase 2 (state + guard) | 10 min |
| Phase 3 (submit sequence) | 10 min |
| Phase 4 (cleanup) | 5 min |
| Phase 5 (verification) | 15 min |
| Phase 6 (optional backfill) | 30 min, only if base64 rows exist |
| **Total (without Phase 6)** | **~45 min** |

---

## Execution Order

```
Phase 0 (manual bucket)
   ↓
Phase 1 (route: add "outlets" kind)
   ↓
Phase 2 (modal state + HEIC guard)
   ↓
Phase 3 (upload before create)
   ↓
Phase 4 (clear photoFile on remove / paste / reopen)
   ↓
Phase 5 (tsc + tests + 10 manual scenarios)
   ↓
Phase 6 (optional, only if data: rows exist)
```
