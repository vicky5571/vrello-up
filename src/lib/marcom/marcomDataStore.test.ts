import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import type {
  ContentPostItem,
  MonthlyReport,
  DocumentItem,
  BranchItem,
  MarcomMou,
  MarcomPlacement,
  FieldEventItem,
} from "@/types";

describe("useMarcomDataStore", () => {
  beforeEach(() => {
    useMarcomDataStore.setState({
      branches: [],
      isBranchesLoaded: false,
      isBranchesLoading: false,
      materials: [],
      isMaterialsLoaded: false,
      isMaterialsLoading: false,
      outlets: [],
      isOutletsLoaded: false,
      isOutletsLoading: false,
      lastError: null,
      postsByWorkspace: {},
      reportsByWorkspace: {},
      documentsByWorkspace: {},
      mousByWorkspace: {},
      placementsByWorkspace: {},
      eventsByWorkspace: {},
    });
  });

  describe("Master Data Caching", () => {
    it("stores and retrieves branches synchronously from state", () => {
      const mockBranches: BranchItem[] = [
        {
          id: "b1",
          code: "SMG-01",
          name: "Semarang Pusat",
          region: "Central Java",
          city: "Semarang",
          picName: "Budi",
          picPhone: "0812345678",
          address: "Jl. Pemuda No. 1",
        },
      ];

      useMarcomDataStore.getState().setBranches(mockBranches);

      const state = useMarcomDataStore.getState();
      assert.equal(state.isBranchesLoaded, true);
      assert.equal(state.branches.length, 1);
      assert.equal(state.branches[0].name, "Semarang Pusat");
    });

    it("stores and retrieves outlets and materials synchronously from state", () => {
      const store = useMarcomDataStore.getState();
      assert.equal(store.isOutletsLoaded, false);

      store.setOutlets([
        {
          id: "out-1",
          code: "OUT-01",
          name: "Toko Sinar Rejeki",
          type: "TRADITIONAL",
          address: "Jl. Gajah Mada",
          city: "Semarang",
          picName: "Siti",
          picPhone: "0811111111",
          active: true,
          branchId: "b1",
        },
      ]);

      store.setMaterials([
        { id: "mat-1", name: "Neon Box", type: "PERMANENT" },
      ]);

      const state = useMarcomDataStore.getState();
      assert.equal(state.isOutletsLoaded, true);
      assert.equal(state.outlets.length, 1);
      assert.equal(state.outlets[0].name, "Toko Sinar Rejeki");
      assert.equal(state.isMaterialsLoaded, true);
      assert.equal(state.materials.length, 1);
      assert.equal(state.materials[0].name, "Neon Box");
    });

    it("tracks and clears errors gracefully", () => {
      const store = useMarcomDataStore.getState();
      assert.equal(store.lastError, null);

      useMarcomDataStore.setState({ lastError: "Network connection lost" });
      assert.equal(useMarcomDataStore.getState().lastError, "Network connection lost");

      useMarcomDataStore.getState().clearError();
      assert.equal(useMarcomDataStore.getState().lastError, null);
    });

    it("invalidates master data caches on demand", () => {
      const store = useMarcomDataStore.getState();
      store.setBranches([
        {
          id: "b1",
          code: "B1",
          name: "Branch 1",
          region: "R1",
          city: "C1",
          picName: "P1",
          picPhone: "123",
          address: "A1",
        },
      ]);
      store.setMaterials([{ id: "m1", name: "Mat 1", type: "PERMANENT" }]);
      store.setOutlets([
        {
          id: "o1",
          code: "O1",
          name: "Out 1",
          type: "TRADITIONAL",
          address: "A1",
          city: "C1",
          picName: "P1",
          picPhone: "123",
          active: true,
          branchId: "b1",
        },
      ]);

      assert.equal(useMarcomDataStore.getState().isBranchesLoaded, true);
      assert.equal(useMarcomDataStore.getState().isMaterialsLoaded, true);
      assert.equal(useMarcomDataStore.getState().isOutletsLoaded, true);

      store.invalidateBranches();
      assert.equal(useMarcomDataStore.getState().isBranchesLoaded, false);

      store.invalidateMaterials();
      assert.equal(useMarcomDataStore.getState().isMaterialsLoaded, false);

      store.invalidateOutlets();
      assert.equal(useMarcomDataStore.getState().isOutletsLoaded, false);
    });

    it("updates cached outlet master data immutably while preserving other outlets", () => {
      const store = useMarcomDataStore.getState();
      store.setOutlets([
        {
          id: "out-gps-1",
          code: "OUT-01",
          name: "Warung Berkah",
          type: "TRADITIONAL",
          address: "Jl. Sudirman",
          city: "Jakarta",
          picName: "Budi",
          picPhone: "0812345678",
          active: true,
          branchId: "b1",
          latitude: null,
          longitude: null,
        },
        {
          id: "out-gps-2",
          code: "OUT-02",
          name: "Toko Sebelah",
          type: "TRADITIONAL",
          address: "Jl. Thamrin",
          city: "Jakarta",
          picName: "Siti",
          picPhone: "0898765432",
          active: true,
          branchId: "b1",
          latitude: -6.19,
          longitude: 106.82,
        },
      ]);

      store.updateCachedOutlet({
        id: "out-gps-1",
        latitude: -6.2088,
        longitude: 106.8456,
      });

      const updated = useMarcomDataStore.getState().outlets.find((o) => o.id === "out-gps-1");
      assert.equal(updated?.latitude, -6.2088);
      assert.equal(updated?.longitude, 106.8456);

      const untouched = useMarcomDataStore.getState().outlets.find((o) => o.id === "out-gps-2");
      assert.equal(untouched?.latitude, -6.19);
      assert.equal(untouched?.longitude, 106.82);
    });
  });

  describe("SWR Content Posts Cache", () => {
    it("sets, gets, updates, and invalidates posts per workspace", () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-test";

      const initialPosts: ContentPostItem[] = [
        {
          id: "cp-1",
          title: "Promo Merdeka",
          platform: "instagram",
          format: "reel",
          status: "DRAFT",
        },
        {
          id: "cp-2",
          title: "Flash Sale",
          platform: "tiktok",
          format: "carousel",
          status: "SCHEDULED",
        },
      ];

      // Cache miss initially
      assert.equal(store.getCachedPosts(wsId), undefined);

      // Set cache
      store.setCachedPosts(wsId, initialPosts);
      const cached = store.getCachedPosts(wsId);
      assert.ok(cached);
      assert.equal(cached.length, 2);

      // Update a post
      store.updateCachedPost(wsId, { id: "cp-1", status: "PUBLISHED" });
      const updated = store.getCachedPosts(wsId);
      assert.equal(updated?.find((p) => p.id === "cp-1")?.status, "PUBLISHED");

      // Remove a post
      store.removeCachedPost(wsId, "cp-2");
      assert.equal(store.getCachedPosts(wsId)?.length, 1);

      // Invalidate cache
      store.invalidatePosts(wsId);
      assert.equal(store.getCachedPosts(wsId), undefined);
    });
  });

  describe("SWR Reports & Documents Cache", () => {
    it("caches reports and documents per workspace", () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-test-2";

      const mockReports: MonthlyReport[] = [
        {
          id: "rep-1",
          month: "September",
          year: 2026,
          workspaceId: wsId,
        },
      ];

      const mockDocs: DocumentItem[] = [
        {
          id: "doc-1",
          name: "SOP Marcom.pdf",
          category: "SOP",
          fileType: "PDF",
          filePath: "/docs/sop.pdf",
        },
      ];

      store.setCachedReports(wsId, mockReports);
      store.setCachedDocuments(wsId, mockDocs);

      assert.equal(store.getCachedReports(wsId)?.length, 1);
      assert.equal(store.getCachedDocuments(wsId)?.length, 1);

      store.invalidateReports(wsId);
      assert.equal(store.getCachedReports(wsId), undefined);
      assert.equal(store.getCachedDocuments(wsId)?.length, 1); // Docs untouched
    });
  });

  describe("SWR MOUs Cache", () => {
    it("sets, gets, and invalidates MOUs per workspace", () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-mou-1";

      const mockMous: MarcomMou[] = [
        {
          id: "mou-1",
          workspaceId: wsId,
          branchId: "b1",
          outletName: "Outlet 1",
          partnerName: "Partner A",
          mouType: "REVENUE_SHARE",
          submissionDate: "2026-09-01",
          startDate: "2026-09-01",
          endDate: "2027-09-01",
          status: "APPROVED",
          picName: "John",
          picPhone: "081234",
          docPath: "/mou.pdf",
          compensationValue: 1000000,
          notes: "Annual MOU",
        },
      ];

      assert.equal(store.getCachedMous(wsId), undefined);

      store.setCachedMous(wsId, mockMous);
      const cached = store.getCachedMous(wsId);
      assert.ok(cached);
      assert.equal(cached.length, 1);
      assert.equal(cached[0].partnerName, "Partner A");

      // Invalidate specific workspace
      store.invalidateMous(wsId);
      assert.equal(store.getCachedMous(wsId), undefined);

      // Invalidate all workspaces
      store.setCachedMous("ws-mou-2", mockMous);
      store.invalidateMous();
      assert.equal(store.getCachedMous("ws-mou-2"), undefined);
    });
  });

  describe("SWR Placements Cache", () => {
    it("sets, gets, and invalidates Placements per workspace", () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-place-1";

      const mockPlacements: MarcomPlacement[] = [
        {
          id: "plc-1",
          workspaceId: wsId,
          outletId: "out-1",
          materialId: "mat-1",
          status: "DONE",
          brand: "IM3",
          date: "2026-09-10",
          picName: "Rudi",
          photoUrl: "/photo.jpg",
          dimensions: "2x1m",
          cost: 500000,
          notes: "Front store placement",
        },
      ];

      assert.equal(store.getCachedPlacements(wsId), undefined);

      store.setCachedPlacements(wsId, mockPlacements);
      const cached = store.getCachedPlacements(wsId);
      assert.ok(cached);
      assert.equal(cached.length, 1);
      assert.equal(cached[0].picName, "Rudi");

      // Invalidate specific workspace
      store.invalidatePlacements(wsId);
      assert.equal(store.getCachedPlacements(wsId), undefined);

      // Invalidate all
      store.setCachedPlacements("ws-place-2", mockPlacements);
      store.invalidatePlacements();
      assert.equal(store.getCachedPlacements("ws-place-2"), undefined);
    });
  });

  describe("SWR Events Cache", () => {
    it("sets, gets, and invalidates Field Events per workspace", () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-event-1";

      const mockEvents: FieldEventItem[] = [
        {
          id: "evt-1",
          workspaceId: wsId,
          name: "Car Free Day Promo",
          eventType: "ROADSHOW",
          branchName: "Semarang",
          startDate: "2026-09-20",
          endDate: "2026-09-20",
          status: "UPCOMING",
          picName: "Andi",
          location: "Simpang Lima",
          budget: 2000000,
          targetAttendee: 500,
          attendeeCount: 0,
        },
      ];

      assert.equal(store.getCachedEvents(wsId), undefined);

      store.setCachedEvents(wsId, mockEvents);
      const cached = store.getCachedEvents(wsId);
      assert.ok(cached);
      assert.equal(cached.length, 1);
      assert.equal(cached[0].name, "Car Free Day Promo");

      // Invalidate specific workspace
      store.invalidateEvents(wsId);
      assert.equal(store.getCachedEvents(wsId), undefined);

      // Invalidate all
      store.setCachedEvents("ws-event-2", mockEvents);
      store.invalidateEvents();
      assert.equal(store.getCachedEvents("ws-event-2"), undefined);
    });
  });

  describe("Scoped Async Fetch Actions (fetchEvents & fetchMous)", () => {
    it("fetchEvents returns empty array immediately if workspaceId is empty without calling fetch", async () => {
      const store = useMarcomDataStore.getState();
      const res = await store.fetchEvents("");
      assert.deepEqual(res, []);
    });

    it("fetchMous returns empty array immediately if workspaceId is empty without calling fetch", async () => {
      const store = useMarcomDataStore.getState();
      const res = await store.fetchMous("");
      assert.deepEqual(res, []);
    });

    it("fetchEvents returns cached events when available without refetching", async () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-cached-events";
      const dummyEvents = [
        {
          id: "e-1",
          workspaceId: wsId,
          name: "Cached Event",
          eventType: "PROMO",
          status: "UPCOMING" as const,
        },
      ];
      store.setCachedEvents(wsId, dummyEvents as unknown as FieldEventItem[]);

      const res = await store.fetchEvents(wsId);
      assert.deepEqual(res, dummyEvents);
    });

    it("fetchMous returns cached mous when available without refetching", async () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-cached-mous";
      const dummyMous = [
        {
          id: "m-1",
          workspaceId: wsId,
          partnerName: "Cached Partner",
          mouType: "Sponsorship",
          status: "DRAFT" as const,
        },
      ];
      store.setCachedMous(wsId, dummyMous as unknown as MarcomMou[]);

      const res = await store.fetchMous(wsId);
      assert.deepEqual(res, dummyMous);
    });
  });

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
      } as unknown as MarcomPlacement;

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
      } as unknown as MarcomMou;

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
      } as unknown as FieldEventItem;

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
        { id: "pl-1", workspaceId: wsId, outletId: "o1", materialId: "m1", status: "ON_PROGRESS" } as unknown as MarcomPlacement,
      ];
      store.setCachedPlacements(wsId, dummy);

      const res = await store.fetchPlacements(wsId);
      assert.deepEqual(res, dummy);
    });

    it("fetchPosts returns empty array immediately if workspaceId is empty without calling fetch", async () => {
      const store = useMarcomDataStore.getState();
      const res = await (store as any).fetchPosts("");
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

      const res = await (store as any).fetchPosts(wsId);
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

      (store as any).addCachedPost(wsId, initial);
      assert.equal(useMarcomDataStore.getState().postsByWorkspace[wsId]?.length, 1);
      assert.equal(useMarcomDataStore.getState().postsByWorkspace[wsId]?.[0].title, "Test Post");

      // Adding duplicate ID replaces or keeps single entry
      (store as any).addCachedPost(wsId, { ...initial, title: "Test Post Updated" });
      assert.equal(useMarcomDataStore.getState().postsByWorkspace[wsId]?.length, 1);
      assert.equal(useMarcomDataStore.getState().postsByWorkspace[wsId]?.[0].title, "Test Post Updated");
    });

    it("fetchReports and fetchDocuments return empty array if workspaceId is empty", async () => {
      const store = useMarcomDataStore.getState();
      assert.deepEqual(await (store as any).fetchReports(""), []);
      assert.deepEqual(await (store as any).fetchDocuments(""), []);
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

      (store as any).addCachedReport(wsId, initial);
      assert.equal(useMarcomDataStore.getState().reportsByWorkspace[wsId]?.length, 1);
      assert.equal(useMarcomDataStore.getState().reportsByWorkspace[wsId]?.[0].month, "October");
    });

    it("fetchReports returns cached reports when available without refetching", async () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-cached-rep";
      const dummyReports = [
        {
          id: "rep-1",
          workspaceId: wsId,
          month: "September",
          year: 2026,
          summary: {},
        },
      ];
      store.setCachedReports(wsId, dummyReports as unknown as MonthlyReport[]);

      const res = await (store as any).fetchReports(wsId);
      assert.deepEqual(res, dummyReports);
    });

    it("fetchDocuments returns cached documents when available without refetching", async () => {
      const store = useMarcomDataStore.getState();
      const wsId = "ws-cached-doc";
      const dummyDocs = [
        {
          id: "doc-1",
          workspaceId: wsId,
          name: "Doc A",
        },
      ];
      store.setCachedDocuments(wsId, dummyDocs as unknown as DocumentItem[]);

      const res = await (store as any).fetchDocuments(wsId);
      assert.deepEqual(res, dummyDocs);
    });
  });
});


