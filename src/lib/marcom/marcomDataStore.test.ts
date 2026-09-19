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
});

