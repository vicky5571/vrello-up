# Architecture Reference: Data Scoping & Entity Boundaries

## 1. Architectural Overview & Core Invariants

The `vrello-up` platform enforces a strict two-tier data boundary between **Global Master Data** and **Workspace-Scoped Operational Data**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ORGANIZATION GLOBAL MASTER DATA                       │
│  (Shared across all workspaces; no workspaceId; persistent infrastructure)   │
│                                                                             │
│    ┌──────────────┐          ┌──────────────┐          ┌────────────────┐   │
│    │    Branch    │◀─────────┤    Outlet    │          │    Material    │   │
│    └──────────────┘          └──────────────┘          └────────────────┘   │
└──────────────────────────────────────┬──────────────────────────┬───────────┘
                                       │                          │
                                       ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WORKSPACE-SCOPED OPERATIONAL WORK ITEMS                  │
│       (Isolated by workspaceId; cascades on workspace deletion)              │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        WorkspaceItem (ws-main, ...)                 │   │
│   │   ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │   │
│   │   │  Placement   │  │     Mou     │  │ FieldEvent  │  │ContentPost│ │   │
│   │   └──────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │   │
│   │   ┌─────────────────────────────────────────────────────────────┐   │   │
│   │   │  SpaceItem ──▶ FolderItem ──▶ ListItem ──▶ TaskItem         │   │   │
│   │   └─────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Entity Scoping Matrix

| Entity | Scope | `workspaceId` Field? | Relation to `WorkspaceItem` | Lifecycle on Workspace Deletion | UI Behavior on Workspace Switch |
|---|---|---|---|---|---|
| **`Branch`** | Global Master Data | ❌ No | None | Preserved | Unchanged across workspaces |
| **`Outlet`** | Global Master Data | ❌ No | None | Preserved | Unchanged across workspaces |
| **`Material`** | Global Master Data | ❌ No | None | Preserved | Unchanged across workspaces |
| **`Placement`** | Operational Work Item | ✅ Yes (`String @default("ws-main")`) | `onDelete: Cascade` | Automatically deleted | Refreshed & filtered to active workspace |
| **`Mou`** | Operational Work Item | ✅ Yes (`String @default("ws-main")`) | `onDelete: Cascade` | Automatically deleted | Refreshed & filtered to active workspace |
| **`FieldEvent`** | Operational Work Item | ✅ Yes (`String @default("ws-main")`) | `onDelete: Cascade` | Automatically deleted | Refreshed & filtered to active workspace |
| **`ContentPost`** | Operational Work Item | ✅ Yes (`String @default("ws-main")`) | `onDelete: Cascade` | Automatically deleted | Refreshed & filtered to active workspace |
| **`MonthlyReport`**| Operational Work Item | ✅ Yes (`String @default("ws-main")`) | `onDelete: Cascade` | Automatically deleted | Refreshed & filtered to active workspace |
| **`DocumentItem`** | Operational Work Item | ✅ Yes (`String @default("ws-main")`) | `onDelete: Cascade` | Automatically deleted | Refreshed & filtered to active workspace |
| **`SpaceItem`** | Operational Work Item | ✅ Yes (`String`) | `onDelete: Cascade` | Automatically deleted | Refreshed & filtered to active workspace |
| **`TaskItem`** | Operational Work Item | Indirect (via `listId` → `spaceId` → `workspaceId`) | Cascaded via `ListItem` | Automatically deleted | Refreshed & filtered to active workspace |

---

## 3. Why This Separation Exists (Design Rationale)

### 3.1. Why Master Data (`Branch`, `Outlet`, `Material`) Has NO `workspaceId`
1. **Physical Reality & Single Source of Truth**:
   - A telecom distribution network consists of ~25,000 physical retail stores and regional offices in Central Java.
   - A physical store exists regardless of whether a marketing campaign is running.
   - If `Outlet` were scoped by `workspaceId`, multiple workspaces would create duplicate records for the same store, fragmenting verified GPS coordinates, store history, and branch rollups.
2. **Cross-Campaign Analytics**:
   - Management needs to see historical branding across quarters and campaigns for a single outlet (e.g. "How many POSMs have been installed at Outlet X across Q1, Q2, and Q3 workspaces?"). Master Data sharing makes this a simple relational query (`outlet.placements`).
3. **Data Integrity for GPS Backfill**:
   - Field operations backfill GPS coordinates into `Outlet` records upon completing a placement (`status === 'DONE'`). Master Data enables that accurate location to benefit all teams immediately.

### 3.2. Why Operational Work Items HAVE `workspaceId`
1. **Team & Campaign Isolation**:
   - Placements, MOUs, Events, and Content Calendars represent operational initiatives with specific quarters, budgets, PICs, and deadlines.
   - Different teams or quarterly planning cycles operate in isolated workspaces without cluttering each other's views or dashboards.
2. **Clean Cascading Cleanup**:
   - When a test, archived, or temporary workspace is deleted, all operational records, tasks, attachments, and contracts belonging to it are deleted via `onDelete: Cascade` without corrupting the store network.

---

## 4. Engineering Rules & Invariants for Developers

1. **NEVER add `workspaceId` to `Branch`, `Outlet`, or `Material`**:
   - If a feature seems to need workspace-specific outlet data (e.g., "Outlet status in this campaign"), create a join model or record it on `Placement` or `Mou`. Do not alter the Master Data models.
2. **ALWAYS scope Operational Queries by `workspaceId`**:
   - Any query or API route for `Placement`, `Mou`, `FieldEvent`, `ContentPost`, `MonthlyReport`, or `DocumentItem` MUST include `where: { workspaceId: activeWorkspaceId }`.
   - Any Task query must verify list/space ownership within the workspace using `buildTaskTenantWhere` or relational queries.
3. **Frontend Cache Scoping (`marcomDataStore.ts`)**:
   - Master data is cached globally: `store.branches`, `store.outlets`, `store.materials`.
   - Operational items are cached by workspace key: `store.placementsByWorkspace[workspaceId]`, `store.mousByWorkspace[workspaceId]`, `store.postsByWorkspace[workspaceId]`.
   - When the user switches workspaces, the store automatically fetches or serves the cached data for that specific workspace key.
