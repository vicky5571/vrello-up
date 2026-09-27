# Reactive Marcom Data Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate dual-state desynchronization and stale UI across Marcom views by promoting `useMarcomDataStore` to the reactive Single Source of Truth (SSOT), removing local `useState` array clones and ad-hoc fetchers in favor of reactive Zustand selectors and atomic cache mutation actions.

**Architecture:** Extend `useMarcomDataStore` with reactive fetchers (`fetchPlacements`) and immutable cache mutation actions (`addCachedPlacement`, `updateCachedPlacement`, `removeCachedPlacement`, alongside equivalents for MOUs and Field Events). Migrate views (`PlacementsView`, `EventsView`, `MousView`, and `QuarterlyPosmReportTab`) to select data directly from `useMarcomDataStore` using stable fallback selectors (`?? EMPTY_ARRAY`), replacing local array state and manual cache invalidation loops with instant reactive updates.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5, Zustand 5, TanStack Table v8, Node native test runner (`node --test`).

**Spec:** Problem #3: State Duplication (Zustand Cache vs Local Component `useState`) in Marcom Modules.

---

## Global Constraints

- Source code, type definitions, inline comments, technical plans, and commit messages MUST strictly be in English.
- Single source of truth for domain types must remain in `src/types/index.ts`.
- Never mutate state objects in-place in Zustand actions (always use immutable spreads).
- All 505+ existing unit tests must continue to pass with 0 regressions.
- No new external runtime dependencies; use standard Zustand 5 store patterns.

---

### Task 1: Store Actions & Unit Tests in `marcomDataStore.ts`

**Files:**
- Modify: `src/lib/marcom/marcomDataStore.ts`
- Test: `src/lib/marcom/marcomDataStore.test.ts`

**Interfaces:**
- Produces: `fetchPlacements: (workspaceId: string, force?: boolean) => Promise<MarcomPlacement[]>`
- Produces: `addCachedPlacement: (workspaceId: string, placement: MarcomPlacement) => void`
- Produces: `updateCachedPlacement: (workspaceId: string, placement: Partial<MarcomPlacement> & { id: string }) => void`
- Produces: `removeCachedPlacement: (workspaceId: string, placementId: string) => void`
- Produces: `addCachedMou: (workspaceId: string, mou: MarcomMou) => void`
- Produces: `updateCachedMou: (workspaceId: string, mou: Partial<MarcomMou> & { id: string }) => void`
- Produces: `removeCachedMou: (workspaceId: string, mouId: string) => void`
- Produces: `addCachedEvent: (workspaceId: string, event: FieldEventItem) => void`
- Produces: `updateCachedEvent: (workspaceId: string, event: Partial<FieldEventItem> & { id: string }) => void`
- Produces: `removeCachedEvent: (workspaceId: string, eventId: string) => void`

- [ ] **Step 1: Write the failing tests for new store actions in `marcomDataStore.test.ts`**

Add test cases in `src/lib/marcom/marcomDataStore.test.ts` under a new `describe("Reactive Mutation Actions")`:

```ts
  describe("Reactive Mutation Actions", () => {
    it("adds, updates, and removes cached placements immutably", () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-test-place";
      const initial: MarcomPlacement = {
        id: "p-1",
        workspaceId: wsId,
        outletId: "out-1",
        materialId: "mat-1",
        status: "NOT_STARTED",
      };

      store.addCachedPlacement(wsId, initial);
      assert.equal(useMarcomDataStore.getState().placementsByWorkspace[wsId]?.length, 1);
      assert.equal(useMarcomDataStore.getState().placementsByWorkspace[wsId]?.[0].status, "NOT_STARTED");

      store.updateCachedPlacement(wsId, { id: "p-1", status: "DONE" });
      assert.equal(useMarcomDataStore.getState().placementsByWorkspace[wsId]?.[0].status, "DONE");

      store.removeCachedPlacement(wsId, "p-1");
      assert.equal(useMarcomDataStore.getState().placementsByWorkspace[wsId]?.length, 0);
    });

    it("adds, updates, and removes cached MOUs immutably", () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-test-mou";
      const initial: MarcomMou = {
        id: "m-1",
        workspaceId: wsId,
        partnerName: "Partner A",
        status: "DRAFT",
      };

      store.addCachedMou(wsId, initial);
      assert.equal(useMarcomDataStore.getState().mousByWorkspace[wsId]?.length, 1);

      store.updateCachedMou(wsId, { id: "m-1", status: "APPROVED" });
      assert.equal(useMarcomDataStore.getState().mousByWorkspace[wsId]?.[0].status, "APPROVED");

      store.removeCachedMou(wsId, "m-1");
      assert.equal(useMarcomDataStore.getState().mousByWorkspace[wsId]?.length, 0);
    });

    it("adds, updates, and removes cached Field Events immutably", () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-test-evt";
      const initial: FieldEventItem = {
        id: "e-1",
        workspaceId: wsId,
        name: "Initial Event",
        status: "UPCOMING",
      };

      store.addCachedEvent(wsId, initial);
      assert.equal(useMarcomDataStore.getState().eventsByWorkspace[wsId]?.length, 1);

      store.updateCachedEvent(wsId, { id: "e-1", name: "Updated Event" });
      assert.equal(useMarcomDataStore.getState().eventsByWorkspace[wsId]?.[0].name, "Updated Event");

      store.removeCachedEvent(wsId, "e-1");
      assert.equal(useMarcomDataStore.getState().eventsByWorkspace[wsId]?.length, 0);
    });

    it("fetchPlacements returns empty array if workspaceId is empty", async () => {
      const store = useMarcomDataStore.getState();
      const res = await store.fetchPlacements("");
      assert.deepEqual(res, []);
    });

    it("fetchPlacements returns cached placements when available without refetching", async () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-cached-place";
      const dummy: MarcomPlacement[] = [
        { id: "pl-1", workspaceId: wsId, outletId: "o1", materialId: "m1", status: "ON_PROGRESS" },
      ];
      store.setCachedPlacements(wsId, dummy);

      const res = await store.fetchPlacements(wsId);
      assert.deepEqual(res, dummy);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/marcom/marcomDataStore.test.ts`
Expected: FAIL with `store.addCachedPlacement is not a function` or similar.

- [ ] **Step 3: Implement actions in `src/lib/marcom/marcomDataStore.ts`**

Update `MarcomDataState` interface and `useMarcomDataStore`:

```ts
// In MarcomDataState interface:
fetchPlacements: (workspaceId: string, force?: boolean) => Promise<MarcomPlacement[]>;
addCachedPlacement: (workspaceId: string, placement: MarcomPlacement) => void;
updateCachedPlacement: (
  workspaceId: string,
  placement: Partial<MarcomPlacement> & { id: string }
) => void;
removeCachedPlacement: (workspaceId: string, placementId: string) => void;

addCachedMou: (workspaceId: string, mou: MarcomMou) => void;
updateCachedMou: (
  workspaceId: string,
  mou: Partial<MarcomMou> & { id: string }
) => void;
removeCachedMou: (workspaceId: string, mouId: string) => void;

addCachedEvent: (workspaceId: string, event: FieldEventItem) => void;
updateCachedEvent: (
  workspaceId: string,
  event: Partial<FieldEventItem> & { id: string }
) => void;
removeCachedEvent: (workspaceId: string, eventId: string) => void;
```

And in `useMarcomDataStore` implementation:

```ts
fetchPlacements: async (workspaceId: string, force = false) => {
  if (!workspaceId) return [];
  const state = get();
  const cached = state.placementsByWorkspace[workspaceId];
  if (cached && !force) {
    return cached;
  }
  try {
    const res = await fetch(`/api/marcom/placements?workspaceId=${encodeURIComponent(workspaceId)}`);
    if (!res.ok) throw new Error(`Failed to fetch placements (${res.status})`);
    const json = await res.json();
    const list: MarcomPlacement[] = Array.isArray(json.data) ? json.data : [];
    set((s) => ({
      placementsByWorkspace: { ...s.placementsByWorkspace, [workspaceId]: list },
    }));
    return list;
  } catch (err) {
    console.error("[marcomDataStore] fetchPlacements error:", err);
    return cached || [];
  }
},

addCachedPlacement: (workspaceId: string, placement: MarcomPlacement) => {
  set((s) => {
    const existing = s.placementsByWorkspace[workspaceId] || [];
    return {
      placementsByWorkspace: {
        ...s.placementsByWorkspace,
        [workspaceId]: [placement, ...existing.filter((p) => p.id !== placement.id)],
      },
    };
  });
},

updateCachedPlacement: (
  workspaceId: string,
  placement: Partial<MarcomPlacement> & { id: string }
) => {
  set((s) => {
    const existing = s.placementsByWorkspace[workspaceId];
    if (!existing) return s;
    return {
      placementsByWorkspace: {
        ...s.placementsByWorkspace,
        [workspaceId]: existing.map((p) =>
          p.id === placement.id ? ({ ...p, ...placement } as MarcomPlacement) : p
        ),
      },
    };
  });
},

removeCachedPlacement: (workspaceId: string, placementId: string) => {
  set((s) => {
    const existing = s.placementsByWorkspace[workspaceId];
    if (!existing) return s;
    return {
      placementsByWorkspace: {
        ...s.placementsByWorkspace,
        [workspaceId]: existing.filter((p) => p.id !== placementId),
      },
    };
  });
},

addCachedMou: (workspaceId: string, mou: MarcomMou) => {
  set((s) => {
    const existing = s.mousByWorkspace[workspaceId] || [];
    return {
      mousByWorkspace: {
        ...s.mousByWorkspace,
        [workspaceId]: [mou, ...existing.filter((m) => m.id !== mou.id)],
      },
    };
  });
},

updateCachedMou: (
  workspaceId: string,
  mou: Partial<MarcomMou> & { id: string }
) => {
  set((s) => {
    const existing = s.mousByWorkspace[workspaceId];
    if (!existing) return s;
    return {
      mousByWorkspace: {
        ...s.mousByWorkspace,
        [workspaceId]: existing.map((p) =>
          p.id === mou.id ? ({ ...p, ...mou } as MarcomMou) : p
        ),
      },
    };
  });
},

removeCachedMou: (workspaceId: string, mouId: string) => {
  set((s) => {
    const existing = s.mousByWorkspace[workspaceId];
    if (!existing) return s;
    return {
      mousByWorkspace: {
        ...s.mousByWorkspace,
        [workspaceId]: existing.filter((m) => m.id !== mouId),
      },
    };
  });
},

addCachedEvent: (workspaceId: string, event: FieldEventItem) => {
  set((s) => {
    const existing = s.eventsByWorkspace[workspaceId] || [];
    return {
      eventsByWorkspace: {
        ...s.eventsByWorkspace,
        [workspaceId]: [event, ...existing.filter((e) => e.id !== event.id)],
      },
    };
  });
},

updateCachedEvent: (
  workspaceId: string,
  event: Partial<FieldEventItem> & { id: string }
) => {
  set((s) => {
    const existing = s.eventsByWorkspace[workspaceId];
    if (!existing) return s;
    return {
      eventsByWorkspace: {
        ...s.eventsByWorkspace,
        [workspaceId]: existing.map((e) =>
          e.id === event.id ? ({ ...e, ...event } as FieldEventItem) : e
        ),
      },
    };
  });
},

removeCachedEvent: (workspaceId: string, eventId: string) => {
  set((s) => {
    const existing = s.eventsByWorkspace[workspaceId];
    if (!existing) return s;
    return {
      eventsByWorkspace: {
        ...s.eventsByWorkspace,
        [workspaceId]: existing.filter((e) => e.id !== eventId),
      },
    };
  });
},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/marcom/marcomDataStore.test.ts`
Expected: PASS (all tests pass).

- [ ] **Step 5: Commit**

```bash
git add src/lib/marcom/marcomDataStore.ts src/lib/marcom/marcomDataStore.test.ts
git commit -m "feat(marcom): add reactive fetchPlacements and immutable mutation actions to marcomDataStore"
```

---

### Task 2: Reactive Migration of `PlacementsView.tsx` & `PlacementBulkActionBar.tsx`

**Files:**
- Modify: `src/components/views/PlacementsView/PlacementsView.tsx`
- Modify: `src/components/views/PlacementsView/PlacementBulkActionBar.tsx`

**Interfaces:**
- Consumes: `useMarcomDataStore((s) => s.placementsByWorkspace[activeWorkspaceId])`
- Consumes: `fetchPlacements: (workspaceId: string, force?: boolean) => Promise<MarcomPlacement[]>`
- Consumes: `addCachedPlacement`, `updateCachedPlacement`, `removeCachedPlacement`

- [ ] **Step 1: Refactor `PlacementsView.tsx` to read directly from Zustand reactive selector**

1. Define `const EMPTY_PLACEMENTS: MarcomPlacement[] = [];` outside the component.
2. Remove `const [placements, setPlacements] = useState<MarcomPlacement[]>(() => cachedPlacements || []);`.
3. Connect reactive selector:
   ```ts
   const placements = useMarcomDataStore(
     (s) => s.placementsByWorkspace[activeWorkspaceId] ?? EMPTY_PLACEMENTS
   );
   const fetchPlacements = useMarcomDataStore((s) => s.fetchPlacements);
   const addCachedPlacement = useMarcomDataStore((s) => s.addCachedPlacement);
   const updateCachedPlacement = useMarcomDataStore((s) => s.updateCachedPlacement);
   const removeCachedPlacement = useMarcomDataStore((s) => s.removeCachedPlacement);
   ```
4. Update `filteredPlacements` to filter by `selectedStatus`, `selectedBrand`, and `searchTerm` client-side from the reactive `placements` array:
   ```ts
   const filteredPlacements = useMemo(() => {
     const query = (marcomFilters["placements"] || "").toLowerCase().trim();
     return placements.filter((p) => {
       if (selectedStatus !== "ALL" && p.status !== selectedStatus) {
         return false;
       }
       if (selectedBrand !== "ALL") {
         const pBrand = (p.brand || "IM3").toUpperCase();
         const target = selectedBrand.toUpperCase();
         if ((target === "TRI" || target === "3") && pBrand !== "3" && pBrand !== "TRI") return false;
         if (target === "IM3" && pBrand !== "IM3") return false;
       }
       if (!query) return true;
       const outlet = p.outlet?.name?.toLowerCase() || "";
       const code = p.outlet?.code?.toLowerCase() || "";
       const material = p.material?.name?.toLowerCase() || "";
       const pic = p.picName?.toLowerCase() || "";
       const notes = p.notes?.toLowerCase() || "";
       const locNotes = p.locationNotes?.toLowerCase() || "";
       const brand = (p.brand || "").toLowerCase();
       return (
         outlet.includes(query) ||
         code.includes(query) ||
         material.includes(query) ||
         pic.includes(query) ||
         notes.includes(query) ||
         locNotes.includes(query) ||
         brand.includes(query)
       );
     });
   }, [placements, marcomFilters, selectedBrand, selectedStatus]);
   ```
5. Pass `data={filteredPlacements}` to `MarcomTableShell`.
6. Update `loadPlacements`:
   ```ts
   const loadPlacements = useCallback(
     async (force = false) => {
       if (!activeWorkspaceId) return;
       const hasCache = Boolean(useMarcomDataStore.getState().placementsByWorkspace[activeWorkspaceId]);
       if (!hasCache) setIsLoading(true);
       setError(null);
       try {
         const [, outletsData, materialsData] = await Promise.all([
           fetchPlacements(activeWorkspaceId, force),
           fetchOutlets(),
           fetchMaterials(),
           fetchBranches(),
           useMarcomDataStore.getState().fetchMous(activeWorkspaceId),
         ]);
         if (Array.isArray(outletsData) && outletsData.length > 0) {
           setOutletsList(outletsData.map((o) => ({ id: o.id, name: o.name, brand: o.brand, picName: o.picName, branchId: o.branchId })));
         }
         if (Array.isArray(materialsData) && materialsData.length > 0) {
           setMaterialsList(materialsData.map((m) => ({ id: m.id, name: m.name, type: m.type, requiresMou: m.requiresMou })));
         }
       } catch (e) {
         setError(e instanceof Error ? e.message : "Failed to load placements");
       } finally {
         setIsLoading(false);
       }
     },
     [activeWorkspaceId, fetchPlacements, fetchOutlets, fetchMaterials, fetchBranches]
   );

   useEffect(() => {
     loadPlacements();
   }, [loadPlacements]);
   ```
7. In `handleStatusFilter` and `handleBrandFilter`, simply update local filter state (`setSelectedStatus` / `setSelectedBrand`) without firing unnecessary network round-trips.
8. In `handleSavePlacement`:
   ```ts
   const jsonRes = await res.json().catch(() => ({}));
   const savedPlacement: MarcomPlacement = jsonRes.data || jsonRes;
   if (isEdit && id) {
     updateCachedPlacement(activeWorkspaceId, savedPlacement);
   } else {
     addCachedPlacement(activeWorkspaceId, savedPlacement);
   }
   fetchPlacements(activeWorkspaceId, true);
   ```
9. In `deleteOne`:
   ```ts
   const deleteOne = useCallback(
     async (id: string) => {
       const res = await fetch(`/api/marcom/placements/${id}`, { method: "DELETE" });
       if (res.ok) {
         removeCachedPlacement(activeWorkspaceId, id);
         invalidateMous(activeWorkspaceId);
       }
       return res.ok;
     },
     [activeWorkspaceId, removeCachedPlacement, invalidateMous],
   );
   ```

- [ ] **Step 2: Update `PlacementBulkActionBar.tsx` to refresh reactive store on bulk operations**

In `PlacementBulkActionBar.tsx`:
Ensure `onRefresh` triggers `loadPlacements(true)` (which calls `fetchPlacements(activeWorkspaceId, true)`), guaranteeing reactive update across table and KPIs.

- [ ] **Step 3: Run typecheck and tests to verify no regressions**

Run: `npx tsc --noEmit`
Run: `npm test -- src/lib/tasks/placementTaskSync.test.ts`
Expected: 0 type errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/views/PlacementsView/PlacementsView.tsx src/components/views/PlacementsView/PlacementBulkActionBar.tsx
git commit -m "refactor(marcom): migrate PlacementsView to reactive useMarcomDataStore selector"
```

---

### Task 3: Reactive Migration of `EventsView.tsx`

**Files:**
- Modify: `src/components/views/EventsView/EventsView.tsx`

**Interfaces:**
- Consumes: `useMarcomDataStore((s) => s.eventsByWorkspace[activeWorkspaceId])`
- Consumes: `fetchEvents: (workspaceId: string, force?: boolean) => Promise<FieldEventItem[]>`
- Consumes: `addCachedEvent`, `updateCachedEvent`, `removeCachedEvent`

- [ ] **Step 1: Refactor `EventsView.tsx` to read directly from Zustand reactive selector**

1. Define `const EMPTY_EVENTS: FieldEventItem[] = [];` outside the component.
2. Remove `const [events, setEvents] = useState<FieldEventItem[]>(() => cachedEvents || []);`.
3. Connect reactive selector:
   ```ts
   const events = useMarcomDataStore(
     (s) => s.eventsByWorkspace[activeWorkspaceId] ?? EMPTY_EVENTS
   );
   const storeFetchEvents = useMarcomDataStore((s) => s.fetchEvents);
   const addCachedEvent = useMarcomDataStore((s) => s.addCachedEvent);
   const updateCachedEvent = useMarcomDataStore((s) => s.updateCachedEvent);
   const removeCachedEvent = useMarcomDataStore((s) => s.removeCachedEvent);
   ```
4. In `fetchEvents`:
   ```ts
   const fetchEvents = useCallback(async (force = false) => {
     if (!activeWorkspaceId) return;
     const hasCache = Boolean(useMarcomDataStore.getState().eventsByWorkspace[activeWorkspaceId]);
     if (!hasCache) setIsLoading(true);
     setError(null);
     try {
       const [, branchList] = await Promise.all([
         storeFetchEvents(activeWorkspaceId, force),
         fetchBranches(),
       ]);
       if (Array.isArray(branchList)) {
         setBranches(branchList);
       }
     } catch (e) {
       setError(e instanceof Error ? e.message : "Failed to load field events");
     } finally {
       setIsLoading(false);
     }
   }, [activeWorkspaceId, fetchBranches, storeFetchEvents]);
   ```
5. In `handleDeleteEvent`:
   ```ts
   removeCachedEvent(activeWorkspaceId, id);
   ```
6. In `handleEventSaved`:
   ```ts
   if (editingEvent) {
     updateCachedEvent(activeWorkspaceId, savedItem);
   } else {
     addCachedEvent(activeWorkspaceId, savedItem);
   }
   storeFetchEvents(activeWorkspaceId, true);
   ```

- [ ] **Step 2: Run typecheck and tests to verify no regressions**

Run: `npx tsc --noEmit`
Run: `npm test -- src/lib/tasks/eventTaskSync.test.ts`
Expected: 0 type errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/views/EventsView/EventsView.tsx
git commit -m "refactor(marcom): migrate EventsView to reactive useMarcomDataStore selector"
```

---

### Task 4: Reactive Migration of `MousView.tsx` & `QuarterlyPosmReportTab.tsx`

**Files:**
- Modify: `src/components/views/MousView/MousView.tsx`
- Modify: `src/components/views/ReportsView/QuarterlyPosmReportTab.tsx`

**Interfaces:**
- Consumes: `useMarcomDataStore((s) => s.mousByWorkspace[activeWorkspaceId])`
- Consumes: `useMarcomDataStore((s) => s.placementsByWorkspace[activeWorkspaceId])`
- Consumes: `fetchMous`, `fetchPlacements`
- Consumes: `addCachedMou`, `updateCachedMou`, `removeCachedMou`

- [ ] **Step 1: Refactor `MousView.tsx` to read directly from Zustand reactive selector**

1. Define `const EMPTY_MOUS: MarcomMou[] = [];` outside the component.
2. Remove `const [mous, setMous] = useState<MarcomMou[]>(() => cachedMous || []);`.
3. Connect reactive selector:
   ```ts
   const mous = useMarcomDataStore(
     (s) => s.mousByWorkspace[activeWorkspaceId] ?? EMPTY_MOUS
   );
   const fetchMous = useMarcomDataStore((s) => s.fetchMous);
   const addCachedMou = useMarcomDataStore((s) => s.addCachedMou);
   const updateCachedMou = useMarcomDataStore((s) => s.updateCachedMou);
   const removeCachedMou = useMarcomDataStore((s) => s.removeCachedMou);
   ```
4. In `filteredMous`:
   ```ts
   const filteredMous = useMemo(() => {
     if (selectedStatus === "ALL") return mous;
     return mous.filter((m) => m.status === selectedStatus);
   }, [mous, selectedStatus]);
   ```
   Pass `data={filteredMous}` to `MarcomTableShell`.
5. Update `loadMous`:
   ```ts
   const loadMous = useCallback(async (force = false) => {
     if (!activeWorkspaceId) return;
     const hasCache = Boolean(useMarcomDataStore.getState().mousByWorkspace[activeWorkspaceId]);
     if (!hasCache) setIsLoading(true);
     setError(null);
     try {
       const [, branchList, outletList] = await Promise.all([
         fetchMous(activeWorkspaceId, force),
         fetchBranches(),
         fetchOutlets(),
       ]);
       if (Array.isArray(branchList)) {
         setBranches(branchList.map((b) => ({ id: b.id, name: b.name, code: b.code })));
       }
       if (Array.isArray(outletList)) {
         setOutletsList(outletList.map((o) => ({ id: o.id, name: o.name, code: o.code, branchId: o.branchId })));
       }
     } catch (e) {
       setError(e instanceof Error ? e.message : "Failed to load MOUs");
     } finally {
       setIsLoading(false);
     }
   }, [activeWorkspaceId, fetchMous, fetchBranches, fetchOutlets]);

   useEffect(() => {
     loadMous();
   }, [loadMous]);
   ```
6. In `handleStatusTransition`:
   ```ts
   updateCachedMou(activeWorkspaceId, { id: mou.id, status: nextStatus });
   fetchMous(activeWorkspaceId, true);
   ```
7. In `handleSaveMou`:
   ```ts
   const savedMou: MarcomMou = (await res.json()).data;
   if (isEdit && id) {
     updateCachedMou(activeWorkspaceId, savedMou);
   } else {
     addCachedMou(activeWorkspaceId, savedMou);
   }
   fetchMous(activeWorkspaceId, true);
   ```
8. In `deleteOne`:
   ```ts
   removeCachedMou(activeWorkspaceId, id);
   ```

- [ ] **Step 2: Refactor `QuarterlyPosmReportTab.tsx` to read directly from Zustand reactive selector**

1. Define `const EMPTY_PLACEMENTS: MarcomPlacement[] = [];` outside the component.
2. Remove `const [placements, setPlacements] = useState<MarcomPlacement[]>(() => getCachedPlacements(activeWorkspaceId) || []);`.
3. Connect reactive selector:
   ```ts
   const placements = useMarcomDataStore(
     (s) => s.placementsByWorkspace[activeWorkspaceId] ?? EMPTY_PLACEMENTS
   );
   const fetchPlacements = useMarcomDataStore((s) => s.fetchPlacements);
   ```
4. In `fetchReportData`:
   ```ts
   const fetchReportData = useCallback(async () => {
     setIsLoading(true);
     try {
       await Promise.all([
         fetchPlacements(activeWorkspaceId),
         fetchBranches(),
         fetchMaterials(),
       ]);
     } catch {
       toast.error("Gagal memuat data laporan POSM");
     } finally {
       setIsLoading(false);
     }
   }, [activeWorkspaceId, fetchPlacements, fetchBranches, fetchMaterials]);
   ```

- [ ] **Step 3: Run typecheck and tests to verify no regressions**

Run: `npx tsc --noEmit`
Run: `npm test -- src/lib/marcom/mouMachine.test.ts`
Expected: 0 type errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/views/MousView/MousView.tsx src/components/views/ReportsView/QuarterlyPosmReportTab.tsx
git commit -m "refactor(marcom): migrate MousView and QuarterlyPosmReportTab to reactive useMarcomDataStore"
```

---

### Task 5: Full Verification Suite

**Files:**
- Entire repository

- [ ] **Step 1: Run TypeScript compiler check**

Run: `npx tsc --noEmit`
Expected: Exit code 0, 0 type errors.

- [ ] **Step 2: Run full unit test suite**

Run: `npm test`
Expected: All 505+ tests passing across all 69 test suites, 0 failures.

- [ ] **Step 3: Verify git status is clean**

Run: `git status`
Expected: Working tree clean, everything committed with structured commit messages.

