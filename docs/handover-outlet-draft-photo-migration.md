# Handover — Outlet Draft Photo Migration (ADR-0020 / Spec / Plan)

**Date:** 2026-11-03  
**Purpose:** Continue the Outlet Draft Photo planning work in a fresh session without losing context.

---

## 1. What This Handover Is For

A previous session researched the Outlets draft-photo upload path and decided to migrate it from a base64 `data:` URL stored in Postgres to a Supabase Storage CDN URL. Planning documents were started using the incremental write pattern (create shell → append sections). If the session ended mid-document, this file tells the next session exactly where to resume.

---

## 2. Session Rule In Effect

> **"Don't code in this session"** — planning-only mode.

Rules that apply to the next session **if that rule is repeated**:

1. **File-first, content-second** — always `write()` the `.md` shell (title + status + an append marker), then append each section with `edit()`. Never write a large document in one tool call.
2. **Explore before writing** — no planning doc may be written from assumption. Read the actual files listed in §5.
3. **No code edits** — no `edit()` on any file under `src/`, `prisma/`, or config files. Documentation only.

If the next session is *allowed* to code, follow the plan in `docs/superpowers/plans/2026-11-03-outlet-draft-photo-supabase-storage.md`.

---

## 3. The Decision (Already Made)

| Question | Answer |
|---|---|
| Is the outlet draft photo broken on Vercel? | **No.** It never touches the filesystem. Pure JSON → Prisma → DB. |
| So why migrate it? | Base64 bloat: ~650 KB per row; outlet list API has no `select` so every list response carries every draft photo (~13 MB for 20 drafts). Plus a latent HEIC `413` failure. |
| Priority | **Now the only unfinished storage item.** ADR-0019 shipped in commit `ab12035` — nothing blocks this anymore. |
| Is it an outage? | **No.** Outlet draft photo works in production today. It is debt, not a break. |
| Chosen approach | Upload the already-compressed file to Supabase Storage at **submit time**, store the CDN URL in `Outlet.photoUrl`. Base64 preview stays browser-only. |
| Bucket | `outlet-photos` (public, 25 MB) |
| Path | `outlet-photos/outlets/{branchId}/{uuid}-{filename}` |
| Colour of the change | Small — one modal component + one `kind` added to the upload route. No DB migration. |

---

## 4. Files That Matter (Read These Before Continuing)

### 4.1 Primary edit targets

| File | Lines of interest | Why it matters |
|---|---|---|
| `src/components/views/OutletsView/SubmitDraftOutletModal.tsx` | `handleFileChange` 102–121, `handleSubmit` 123–163, `finally` 160–163, remove button 413, manual URL input 392–397, `isOpen` effect 63–71 | All client-side changes live here |
| `src/app/api/marcom/uploads/route.ts` | `VALID_KINDS`, `BUCKET_MAP`, `KIND_PREFIX`, `PERMISSION_MAP` | Add `outlets` kind — ADR-0019 already applied, so only 4 map entries change |
| `src/lib/server/supabaseStorage.ts` | whole file | **Already exists** (verified) — `uploadToSupabase(bucket, storagePath, buffer, mimeType)` |

### 4.2 Read-only references (do not modify)

| File | What to learn from it |
|---|---|
| `src/app/api/marcom/outlets/draft/route.ts` | Confirms JSON contract; `photoUrl` is not format-validated |
| `src/app/api/marcom/outlets/draft/draftOutletHelpers.ts` | `buildDraftOutletData` — `photoUrl: input.photoUrl?.trim() || ""` |
| `src/components/views/OutletsView/submitDraftOutletHelpers.ts` | `validateDraftForm` requires non-empty `photoUrl`; `buildDraftSubmissionPayload` trims it |
| `src/components/views/OutletsView/OutletApprovalQueueTab.tsx` | Renders `outlet.photoUrl` via `AppImage` (thumbnail ~307, lightbox ~303) |
| `src/components/ui/appImageHelpers.ts` | `isConfiguredRemoteHost` accepts `data:`, `blob:`, `supabase.co`, `*.supabase.co`; `shouldBypassOptimization` bypasses `data:`/`blob:` |
| `src/lib/marcom/imageCompression.ts` | `isCompressibleImage` whitelist = jpg/jpeg/png/webp → this is why HEIC bypasses compression |
| `src/lib/marcom/auth.ts` | `requireMember()` returns only `"admin"` — **no user id available** |
| `src/lib/marcom/guards.ts` | `PermissionAction` includes `SUBMIT_DRAFT_OUTLET` |
| `prisma/schema.prisma` | `model Outlet` — `photoUrl String @default("")` at ~line 143 |
| `src/app/api/marcom/outlets/route.ts` | `prisma.outlet.findMany` has **no top-level `select`** — root cause of the list-payload bloat |

### 4.3 Documents produced so far

| Document | Status at handover |
|---|---|
| `docs/adr/0020-outlet-draft-photo-supabase-storage.md` | Sections: Context, Drivers, Options, Decision |
| `docs/superpowers/specs/2026-11-03-outlet-draft-photo-supabase-storage.md` | Sections: Problem, Goals, Non-Goals, Flow, State Model, Submit Sequence, API Contract, Format Guard, Rendering |
| `docs/superpowers/plans/2026-11-03-outlet-draft-photo-supabase-storage.md` | Phases 0–6, Rollback, Files Changed |
| `docs/handover-outlet-draft-photo-migration.md` | This file |

Check the `APPEND` marker at the bottom of each document. If a marker is still present, that document is incomplete — append the missing section before writing new content.

---

## 5. Key Codebase Facts Discovered

These were verified by reading the code, not assumed.

1. **No filesystem involvement.** `SubmitDraftOutletModal` never calls `/api/marcom/uploads` today. It is a pure JSON flow. This is why it was excluded from ADR-0019.
2. **`compressImageFile` is client-side only.** Canvas API, max 1920px, JPEG quality 0.8, skips files under 350 KB, skips non-whitelisted types.
3. **`FileReader.readAsDataURL` produces the base64 string** that goes directly into React state as `formData.photoUrl`.
4. **`Outlet.photoUrl` is `String @default("")`** — no schema change needed for URLs.
5. **`GET /api/marcom/outlets` has no top-level `select`.** It returns all scalar columns including `photoUrl`. This is the real damage of base64 storage: the bloat is on the read path, not only in storage.
6. **`requireMember()` returns `"admin"` — a stub, not a user object.** There is no `userId` available in that helper. Use `branchId` for the storage path, or `auth()` from `@/auth` if a user id is required.
7. **`requireMember()` and `hasPermission()` are the guard pattern** used by `/api/marcom/uploads`; `SUBMIT_DRAFT_OUTLET` already exists in `PermissionAction`.
8. **`AppImage` renders Supabase URLs correctly today** — `isConfiguredRemoteHost` returns `true` for `supabase.co` and `*.supabase.co`, and `shouldBypassOptimization` returns `false` for them (so Next.js optimization is active).
9. **Vercel's serverless request body limit is 4.5 MB.** This is why a HEIC photo base64-encoded to 2.7–6.7 MB fails with a 413 before the handler runs.
10. **`draftOutletHelpers.test.ts` already uses an `https://` URL** in its fixture (`https://example.com/storefront.jpg`), so the payload contract is URL-shaped in tests already — no test churn expected.

---

## 6. Exact Resume Instructions

### If the planning documents are incomplete

1. Run `grep -rn "APPEND" docs/adr/0020-outlet-draft-photo-supabase-storage.md docs/superpowers/specs/2026-11-03-outlet-draft-photo-supabase-storage.md docs/superpowers/plans/2026-11-03-outlet-draft-photo-supabase-storage.md`
2. For each file with a live marker, append the next missing section using `edit()`, replacing the marker with `new-content + marker`.
3. Remove the marker only when the document is complete.

### If planning is complete and you are starting implementation

1. Read this handover in full.
2. ~~Verify ADR-0019 is executed~~ — **already satisfied.** Verified 2026-11-03: `src/lib/server/supabaseStorage.ts` exists, `/api/marcom/uploads` imports `uploadToSupabase`, and commit `ab12035` shipped it. No prerequisite work remains.
3. Create the `outlet-photos` bucket in Supabase Dashboard (**the only missing piece of infrastructure** — `mou-documents`, `marcom-documents`, `placement-photos`, `content-thumbnails` already exist and are public).
4. Execute the plan phases 1 → 5 in order. Do not skip the format guard (Phase 2b) — it is the fix for the HEIC 413.
5. Run the verification gate before claiming completion:
   ```bash
   npm run drift:check
   npm test
   npm run build:check
   ```

**Baseline to protect:** at handover, `npm run drift:check` reports *"No drift detected. All invariants pass."* and `docs/SESSION_STATE.md` records 748 passing tests. Any regression below that is a failure.

---

## 7. Do Not Touch

| Item | Reason |
|---|---|
| `compressImageFile` behaviour | Already optimized; changing it affects MOUs and Placements too |
| `validateDraftForm` / `buildDraftSubmissionPayload` | Contract stays identical — `photoUrl` remains a string |
| `Outlet.photoUrl` schema | Already `String`, no migration wanted |
| `GET /api/marcom/outlets` query shape | Adding a `select` is a separate concern; not required to fix the bloat |
| `OutletApprovalQueueTab` rendering | Already handles both `data:` and `https://` |
| Multi-file support in the draft modal | Out of scope — single facade photo by design |
| `SubmitDraftOutletModal`'s manual URL paste field | Intentionally preserved |

---

## 8. Open Questions for the Next Session

| # | Question | Why it matters |
|---|---|---|
| Q1 | Does the live database currently contain any `photoUrl LIKE 'data:%'` rows? | Decides whether Plan Phase 6 (backfill) is needed at all |
| Q2 | Should approved outlets keep their photo forever, or should the photo be purged after approval? | Affects storage growth and a future cleanup job |
| Q3 | Is `branchId` an acceptable storage-path segment, or should the path use the submitting user's id? | `requireMember()` exposes no user id; using `auth()` would be a larger change |
| Q4 | Should the manual URL paste field stay long-term? | If both local upload and pasted URLs exist, the modal has two sources of truth for `photoUrl` |

---

## 9. Verified Current State (checked 2026-11-03)

The earlier draft of this section claimed ADR-0019 and several fixes were still pending. **That was wrong.** The table below is the verified reality, gathered by reading files, querying the Supabase Storage API, and running `npx prisma migrate status`.

### 9.1 Completed and verified

| # | Work | Evidence |
|---|---|---|
| 1 | **ADR-0019 — filesystem → Supabase Storage** | Commit `ab12035 feat(storage): migrate filesystem uploads to supabase storage`. `src/app/api/marcom/uploads/route.ts` imports `uploadToSupabase` and no longer imports `writeFile` / `mkdir`. |
| 2 | `src/lib/server/supabaseStorage.ts` helper | File exists; exports `uploadToSupabase(bucket, storagePath, buffer, mimeType)` using `POST` + `x-upsert: true` |
| 3 | `uploadsApi.test.ts` guard | Asserts route contents never include `writeFile` |
| 4 | `mouApi.ts` → `kind: "mou-documents"` | Line 70. Covered by `mouApi.test.ts`. |
| 5 | **Storage buckets** (4 of 5) | Storage API returns: `content-thumbnails` (public, 5 MB), `mou-documents` (public, 25 MB), `marcom-documents` (public, 25 MB), `placement-photos` (public, 25 MB) |
| 6 | **Prisma migration drift** | `npx prisma migrate status` → *"6 migrations found … Database schema is up to date!"* `_prisma_migrations` now exists. |
| 7 | `add_media_attachments` migration | Present at `prisma/migrations/20261103000000_add_media_attachments` |
| 8 | **`mediaAttachments` saved from drawer** | `ContentPlannerView.tsx:344` → `mediaAttachments: updated.mediaAttachments ?? []` |
| 9 | **Toast position** | `src/app/layout.tsx:32` → `position="top-right"` (commit `845f39a`) |
| 10 | **Thumbnail generation** | `generateAndUploadThumbnail()` in `/api/marcom/drive/upload`; `useDirectDriveUpload.ts:74` reads `thumbnailUrl` into the attachment; `ContentDrawer.tsx:638` + `ContentPlannerView.tsx:670` resolve the cover thumbnail (commit `b8f5b14`) |
| 11 | Content Planner multi-file, cover decoupling, drag reorder | Commits `abc2da2`, `50986c8`, `2875f11`, `a7a48fd`, `6b6850f`, `0e67380`, `35a0f0b`, `9dec763` |
| 12 | Drift gate baseline | `npm run drift:check` → *"No drift detected. All invariants pass."* |
| 13 | Test baseline | Recorded in `docs/SESSION_STATE.md` as **748 passed, 0 failed (133 suites)** — I did not re-run the suite during this verification pass. Re-run `npm test` before relying on it. |

### 9.2 Still genuinely outstanding

| # | Work | Status |
|---|---|---|
| 1 | **`outlet-photos` bucket** | ❌ Does not exist — the only missing bucket. Create before ADR-0020 Phase 1. |
| 2 | **ADR-0020 code** — `photoFile` state, HEIC guard, upload-before-create, `outlets` kind | ❌ Not started. Plan is ready. |
| 3 | Optional: backfill existing `photoUrl LIKE 'data:%'` rows | ❓ Unknown — run the count query in Plan Phase 6 first |

### 9.3 Optional cleanups discovered while verifying

| Item | Detail | Priority |
|---|---|---|
| Duplicate Supabase upload logic | `src/app/api/marcom/drive/upload/route.ts:42` still builds its own `storage/v1/object/content-thumbnails/...` fetch instead of calling `uploadToSupabase()`. Behaviour is correct — only duplication. | Low |
| Inconsistent bucket limits | `content-thumbnails` is capped at **5 MB** while the other three are 25 MB. Correct for thumbnails, but worth knowing when reading the code. | Informational |
| `uploadToSupabase` uses `POST` not `PUT` | ADR-0019's plan sketch said `PUT`; the shipped helper uses `POST` with `x-upsert: true`. Both work — the ADR text should be read as intent, not literal. | Informational |

### 9.4 Revised priority order

| Priority | Work | Why |
|---|---|---|
| 1 | **ADR-0020 — Outlet draft photo** | Now the only unfinished storage item; infrastructure already in place |
| 2 | Optional `data:` backfill | Only if §9.5 shows rows exist |
| 3 | Deduplicate thumbnail upload via `uploadToSupabase` | Cosmetic, safe |

ADR-0020 remains debt-fixing rather than outage-fixing — it can still be scheduled behind feature work if needed.

### 9.5 First command for the next session

⚠️ `npx prisma db execute` **does not print `SELECT` results** — it only reports success. Use one of these instead.

**Option A — Prisma Studio (no code):**
```bash
npx prisma studio
# Open the Outlet table, sort by photoUrl length, filter rows starting with "data:"
```

**Option B — psql with the direct connection:**
```bash
set -a && source .env.local && set +a
psql "$DIRECT_URL" -c "SELECT COUNT(*) AS base64_rows FROM \"Outlet\" WHERE \"photoUrl\" LIKE 'data:%';"
psql "$DIRECT_URL" -c "SELECT COUNT(*) AS n, pg_size_pretty(SUM(LENGTH(\"photoUrl\"))::bigint) AS total_bytes, MAX(LENGTH(\"photoUrl\")) AS longest FROM \"Outlet\";"
```

**Option C — one-off Node script** using `prisma.$queryRaw`, exiting afterwards.

If `base64_rows > 0`, Plan Phase 6 (backfill) becomes relevant. If it is `0`, skip Phase 6 entirely and delete that phase from the plan to keep it honest.
