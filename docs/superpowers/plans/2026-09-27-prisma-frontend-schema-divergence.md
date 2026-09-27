# Prisma ↔ Frontend Schema Divergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the 6 semantic gaps and type divergences between Prisma ORM models and frontend TypeScript domain models, ensuring strict type safety, predictable serialization, and full bidirectional alignment without breaking existing workflows or regressing the test suite.

**Architecture:**
1. **SSoT Alignment** (`src/types/index.ts` & `prisma/schema.prisma`): align database models and frontend domain entities so enums, relations, and fields mirror each other 1:1.
2. **Schema changes are applied with `prisma db push`, not migrations.** This repo's `prisma/migrations/` history is an abandoned early snapshot (10 of 17 tables, 2 of 41 indexes) — the rest was added via `db push` and never captured. `migrate dev` detects permanent drift and demands a full database reset. `db push` syncs `schema.prisma` → database directly. Always confirm the delta first with `prisma migrate diff`.
3. **Data backfill before type tightening.** Never narrow a type to a value set that existing rows violate. Backfill first, verify the distribution, then tighten.
4. **Defensive API Gateways**: validate incoming payloads against canonical allowlists derived from SSoT types, returning `400 Bad Request` on invalid input.
5. **Dead Property Elimination**: cut the speculative `Placement.photoUrls` phantom field per YAGNI (`AGENTS.md`).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Prisma 6 (`@prisma/client`), PostgreSQL (local), Node test runner (`node --test`).

**Spec:** Identified in Codebase Confusion Audit, Issue #6.

---

## Global Constraints

- **Strict Tenant & Workspace Isolation**: preserve workspace scoping across all queries and API boundaries.
- **Schema Push Discipline**: any `schema.prisma` change is applied with `npx prisma db push`, preceded by `npx prisma migrate diff` to confirm the pending delta is exactly what is intended. Do not create migration files — the migration history is not maintained in this repo. `db push` refuses to run without `--accept-data-loss`; pass that flag **only** after the full delta has been computed, inspected, and every warning it raises has been verified inapplicable to the current data.
- **Backfill Before Tightening**: verify data distribution with SQL *before* narrowing any union type.
- **Zero Runtime Regressions**: all 546 tests across 70 suites must pass after each task.
- **Verification Gate**: `npx prisma validate` + `npx tsc --noEmit` + targeted `npm test` on every task before committing.
- **Type Safety Must Be Real**: never write `SomeUnion | string` — it collapses to `string` and provides zero safety. If a value is genuinely freeform, say so explicitly instead.
- **English Standard**: code, types, comments, commit messages, and docs strictly in English.

---

## Prerequisite: Verified Database State (measured 2026-09-27)

Facts confirmed against the live local database before writing this plan. Re-verify at execution time.

- `DATABASE_URL="postgresql://postgres@localhost:5432/vrelloup"` — **local**, reachable.
- `npx prisma migrate status` → 1 migration found (`20260906221636_marcom_port`), schema up to date.
- **Table names are the bare model names**: `Mou`, `Placement`, `DocumentItem`, `Material`, `Branch`. Only `WorkspaceItem`, `SpaceItem`, `ListItem`, `TaskItem`, `TaskCommentItem` carry the `Item` suffix.
- `Mou.status` distribution: `DRAFT|18, SUBMITTED|52, DONE|35, REJECTED|17`. **Zero `ON_PROGRESS` rows** — dropping that enum value is data-safe.
- `DocumentItem.status` distribution: `Done|15, Draft|7, Pending|7, Submitted|7` — **36 rows in PascalCase**, all requiring backfill in Task 4.
- `Material.type` distribution: `POSTER|1, SHOPBLIND|1, BANNER|1, BRANDING_SIGNBOARD|1, OTHER_MATERIALS|1` — already canonical enum tokens, so `MaterialItem.type` can be typed strictly.

---

## The 6 Gaps Addressed

| # | Divergence | Current State | Target SSoT Alignment |
|---|---|---|---|
| **1** | `MouStatus` enum mismatch | Prisma has 6 values (incl. `ON_PROGRESS`). Domain state machine has 5 and has no transitions to/from `ON_PROGRESS`. Zero rows use it. | Remove `ON_PROGRESS` from `enum MouStatus` via **`db push`**, regenerate client. |
| **2** | `Mou.outletId` missing | Prisma has `outletId String?` & `outlet Outlet?`. Frontend `Mou` only has `outletName?: string`. | Add `outletId?: string \| null` and `outlet?: { id; code; name } \| null` to `interface Mou`. |
| **3** | `Placement.photoUrls` phantom | Frontend `Placement` declares `photoUrls?: string[]` with **zero usages repo-wide**. Prisma has scalar `photoUrl String`. | Remove `photoUrls` from `Placement`. Keep canonical `photoUrl?: string`. |
| **4** | `DocumentItem.status` casing | Schema default `"Draft"`. 36 rows in PascalCase (`Done`/`Draft`/`Pending`/`Submitted`). Frontend works around it with `DocumentStatus \| string`. | Backfill all 36 rows to canonical uppercase, change schema default to `"DRAFT"` via **`db push`**, remove the `\| string` escape hatch. `Pending` and `Submitted` both collapse to `ACTIVE`. |
| **5** | `ContentPost` enum vs String | Prisma uses plain `String` for `platform`/`format` with no API validation. Frontend strictly types `PostPlatform`/`PostFormat`. | Add a single shared taxonomy module with compile-time drift guards; validate in `POST`/`PATCH`, returning `400`. |
| **6** | `MaterialType` not in frontend | Prisma has `enum MaterialType`; frontend `MaterialItem.type` is generic `string`; `placementMouBridge.ts` hardcodes literals. | Export canonical `MaterialType`, type `MaterialItem.type` strictly, refactor the bridge to consume it. |

---

## Implementation Tasks

### Task 1: Align `MouStatus` Enum in Prisma via `db push`

**Files:**
- Modify: `prisma/schema.prisma`
- Read: `src/lib/marcom/mouMachine.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: a 5-value `MouStatus` enum in both the database and the generated Prisma Client

**Context:** `enum MouStatus` currently has 6 values. `mouMachine.ts` deliberately excludes `ON_PROGRESS` because the state machine has no transitions to or from it, and neither `prisma/seed.ts` (see `mouStatuses`, line 222) nor the frontend ever produces it. A live query confirms zero rows use it, so the enum can be narrowed safely.

- [ ] **Step 1: Pre-flight check — confirm no rows use `ON_PROGRESS`**

Run:
```bash
psql "$DATABASE_URL" -tAc "SELECT status, count(*) FROM \"Mou\" GROUP BY status ORDER BY status;"
```
Expected: `DRAFT`, `SUBMITTED`, `DONE`, `REJECTED` only. **If any row shows `ON_PROGRESS`, STOP** — it must be remapped to `DRAFT` before the schema push can succeed.

- [ ] **Step 2: Remove `ON_PROGRESS` from `enum MouStatus` in `prisma/schema.prisma`**

```prisma
enum MouStatus {
  DRAFT
  SUBMITTED
  DONE
  REJECTED
  APPROVED
}
```

- [ ] **Step 3: Validate the schema**

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid`.

- [ ] **Step 4: Apply the schema change to the database**

Run: `npx prisma db push`
Expected: the enum is recreated with 5 values.

> **Why `db push` and not `migrate dev`:** this repo's migration history is an abandoned early snapshot — `20260906221636_marcom_port/migration.sql` creates only 10 of the 17 tables and 2 of the 41 indexes. The rest was added via `db push` and never captured. `migrate dev` therefore detects permanent drift and demands a full database reset (total data loss). `db push` syncs `schema.prisma` → database directly, which is how this database has actually been managed. Verified beforehand with `prisma migrate diff` that the only pending change is the enum alteration below — no other drift exists.
>
> Do **not** pass `--accept-data-loss`. The delta contains no destructive statement; if `db push` demands that flag, stop and re-diagnose.

- [ ] **Step 5: Regenerate the client**

Run: `npx prisma generate`
Expected: generated client exposes a 5-value `MouStatus`.

- [ ] **Step 6: Verify TypeScript and unit tests**

Run: `npx tsc --noEmit`
Run: `npm test -- src/lib/marcom/mouMachine.test.ts`
Expected: exit 0, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma
git commit -m "fix(schema): align Prisma MouStatus enum with domain state machine"
```

> **Dropped from the original plan:** a "defensive fallback to DRAFT for dirty records" in `mous/route.ts`. After the schema push the database type physically cannot hold `ON_PROGRESS`, so such a branch would be unreachable dead code — a YAGNI violation. The pre-flight check in Step 1 is the correct guard.

---

### Task 2: Add `outletId` and `outlet` Relation to `Mou` in SSoT Types

**Files:**
- Modify: `src/types/index.ts` (the `export interface Mou` block)
- Read: `prisma/schema.prisma` (model `Mou`)
- Read: `src/components/views/MousView/MouFormModal.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `Mou` gains `outletId?: string | null` and `outlet?: { id: string; code: string; name: string } | null`

**Context:** Prisma model `Mou` has `outletId String?` and `outlet Outlet? @relation(..., onDelete: SetNull)`. The frontend `Mou` interface omits both, causing narrowing discrepancies between task adapters and Marcom views. This is a **types-only** change with no runtime effect.

- [ ] **Step 1: Update `interface Mou` in `src/types/index.ts`**

Replace the existing `export interface Mou { ... }` block with:

```ts
export interface Mou {
  id: string;
  workspaceId?: string;
  branchId: string;
  outletId?: string | null;
  outletName?: string;
  partnerName: string;
  mouType: string;
  submissionDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: MouStatus;
  picName?: string;
  picPhone?: string;
  docPath?: string;
  compensationValue?: number;
  notes?: string;
  branch?: { id: string; code: string; name: string };
  outlet?: { id: string; code: string; name: string } | null;
}
```

This is a strict superset of the current interface — every existing field is preserved, so no consumer can break.

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: clean exit 0.

- [ ] **Step 3: Run the MOU test suites**

Run: `npm test -- src/lib/marcom/mouMachine.test.ts src/lib/marcom/placementMouBridge.test.ts`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "fix(types): add outletId and outlet relation to Mou interface"
```

---

### Task 3: Remove Speculative `photoUrls` Phantom Array from `Placement`

**Files:**
- Modify: `src/types/index.ts` (the `export interface Placement` block)
- Read: `prisma/schema.prisma` (model `Placement`)

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `Placement` no longer declares `photoUrls`

**Context:** `prisma.Placement` has a scalar `photoUrl String @default("")`. `Placement` declared a speculative `photoUrls?: string[]` that a repo-wide grep confirms is referenced **nowhere** except its own declaration. It violates YAGNI and falsely implies multi-photo support.

- [ ] **Step 1: Confirm zero usages before deleting**

Run: `grep -rnE "photoUrls" src/ prisma/`
Expected: exactly one hit — the declaration itself in `src/types/index.ts`. **If any other file references it, STOP** and reassess.

- [ ] **Step 2: Remove the `photoUrls?: string[];` line from `interface Placement`**

Keep the canonical `photoUrl?: string;` field untouched. Do not change any other property.

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: clean exit 0.

- [ ] **Step 4: Run the placement test suites**

Run: `npm test -- src/lib/marcom/placementMachine.test.ts src/lib/tasks/placementTaskSync.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts
git commit -m "refactor(types): remove unused speculative photoUrls array from Placement"
```

---

### Task 4: Normalize `DocumentStatus` Casing Across Schema, Data, Seed, Types, and View

**Files:**
- Modify: `prisma/schema.prisma` (model `DocumentItem`, line ~307)
- Modify: `prisma/seed.ts` (line ~548)
- Modify: `src/types/index.ts` (`DocumentItem.status`, line ~397)
- Modify: `src/app/api/marcom/documents/route.ts`
- Modify: `src/components/views/DocumentsView/DocumentsView.tsx`
- Read: `src/lib/marcom/documentWorkflow.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `DocumentItem.status?: DocumentStatus` (strict, no `| string`); all persisted rows uppercase

**Context:** The schema default is `"Draft"` (PascalCase) and 36 live rows are PascalCase: `Done|15, Draft|7, Pending|7, Submitted|7`. The frontend creates uppercase `"ACTIVE"`/`"DRAFT"`/`"ARCHIVED"` and works around the mismatch with `status?: DocumentStatus | string`. Everything converges on uppercase `"DRAFT" | "ACTIVE" | "ARCHIVED"`.

**Decision (approved):** collapse to 3 values. `Done` → `ACTIVE`, `Draft` → `DRAFT`, `Pending` → `ACTIVE`, `Submitted` → `ACTIVE`. The `Submitted`/`Pending` distinction is discarded.

> **Critical:** a blind `(status || "DRAFT").toUpperCase()` does **not** work. `"Done".toUpperCase()` is `"DONE"`, which is not a member of `DocumentStatus`. Explicit value mapping is mandatory, and the backfill must happen before the type is narrowed.

- [ ] **Step 1: Backfill existing rows (BEFORE touching the schema)**

Run:
```bash
psql "$DATABASE_URL" -c "UPDATE \"DocumentItem\" SET status = CASE status
  WHEN 'Done' THEN 'ACTIVE'
  WHEN 'Draft' THEN 'DRAFT'
  WHEN 'Pending' THEN 'ACTIVE'
  WHEN 'Submitted' THEN 'ACTIVE'
  ELSE upper(status) END;"
```

- [ ] **Step 2: Verify the backfill**

Run:
```bash
psql "$DATABASE_URL" -tAc "SELECT status, count(*) FROM \"DocumentItem\" GROUP BY status ORDER BY status;"
```
Expected: only `ACTIVE` (29) and `DRAFT` (7). **If any other value appears, STOP** — the type narrowing in Step 6 would be a lie.

- [ ] **Step 3: Change the schema default**

In `prisma/schema.prisma`, model `DocumentItem`:
```prisma
  status      String        @default("DRAFT")
```

- [ ] **Step 4: Apply the schema change to the database**

Run: `npx prisma db push`
Expected: the column default is altered to `'DRAFT'`.

> **Why `db push`:** see Task 1 Step 4. `migrate dev` cannot be used in this repo — it demands a full database reset. As with Task 1, run `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script` first and confirm the only pending change is the column default. Do **not** pass `--accept-data-loss`.

- [ ] **Step 5: Update `prisma/seed.ts`**

Replace line ~548:
```ts
const docStatuses = ["ACTIVE", "ACTIVE", "DRAFT", "ARCHIVED"] as const;
```

- [ ] **Step 6: Tighten `src/types/index.ts`**

Remove the `| string` escape hatch:
```ts
export type DocumentStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface DocumentItem {
  id: string;
  workspaceId?: string;
  name: string;
  category: string;
  period?: string;
  branchName?: string;
  ownerPic?: string;
  status?: DocumentStatus;
  fileType: DocFileType;
  fileSizeMb?: number;
  filePath: string;
  description?: string;
}
```

- [ ] **Step 7: Validate at the API boundary in `src/app/api/marcom/documents/route.ts`**

`status` is currently passed straight through to Prisma with no validation. Add a guard before the `prisma.documentItem.create` call:

```ts
const VALID_DOCUMENT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
type ValidDocumentStatus = (typeof VALID_DOCUMENT_STATUSES)[number];

const rawStatus = typeof status === "string" && status.trim() !== "" ? status.trim().toUpperCase() : "DRAFT";
if (!VALID_DOCUMENT_STATUSES.includes(rawStatus as ValidDocumentStatus)) {
  return NextResponse.json(
    { error: `Invalid status: '${status}'. Must be one of: ${VALID_DOCUMENT_STATUSES.join(", ")}` },
    { status: 400 },
  );
}
```
Then pass `status: rawStatus` in the `data` object instead of the raw `status`.

- [ ] **Step 8: Fix fallback strings in `src/components/views/DocumentsView/DocumentsView.tsx`**

The file mixes `"Active"`, `"active"`, and `"ACTIVE"`. Update:
- line ~54: `status: DocumentStatus | string;` → `status: DocumentStatus;`
- line ~187: `status: status || "Active"` → `status: status || "ACTIVE"`
- line ~390: `(row.original.status || "active").toLowerCase()` → `(row.original.status || "DRAFT").toLowerCase()`
- line ~402: `{row.original.status || "Active"}` → `{row.original.status || "DRAFT"}`
- line ~486: `status: "Active"` → `status: "ACTIVE"`
- line ~777: `(modalDocument.status || "ACTIVE").toUpperCase()` → `modalDocument.status || "ACTIVE"` (the value is already canonical; the redundant `.toUpperCase()` can go)

- [ ] **Step 9: Confirm `src/lib/marcom/documentWorkflow.ts` needs no change**

It already compares case-insensitively (`(doc.status || "").toLowerCase()` at line ~161 and line ~226). Since all persisted values are now uppercase, the comparisons remain correct. Run the test in Step 10 to confirm rather than editing speculatively.

- [ ] **Step 10: Verify TypeScript and unit tests**

Run: `npx tsc --noEmit`
Run: `npm test -- src/lib/marcom/documentWorkflow.test.ts`
Expected: exit 0, 0 failures.

- [ ] **Step 11: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts src/types/index.ts \
  src/app/api/marcom/documents/route.ts \
  src/components/views/DocumentsView/DocumentsView.tsx
git commit -m "fix(documents): normalize DocumentStatus casing to canonical uppercase across schema and UI"
```

---

### Task 5: Shared Content Taxonomy with Compile-Time Drift Guards

**Files:**
- Create: `src/lib/marcom/contentTaxonomy.ts`
- Modify: `src/app/api/marcom/content/route.ts`
- Modify: `src/app/api/marcom/content/[id]/route.ts`
- Read: `src/types/index.ts` (`PostPlatform`, `PostFormat`, `PostStatus`)

**Interfaces:**
- Consumes: `PostPlatform`, `PostFormat`, `PostStatus` from `@/types`
- Produces: `VALID_PLATFORMS`, `VALID_FORMATS`, `VALID_POST_STATUSES`, `isValidPlatform()`, `isValidFormat()`

**Context:** `ContentPost.platform` and `.format` are plain `String` columns in Prisma, so the API accepted arbitrary values while the frontend strictly types them. The original draft of this plan inlined the allowlists into both route files with **incorrect members** — it listed `feed`/`short`/`video` (not valid `PostFormat` values) and omitted `blog`/`press` (valid `PostPlatform` values), which would have caused both a compile error and a functional regression.

The fix is a **single shared module**, derived from SSoT with a compile-time exhaustiveness guard so it can never silently drift again.

- [ ] **Step 1: Create `src/lib/marcom/contentTaxonomy.ts`**

```ts
import type { PostFormat, PostPlatform, PostStatus } from "@/types";

/**
 * Canonical content taxonomy allowlists.
 *
 * These mirror the SSoT unions in `@/types`. The `satisfies` clauses plus the
 * exhaustiveness assertions below turn any drift into a compile error, so the
 * API can never silently accept a value the frontend cannot represent.
 */

export const VALID_PLATFORMS = [
  "instagram",
  "tiktok",
  "youtube",
  "linkedin",
  "facebook",
  "twitter",
  "blog",
  "press",
] as const satisfies readonly PostPlatform[];

export const VALID_FORMATS = [
  "reel",
  "carousel",
  "image",
  "story",
  "article",
  "thread",
] as const satisfies readonly PostFormat[];

export const VALID_POST_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "REVISION",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
] as const satisfies readonly PostStatus[];

// Compile-time exhaustiveness: if a new member is added to a SSoT union and not
// added above, these resolve to `never` and the assignments fail to typecheck.
type MissingPlatform = Exclude<PostPlatform, (typeof VALID_PLATFORMS)[number]>;
type MissingFormat = Exclude<PostFormat, (typeof VALID_FORMATS)[number]>;
type MissingStatus = Exclude<PostStatus, (typeof VALID_POST_STATUSES)[number]>;

const _assertNoMissingPlatform: MissingPlatform extends never ? true : never = true;
const _assertNoMissingFormat: MissingFormat extends never ? true : never = true;
const _assertNoMissingStatus: MissingStatus extends never ? true : never = true;

export function isValidPlatform(value: unknown): value is PostPlatform {
  return (
    typeof value === "string" &&
    (VALID_PLATFORMS as readonly string[]).includes(value.trim().toLowerCase())
  );
}

export function isValidFormat(value: unknown): value is PostFormat {
  return (
    typeof value === "string" &&
    (VALID_FORMATS as readonly string[]).includes(value.trim().toLowerCase())
  );
}
```

- [ ] **Step 2: Wire the taxonomy into `src/app/api/marcom/content/route.ts`**

Delete the local `VALID_POST_STATUSES` declaration (now imported) and add:

```ts
import {
  VALID_FORMATS,
  VALID_PLATFORMS,
  VALID_POST_STATUSES,
  isValidFormat,
  isValidPlatform,
} from "@/lib/marcom/contentTaxonomy";
```

In the `POST` handler, immediately after the existing required-field check (line ~110), insert:

```ts
  const normalizedPlatform = String(platform).trim().toLowerCase();
  if (!isValidPlatform(normalizedPlatform)) {
    return NextResponse.json(
      { error: `Invalid platform: '${platform}'. Must be one of: ${VALID_PLATFORMS.join(", ")}` },
      { status: 400 },
    );
  }

  const normalizedFormat = String(format || "reel").trim().toLowerCase();
  if (!isValidFormat(normalizedFormat)) {
    return NextResponse.json(
      { error: `Invalid format: '${format}'. Must be one of: ${VALID_FORMATS.join(", ")}` },
      { status: 400 },
    );
  }
```

Then replace the existing create payload lines so they use the normalized values:
```ts
        platform: normalizedPlatform,
        format: normalizedFormat,
```

- [ ] **Step 3: Wire the same taxonomy into `src/app/api/marcom/content/[id]/route.ts`**

This handler currently normalizes `platform`/`format` with no validation (lines 48-49) and assigns `status` completely unvalidated (line 53). Replace all three with:

```ts
  if (body.platform !== undefined) {
    const normalized = String(body.platform).trim().toLowerCase();
    if (!isValidPlatform(normalized)) {
      return NextResponse.json(
        { error: `Invalid platform: '${body.platform}'. Must be one of: ${VALID_PLATFORMS.join(", ")}` },
        { status: 400 },
      );
    }
    data.platform = normalized;
  }

  if (body.format !== undefined) {
    const normalized = String(body.format).trim().toLowerCase();
    if (!isValidFormat(normalized)) {
      return NextResponse.json(
        { error: `Invalid format: '${body.format}'. Must be one of: ${VALID_FORMATS.join(", ")}` },
        { status: 400 },
      );
    }
    data.format = normalized;
  }

  if (body.status !== undefined) {
    if (!(VALID_POST_STATUSES as readonly string[]).includes(String(body.status))) {
      return NextResponse.json(
        { error: `Invalid status: '${body.status}'. Must be one of: ${VALID_POST_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }
    data.status = body.status;
  }
```

Each guard is nested inside its own `!== undefined` check, so a partial update never rejects an absent field. Add the same import block used in Step 2.

- [ ] **Step 4: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: clean exit 0. If the exhaustiveness assertions fire, a SSoT union and the allowlist disagree — fix the allowlist, do not weaken the assertion.

- [ ] **Step 5: Run the content test suite**

Run: `npm test -- src/lib/marcom/contentAndEventsTypes.test.ts`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/marcom/contentTaxonomy.ts src/app/api/marcom/content/route.ts "src/app/api/marcom/content/[id]/route.ts"
git commit -m "feat(content): add shared content taxonomy with drift guards and enforce API validation"
```

---

### Task 6: Export and Integrate `MaterialType` in Frontend Domain Types

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/marcom/placementMouBridge.ts`
- Read: `prisma/schema.prisma` (`enum MaterialType`)

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `MaterialType` union; `MaterialItem.type: MaterialType`; `Placement.material.type: MaterialType`

**Context:** Prisma declares `enum MaterialType { POSTER SHOPBLIND BANNER BRANDING_SIGNBOARD OTHER_MATERIALS }` and `Material.type` is that enum. A live query confirms all 5 rows already hold canonical enum tokens. Meanwhile the frontend types `MaterialItem.type` as generic `string`, so `placementMouBridge.ts` hardcodes the literal tokens at lines 96-98.

> **Do not write `MaterialType | string`.** That union collapses to `string` and delivers zero type safety — it would make this entire task cosmetic. Type the fields strictly.

> **Legacy tokens:** `isPermanentMaterial` also handles two non-enum tokens, `"PERMANENT"` and `"TEMPORARY"`, which exist for legacy/freeform callers. `MaterialIdentifier.type` is a heuristic boundary and must stay `string | null`; only the persisted domain fields get strict typing.

- [ ] **Step 1: Export `MaterialType` and type the material fields strictly in `src/types/index.ts`**

Replace the `MaterialItem` interface (line ~508):

```ts
export type MaterialType =
  | "POSTER"
  | "SHOPBLIND"
  | "BANNER"
  | "BRANDING_SIGNBOARD"
  | "OTHER_MATERIALS";

export interface MaterialItem {
  id: string;
  name: string;
  type: MaterialType;
  requiresMou?: boolean;
}
```

Then update **all three** embedded material shapes. Find them with:
```bash
grep -n "type: string; name: string\|type: string }" src/types/index.ts
```
At the time of writing these are lines ~293 (`Placement.material`), ~321 (`MarcomPlacement.material`), and ~381 (the outlet-detail interface's `placements[]` entry). Change each to:

```ts
material?: { id: string; type: MaterialType; name: string };
```

- [ ] **Step 2: Refactor `placementMouBridge.ts` to name the taxonomy**

Add the import and replace the hardcoded Tier 2 comparisons (lines ~94-109) with named constants:

```ts
import type { MaterialType } from "@/types";

/** MaterialType members that permanently brand an outlet and require an MoU. */
const PERMANENT_MATERIAL_TYPES = [
  "BRANDING_SIGNBOARD",
  "SHOPBLIND",
] as const satisfies readonly MaterialType[];

/** MaterialType members that are temporary by nature. */
const TEMPORARY_MATERIAL_TYPES = ["POSTER", "BANNER"] as const satisfies readonly MaterialType[];

/** Legacy freeform tokens accepted from unclassified callers. */
const LEGACY_PERMANENT_TOKENS = ["PERMANENT"] as const;
const LEGACY_TEMPORARY_TOKENS = ["TEMPORARY"] as const;
```

Then rewrite the Tier 2 block:

```ts
  // Tier 2: Domain Taxonomy mapping (Prisma MaterialType enum + legacy tokens)
  if (explicitType) {
    if (
      PERMANENT_MATERIAL_TYPES.some((t) => t === explicitType) ||
      LEGACY_PERMANENT_TOKENS.some((t) => t === explicitType)
    ) {
      return true;
    }
    if (
      TEMPORARY_MATERIAL_TYPES.some((t) => t === explicitType) ||
      LEGACY_TEMPORARY_TOKENS.some((t) => t === explicitType)
    ) {
      return false;
    }
  }
```

Note `explicitType` is `string | undefined` (uppercased at line ~79), so `.some((t) => t === explicitType)` is used rather than `.includes()`, which would not typecheck against a literal-tuple array.

- [ ] **Step 3: Run the bridge unit tests**

Run: `npm test -- src/lib/marcom/placementMouBridge.test.ts`
Expected: all pass. This suite is the behavioral contract for `isPermanentMaterial` — if it goes red, the refactor changed semantics, not just names.

- [ ] **Step 4: Verify full test suite and TypeScript compilation**

Run: `npx tsc --noEmit`
Run: `npm test`
Expected: 0 TypeScript errors, 546 tests passing across 70 suites.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/lib/marcom/placementMouBridge.ts
git commit -m "fix(types): export canonical MaterialType matching Prisma enum and integrate in placementMouBridge"
```

---

## Verification Checklist

- [ ] `npx prisma validate` passes with 0 errors.
- [ ] `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script` reports **no pending changes** after the final task (proves database ↔ `schema.prisma` are in sync).
- [ ] `git status --short` shows no unintended files; no migration files were created.
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `npm test` runs with 0 failures across the entire suite (546 tests / 70 suites).
- [ ] `psql "$DATABASE_URL" -tAc "SELECT count(*) FROM \"Mou\" WHERE status::text='ON_PROGRESS';"` returns `0`.
- [ ] `psql "$DATABASE_URL" -tAc "SELECT DISTINCT status FROM \"DocumentItem\";"` returns only `ACTIVE` and `DRAFT`.
- [ ] `interface Mou` includes `outletId?: string | null` and `outlet?: { id; code; name } | null`.
- [ ] `photoUrls` is completely absent from `interface Placement`.
- [ ] `DocumentItem.status` is typed strictly as `DocumentStatus` — no `| string`.
- [ ] `grep -rn "type: string; name: string" src/types/index.ts` returns no material shapes.
- [ ] `grep -rn "MaterialType | string" src/` returns nothing.
- [ ] `POST /api/marcom/content` rejects an invalid platform or format with `400`.
- [ ] `POST /api/marcom/content` accepts `blog` and `press` (regression guard for the original plan's truncated allowlist).
- [ ] `PATCH /api/marcom/content/[id]` rejects an invalid `platform`, `format`, or `status` with `400`, while still accepting a partial payload that omits all three.
- [ ] `MaterialType` is exported from `src/types/index.ts` and consumed in `placementMouBridge.ts`.
- [ ] All 7 atomic commits recorded cleanly on branch `vicky` (6 task commits plus the Task 4 fix-round commit `f87a566`).

---

## Revision Notes (2026-09-27)

This plan was corrected after a critical review against the live codebase and database. The following defects were found in the first draft and are fixed above:

| # | Original defect | Severity | Fix |
|---|---|---|---|
| 1 | Task 1 used `npx prisma generate` only — no schema change applied. The DB enum would have stayed at 6 values while the client expected 5. | **Blocking** | Steps 3-4 now run `prisma validate` + `prisma db push`. Migrations were **not** used: the repo's `prisma/migrations/` history is an abandoned 10-of-17-table snapshot, so `migrate dev` detects permanent drift and demands a full database reset. `db push` syncs `schema.prisma` → database directly; the commit contains only `prisma/schema.prisma`. |
| 2 | Task 4 changed the column default with no schema change applied. | **Blocking** | Steps 3-4 apply the default via `prisma db push` (same substitution as row 1), after the data backfill in Steps 1-2. |
| 3 | Task 4 had no data backfill, and `(status \|\| "DRAFT").toUpperCase()` maps `"Done"` → `"DONE"`, which is not a valid `DocumentStatus`. 36 rows affected; `Pending`/`Submitted` had no defined target. | **Blocking** | Steps 1-2 backfill and verify **before** narrowing; explicit CASE mapping approved by the user. |
| 4 | Task 5's `VALID_FORMATS` listed `feed`/`short`/`video` (not `PostFormat` members) and omitted `image`/`article`/`thread`. Typed `readonly PostFormat[]`, so this was a hard compile error. | **Blocking** | Replaced with a shared module derived from SSoT via `satisfies` + exhaustiveness assertions. |
| 5 | Task 5's `VALID_PLATFORMS` omitted `blog` and `press` — the API would have rejected valid posts with `400`. | Regression | Full 8-member list; explicit regression-guard checklist item. |
| 6 | Task 5 duplicated the allowlist across two route files — recreating the exact divergence class this plan exists to fix. Also risky to export non-route consts from a Next.js `route.ts`. | Design | Single `contentTaxonomy.ts` module imported by both routes. |
| 7 | Task 6's `MaterialType \| string` collapses to `string`, giving zero type safety and making the task cosmetic. | Pointless | Strict `MaterialType`; legacy `PERMANENT`/`TEMPORARY` tokens handled explicitly as named constants. |
| 8 | Task 1 Step 3's "defensive fallback for dirty records" would be unreachable dead code post-schema-push. | YAGNI | Replaced with a pre-flight SQL assertion that fails loudly if the schema push cannot succeed. |

**Verified correct in the original draft:** Task 1's premise that nothing produces `MouStatus.ON_PROGRESS` (confirmed in `seed.ts:222-230` and by live query); Task 2's premise that `Mou` is missing `outletId`/`outlet` (the replacement is a strict superset); Task 3's claim that `photoUrls` has zero usages; Task 6's premise that `MaterialType` is absent from the frontend.

---

## Execution Outcome (2026-09-27)

All 6 tasks are complete, plus the Task 4 fix-round commit, plus the final whole-branch review fix wave. Branch: `vicky`.

**Final verified state:**

- `npx tsc --noEmit` → exit 0.
- `npm test` → **546 tests / 70 suites / 0 failures** after the 6 plan tasks; **553 tests / 70 suites / 0 failures** after the fix wave added the taxonomy tests (7 new tests).
- `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script` → **empty** (database ↔ `schema.prisma` in sync). Verified during plan execution; not re-run in the fix wave (database work is frozen).
- `SELECT count(*) FROM "Mou" WHERE status::text = 'ON_PROGRESS'` → **0**.
- `SELECT DISTINCT status FROM "DocumentItem"` → only **`ACTIVE`** and **`DRAFT`**.
- **18/18** runtime content-taxonomy assertions pass, plus **7/7** document-taxonomy assertions.

**Commits (7):**

| SHA | Subject |
|---|---|
| `e483d65` | fix(schema): align Prisma MouStatus enum with domain state machine |
| `e985861` | fix(types): add outletId and outlet relation to Mou interface |
| `6c7992e` | refactor(types): remove unused speculative photoUrls array from Placement |
| `ad6f385` | fix(documents): normalize DocumentStatus casing to canonical uppercase across schema and UI |
| `f87a566` | fix(documents): validate status in PATCH handler against canonical allowlist |
| `bb99694` | feat(content): add shared content taxonomy with drift guards and enforce API validation |
| `77a9c5d` | fix(types): export canonical MaterialType matching Prisma enum and integrate in placementMouBridge |

**Deployment caveat (unresolved, human decision required):** the schema changes were applied with `prisma db push` and therefore record **nothing** in `prisma/migrations/`. They are **not reproducible via `prisma migrate deploy`**. A staging or production pipeline that runs `migrate deploy` will not apply the `MouStatus` enum narrowing or the `DocumentItem.status` default change — the target database will silently keep the old shape. Reproducing them elsewhere requires re-running the equivalent `db push` against that environment (or hand-authoring and committing a real migration). This caveat is recorded here only; the deploy contract is deliberately not encoded in `AGENTS.md` or the README.

