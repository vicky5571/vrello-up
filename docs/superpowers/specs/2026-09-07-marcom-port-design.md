# Design: Full Port of Marketing & Communication Dashboard into VrelloUp

- Date: 2026-09-07
- Approach: A — native views (approved; options B lift-and-shift and C reports-first rejected)
- Skills: using-superpowers, brainstorming (architectural path), ponytail (implementation)

## 1. Context

VrelloUp (`vrello-up`) is a Next.js task/workspace manager: Zustand + localStorage
store, Auth.js Google sign-in, List/Board/Table/Calendar/Gantt/Home/Channel views,
31 `node --test` suites, `/` First Load JS at 241 kB.

The marketing-and-communication-reporting-dashboard is a Next.js field-marketing
reporting system (branches, outlets, MOUs, placements, events, documents, monthly
reports, analytics). Verified during exploration:

- It runs 100% on mock data: zero `@prisma/client` imports, API routes serve
  `src/data/*`, all state in `AppContext` useState. Its Postgres/Prisma schema
  is aspirational.
- UI kit: Radix primitives, cmdk palette, recharts, TanStack Table, framer-motion,
  sonner — 8 pages (~300-420 lines each), 6 module modals, AppShell/Header/Sidebar.
- RBAC: `hasPermission(role, action)` with roles admin/staff/viewer and 11 actions.

"Full functionality" therefore means: 8 pages + RBAC matrix + mock datasets as
seed data. No live backend behavior must be preserved.

## 2. Decisions (approved)

1. **Data layer: Prisma + Postgres now.** New `prisma/schema.prisma` in vrello-up,
   `DATABASE_URL=postgresql://postgres@localhost:5432/vrelloup` for dev (server
   verified reachable; RLS migration already proved against it).
2. **Media: local uploads.** Multipart uploads to gitignored `uploads/` volume,
   direct preview, no transcoding. S3/R2 later via credential handoff.
3. **RBAC: ported as-is.** Dashboard admin/staff/viewer semantics enforced.

## 3. Data model

- `User.role` becomes the enum `admin | staff | viewer`. Seed migration:
  Lead Architect→admin, Senior Frontend→staff, Designer→staff. Free-text titles dropped.
- New models: `Branch` 1—N `Outlet`; `Material` + `Placement` (outlet×material join
  with status + proofs); `Mou` (DRAFT→SUBMITTED→APPROVED/DONE/REJECTED);
  `MarcomEvent` + `EventFootage`; `DocumentItem`; `MonthlyReport` with
  activities/achievements/issues/action-plans as `Json` arrays (one table, not four).
- Dropped: `NotificationItem` (toasts cover it), `BackgroundTaskJob` (no worker).
- Existing task domain stays on Zustand/localStorage. Raw-SQL
  `supabase/migrations/0001` remains the RLS reference for a future task-domain pass.

## 4. API + RBAC

- Routes under `src/app/api/marcom/*`, one file per entity (`branches`, `outlets`,
  `mous`, `placements`, `events`, `documents`, `reports`): GET list with the
  dashboard's query filters (region/status/search) + POST; `[id]` routes for
  PATCH/DELETE.
- AuthN via Auth.js `auth()` → workspace member. AuthZ via ported `hasPermission`
  + 11-action matrix in `src/lib/marcom/guards.ts`.
- MOU state machine enforced server-side (only SUBMITTED→APPROVED/DONE/REJECTED).
- `APPROVE_MOU` gates MOU transitions; `MANAGE_MASTER_DATA` gates
  branch/outlet/material writes; `DELETE_DOCUMENT`/`DELETE_MOU` gate deletes.
- `useMarcomPermissions()` hook mirrors gating in UI (server is source of truth).
- 401 unauthenticated / 403 forbidden + toast. No service-role key near the client.

## 5. Views + shell

- New `ViewMode` entries: `branches`, `mous`, `placements`, `events`, `documents`,
  `reports`, `analytics`. All `next/dynamic` with the shared `ViewFallback`
  spinner (bundle budget stays flat).
- ViewSwitcher gains a grouped "Marketing" section. Hotkeys 1-5 unchanged; new
  views reachable via switcher + CommandPalette search entries.
- CRUD tables reuse vrello-up's TanStack setup + bulk-action bar (no second table
  system). Dialogs follow CreateTaskModal/TaskDrawer patterns (no Radix, no cmdk).
- Analytics adds `recharts` (only justified new dep alongside `prisma`).
- Reports render `Json` sections; export reuses JSON-download pattern.
- Density prefs apply to new tables; dark mode via existing `next-themes` tokens.

## 6. Uploads + media

- `POST /api/marcom/uploads`: multipart, 25 MB cap, pdf/png/jpg/mp4 allowlist,
  uuid-prefixed sanitized filenames under `uploads/documents/<id>/`,
  `uploads/events/<id>/`. Returns relative path stored on the record.
- Served via `GET /api/marcom/files/[...path]` with membership re-check (never a
  public static dir).
- `UPLOAD_DOCUMENT` / `UPLOAD_VIDEO_FOOTAGE` enforced in-route. Previews: `<img>`,
  `<video controls>`, PDF iframe. No transcoding states.
- Ceiling: local disk doesn't survive multi-instance deploys; `filePath` is shaped
  for a later key swap to S3/R2.

## 7. Rollout (each slice shippable, app stays green)

1. Prisma setup + schema + adapted seed → `prisma migrate dev`, row-count verified.
2. RBAC guards + branches end-to-end (API + view + tests) as the pattern proof.
3. Remaining entities, then shell wiring (switcher, palette, help text).
4. Gates per slice: `tsc`, `node --test`, `next build` (First Load JS must not regress).

## 8. Testing

- `node --test` suites: permission matrix, MOU state machine, placement
  transitions, upload validation (type/size/path-traversal).
- Old dashboard repo: frozen as reference until parity, then archived. Datasets
  adapted (ids/timestamps normalized); components rebuilt, not copied.

## 9. Open items (require user input, block their slice only)

- Production Postgres connection string + hosted disk/S3 decision for uploads.
- Whether seed demo data ships in prod or dev-only.
