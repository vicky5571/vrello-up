# Spec — Outlet Draft Photo: Supabase Storage Migration

**Status:** Implemented  
**Date:** 2026-11-03  
**ADR:** `docs/adr/0020-outlet-draft-photo-supabase-storage.md`

---

## Problem Statement

The Outlet draft photo is stored as a base64 `data:` URL inside the `Outlet.photoUrl` Postgres column. It works on Vercel (no filesystem dependency), but it causes three concrete problems:

1. **Payload bloat on the hottest read path** — `GET /api/marcom/outlets` has no top-level `select`, so every outlet list response includes every draft outlet's base64 photo. Estimated ~13 MB JSON for 20 pending drafts (estimate: ~650 KB per photo × 20, not measured on live data).
2. **Database quota exhaustion** — ~650 KB per draft row against a ~500 MB Supabase free-tier database.
3. **Latent 413 failure for HEIC photos** — `isCompressibleImage()` skips HEIC, which can produce a JSON body above Vercel's 4.5 MB limit. Inferred from the size arithmetic, not yet reproduced on a device.

The goal is to move the binary out of Postgres and into Supabase Storage, storing only a short CDN URL in `Outlet.photoUrl`.

---

## Goals

| # | Goal | Measure |
|---|---|---|
| G1 | Stop storing image bytes in Postgres | `Outlet.photoUrl` holds a ≤ 250-char URL, never a `data:` URI |
| G2 | Remove base64 payload from outlet list responses | Outlet list response size independent of number of draft photos |
| G3 | Eliminate the HEIC 413 failure | No request body larger than a few KB to `/api/marcom/outlets/draft` |
| G4 | Preserve current UX exactly | Same "Ambil / Upload Foto" button, same instant preview, same manual URL paste field |
| G5 | Reuse existing infrastructure | Same Supabase Storage + `uploadToSupabase` helper as ADR-0019 |

---

## Non-Goals

| Item | Reason |
|---|---|
| Multi-photo support for outlet drafts | Single storefront facade photo by design; multi-file is Placements' concern |
| Image thumbnailing for outlet photos | Single photo per outlet, rendered at ~200–400 px; CDN-served original is acceptable |
| Deleting Supabase objects on outlet rejection | Consistent with ADR-0019 non-goals — future cleanup task |
| Backfilling existing base64 rows | Optional Phase 6 — only if production data exists |
| Changing the approval workflow | Approval flow untouched |
| Changing `Outlet.photoUrl` DB type | `String` already accepts URLs — zero migration |

---

## Current vs Target Flow

### Current

```
File → compressImageFile → FileReader → data: URL → React state
     → JSON body (~650 KB) → POST /api/marcom/outlets/draft
     → prisma.outlet.photoUrl = "data:image/jpeg;base64,..."
```

### Target

```
File → compressImageFile → FileReader → data: URL → React state (PREVIEW ONLY)
                                                    │
        on submit ──────────────────────────────────┘
            ↓
        POST /api/marcom/uploads  (kind: "outlets", multipart)
            ↓
        Supabase Storage  ──►  CDN URL returned
            ↓
        POST /api/marcom/outlets/draft  { photoUrl: "https://...supabase.co/..." }
            ↓
        prisma.outlet.photoUrl = CDN URL (~120 chars)
```

The base64 preview stays in the browser only. It is never transmitted.

---

## Component State Model

The modal needs to distinguish three things that are currently collapsed into one string.

| State | Type | Purpose |
|---|---|---|
| `formData.photoUrl` | `string` | The value that will be **submitted** — either a pasted `https://` URL or the CDN URL returned by upload. Holds the base64 preview during the preview stage (so `validateDraftForm` keeps passing). |
| `photoFile` | `File \| null` | The compressed file awaiting upload. Set when the user picks a file, cleared after successful upload or on removal. |
| `isUploadingPhoto` | `boolean` | Drives the submit button spinner and blocks double-submit. |

**Invariant:** if `photoFile !== null`, `formData.photoUrl` is a preview value and must be replaced before submission. If `photoFile === null`, `formData.photoUrl` is already final (pasted URL, previously uploaded URL, or empty).

---

## Submit Sequence

```
handleSubmit(e)
  │
  ├─ validateDraftForm(formData)        ← unchanged, still passes with preview value
  │     if invalid → show field errors, return
  │
  ├─ setIsSubmitting(true)
  │
  ├─ if (photoFile) {
  │     setIsUploadingPhoto(true)
  │     const fd = new FormData()
  │     fd.append("kind", "outlets")
  │     fd.append("id", formData.branchId)
  │     fd.append("file", photoFile)
  │     POST /api/marcom/uploads
  │       ├─ !ok → toast.error("Gagal mengunggah foto..."), setIsSubmitting(false), return
  │       └─ ok  → photoUrl = json.filePath
  │     setIsUploadingPhoto(false)
  │   }
  │
  ├─ payload = buildDraftSubmissionPayload({ ...formData, photoUrl })
  │     ↳ guard: if photoUrl starts with "data:" or "blob:" → abort with toast
  │
  ├─ POST /api/marcom/outlets/draft   (unchanged JSON contract)
  │
  └─ success → invalidateOutlets(), onSuccess(), onClose()
```

Upload failure is **fatal to the submit** — no outlet record is created with a broken photo reference. This is intentional: `photoUrl` is a required field for approver verification.

---

## API Contract Changes

### `POST /api/marcom/uploads` — new kind

**Added value:** `kind: "outlets"`

| Field | Value |
|---|---|
| `kind` | `"outlets"` |
| `id` | the selected `branchId` (cuid, no `/` or `..`) |
| `file` | the compressed `File` (image/jpeg, image/png, or image/webp) |

**Response 201** (unchanged shape):
```json
{
  "filePath": "https://kkstcawepmqenghaqxzt.supabase.co/storage/v1/object/public/outlet-photos/outlets/clx1b2c3/550e8400-toko-sinar.jpg",
  "filename": "550e8400-toko-sinar.jpg",
  "originalName": "toko-sinar.jpg",
  "sizeBytes": 412000
}
```

**Server-side additions required in `/api/marcom/uploads/route.ts`:**

| Map | Entry |
|---|---|
| `VALID_KINDS` | add `"outlets"` |
| `BUCKET_MAP` | `outlets: "outlet-photos"` |
| `KIND_PREFIX` | `outlets: "outlets"` |
| `PERMISSION_MAP` | `outlets: "SUBMIT_DRAFT_OUTLET"` |

### `POST /api/marcom/outlets/draft` — unchanged

No change to the route, the payload type, or the validation. `photoUrl` remains `string`. The only difference is the value's format: a `https://` CDN URL instead of a `data:` URI.

### `GET /api/marcom/outlets` — unchanged

No code change needed. Responses become small automatically once `photoUrl` holds URLs. **Do not** add a top-level `select` as part of this work — it is not required and would widen the diff.

---

## Client-Side Format Guard

`isCompressibleImage()` in `imageCompression.ts` accepts only `jpg`, `jpeg`, `png`, `webp`. The input keeps `accept="image/*"` so mobile cameras open normally, but `handleFileChange` gains an explicit guard:

```
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
if (rawFile.type && !ALLOWED.has(rawFile.type.toLowerCase())) {
  toast.error("Format foto tidak didukung. Gunakan JPG, PNG, atau WebP.");
  e.target.value = "";
  return;
}
```

This closes the HEIC `413` hole described in the ADR. `e.target.value = ""` is required so the same file can be re-selected after a rejection.

---

## Rendering Paths (all already work)

| Location | Code | Behaviour with CDN URL |
|---|---|---|
| Modal preview | `SubmitDraftOutletModal` → `<AppImage src={formData.photoUrl}>` | `data:` preview → bypass optimization (unchanged). After submit the URL is a CDN URL but the modal closes. |
| Approval queue thumbnail | `OutletApprovalQueueTab` → `<AppImage src={outlet.photoUrl}>` | `isConfiguredRemoteHost("https://x.supabase.co/...")` → `true`; `shouldBypassOptimization` → `false` → Next Image optimization active |
| Approval queue enlarged photo | `OutletApprovalQueueTab` → `setEnlargedPhotoUrl(outlet.photoUrl)` | Plain URL in an overlay `<img>` / `AppImage` — works |

Verified in `src/components/ui/appImageHelpers.ts`:

```ts
if (trimmed.startsWith("/") || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
  return true;
}
// ...
host === "supabase.co" || host.endsWith(".supabase.co")
```

No changes required in `AppImage`, `appImageHelpers`, `next.config.ts`, or `OutletApprovalQueueTab`.

---

## Acceptance Criteria

| # | Criterion | How to verify |
|---|---|---|
| AC-1 | A newly submitted draft outlet stores a `https://` URL in `photoUrl` | SQL: `SELECT LEFT("photoUrl", 8) FROM "Outlet" WHERE status='PENDING_APPROVAL'` → `https://` |
| AC-2 | No `data:` URI is ever persisted after this change | SQL: `SELECT COUNT(*) FROM "Outlet" WHERE "photoUrl" LIKE 'data:%' AND "createdAt" > <deploy time>` → 0 |
| AC-3 | The JSON body sent to `/api/marcom/outlets/draft` is small | DevTools Network → request payload < 5 KB |
| AC-4 | Photo preview is instant after file selection | No network request between file pick and preview render |
| AC-5 | HEIC selection shows a clear error and does not submit | Toast "Format foto tidak didukung..." appears |
| AC-6 | Manual `https://` URL paste still works without an upload | Network tab shows no request to `/api/marcom/uploads` |
| AC-7 | Approval queue thumbnail and lightbox render the CDN URL | Visual check on a pending draft |
| AC-8 | Upload failure prevents record creation | Throttle network → submit → error toast, no new row in DB |
| AC-9 | No TypeScript errors, no test regressions | `npx tsc --noEmit` → 0; `npm test` → 0 failures |

---

## Verification Checklist

```
[ ] Supabase bucket outlet-photos exists and is public
[ ] /api/marcom/uploads accepts kind="outlets"
[ ] Uploaded file appears in Supabase Dashboard → Storage → outlet-photos/outlets/{branchId}/
[ ] DB row photoUrl starts with https:// and length < 300
[ ] Outlet list response size unchanged after adding 5 more draft outlets
[ ] HEIC file rejected with a clear toast
[ ] Pasted URL path bypasses upload
[ ] Remove-photo then re-pick uploads only the latest file
[ ] Modal reopened after close has no stale file
[ ] npx tsc --noEmit → 0 errors
[ ] npm test → 0 failures
[ ] npm run drift:check → no drift
[ ] npm run build:check → success
```

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| ADR-0019 not executed → `uploadToSupabase` missing | Medium | Blocks implementation | Plan Phase 0 has an explicit `grep` gate; stop if it fails |
| Orphaned storage objects when record creation fails | Medium | Low — wasted storage only | Accept for now; note a future cleanup job |
| `branchId` used as path segment leaks branch ids in public URLs | Low | Low — branch ids are already client-visible | Acceptable; alternative is `auth()`-derived user id |
| HEIC users blocked from submitting | Low | Medium — UX friction on iOS | Clear toast with supported formats; iOS Safari usually converts to JPEG on upload |
| Double submission creates two uploads | Low | Low | `isSubmitting` already disables the submit button; `isUploadingPhoto` extends that window |
| Preview data URL held in memory for large photos | Low | Low — ephemeral, cleared on close | `photoFile` and preview reset in the `isOpen` effect |
| Base64 already in production rows keeps list payloads large | Unknown | Medium | Count rows first (Plan Phase 6); run backfill if non-zero |

---

## Open Questions (resolve before implementation)

| # | Question | Default if unanswered |
|---|---|---|
| Q1 | Are there existing `data:` rows in production? | Assume none; verify with the Phase 6 count query |
| Q2 | Should photos be purged when a draft outlet is rejected? | No — out of scope, consistent with ADR-0019 |
| Q3 | Is the manual URL paste field still wanted? | Yes — preserved as-is |

---

## Definition of Done

1. All Acceptance Criteria AC-1 through AC-9 pass.
2. Verification Checklist fully checked.
3. `npm run drift:check`, `npm test`, `npm run build:check` all green.
4. `docs/SESSION_STATE.md` updated with what changed.
5. Commit message references ADR-0020, the spec, and the plan.
