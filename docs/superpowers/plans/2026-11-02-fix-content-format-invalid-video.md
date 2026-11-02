# Fix Plan — Invalid `format: "video"` in ContentPost

**Status:** Ready to Execute  
**Date:** 2026-11-02  
**Error:** `Invalid format: 'video'. Must be one of: reel, carousel, image, story, article, thread`  

---

## Root Cause

The bug has **two layers**:

### Layer 1 — Bad Seed Data (Origin)
`prisma/seed.ts` wrote invalid `format` values directly via `prisma.contentPost.create()`, bypassing the API route validator. The DB column is plain `TEXT` with no `CHECK` constraint, so it accepted them silently.

| Post ID | Field | Invalid value | Correct value |
|---|---|---|---|
| `cnt-001` | `format` | `"reels"` | `"reel"` |
| `cnt-002` | `format` | `"video"` | `"reel"` |
| `cnt-002` | `status` | `"REVISION_NEEDED"` | `"REVISION"` |
| `cnt-004` | `format` | `"shorts"` | `"reel"` |

### Layer 2 — No Client-Side Guard (Propagator)
`ContentDrawer.tsx` line 104 syncs the raw DB value directly into state:
```tsx
setFormat(post.format || "reel");  // ← "video" passes through as-is
```
When the user hits Save, `"video"` reaches the PATCH API route → `isValidFormat("video") === false` → HTTP 400 → error thrown.

---

## Exact Error Flow

```
DB has format: "video" (seeded incorrectly)
  → ContentDrawer useEffect [line 104]: setFormat("video")
  → User clicks "Simpan Perubahan"
  → handleSave [ContentDrawer.tsx:189]: calls onUpdatePost({ format: "video" })
  → handleDrawerUpdate [ContentPlannerView.tsx:301]: PATCH /api/marcom/content/cnt-002
  → API [content/[id]/route.ts:60]: isValidFormat("video") === false
  → HTTP 400: { error: "Invalid format: 'video'. Must be one of: ..." }
  → throw new Error(errJson.error) [line 322]
  → toast.error("Gagal menyimpan perubahan konten")
```

---

## Files to Change

| File | Change Type | Scope |
|---|---|---|
| `prisma/seed.ts` | Fix seed data | 4 invalid values across 3 posts |
| `src/components/views/ContentPlannerView/ContentDrawer.tsx` | Add fallback guard | line 104 — 1 line change |

### Files to NOT touch
| File | Reason |
|---|---|
| `src/types/index.ts` | `PostFormat` type is correct |
| `src/lib/marcom/contentTaxonomy.ts` | `VALID_FORMATS` and `isValidFormat` are correct |
| `src/app/api/marcom/content/[id]/route.ts` | API validation is correct |
| `prisma/schema.prisma` | No migration needed (optional improvement, separate task) |
| Any test files | All tests already pass and correctly reject `"video"` |

---

## Phase 1 — Fix Seed Data

**File:** `prisma/seed.ts`

### Change 1 — `cnt-001` format
```typescript
// BEFORE (line 958):
format: "reels",

// AFTER:
format: "reel",
```

### Change 2 — `cnt-002` format + status
```typescript
// BEFORE (lines 976, 978):
format: "video",
...
status: "REVISION_NEEDED",

// AFTER:
format: "reel",
...
status: "REVISION",
```

### Change 3 — `cnt-004` format
```typescript
// BEFORE (line 1011):
format: "shorts",

// AFTER:
format: "reel",
```

---

## Phase 2 — Add Client-Side Guard in ContentDrawer

**File:** `src/components/views/ContentPlannerView/ContentDrawer.tsx`

**Import `VALID_FORMATS`** at the top of the file:
```typescript
import { VALID_FORMATS } from "@/lib/marcom/contentTaxonomy";
```

**Change line 104** — add fallback for invalid DB values:
```typescript
// BEFORE:
setFormat(post.format || "reel");

// AFTER:
setFormat(
  (VALID_FORMATS as readonly string[]).includes(post.format) ? post.format as PostFormat : "reel"
);
```

This ensures that if **any** stale invalid value ever exists in the DB (not just `"video"`), the drawer silently normalizes it to `"reel"` instead of propagating it to the API.

---

## Phase 3 — Re-seed the Database

After fixing the seed file, run:

```bash
npx prisma db seed
```

If the environment uses a reset-seed pattern:
```bash
npx prisma migrate reset --skip-generate
```

> ⚠️ `migrate reset` will wipe all data. Use only in dev/staging environments.

Alternatively, run a one-off DB patch to fix existing rows without reseed:
```sql
UPDATE "ContentPost" SET "format" = 'reel'   WHERE "format" IN ('video', 'reels', 'shorts');
UPDATE "ContentPost" SET "status" = 'REVISION' WHERE "status" = 'REVISION_NEEDED';
```

---

## Phase 4 — Verify

```bash
npm run drift:check       # must pass
npm test                  # 0 failures — contentTaxonomy.test.ts already covers isValidFormat("video") === false
npm run build:check       # 0 TypeScript errors
```

Manual verify:
- [ ] Open ContentPlanner → find "Tutorial Klaim Kuota Bonus" post (cnt-002)
- [ ] Open its drawer → Format field should show "Reel / Video" (not blank)
- [ ] Click "Simpan Perubahan" → no error toast, success toast shown
- [ ] Board card for cnt-002 shows `reel` not `video`

---

## Execution Order (Step by Step)

```
1. Edit prisma/seed.ts  → fix cnt-001 format "reels" → "reel"
2. Edit prisma/seed.ts  → fix cnt-002 format "video" → "reel"
3. Edit prisma/seed.ts  → fix cnt-002 status "REVISION_NEEDED" → "REVISION"
4. Edit prisma/seed.ts  → fix cnt-004 format "shorts" → "reel"
5. Edit ContentDrawer.tsx → add VALID_FORMATS import
6. Edit ContentDrawer.tsx → add fallback guard on line 104
7. Run SQL patch on DB (or npx prisma db seed if dev env allows)
8. npm run drift:check
9. npm test
10. npm run build:check
11. Manual smoke: open drawer for cnt-002, save successfully
```

---

## Risk Assessment

**Low risk.** Changes are:
- Seed data string corrections (no schema change)
- One-line defensive guard in a `useEffect` sync
- No API logic touched
- No type changes
- All existing tests continue to pass (they already correctly reject `"video"`)
