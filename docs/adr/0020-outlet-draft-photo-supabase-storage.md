# ADR-0020 — Outlet Draft Photo: Supabase Storage Instead of Base64 in DB

**Status:** Accepted  
**Date:** 2026-11-03  
**Area:** Outlets — Draft Outlet Photo Storage  
**Relates to:** ADR-0018 (Thumbnail Supabase Storage), ADR-0019 (Filesystem Uploads → Supabase Storage)

---

## Context

`SubmitDraftOutletModal` handles outlet draft photo upload **without any file-storage backend**. The full pipeline is:

```
<input type="file" accept="image/*" capture="environment">
  ↓
compressImageFile()          Canvas API, max 1920px, JPEG q0.8   (client)
  ↓
FileReader.readAsDataURL()   → "data:image/jpeg;base64,...."      (client)
  ↓
setFormData({ photoUrl: dataUrl })                                (React state)
  ↓
buildDraftSubmissionPayload() → { photoUrl: "<base64>" }          (client)
  ↓
POST /api/marcom/outlets/draft   Content-Type: application/json
  ↓
buildDraftOutletData() → photoUrl: input.photoUrl.trim()
  ↓
prisma.outlet.create({ data: { photoUrl: "<base64>" } })
  ↓
Postgres column Outlet.photoUrl (String @default(""))
```

### Why this is NOT a production blocker

Unlike MOUs / Documents / Placements (ADR-0019), this flow **never touches the server filesystem**. There is no `fs.writeFile`, no `./uploads/`, no `GET /api/marcom/files`. The route is a pure `JSON in → Prisma write → JSON out`, which is fully compatible with Vercel serverless. It works in production today.

### Why it is still a problem

**1. Base64 bloat in a relational column**

`compressImageFile` produces a JPEG at max 1920px, quality 0.82 — typically 400–600 KB. Base64 encoding adds ~33%, so each stored `photoUrl` is roughly **530–800 KB of text** inside a Postgres `String` column.

**2. Every outlet query carries the blobs**

`src/app/api/marcom/outlets/route.ts` uses:

```ts
const outlets = await prisma.outlet.findMany({
  where,
  orderBy: { code: "asc" },
  take,
  include: {
    branch: { select: { ... } },
    _count: { select: { placements: true, mous: true } },
    placements: { ... },
  },
});
```

There is **no top-level `select`**, so Prisma returns every scalar column — including `photoUrl`. Every Outlets list load, every approval queue refresh, every dropdown that reads outlets drags the full base64 payload of every pending draft across the wire.

With 20 pending draft outlets at ~650 KB each, a single outlet list response is roughly **13 MB of JSON**. This affects the hottest read path in the Outlets module.

**3. Supabase free-tier database quota**

The Supabase free plan provides ~500 MB of database storage, shared with every relational table. At ~650 KB per draft outlet, roughly **750 draft outlets** would consume the entire database quota before any other data is counted.

**4. Silent HEIC failure mode (latent bug)**

`isCompressibleImage()` in `imageCompression.ts` only accepts `jpg`, `jpeg`, `png`, `webp`. The input uses `accept="image/*"`, and iOS may hand the browser an `image/heic` file. In that case compression is **skipped entirely** and the raw HEIC bytes (2–5 MB) are base64-encoded to **2.7–6.7 MB**.

The resulting JSON body is then sent to `POST /api/marcom/outlets/draft`. Vercel enforces a **4.5 MB request body limit** on serverless functions, so these submissions fail with `413 Payload Too Large` — before the route handler even runs. The user sees a generic "Terjadi kesalahan saat pengajuan outlet" error with no actionable cause.

**Confidence:** this is a reasoned inference, not an observed production incident. The arithmetic is straightforward (HEIC payload > ~3.4 MB → base64 > 4.5 MB), but whether iOS actually hands the browser a HEIC file depends on Safari version and the "Keep Original" setting. Treat it as a high-probability latent bug worth closing, not as a confirmed outage. Verifying it is cheap: open the DevTools Network tab on an iPhone and submit a HEIC photo — the request should fail with `413` before reaching the route.

### What the data looks like today

| Field | Value |
|---|---|
| `Outlet.photoUrl` column type | `String @default("")` |
| Typical stored value | `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...` (530–800 KB) |
| Rendered by | `AppImage` → `data:` prefix → `isConfiguredRemoteHost` returns `true`, `shouldBypassOptimization` returns `true` |
| Consumed by | `OutletApprovalQueueTab` (thumbnail + enlarged lightbox) |

---

## Decision Drivers

- ADR-0019 establishes `src/lib/server/supabaseStorage.ts` → `uploadToSupabase(bucket, path, buffer, mimeType)` — reusable, no new dependencies
- `AppImage` / `appImageHelpers.ts` already whitelists `supabase.co` and `*.supabase.co` in `isConfiguredRemoteHost` — CDN URLs render through Next Image with optimization, zero config change
- `isConfiguredRemoteHost` also returns `true` for `blob:` and `data:` → local preview keeps working unchanged
- `shouldBypassOptimization` returns `true` for `blob:` / `data:` / `.svg` → preview renders unoptimized as it does today
- `Outlet.photoUrl` is already `String` — no Prisma migration, no schema drift
- `compressImageFile()` already produces an upload-ready `File` — the compression step is untouched
- The photo is uploaded **once per submission**, not per keystroke — deferred upload keeps the flow simple
- `validateDraftForm()` requires a non-empty `photoUrl` — this must keep passing at preview time

---

## Options Considered

### Option A — Keep base64 in Postgres (status quo)

| | |
|---|---|
| **Pros** | Zero work. Works on Vercel. No new bucket. |
| **Cons** | ~650 KB per row; outlet list API returns every draft photo; ~750 drafts exhausts the free-tier DB; HEIC submissions fail with 413; no CDN caching. |
| **Verdict** | ❌ Rejected — unsustainable debt on the module's hottest read path. |

### Option B — Supabase Storage, upload at submit time (deferred) ✅

| | |
|---|---|
| **Pros** | No code change to compression or preview. Base64 never leaves the browser. Small diff. Reuses ADR-0019 helper. No schema change. |
| **Cons** | Two sequential requests on submit (upload → create). If the second fails, an orphan object remains in the bucket (harmless; future cleanup job). |
| **Verdict** | ✅ **Chosen.** |

### Option C — Supabase Storage, upload immediately on file select (eager)

| | |
|---|---|
| **Pros** | Submit stays a single request. |
| **Cons** | Every abandoned/retried selection leaves an orphan object. Needs a cleanup cron job from day one. Uploads happen even if the user never submits. |
| **Verdict** | ❌ Rejected — premature complexity for a single-photo form. |

### Option D — Store bytes in a separate `OutletPhoto` table as `bytea`

| | |
|---|---|
| **Pros** | Removes the blob from `Outlet` list queries via `select`. |
| **Cons** | Still no CDN, still no browser caching, still consumes the same DB quota, new table + relation + migration. |
| **Verdict** | ❌ Rejected — solves the query symptom, not the storage problem. |

### Option E — Vercel Blob

| | |
|---|---|
| **Pros** | Native Vercel integration. |
| **Cons** | New dependency, paid tier, second storage system alongside Supabase. |
| **Verdict** | ❌ Rejected — infrastructure fragmentation. |

### Option F — Google Drive (same as Content Planner)

| | |
|---|---|
| **Pros** | Already integrated for media. |
| **Cons** | Drive is user-content storage, not app infrastructure. Outlet photos must be readable by approvers without Drive sharing setup. Mixing concerns. |
| **Verdict** | ❌ Rejected — wrong storage class. |

### HEIC handling sub-decision

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Reject non-JPEG/PNG/WebP client-side with a clear toast** | Deterministic, 3-line guard, no server dependency | iPhone users must retake/convert | ✅ Chosen |
| Add `heic` to `validateUpload` allowlist | No user friction | Chrome/Firefox cannot render HEIC — broken previews for approvers | ❌ |
| Server-side HEIC → JPEG conversion | Best UX | Requires `heic-convert` / `libheif` — new native dependency, larger bundle | ❌ Out of scope |

---

## Decision

Migrate outlet draft photos to **Supabase Storage**, storing a public CDN URL in `Outlet.photoUrl`.

### Concrete decision points

| Point | Decision |
|---|---|
| Storage backend | Supabase Storage bucket `outlet-photos` (public, 25 MB) |
| Path convention | `outlets/{branchId}/{uuid}-{sanitizedFilename}` |
| Upload trigger | On form submit, **before** `POST /api/marcom/outlets/draft` |
| Upload endpoint | Existing `POST /api/marcom/uploads` with new `kind: "outlets"` (depends on ADR-0019) |
| Permission for the new kind | `SUBMIT_DRAFT_OUTLET` |
| Preview | Unchanged — `FileReader` data URL rendered by `AppImage`, never transmitted |
| Manual URL paste | Preserved — pasted `https://` URL bypasses upload and is submitted as-is |
| HEIC / unsupported formats | Rejected client-side with a specific toast; `accept` stays `image/*` so the camera still opens |
| Client-side compression | Unchanged — `compressImageFile` max 1920px, JPEG q0.8 |
| DB schema | **No change** — `Outlet.photoUrl` already `String @default("")` |
| Existing base64 rows | Optional one-off backfill (Phase 6), not required for correctness |

### Why upload-before-create is safe

`POST /api/marcom/outlets/draft` validates `photoUrl` only as a trimmed non-empty string (`draftOutletHelpers.ts` does no format check). A CDN URL and a `data:` URL are both accepted by the current validation. No server-side validation change is required — only a convenience guard against accidentally submitting a `data:` URI.

---

## Consequences

### Positive

- `Outlet.photoUrl` shrinks from ~650 KB to ~120 characters — the outlet list response no longer scales with the number of pending drafts
- Database quota is reclaimed for relational data instead of base64 blobs
- Photos are served from the Supabase CDN with Next.js image optimization active, instead of being base64-decoded on every render
- HEIC `413 Payload Too Large` failures are eliminated — the base64 preview never leaves the browser
- Storage credentials and infrastructure are shared with ADR-0019 — one system, one pattern
- Zero Prisma migration, zero schema drift

### Negative

- Submitting an outlet draft becomes two round trips (upload, then create) instead of one
- If the upload succeeds but the record creation fails, an orphan object remains in `outlet-photos` — harmless but untracked
- A new bucket must be created manually in the Supabase dashboard
- Client loses support for HEIC source photos (explicit trade-off, with a clear user-facing message)
- Ordering dependency on ADR-0019 — this work cannot start until `uploadToSupabase` exists

### Neutral

- `compressImageFile` is unchanged — it already produces an upload-ready `File`
- `validateDraftForm` and `buildDraftSubmissionPayload` are unchanged — `photoUrl` remains a string
- `AppImage`, `appImageHelpers`, `next.config.ts`, and `OutletApprovalQueueTab` need no changes
- The manual URL paste field is preserved, so two sources of `photoUrl` still exist (file upload and pasted URL)

---

## Migration Strategy for Existing Data

Existing rows with `photoUrl LIKE 'data:%'` continue to render correctly — `AppImage` handles both `data:` and `https://` identically. No forced migration.

Optional one-off backfill (Plan Phase 6) decodes each base64 payload, uploads it to `outlet-photos`, and rewrites `photoUrl` to the CDN URL. Idempotent by row id. Run only if the live database actually contains base64 rows.

**No schema migration needed.**

---

## Non-Goals

- Multi-photo support for outlet drafts — single storefront facade photo by design
- Thumbnail generation for outlet photos — one photo per outlet, rendered at thumbnail size by Next.js optimization
- Deleting Supabase objects when an outlet is rejected or deleted — future cleanup task
- Adding a top-level `select` to `GET /api/marcom/outlets` — separate concern, unnecessary once URLs are short
- Changing the approval workflow or `hasScopedPermission` branch scoping
- Migrating the manual URL paste field away

---

## Related

- ADR-0018 — Thumbnail Generation via Sharp + Supabase Storage
- ADR-0019 — Migrate Filesystem Uploads to Supabase Storage (**blocking prerequisite**)
- Spec: `docs/superpowers/specs/2026-11-03-outlet-draft-photo-supabase-storage.md`
- Plan: `docs/superpowers/plans/2026-11-03-outlet-draft-photo-supabase-storage.md`
- Handover: `docs/handover-outlet-draft-photo-migration.md`
