# Type Outlet Backfill Prisma Client (Issue #8c) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the untyped `prismaClient: any` parameter in `autoBackfillOutletGps` with an explicit, strictly typed union (`Pick<PrismaClient, "outlet"> | Prisma.TransactionClient`) to ensure compile-time type safety across standard and transactional Prisma calls.

**Architecture:** Export a clean type `OutletBackfillPrismaClient` from `src/lib/marcom/outletBackfill.ts` leveraging `@prisma/client`. Update `autoBackfillOutletGps` signature to use this type instead of `any`, ensuring queries (`findUnique`) and mutations (`update`) against master data `Outlet` are type-checked by the TypeScript compiler. Update unit test mocks to remove untyped `as any` casts.

**Tech Stack:** TypeScript 5, Prisma 6 (`@prisma/client`), Node native test runner (`node --test`)

**Spec:** Audit Issue #8c in `vrello-up-confusion-audit.md` — Unchecked Prisma Client Typing (`prismaClient: any`).

**Status:** ✅ Implemented 2026-09-27. Commit `9fddea8`.
Verification: `npm test` → **570 pass / 0 fail**; `npx tsc --noEmit` → **0 errors**;
`git status` → clean; **zero `any` / `as any` remain** in both files.

### Deviation 1 — the plan's import snippet breaks its own `@ts-expect-error`

Task 1, Step 1 reformats the test import to **multi-line**. That silently breaks
the file. Measured result of that exact snippet:

```
src/lib/marcom/outletBackfill.test.ts(3,1): error TS2578: Unused '@ts-expect-error' directive.
src/lib/marcom/outletBackfill.test.ts(8,8): error TS2305: Module '"./outletBackfill.ts"' has no exported member 'OutletBackfillPrismaClient'.
src/lib/marcom/outletBackfill.test.ts(9,8): error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
```

Because the errors land on the **specifier** lines (8 and 9), not on the line
after the directive, the directive is orphaned and reported as unused. The
import is kept on a **single line**, matching the convention used by every other
`@ts-expect-error` + `.ts`-extension import in this repo (e.g.
`src/lib/store/automationRules.test.ts:3-4`).

### Deviation 2 — Task 1 Step 2's expected "red" signal never fires

The step expects `npx tsc --noEmit` to FAIL with a missing-export error. It does
not. With the directive correctly placed above a single-line import, that same
`@ts-expect-error` suppresses **both** TS5097 and TS2305, so tsc exits clean even
though the export is absent. Measured: **0 errors** with the export missing.

This is not fixable without dropping the directive, and the directive is required
for Node's strip-types runner. The practical consequence is that this task has
**no compile-time red step**; correctness rests on the green verification in
Task 2 Step 3 and Task 3. Recorded here so nobody later mistakes the clean run
for proof the export already existed.

### Deviation 3 — test mocks use no `as any` at all

The plan's Goal claims "remove untyped `as any` casts", but its own Task 1 mocks
still contain three: `as any` on the `findUnique` return, `: any` on the `update`
destructure, and `as unknown as`. The inner two are redundant — a cast does not
contextually type its operand, so the delegate literal is not checked against
Prisma's signature and needs no `any`. Only the single bridging
`as unknown as OutletBackfillPrismaClient["outlet"]` remains, with `updatedData`
narrowed from `any` to `unknown`. Verified: zero `any` / `as any` in either file.

### Type-enforcement evidence (not just "tsc passed")

A clean `tsc` is weak evidence on its own — it is also what `any` produces. The
type was proven to be genuinely enforced with a temporary probe file:

- `autoBackfillOutletGps("not-a-client", …)` and `client.placement` were each
  flagged, i.e. both `@ts-expect-error` directives found real errors.
- **Negative control:** a directive placed on a *valid* access
  (`client.outlet`) was reported as `TS2578 Unused '@ts-expect-error' directive`,
  proving the probe mechanism fires. (Probe deleted.)

### Observation — the union's second member is structurally redundant

Measured: `Prisma.TransactionClient` is assignable to
`Pick<PrismaClient, "outlet">`, because `TransactionClient` is
`Omit<PrismaClient, ITXClientDenyList>` and the deny list does not touch `outlet`.
So `OutletBackfillPrismaClient` is effectively `Pick<PrismaClient, "outlet">`
and the `| Prisma.TransactionClient` member adds **documentation value, not
type-level strictness**.

Kept as written — it is the plan's specified interface, it is harmless, and it
signals that transaction clients are supported. Flagged only so the redundancy is
a known, deliberate choice rather than an unnoticed one.

---

## Global Constraints

- All source code, types, comments, variable names, and commit messages MUST be in English.
- Import domain types from `@/types` (SSoT) and database client types from `@prisma/client`.
- DO NOT introduce new dependencies or runtime overhead.
- Every task ends with passing tests and clean typechecking: `npm test && npx tsc --noEmit`.
- Commit after each task with conventional commit messages in English.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/lib/marcom/outletBackfill.ts` | **Modify** | Define and export `OutletBackfillPrismaClient` type; replace `prismaClient: any` in `autoBackfillOutletGps` |
| `src/lib/marcom/outletBackfill.test.ts` | **Modify** | Add compile-time and runtime tests for `OutletBackfillPrismaClient`; replace `as any` mock casts |

---

### Task 1: Add Type-Aware Test Cases to `outletBackfill.test.ts`

**Files:**
- Modify: `src/lib/marcom/outletBackfill.test.ts:45-95`

**Interfaces:**
- Consumes: `autoBackfillOutletGps`, `OutletBackfillPrismaClient` (to be exported from `outletBackfill.ts`)
- Produces: Type-safe tests without raw `as any` client casts.

- [x] **Step 1: Update mock Prisma client in `outletBackfill.test.ts` to be type-checked**

Import `OutletBackfillPrismaClient` in `src/lib/marcom/outletBackfill.test.ts`:

```typescript
// @ts-expect-error Node's strip-types runner requires explicit .ts extension
import {
  extractValidCoordinates,
  shouldBackfillOutlet,
  autoBackfillOutletGps,
  type OutletBackfillPrismaClient,
} from "./outletBackfill.ts";
```

Update the test fixtures at lines 47-72 and 76-94:
Replace `mockPrisma as any` with typed mock clients:

```typescript
test("autoBackfillOutletGps updates outlet when eligible", async () => {
  let updatedData: unknown = null;
  const mockPrisma: OutletBackfillPrismaClient = {
    outlet: {
      findUnique: async () => ({ id: "out-123", latitude: null, longitude: null } as any),
      update: async ({ where, data }: any) => {
        updatedData = { where, data };
        return { id: where.id, ...data };
      },
    } as unknown as OutletBackfillPrismaClient["outlet"],
  };

  const result = await autoBackfillOutletGps(mockPrisma, {
    outletId: "out-123",
    status: "DONE",
    latitude: -6.2088,
    longitude: 106.8456,
  });

  assert.equal(result.backfilled, true);
  assert.equal(result.outletId, "out-123");
  assert.equal(result.latitude, -6.2088);
  assert.equal(result.longitude, 106.8456);
  assert.deepEqual(updatedData, {
    where: { id: "out-123" },
    data: { latitude: -6.2088, longitude: 106.8456 },
  });
});

test("autoBackfillOutletGps skips update when outlet already has coordinates", async () => {
  let updateCalled = false;
  const mockPrisma: OutletBackfillPrismaClient = {
    outlet: {
      findUnique: async () => ({ id: "out-123", latitude: -6.1, longitude: 106.7 } as any),
      update: async () => {
        updateCalled = true;
      },
    } as unknown as OutletBackfillPrismaClient["outlet"],
  };

  const result = await autoBackfillOutletGps(mockPrisma, {
    outletId: "out-123",
    status: "DONE",
    latitude: -6.2088,
    longitude: 106.8456,
  });

  assert.equal(result.backfilled, false);
  assert.equal(updateCalled, false);
});
```

- [x] **Step 2: Run test to observe compiler error on missing export**

Run: `npx tsc --noEmit`
Expected: FAIL with `Module './outletBackfill.ts' has no exported member 'OutletBackfillPrismaClient'`.

---

### Task 2: Implement `OutletBackfillPrismaClient` in `outletBackfill.ts`

**Files:**
- Modify: `src/lib/marcom/outletBackfill.ts:1-70`

**Interfaces:**
- Consumes: `type { PrismaClient, Prisma } from "@prisma/client"`
- Produces:
  - `export type OutletBackfillPrismaClient = Pick<PrismaClient, "outlet"> | Prisma.TransactionClient;`
  - `export interface AutoBackfillPlacementInput { outletId: string; status: string; latitude?: number | null; longitude?: number | null; shareLocationUrl?: string | null; }`
  - `export async function autoBackfillOutletGps(prismaClient: OutletBackfillPrismaClient, placement: AutoBackfillPlacementInput): Promise<BackfillResult>`

- [x] **Step 1: Add Prisma imports and export types in `outletBackfill.ts`**

At the top of `src/lib/marcom/outletBackfill.ts`:

```typescript
import type { PrismaClient, Prisma } from "@prisma/client";
// @ts-expect-error Node strip-types requires explicit .ts extension
import { isValidCoordinate, parseGoogleMapsUrl, type Coordinates } from "./locationUtils.ts";

export type { Coordinates };

/**
 * Supported Prisma client types for outlet backfill:
 * Supports standard singleton PrismaClient, scoped delegates, or interactive $transaction clients.
 */
export type OutletBackfillPrismaClient =
  | Pick<PrismaClient, "outlet">
  | Prisma.TransactionClient;

export interface AutoBackfillPlacementInput {
  outletId: string;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  shareLocationUrl?: string | null;
}
```

- [x] **Step 2: Update `autoBackfillOutletGps` signature to use the typed client**

Replace line 65:

```typescript
/**
 * Automatically backfills outlet master coordinates from a completed placement if the outlet lacks GPS.
 */
export async function autoBackfillOutletGps(
  prismaClient: OutletBackfillPrismaClient,
  placement: AutoBackfillPlacementInput,
): Promise<BackfillResult> {
```

- [x] **Step 3: Run targeted test and TypeScript check**

Run: `npm test -- src/lib/marcom/outletBackfill.test.ts`
Expected: All tests in suite PASS.

Run: `npx tsc --noEmit`
Expected: 0 errors across the entire codebase.

- [x] **Step 4: Commit**

```bash
git add src/lib/marcom/outletBackfill.ts src/lib/marcom/outletBackfill.test.ts
git commit -m "refactor: type autoBackfillOutletGps prismaClient with OutletBackfillPrismaClient"
```

---

### Task 3: Full Verification & Caller Compatibility

**Files:**
- Existing callers:
  - `src/app/api/marcom/placements/[id]/route.ts:80`
  - `src/app/api/marcom/placements/route.ts:145,212`

**Interfaces:**
- Verify standard `prisma` singleton passed from `@/lib/db` conforms to `OutletBackfillPrismaClient` without type assertion errors.

- [x] **Step 1: Run full test suite**

Run: `npm test`
Expected: All 570 tests PASS, 0 failures.

- [x] **Step 2: Run full TypeScript compilation check**

Run: `npx tsc --noEmit`
Expected: Clean exit (0 errors).

- [x] **Step 3: Verify git status is clean**

Run: `git status`
Expected: Clean working tree.
