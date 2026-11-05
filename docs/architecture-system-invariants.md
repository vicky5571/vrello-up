# Architecture System Invariants — vrello-up

> These rules are NON-NEGOTIABLE. Violations must be challenged and reverted.  
> Enforced by `scripts/drift-check.ts` (`npm run drift:check`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict) |
| Runtime | React 19 |
| Database | PostgreSQL via Prisma 6 |
| Auth | NextAuth v5 (beta) |
| State | Zustand 5 (sliced store) |
| Validation | Zod 4 |
| Styling | Tailwind CSS 4 |
| Testing | Node.js built-in `node:test` |
| E2E | Playwright |

---

## 1. SSOT — Single Source of Truth for Types

**Rule:** ALL domain entity interfaces, types, and enums MUST be defined in `src/types/index.ts` and imported from there. No inline interface redefinition in components, API handlers, hooks, or store slices.

**Violations:**
- Declaring `interface Placement { ... }` inside a component file → REJECT
- Duplicating `type Priority = ...` in a hook → REJECT
- Importing types from anywhere other than `src/types/index.ts` for domain entities → REJECT

**Enforcement:** `grep -rn "^export interface\|^export type" src/ --include="*.ts" --include="*.tsx" | grep -v "src/types/index.ts"`

---

## 2. Coordinator / God File Size Limit

**Rule:** No coordinator, store root, or view root file may exceed **250 lines**.

**Affected files (enforced):**
- `src/lib/store/useWorkspaceStore.ts`
- `src/app/**/page.tsx` root pages
- Any `*View.tsx` coordinator component

**When approaching limit:** Extract business logic to a dedicated slice/helper. Extract UI to atomic subcomponents. Use the Strangler Pattern.

**Enforcement:** `wc -l` check on designated coordinator files in drift-check script.

---

## 3. Tenant & Data Scoping Boundary

**Rule:** Global Master Data entities (`Branch`, `Outlet`, `Material`) MUST NEVER receive a `workspaceId` field or be filtered by workspace in queries.

**Rule:** System is **single-tenant by design** (one organization). There is no multi-workspace layer. All operational queries run unscoped (no `workspaceId` filter).

**Forbidden patterns:**
```ts
// FORBIDDEN — system is single-tenant
where: { workspaceId: someId }
requireWorkspaceAccess(...)
state.workspaces.find(ws => ws.id === activeWorkspaceId)
```

**Why:** See `docs/architecture-data-scoping.md` §3 for full rationale on master data immutability and single-tenant design decision.

---

## 4. No Raw `any` Types

**Rule:** `any` type is forbidden without an inline justification comment.

**Allowed:**
```ts
// @ts-expect-error: Prisma returns unknown shape for raw query result
const row = rawResult as any;
```

**Forbidden:**
```ts
const data: any = fetchSomething(); // no justification
```

---

## 5. Spec + Plan Pairing

**Rule:** Every feature implemented MUST have a matching spec and plan file.

- Spec: `docs/superpowers/specs/YYYY-MM-DD-<name>-design.md`
- Plan: `docs/superpowers/plans/YYYY-MM-DD-<name>.md`

Features without spec/plan pairing are considered undocumented drift and must be remediated before merge.

---

## 6. Test Coverage Gate

**Rule:** `npm test` MUST produce `fail 0` before any task is claimed complete.

**Rule:** No test may be deleted to make the suite pass. Broken tests must be fixed.

**Rule:** New business logic MUST be accompanied by at least one test in the relevant `*.test.ts` file.

---

## 7. TypeScript Strict Build

**Rule:** `npm run build:check` (`tsc --noEmit`) MUST produce 0 errors.

No `// @ts-ignore` without a paired `// reason:` comment on the same line.

---

## 8. Prisma Schema Conventions

- Operational models (Placement, Mou, FieldEvent, ContentPost, DocumentItem, MonthlyReport, SpaceItem) do NOT have `workspaceId`.
- Global Master Data models (Branch, Outlet, Material) never get workspace or tenant scoping fields.
- Every Prisma migration must be generated via `prisma migrate dev --name <descriptive-name>`.
- Never edit migration SQL files manually after generation.

---

## 9. API Route Conventions

- All API routes live under `src/app/api/`
- Marcom routes: `src/app/api/marcom/<resource>/route.ts` and `.../[id]/route.ts`
- Task routes: `src/app/api/tasks/`
- No `requireWorkspaceAccess` calls — system is single-tenant
- Auth guard via NextAuth session only

---

## 10. Store Architecture

- Zustand store is sliced: each domain has its own `createXSlice.ts` file
- Store coordinator: `src/lib/store/useWorkspaceStore.ts` (must stay ≤250 LOC)
- State shape: `spaces: Space[]` (flat — no workspace nesting)
- No `activeWorkspaceId` in store state
- Marcom data store: `src/lib/marcom/marcomDataStore.ts` — global cache, no workspace key

---

## 11. File Deletion Protocol

When deleting files:
1. Confirm no remaining imports reference the deleted file (`grep -rn "<filename>" src/`)
2. Delete
3. Run `npm run build:check` immediately — it will surface any missed imports

---

## 12. Git & Branch Convention

- Main working branch: `vicky`
- Feature branches: `feat/<name>` off `vicky`
- Commit format: see `AGENTS.md` §Git Commit Convention
- WIP commits: prefix `WIP: ` on subject line

---

## 13. Canonical 7-Layer Z-Index & Stacking Context Hierarchy (ADR-0039)

To prevent visual clipping, sibling element occlusion, and leakage between floating popovers and sticky table elements, the application strictly adheres to this 7-layer hierarchy:

| Layer | Value | Scope / Components | Invariant Rules |
| :--- | :--- | :--- | :--- |
| **Layer 0** | `isolate` / `z-0` | `MarcomTableShell`, Data Tables, View Content Wrappers | Must be enclosed with `isolation: isolate` (`isolate`). Prevents internal sticky headers/cells from leaking out. |
| **Layer 10** | `z-10` | Sticky Table Body Cells | Positioned inside Layer 0 only; strictly scoped to table rows. |
| **Layer 20** | `z-20` | Sticky Table Column Headers & Fixed Row Headers | Positioned inside Layer 0 only; stacks above Layer 10 rows. |
| **Layer 30** | `relative z-30` | Marcom View Headers & Filter Bars (`MousHeader`, etc.) | Stacks strictly above Layer 0 table shells. |
| **Layer 40** | `relative z-40` | Global Top Navigation (`TopNav.tsx`) | Stacks strictly above Layer 30 view headers. |
| **Layer 50** | `z-50` | Active `CustomDropdown` Container & Listbox Popover | Stacks strictly above headers and stage content when `isOpen = true`. |
| **Layer 60** | `fixed z-60` / `z-50` | Slide-Over Drawers (`AiDrawer`, `EventDrawer`) & Form Modals | Overlays stage and headers completely. |
| **Layer 70** | `z-[70]` / `z-50` | Command Palette, System Alerts, Global Toasts | Maximum viewport priority. |

