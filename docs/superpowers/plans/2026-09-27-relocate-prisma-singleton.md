# Relocate Prisma Singleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Prisma client singleton from `src/lib/marcom/db.ts` to `src/lib/db.ts` so generic infrastructure (tasks, workspaces, auth) no longer depends on a domain-specific module.

**Architecture:** Create `src/lib/db.ts` with the existing singleton logic (unchanged). Update all 29 import sites to point to `@/lib/db`. Convert `src/lib/marcom/db.ts` to a thin re-export shim with a deprecation comment — this preserves backward compatibility for any untracked imports or external tooling, and can be deleted later.

**Tech Stack:** TypeScript 5, Prisma (`@prisma/client`), Node test runner (`node --test`)

**Spec:** Identified in confusion audit, Issue #3.

## Global Constraints

- Zero behavior change — the Prisma singleton logic, `globalForPrisma` caching, dev-mode fallback URL, all stay identical.
- All 539 existing tests must pass after each task.
- No new dependencies.
- Commit after each task.

---

### Task 1: Create `src/lib/db.ts` and verify

**Files:**
- Create: `src/lib/db.ts`

**Interfaces:**
- Consumes: `@prisma/client` (already installed)
- Produces: `export const prisma: PrismaClient` — the canonical import for all server-side code

- [ ] **Step 1: Create `src/lib/db.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV !== "production"
    ? "postgresql://postgres@localhost:5432/vrelloup"
    : undefined);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(databaseUrl ? { datasourceUrl: databaseUrl } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

This is an exact copy of the current `src/lib/marcom/db.ts` content. No changes to logic.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No new errors related to `src/lib/db.ts`

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: 539 tests, 0 failures (new file has no side effects until imports switch)

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts
git commit -m "refactor: create canonical Prisma singleton at src/lib/db.ts"
```

---

### Task 2: Update all 29 import paths from `@/lib/marcom/db` → `@/lib/db`

**Files (Modify import line only in each):**

**Generic infrastructure (5 files — the core reason for this refactor):**
- `src/app/api/tasks/route.ts:2`
- `src/app/api/tasks/[id]/route.ts:2`
- `src/app/api/tasks/[id]/comments/route.ts:2`
- `src/app/api/workspaces/route.ts:2`
- `src/lib/server/workspaceAuth.ts:1`

**Shared query helper (1 file):**
- `src/lib/tasks/taskQuery.ts:1`

**Marcom API routes (23 files):**
- `src/app/api/marcom/analytics/route.ts:2`
- `src/app/api/marcom/branches/route.ts:3`
- `src/app/api/marcom/branches/[id]/route.ts:3`
- `src/app/api/marcom/content/route.ts:3`
- `src/app/api/marcom/content/[id]/route.ts:2`
- `src/app/api/marcom/documents/route.ts:3`
- `src/app/api/marcom/documents/[id]/route.ts:3`
- `src/app/api/marcom/events/route.ts:3`
- `src/app/api/marcom/events/[id]/route.ts:3`
- `src/app/api/marcom/materials/route.ts:3`
- `src/app/api/marcom/materials/[id]/route.ts:3`
- `src/app/api/marcom/mous/route.ts:3`
- `src/app/api/marcom/mous/[id]/route.ts:3`
- `src/app/api/marcom/outlets/route.ts:2`
- `src/app/api/marcom/outlets/[id]/route.ts:3`
- `src/app/api/marcom/outlets/[id]/approval/route.ts:2`
- `src/app/api/marcom/outlets/draft/route.ts:2`
- `src/app/api/marcom/pipeline/route.ts:2`
- `src/app/api/marcom/placements/route.ts:3`
- `src/app/api/marcom/placements/[id]/route.ts:3`
- `src/app/api/marcom/reports/route.ts:3`
- `src/app/api/marcom/reports/[id]/route.ts:3`
- `src/app/api/marcom/reports/draft/route.ts:2`

**Interfaces:**
- Consumes: `export const prisma` from Task 1's `src/lib/db.ts`
- Produces: No interface change — all files still use `prisma` the same way

- [ ] **Step 1: Replace imports in all 29 files**

The change in every file is identical — replace:
```ts
import { prisma } from "@/lib/marcom/db";
```
with:
```ts
import { prisma } from "@/lib/db";
```

Automated via `sed`:
```bash
find src/app/api src/lib/server src/lib/tasks -name '*.ts' \
  -exec grep -l '@/lib/marcom/db' {} \; \
  | xargs sed -i '' 's|from "@/lib/marcom/db"|from "@/lib/db"|g'
```

- [ ] **Step 2: Verify no remaining references (except `marcom/db.ts` itself)**

Run: `grep -rn '@/lib/marcom/db' src/ --include='*.ts' --include='*.tsx' | grep -v 'src/lib/marcom/db.ts'`
Expected: No output (zero remaining imports)

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: 539 tests, 0 failures

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: update all imports from @/lib/marcom/db to @/lib/db

Fixes inverted dependency where generic task/workspace/auth endpoints
depended on a domain-specific marcom module for database access."
```

---

### Task 3: Convert `src/lib/marcom/db.ts` to re-export shim

**Files:**
- Modify: `src/lib/marcom/db.ts` (replace contents)

**Interfaces:**
- Consumes: `export const prisma` from `src/lib/db.ts`
- Produces: Same `export { prisma }` for backward compatibility

- [ ] **Step 1: Replace `src/lib/marcom/db.ts` with re-export shim**

Replace the entire file content with:
```ts
/**
 * @deprecated Import from "@/lib/db" instead.
 * This re-export exists only for backward compatibility and will be removed.
 */
export { prisma } from "@/lib/db";
```

This ensures:
- Any untracked import (scripts, one-off tools, worktrees) won't break.
- IDE "find usages" on the old path reveals the deprecation notice.
- Future cleanup: delete this file once confident no references remain.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: 539 tests, 0 failures

- [ ] **Step 4: Commit**

```bash
git add src/lib/marcom/db.ts
git commit -m "refactor: convert marcom/db.ts to deprecated re-export shim"
```

---

## Post-Completion Verification

After all 3 tasks, run this final check:

```bash
# 1. Canonical import is in the right place
head -5 src/lib/db.ts

# 2. Old file is just a shim
cat src/lib/marcom/db.ts

# 3. No production code imports from the old path
grep -rn '@/lib/marcom/db' src/ --include='*.ts' --include='*.tsx' | grep -v 'src/lib/marcom/db.ts'
# Expected: no output

# 4. All tests pass
npm test
# Expected: 539 tests, 0 failures

# 5. Dependency direction is correct
echo "Generic → @/lib/db ✓"
echo "Marcom  → @/lib/db ✓"
echo "Generic → @/lib/marcom/* ✗ (no longer)"
```
