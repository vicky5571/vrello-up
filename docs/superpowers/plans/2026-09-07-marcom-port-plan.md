# Marcom Full-Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port all 8 marketing-dashboard modules into vrello-up as native Prisma-backed views with RBAC enforcement.

**Architecture:** New `prisma/schema.prisma` (Postgres) holds the 9 ported entities plus a `WorkspaceMember` table that makes API-side RBAC enforceable; Next.js route handlers under `src/app/api/marcom/*` own reads/writes; seven new `ViewMode` entries render via the repo's existing TanStack-table/modal patterns, all `next/dynamic`.

**Tech Stack:** Next.js 15.2, React 19, Prisma ^6 + `@prisma/client` ^6, PostgreSQL 16 (local dev `postgresql://postgres@localhost:5432/vrelloup`), recharts ^2, existing Zustand store (task domain untouched).

**Spec:** `docs/superpowers/specs/2026-09-07-marcom-port-design.md`

## Global Constraints

- `node --test --import ./test/register-alias.mjs` is the only test runner; test files use explicit `.ts` import extensions with `// @ts-expect-error` on the line above (see `src/lib/tasks/inlineEditing.test.ts`).
- Every new view ships as `next/dynamic` with `{ ssr: false }`; `/` First Load JS stays ≤ 260 kB (currently 241 kB).
- No Radix, no cmdk, no second table/modal/toast system; dark mode via existing `next-themes` tokens.
- No `TBD`/`TODO` markers; YAGNI ruthlessly; commit after every task.

---

## File Structure

- Create: `prisma/schema.prisma` — all ported models + `WorkspaceMember`; single source of truth for the marcom domain.
- Create: `prisma/seed.ts` — seeds members (role-mapped) + adapted dashboard mock datasets.
- Create: `src/lib/marcom/guards.ts` — `hasPermission`, 11-action matrix, `MarcomRole` type (pure, fully tested).
- Create: `src/lib/marcom/permissions.ts` — `useMarcomPermissions()` client hook (role of active member).
- Create: `src/lib/marcom/upload.ts` — `validateUpload()` pure validator (tested); route stays thin.
- Create: `src/lib/marcom/analytics.ts` — pure aggregators over Prisma rows (tested).
- Create: `src/app/api/marcom/[entity]/route.ts` + `[id]/route.ts` — Auth.js session → DB member → guard → Prisma.
- Create: `src/components/views/[Entity]View/[Entity]View.tsx` — one per module, TanStack table + bulk bar per `TableView.tsx` pattern.
- Modify: `src/types/index.ts` — `User.role` becomes `"admin" | "staff" | "viewer"`; `ViewMode` gains 7 entries.
- Modify: `src/components/layout/ViewSwitcher.tsx`, `src/app/page.tsx` — Marketing group + dynamic views.
- Test: `src/lib/marcom/*.test.ts` colocated with each unit (guards, state machine, upload validator, analytics).

---

### Task 1: Prisma setup, schema, member seed, migrate dev

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Modify: `package.json` (add `prisma`, `@prisma/client`, `seed` script)

**Interfaces:**
- Consumes: dashboard enums in `../marketing-and-communication-reporting-dashboard/prisma/schema.prisma` (Role, BranchStatus, MouStatus, PlacementStatus, EventStatus, MaterialType, OutletType, OutletTier); dashboard mock datasets in its `src/data/*.ts`.
- Produces: `WorkspaceMember { workspaceId, email, role }` (used by Task 2 guards + Task 4 routes); seeded row counts verifiable in Task 1 Step 4.

- [ ] **Step 1: Install deps**

```bash
npm install prisma@^6 @prisma/client@^6
```

- [ ] **Step 2: Write `prisma/schema.prisma`**

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum MarcomRole { admin staff viewer }
enum BranchStatus { DONE ON_PROGRESS PENDING }
enum MouStatus { DRAFT SUBMITTED ON_PROGRESS DONE REJECTED APPROVED }
enum PlacementStatus { NOT_STARTED ON_PROGRESS DONE ISSUE }
enum EventStatus { UPCOMING ON_PROGRESS COMPLETED CANCELLED }
enum OutletType { TRADITIONAL MODERN_RETAIL EXCLUSIVE CAMPUS_OUTLET }
enum OutletTier { TIER_1 TIER_2 TIER_3 }
enum MaterialType { POSTER SHOPBLIND BANNER BRANDING_SIGNBOARD OTHER_MATERIALS }
enum DocFileType { PDF XLSX DOCX ZIP CSV MP4 PNG JPG }

model WorkspaceMember {
  workspaceId String
  email       String
  role        MarcomRole @default(viewer)
  @@id([workspaceId, email])
}

model Branch {
  id String @id @default(cuid())
  code String @unique
  name String
  region String
  city String
  status BranchStatus @default(PENDING)
  picName String @default("")
  picPhone String @default("")
  address String @default("")
  outlets Outlet[]
  mous Mou[]
}

model Outlet {
  id String @id @default(cuid())
  code String @unique
  name String
  type OutletType
  tier OutletTier
  address String @default("")
  city String @default("")
  picName String @default("")
  picPhone String @default("")
  active Boolean @default(true)
  branchId String
  branch Branch @relation(fields: [branchId], references: [id], onDelete: Cascade)
  placements Placement[]
}

model Material {
  id String @id @default(cuid())
  type MaterialType
  name String
  placements Placement[]
}

model Placement {
  id String @id @default(cuid())
  outletId String
  outlet Outlet @relation(fields: [outletId], references: [id], onDelete: Cascade)
  materialId String
  material Material @relation(fields: [materialId], references: [id])
  status PlacementStatus @default(NOT_STARTED)
  date DateTime?
  picName String @default("")
  photoUrl String @default("")
  dimensions String @default("")
  cost Float @default(0)
  notes String @default("")
}

model Mou {
  id String @id @default(cuid())
  branchId String
  branch Branch @relation(fields: [branchId], references: [id], onDelete: Cascade)
  outletName String @default("")
  partnerName String
  mouType String
  submissionDate DateTime?
  startDate DateTime?
  endDate DateTime?
  status MouStatus @default(DRAFT)
  picName String @default("")
  docPath String @default("")
  compensationValue Float @default(0)
  notes String @default("")
}

model MarcomEvent {
  id String @id @default(cuid())
  name String
  date DateTime?
  endDate DateTime?
  location String @default("")
  branchName String @default("")
  picName String @default("")
  eventType String
  status EventStatus @default(UPCOMING)
  budget Float @default(0)
  attendeeCount Int @default(0)
  targetAttendee Int @default(0)
  notes String @default("")
  footage EventFootage[]
}

model EventFootage {
  id String @id @default(cuid())
  eventId String
  event MarcomEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  title String
  filePath String
  duration String @default("")
}

model DocumentItem {
  id String @id @default(cuid())
  name String
  category String
  period String @default("")
  branchName String @default("")
  ownerPic String @default("")
  status String @default("Draft")
  fileType DocFileType
  fileSizeMb Float @default(0)
  filePath String
  description String @default("")
}

model MonthlyReport {
  id String @id @default(cuid())
  month String
  year Int
  summary Json @default("{}")
  activities Json @default("[]")
  achievements Json @default("[]")
  keyIssues Json @default("[]")
  actionPlans Json @default("[]")
}
```

- [ ] **Step 3: Write `prisma/seed.ts`** — upserts 3 `WorkspaceMember` rows for `ws-main` from `SEED_USERS` with the role map `{Lead Architect: admin, Senior Frontend Engineer: staff, Product Designer: staff}` (match on email), then inserts every row of the dashboard's `mockBranches`, `mockOutlets`, `mockMous`, `mockPlacements`, `mockEvents`, `mockDocuments`, `mockMonthlyReports`, deriving `Material` rows from distinct placement material types. End the script with `console.log` counts per model.

- [ ] **Step 4: Migrate and verify counts**

```bash
DATABASE_URL=postgresql://postgres@localhost:5432/vrelloup npx prisma migrate dev --name marcom-port
DATABASE_URL=postgresql://postgres@localhost:5432/vrelloup npx prisma db seed
psql -U postgres -d vrelloup -c "select 'branches', count(*) from \"Branch\" union all select 'outlets', count(*) from \"Outlet\" union all select 'mous', count(*) from \"Mou\";"
```

Expected: counts equal each source file's `mockX.length` (compare with `grep -c` on the dashboard data files).

- [ ] **Step 5: Commit**

```bash
git add prisma package.json package-lock.json
git commit -m "feat(marcom): add Prisma schema, seed, and local migrate"
```

### Task 2: RBAC guards + matrix tests

**Files:**
- Create: `src/lib/marcom/guards.ts`
- Test: `src/lib/marcom/guards.test.ts`

**Interfaces:**
- Consumes: `WorkspaceMember.role` from Task 1.
- Produces: `hasPermission(role, action)`, `PermissionAction` (used by Task 4+ routes and `useMarcomPermissions`).

- [ ] **Step 1: Write the failing test** — all 3 roles × all 11 dashboard actions, admin all-true, viewer only `EXPORT_REPORTS`, staff the 7-action subset from `roles.guard.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { hasPermission } from "./guards.ts";

test("viewer can only export", () => {
  assert.equal(hasPermission("viewer", "EXPORT_REPORTS"), true);
  assert.equal(hasPermission("viewer", "APPROVE_MOU"), false);
});

test("staff cannot approve, delete, or manage master data", () => {
  assert.equal(hasPermission("staff", "CREATE_MOU"), true);
  assert.equal(hasPermission("staff", "APPROVE_MOU"), false);
  assert.equal(hasPermission("staff", "DELETE_DOCUMENT"), false);
  assert.equal(hasPermission("staff", "MANAGE_MASTER_DATA"), false);
});

test("admin can do everything", () => {
  const all = ["CREATE_MOU","APPROVE_MOU","DELETE_MOU","CREATE_PLACEMENT","UPDATE_PLACEMENT","CREATE_EVENT","UPLOAD_VIDEO_FOOTAGE","UPLOAD_DOCUMENT","DELETE_DOCUMENT","MANAGE_MASTER_DATA","EXPORT_REPORTS"] as const;
  for (const a of all) assert.equal(hasPermission("admin", a), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/marcom/guards.test.ts` (falls back to full `npm test` if the runner ignores the path filter)
Expected: FAIL with "Cannot find module './guards.ts'"

- [ ] **Step 3: Write minimal implementation** — port `PermissionAction`, `rolePermissions`, `hasPermission` verbatim from the dashboard's `src/backend/guards/roles.guard.ts` with `UserRole` renamed to `MarcomRole`:

```ts
export type MarcomRole = "admin" | "staff" | "viewer";
export type PermissionAction =
  | "CREATE_MOU" | "APPROVE_MOU" | "DELETE_MOU" | "CREATE_PLACEMENT"
  | "UPDATE_PLACEMENT" | "CREATE_EVENT" | "UPLOAD_VIDEO_FOOTAGE"
  | "UPLOAD_DOCUMENT" | "DELETE_DOCUMENT" | "MANAGE_MASTER_DATA" | "EXPORT_REPORTS";

const rolePermissions: Record<MarcomRole, PermissionAction[]> = {
  admin: ["CREATE_MOU","APPROVE_MOU","DELETE_MOU","CREATE_PLACEMENT","UPDATE_PLACEMENT","CREATE_EVENT","UPLOAD_VIDEO_FOOTAGE","UPLOAD_DOCUMENT","DELETE_DOCUMENT","MANAGE_MASTER_DATA","EXPORT_REPORTS"],
  staff: ["CREATE_MOU","CREATE_PLACEMENT","UPDATE_PLACEMENT","CREATE_EVENT","UPLOAD_VIDEO_FOOTAGE","UPLOAD_DOCUMENT","EXPORT_REPORTS"],
  viewer: ["EXPORT_REPORTS"],
};

export function hasPermission(role: MarcomRole, action: PermissionAction): boolean {
  return (rolePermissions[role] || []).includes(action);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"`
Expected: pass count rises, fail 0

- [ ] **Step 5: Commit**

```bash
git add src/lib/marcom/guards.ts src/lib/marcom/guards.test.ts
git commit -m "feat(marcom): add RBAC guard matrix with tests"
```

### Task 3: Branches API (pattern proof for all entities)

**Files:**
- Create: `src/app/api/marcom/branches/route.ts` (GET filtered list + POST)
- Create: `src/app/api/marcom/branches/[id]/route.ts` (PATCH + DELETE)
- Create: `src/lib/marcom/auth.ts` — `requireMember()` helper (Auth.js session email → `WorkspaceMember`; throws 401/403 `Response`)

**Interfaces:**
- Consumes: `hasPermission` (Task 2), Prisma client.
- Produces: route response shape `{ total, data }` matching the dashboard's branches route (all later entity routes copy it).

- [ ] **Step 1: Write `src/lib/marcom/auth.ts`**

```ts
import { auth } from "@/auth";
import { prisma } from "@/lib/marcom/db";
import type { MarcomRole } from "./guards";

export async function requireMember(workspaceId: string): Promise<MarcomRole> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw Response.json({ error: "Unauthorized" }, { status: 401 });
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_email: { workspaceId, email } },
  });
  if (!member) throw Response.json({ error: "Forbidden" }, { status: 403 });
  return member.role;
}
```

- [ ] **Step 2: Write the branches GET route** — same `region`/`status`/`q` filters as the dashboard's `src/app/api/branches/route.ts`, but over Prisma with `requireMember("ws-main")` first (readable by all roles; no guard check on GET).

- [ ] **Step 3: Verify manually** (routes need a live DB; no test-harness change for thin handlers)

```bash
npm run dev &
curl -s "http://localhost:3000/api/marcom/branches?region=ALL" | head -c 300
```

Expected: `{ "total": N, "data": [...] }` with N equal to the seeded branch count.

- [ ] **Step 4: Add POST/PATCH/DELETE** — POST requires any member; PATCH/DELETE require `MANAGE_MASTER_DATA` via `hasPermission(role, ...)` → 403 otherwise.

- [ ] **Step 5: Commit**

```bash
git add src/lib/marcom/auth.ts src/app/api/marcom/branches
git commit -m "feat(marcom): add branches API with RBAC enforcement"
```

### Task 4: BranchesView + shell wiring (pattern proof for all views)

**Files:**
- Create: `src/components/views/BranchesView/BranchesView.tsx`
- Modify: `src/types/index.ts` (`ViewMode` += `"branches"`, `User.role` → `"admin" | "staff" | "viewer"`)
- Modify: `src/components/layout/ViewSwitcher.tsx` (Marketing group + Branches tab), `src/app/page.tsx` (dynamic view + render branch)

**Interfaces:**
- Consumes: GET `/api/marcom/branches` shape from Task 3; TanStack bulk-bar pattern from `TableView.tsx:478-546`.
- Produces: the view pattern every later entity view copies (fetch-on-mount, dynamic import, switcher entry).

- [ ] **Step 1: Extend `ViewMode` and migrate seeds** — change `User.role?: string` to `role?: "admin" | "staff" | "viewer"`, update the three `SEED_USERS` roles per the Task 1 map, fix any `tsc` fallout in existing files, run `npx tsc --noEmit`.

- [ ] **Step 2: Write `BranchesView`** — client component fetching `/api/marcom/branches`, TanStack table (code, name, region, city, status, outlets, progress), row click → existing `setSelectedTaskId`? No: branches are not tasks — detail panel is a local expandable row (do NOT wire TaskDrawer). Bulk bar: delete selected, gated on the workspace member role read straight from the store (the `useMarcomPermissions()` hook formalizes this in Task 9).

- [ ] **Step 3: Wire shell** — `ViewSwitcher.tsx` gains `{ id: "branches", label: "Branches", ... }` under a "Marketing" group label; `page.tsx` adds the `dynamic()` import with `loading: () => <ViewFallback />` and an `activeView === "branches"` render branch mirroring the existing seven.

- [ ] **Step 4: Verify** — `npx tsc --noEmit`, `npm test` green, `npm run build` shows `/` First Load JS ≤ 260 kB.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/components/views/BranchesView src/components/layout/ViewSwitcher.tsx src/app/page.tsx
git commit -m "feat(marcom): add Branches view with shell wiring"
```

### Task 5: Outlets, materials, placements (+ transitions test)

**Files:**
- Create: API routes `outlets`, `placements`; views `OutletsView`, `PlacementsView`
- Test: `src/lib/marcom/placementMachine.test.ts` (pure transition validator)

**Interfaces:**
- Consumes: Task 3 route shape, Task 4 view pattern.
- Produces: nothing downstream (leaf).

- [ ] **Step 1: Write the failing transition test** — placements move `NOT_STARTED → ON_PROGRESS → DONE`, `ISSUE` reachable from any state, `DONE` is terminal:

```ts
import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { canTransitionPlacement } from "./placementMachine.ts";

test("placement lifecycle", () => {
  assert.equal(canTransitionPlacement("NOT_STARTED", "ON_PROGRESS"), true);
  assert.equal(canTransitionPlacement("NOT_STARTED", "DONE"), false);
  assert.equal(canTransitionPlacement("ON_PROGRESS", "ISSUE"), true);
  assert.equal(canTransitionPlacement("DONE", "ON_PROGRESS"), false);
});
```

- [ ] **Step 2: Run to verify it fails** — `npm test`, expect module-not-found failure.
- [ ] **Step 3: Implement `canTransitionPlacement`** in `src/lib/marcom/placementMachine.ts` + enforce it in PATCH `/api/marcom/placements/[id]` (400 on illegal jump) + build the two views by copying the Task 4 pattern.
- [ ] **Step 4: Verify** — `npm test` green, `npx tsc --noEmit` clean.
- [ ] **Step 5: Commit** — `git commit -m "feat(marcom): add outlets, materials, and placements with transition guard"`

### Task 6: MOUs + approval state machine

Same five-step shape as Task 5. Machine (`src/lib/marcom/mouMachine.ts`): `DRAFT → SUBMITTED → APPROVED | REJECTED`, `APPROVED → DONE`; `APPROVE_MOU` required for any transition out of `SUBMITTED` (checked in PATCH route after `requireMember`). Tests cover every edge including `DRAFT → APPROVED` rejected. Commit: `feat(marcom): add MOUs with approval state machine`.

### Task 7: Events, footage, documents, uploads

- [ ] **Step 1: Write failing tests for `validateUpload`** in `src/lib/marcom/upload.ts`: rejects `.exe` and 26 MB payloads, rejects `../` traversal names, accepts pdf/png/jpg/mp4 ≤ 25 MB.
- [ ] **Step 2-4: Implement validator + `POST /api/marcom/uploads`** (uuid-prefixed names under `uploads/<kind>/<id>/`, membership + `UPLOAD_DOCUMENT`/`UPLOAD_VIDEO_FOOTAGE` checks) + `GET /api/marcom/files/[...path]` (membership re-check, never a public dir) + `EventsView`/`DocumentsView` with `<video controls>` / iframe previews. Gitignore `uploads/`.
- [ ] **Step 5: Commit** — `git commit -m "feat(marcom): add events, documents, and local uploads"`

### Task 8: Reports + analytics

- [ ] **Step 1: Write failing tests for `src/lib/marcom/analytics.ts`** — `summarizeReports(rows)` over this exact fixture expects `{ total: 3, done: 2, completionRate: 67 }`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { summarizeReports } from "./analytics.ts";

const rows = [
  { month: "July 2026", summary: { totalActivities: 10, completionRate: 80 } },
  { month: "August 2026", summary: { totalActivities: 20, completionRate: 60 } },
  { month: "September 2026", summary: { totalActivities: 30, completionRate: 60 } },
];

test("summarizeReports totals reports and averages completion", () => {
  assert.deepEqual(summarizeReports(rows), {
    total: 3,
    totalActivities: 60,
    completionRate: 67,
  });
});
```
- [ ] **Step 2-4: Implement aggregators + `ReportsView`** (report sections from `Json` arrays, JSON-download export reusing the SettingsModal pattern) + `AnalyticsView` with `recharts` bar/line charts over branch completion and MOU funnel. Install `recharts@^2` in the analytics step only.
- [ ] **Step 5: Commit** — `git commit -m "feat(marcom): add reports and analytics views"`

### Task 9: Shell completion + final gates

- [ ] **Step 1: ViewSwitcher Marketing group** for all seven views, CommandPalette search entries per entity (reuse `CommandPalette.tsx` item pattern), `?` help text lists new views.
- [ ] **Step 2: `useMarcomPermissions()`** in `src/lib/marcom/permissions.ts` (role of `currentUserId`'s member) + gate create/edit/delete buttons in all seven views.
- [ ] **Step 3: Final gates** — `npx tsc --noEmit` clean, `npm test` all green, `npm run build` with `/` First Load JS ≤ 260 kB.
- [ ] **Step 4: Commit** — `git commit -m "feat(marcom): complete shell wiring for marketing views"`

### Task 10: Production readiness (spec §9)

- [ ] **Step 1: Provision production Postgres** and set `DATABASE_URL` in the hosting environment (never in `.env.example`, which keeps the placeholder). Run `npx prisma migrate deploy` against it.
- [ ] **Step 2: Decide seed policy** — dev-only seeds (`prisma/seed.ts` stays out of the deploy pipeline) vs demo data in prod. Record the decision as a comment at the top of `prisma/seed.ts`.
- [ ] **Step 3: Verify** — `GET /api/marcom/branches` against the production build returns seeded (or empty) data with a valid session; uploads directory is writable by the host user.
- [ ] **Step 4: Commit** — `git commit -m "chore(marcom): document production database and seed policy"`
