# Eliminate Duplicate State (Phase 2: ContentPlanner, Reports & Derived Master Data) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate redundant `useState` arrays and `useEffect` sync cascades across `ContentPlannerView`, `ReportsView`, `PlacementsView`, `MousView`, and `EventsView` by establishing `useMarcomDataStore` as the sole Single Source of Truth (SSOT) and deriving master data projections using `useMemo`.

**Architecture:** Extend `useMarcomDataStore` with scoped async fetch actions (`fetchPosts`, `fetchReports`, `fetchDocuments`) and cache mutation helpers (`addCachedPost`, `addCachedReport`). Convert `ContentPlannerView` and `ReportsView` to reactive Zustand selectors (`postsByWorkspace`, `reportsByWorkspace`, `documentsByWorkspace`). Replace duplicated local `useState` arrays and `useEffect` sync listeners for master data projections (`branches`, `outletsList`, `materialsList`, `mousList`) across `PlacementsView`, `MousView`, `EventsView`, and `ContentPlannerView` with pure `useMemo` derivations directly from store master data.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Zustand 5, Node native test runner (`node --test`).

**Spec:** Problem #3: State Duplication (Zustand Cache vs Component useState) — Phase 2 Completion.

---

## Global Constraints

- Source code, variable/type names, inline code comments, technical specs/plans, and git commit messages MUST strictly remain in English.
- Single source of truth for domain types must remain in `src/types/index.ts`.
- Never mutate state objects in-place in Zustand actions (always use immutable spreads).
- All 532+ existing unit tests must continue to pass with 0 regressions.
- No new external runtime dependencies; use standard Zustand 5 store patterns and React `useMemo`.

---

### Task 1: Store Actions & Unit Tests in `marcomDataStore.ts`

**Files:**
- Modify: `src/lib/marcom/marcomDataStore.ts`
- Test: `src/lib/marcom/marcomDataStore.test.ts`

**Interfaces:**
- Produces: `fetchPosts: (workspaceId: string, force?: boolean) => Promise<ContentPostItem[]>`
- Produces: `addCachedPost: (workspaceId: string, post: ContentPostItem) => void`
- Produces: `fetchReports: (workspaceId: string, force?: boolean) => Promise<MonthlyReport[]>`
- Produces: `addCachedReport: (workspaceId: string, report: MonthlyReport) => void`
- Produces: `fetchDocuments: (workspaceId: string, force?: boolean) => Promise<DocumentItem[]>`

- [ ] **Step 1: Write the failing tests in `marcomDataStore.test.ts`**

Add tests for `fetchPosts`, `addCachedPost`, `fetchReports`, `addCachedReport`, and `fetchDocuments`:

```ts
    it("fetchPosts returns empty array immediately if workspaceId is empty without calling fetch", async () => {
      const store = useMarcomDataStore.getState();
      const res = await store.fetchPosts("");
      assert.deepEqual(res, []);
    });

    it("fetchPosts returns cached posts when available without refetching", async () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-cached-posts";
      const dummyPosts = [
        {
          id: "post-1",
          workspaceId: wsId,
          title: "Cached Post",
          platform: "INSTAGRAM" as const,
          format: "FEED" as const,
          status: "DRAFT" as const,
        },
      ];
      store.setCachedPosts(wsId, dummyPosts as unknown as ContentPostItem[]);

      const res = await store.fetchPosts(wsId);
      assert.deepEqual(res, dummyPosts);
    });

    it("adds cached posts immutably without duplicates", () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-test-post";
      const initial: ContentPostItem = {
        id: "post-1",
        workspaceId: wsId,
        title: "Test Post",
        platform: "TIKTOK" as const,
        format: "REEL" as const,
        status: "IDEA" as const,
      } as unknown as ContentPostItem;

      store.addCachedPost(wsId, initial);
      assert.equal(useMarcomDataStore.getState().postsByWorkspace[wsId]?.length, 1);
      assert.equal(useMarcomDataStore.getState().postsByWorkspace[wsId]?.[0].title, "Test Post");

      // Adding duplicate ID replaces or keeps single entry
      store.addCachedPost(wsId, { ...initial, title: "Test Post Updated" });
      assert.equal(useMarcomDataStore.getState().postsByWorkspace[wsId]?.length, 1);
      assert.equal(useMarcomDataStore.getState().postsByWorkspace[wsId]?.[0].title, "Test Post Updated");
    });

    it("fetchReports and fetchDocuments return empty array if workspaceId is empty", async () => {
      const store = useMarcomDataStore.getState();
      assert.deepEqual(await store.fetchReports(""), []);
      assert.deepEqual(await store.fetchDocuments(""), []);
    });

    it("adds cached reports immutably", () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-test-rep";
      const initial: MonthlyReport = {
        id: "rep-1",
        workspaceId: wsId,
        month: "October",
        year: 2026,
        summary: {},
        activities: [],
        achievements: [],
        keyIssues: [],
        actionPlans: [],
      } as unknown as MonthlyReport;

      store.addCachedReport(wsId, initial);
      assert.equal(useMarcomDataStore.getState().reportsByWorkspace[wsId]?.length, 1);
      assert.equal(useMarcomDataStore.getState().reportsByWorkspace[wsId]?.[0].month, "October");
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/marcom/marcomDataStore.test.ts`
Expected: FAIL with `store.fetchPosts is not a function` or similar.

- [ ] **Step 3: Implement store actions in `marcomDataStore.ts`**

Update `MarcomDataState` interface and `useMarcomDataStore` implementation:

```ts
  // In MarcomDataState interface:
  fetchPosts: (workspaceId: string, force?: boolean) => Promise<ContentPostItem[]>;
  addCachedPost: (workspaceId: string, post: ContentPostItem) => void;
  fetchReports: (workspaceId: string, force?: boolean) => Promise<MonthlyReport[]>;
  addCachedReport: (workspaceId: string, report: MonthlyReport) => void;
  fetchDocuments: (workspaceId: string, force?: boolean) => Promise<DocumentItem[]>;

  // In create<MarcomDataState>:
  fetchPosts: async (workspaceId: string, force = false) => {
    if (!workspaceId) return [];
    const state = get();
    const cached = state.postsByWorkspace[workspaceId];
    if (cached && !force) {
      return cached;
    }
    try {
      const res = await fetch(`/api/marcom/content?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (!res.ok) throw new Error(`Failed to fetch content posts (${res.status})`);
      const json = await res.json();
      const list: ContentPostItem[] = Array.isArray(json.data) ? json.data : [];
      set((s) => ({
        postsByWorkspace: { ...s.postsByWorkspace, [workspaceId]: list },
      }));
      return list;
    } catch (err) {
      console.error("[marcomDataStore] fetchPosts error:", err);
      return cached || [];
    }
  },

  addCachedPost: (workspaceId: string, post: ContentPostItem) => {
    set((s) => {
      const existing = s.postsByWorkspace[workspaceId] || [];
      return {
        postsByWorkspace: {
          ...s.postsByWorkspace,
          [workspaceId]: [post, ...existing.filter((p) => p.id !== post.id)],
        },
      };
    });
  },

  fetchReports: async (workspaceId: string, force = false) => {
    if (!workspaceId) return [];
    const state = get();
    const cached = state.reportsByWorkspace[workspaceId];
    if (cached && !force) {
      return cached;
    }
    try {
      const res = await fetch(`/api/marcom/reports?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (!res.ok) throw new Error(`Failed to fetch reports (${res.status})`);
      const json = await res.json();
      const list: MonthlyReport[] = Array.isArray(json.data) ? json.data : [];
      set((s) => ({
        reportsByWorkspace: { ...s.reportsByWorkspace, [workspaceId]: list },
      }));
      return list;
    } catch (err) {
      console.error("[marcomDataStore] fetchReports error:", err);
      return cached || [];
    }
  },

  addCachedReport: (workspaceId: string, report: MonthlyReport) => {
    set((s) => {
      const existing = s.reportsByWorkspace[workspaceId] || [];
      return {
        reportsByWorkspace: {
          ...s.reportsByWorkspace,
          [workspaceId]: [report, ...existing.filter((r) => r.id !== report.id)],
        },
      };
    });
  },

  fetchDocuments: async (workspaceId: string, force = false) => {
    if (!workspaceId) return [];
    const state = get();
    const cached = state.documentsByWorkspace[workspaceId];
    if (cached && !force) {
      return cached;
    }
    try {
      const res = await fetch(`/api/marcom/documents?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (!res.ok) throw new Error(`Failed to fetch documents (${res.status})`);
      const json = await res.json();
      const list: DocumentItem[] = Array.isArray(json.data) ? json.data : [];
      set((s) => ({
        documentsByWorkspace: { ...s.documentsByWorkspace, [workspaceId]: list },
      }));
      return list;
    } catch (err) {
      console.error("[marcomDataStore] fetchDocuments error:", err);
      return cached || [];
    }
  },
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npm test -- src/lib/marcom/marcomDataStore.test.ts`
Expected: PASS (all tests passing).

- [ ] **Step 5: Commit**

```bash
git add src/lib/marcom/marcomDataStore.ts src/lib/marcom/marcomDataStore.test.ts
git commit -m "feat(marcom): add scoped fetch and mutation actions for posts, reports, and documents"
```

---

### Task 2: Eliminate Duplicate State in `ContentPlannerView.tsx`

**Files:**
- Modify: `src/components/views/ContentPlannerView/ContentPlannerView.tsx`

**Interfaces:**
- Consumes: `postsByWorkspace`, `fetchPosts`, `addCachedPost`, `updateCachedPost`, `removeCachedPost`, `branches` from `useMarcomDataStore`

- [ ] **Step 1: Replace local `posts` and `branches` `useState` with reactive store selectors and `useMemo`**

In `src/components/views/ContentPlannerView/ContentPlannerView.tsx`:

1. Define fallback constant outside component:
```ts
const EMPTY_POSTS: ContentPostItem[] = [];
```

2. Replace store extraction and state hooks:
```ts
  const {
    fetchBranches,
    branches: storeBranches,
    updateCachedPost,
    removeCachedPost,
    addCachedPost,
  } = useMarcomDataStore();

  const posts = useMarcomDataStore(
    (s) => s.postsByWorkspace[activeWorkspaceId] ?? EMPTY_POSTS,
  );
  const storeFetchPosts = useMarcomDataStore((s) => s.fetchPosts);

  const branches = useMemo(
    () => storeBranches.map((b) => ({ id: b.id, name: b.name })),
    [storeBranches]
  );

  const [isLoading, setIsLoading] = useState(
    () => !Boolean(useMarcomDataStore.getState().postsByWorkspace[activeWorkspaceId])
  );
```

3. Update `fetchPosts` callback to delegate to `storeFetchPosts` without local `setPosts` and `setBranches`:
```ts
  const fetchPosts = useCallback(
    async (options?: { silent?: boolean } | React.SyntheticEvent) => {
      const isSilent =
        options && "silent" in options ? Boolean(options.silent) : false;
      if (!isSilent) setIsLoading(true);
      setError(null);
      try {
        await Promise.all([
          storeFetchPosts(activeWorkspaceId, !isSilent),
          fetchBranches(),
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load content posts");
      } finally {
        setIsLoading(false);
      }
    },
    [activeWorkspaceId, storeFetchPosts, fetchBranches]
  );
```

4. In `handleSavePost` (line ~368):
After `const savedItem: ContentPostItem = await res.json();`:
Replace `await fetchPosts();` with:
```ts
addCachedPost(activeWorkspaceId, savedItem);
```

5. In `handleDrawerUpdate` (line ~458):
Delete `setPosts((prev) => prev.map((p) => (p.id === savedItem.id ? savedItem : p)));`. Keep `updateCachedPost(activeWorkspaceId, savedItem);` which reactively updates `posts`.

6. In `handleDrawerDelete` (line ~491):
Delete `setPosts((prev) => prev.filter((p) => p.id !== id));`. Keep `removeCachedPost(activeWorkspaceId, id);` which reactively updates `posts`.

7. In table `onDeleteOne` (line ~1224):
Delete manual refetch; `removeCachedPost(activeWorkspaceId, id)` reactively removes the post.

- [ ] **Step 2: Run test suite to verify no regressions**

Run: `npm test`
Expected: 0 failures.

- [ ] **Step 3: Commit**

```bash
git add src/components/views/ContentPlannerView/ContentPlannerView.tsx
git commit -m "refactor(marcom): eliminate duplicate posts and branches state in ContentPlannerView"
```

---

### Task 3: Eliminate Duplicate State in `ReportsView.tsx`

**Files:**
- Modify: `src/components/views/ReportsView/ReportsView.tsx`

**Interfaces:**
- Consumes: `reportsByWorkspace`, `documentsByWorkspace`, `fetchReports`, `fetchDocuments`, `addCachedReport` from `useMarcomDataStore`

- [ ] **Step 1: Replace local `reports` and `documents` `useState` with reactive store selectors**

In `src/components/views/ReportsView/ReportsView.tsx`:

1. Define fallback constants outside component:
```ts
const EMPTY_REPORTS: MarcomReport[] = [];
const EMPTY_DOCS: MarcomDocument[] = [];
```

2. Replace store extraction and state hooks:
```ts
  const rawReports = useMarcomDataStore(
    (s) => s.reportsByWorkspace[activeWorkspaceId] ?? EMPTY_REPORTS,
  );
  const reports = rawReports as unknown as MarcomReport[];

  const rawDocs = useMarcomDataStore(
    (s) => s.documentsByWorkspace[activeWorkspaceId] ?? EMPTY_DOCS,
  );
  const documents = rawDocs as unknown as MarcomDocument[];

  const storeFetchReports = useMarcomDataStore((s) => s.fetchReports);
  const storeFetchDocuments = useMarcomDataStore((s) => s.fetchDocuments);
  const addCachedReport = useMarcomDataStore((s) => s.addCachedReport);

  const [isLoading, setIsLoading] = useState(
    () =>
      !Boolean(useMarcomDataStore.getState().reportsByWorkspace[activeWorkspaceId]) &&
      !Boolean(useMarcomDataStore.getState().documentsByWorkspace[activeWorkspaceId])
  );
```

3. Update `fetchReports` callback:
```ts
  const fetchReports = useCallback(
    async (options?: { silent?: boolean } | React.SyntheticEvent) => {
      const isSilent =
        options && "silent" in options ? Boolean(options.silent) : false;
      if (!isSilent) setIsLoading(true);
      setError(null);
      try {
        await Promise.all([
          storeFetchReports(activeWorkspaceId, !isSilent),
          storeFetchDocuments(activeWorkspaceId, !isSilent),
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load reports");
      } finally {
        setIsLoading(false);
      }
    },
    [activeWorkspaceId, storeFetchReports, storeFetchDocuments]
  );
```

4. In report creation submit handler (`POST /api/marcom/reports`):
```ts
  const savedReport: MonthlyReport = await res.json();
  addCachedReport(activeWorkspaceId, savedReport);
```

- [ ] **Step 2: Run test suite to verify no regressions**

Run: `npm test`
Expected: 0 failures.

- [ ] **Step 3: Commit**

```bash
git add src/components/views/ReportsView/ReportsView.tsx
git commit -m "refactor(marcom): eliminate duplicate reports and documents state in ReportsView"
```

---

### Task 4: Derive Master Data Projections with `useMemo` across Views

**Files:**
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx`
- Modify: `src/components/views/MousView/MousView.tsx`
- Modify: `src/components/views/EventsView/EventsView.tsx`

**Interfaces:**
- Consumes: `storeOutlets`, `storeMaterials`, `storeBranches`, `storeMous` from `useMarcomDataStore`

- [ ] **Step 1: Clean up `PlacementsView.tsx`**

1. Replace `outletsList`, `materialsList`, `mousList` `useState`:
```ts
  const outletsList = useMemo(
    () => storeOutlets.map((o) => ({ id: o.id, name: o.name, brand: o.brand, picName: o.picName, branchId: o.branchId })),
    [storeOutlets]
  );
  const materialsList = useMemo(
    () => storeMaterials.map((m) => ({ id: m.id, name: m.name, type: m.type, requiresMou: m.requiresMou })),
    [storeMaterials]
  );
  const storeMous = useMarcomDataStore(
    (s) => s.mousByWorkspace[activeWorkspaceId] ?? EMPTY_MOUS,
  );
  const mousList: MouSummaryInfo[] = storeMous;
```

2. In `loadData`: remove `setOutletsList`, `setMaterialsList`, and `setMousList`. The `Promise.all` still triggers the store fetchers (`fetchPlacements`, `fetchOutlets`, `fetchMaterials`, `fetchBranches`, `fetchMous`) which populate store state and automatically recompute memoized projections.

- [ ] **Step 2: Clean up `MousView.tsx`**

1. Replace `branches` and `outletsList` `useState`:
```ts
  const branches = useMemo(
    () => storeBranches.map((b) => ({ id: b.id, name: b.name, code: b.code })),
    [storeBranches]
  );
  const outletsList = useMemo(
    () => storeOutlets.map((o) => ({ id: o.id, name: o.name, code: o.code, branchId: o.branchId })),
    [storeOutlets]
  );
```

2. Remove the two `useEffect` blocks syncing `storeBranches` -> `setBranches` and `storeOutlets` -> `setOutletsList`.
3. In `loadMous`: remove `setBranches(...)` and `setOutletsList(...)`.

- [ ] **Step 3: Clean up `EventsView.tsx`**

1. Replace `branches` `useState`:
```ts
  const storeBranches = useMarcomDataStore((s) => s.branches);
  const branches = useMemo(
    () => storeBranches.map((b) => ({ id: b.id, name: b.name })),
    [storeBranches]
  );
```
2. In `loadData`: remove `setBranches(branchList)`.

- [ ] **Step 4: Run test suite to verify no regressions**

Run: `npm test`
Expected: 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/components/views/PlacementsView/PlacementsView.tsx src/components/views/MousView/MousView.tsx src/components/views/EventsView/EventsView.tsx
git commit -m "refactor(marcom): replace duplicate master data useState and useEffect with useMemo"
```

---

### Task 5: Full Verification & Typecheck

**Files:**
- All touched files

- [ ] **Step 1: Run the fast targeted store tests**

Run: `npm test -- src/lib/marcom/marcomDataStore.test.ts`
Expected: 0 failures.

- [ ] **Step 2: Run full unit test suite**

Run: `npm test`
Expected: All 532+ tests passing.

- [ ] **Step 3: Run TypeScript typecheck**

Run: `npx tsc --noEmit`
Expected: 0 type errors.
