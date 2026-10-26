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
      posts: [],
      reports: [],
      documents: [],
      mous: [],
      placements: [],
      events: [],
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
        { id: "mat-1", name: "Neon Box", type: "BRANDING_SIGNBOARD" },
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
      store.setMaterials([{ id: "m1", name: "Mat 1", type: "BRANDING_SIGNBOARD" }]);
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
    it("sets, gets, updates, and invalidates posts", () => {
      useMarcomDataStore.setState({ posts: [], isPostsLoaded: false });
      const store = useMarcomDataStore.getState();

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

      // Set cache
      store.setCachedPosts(initialPosts);
      assert.equal(useMarcomDataStore.getState().isPostsLoaded, true);
      assert.equal(useMarcomDataStore.getState().posts.length, 2);

      // Update a post
      store.updateCachedPost({ id: "cp-1", status: "PUBLISHED" });
      const updated = useMarcomDataStore.getState().posts;
      assert.equal(updated.find((p) => p.id === "cp-1")?.status, "PUBLISHED");

      // Remove a post
      store.removeCachedPost("cp-2");
      assert.equal(useMarcomDataStore.getState().posts.length, 1);

      // Invalidate cache
      store.invalidatePosts();
      assert.equal(useMarcomDataStore.getState().isPostsLoaded, false);
    });
  });

  describe("SWR Reports & Documents Cache", () => {
    it("caches reports and documents", () => {
      useMarcomDataStore.setState({ reports: [], documents: [], isReportsLoaded: false, isDocumentsLoaded: false });
      const store = useMarcomDataStore.getState();

      const mockReports: MonthlyReport[] = [
        {
          id: "rep-1",
          month: "September",
          year: 2026,
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

      store.setCachedReports(mockReports);
      store.setCachedDocuments(mockDocs);

      assert.equal(useMarcomDataStore.getState().reports.length, 1);
      assert.equal(useMarcomDataStore.getState().documents.length, 1);

      store.invalidateReports();
      assert.equal(useMarcomDataStore.getState().isReportsLoaded, false);
      assert.equal(useMarcomDataStore.getState().isDocumentsLoaded, true); // Docs untouched
    });
  });

  describe("SWR MOUs Cache", () => {
    it("sets, gets, and invalidates MOUs", () => {
      useMarcomDataStore.setState({ mous: [], isMousLoaded: false });
      const store = useMarcomDataStore.getState();

      const mockMous: MarcomMou[] = [
        {
          id: "mou-1",
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

      store.setCachedMous(mockMous);
      assert.equal(useMarcomDataStore.getState().isMousLoaded, true);
      assert.equal(useMarcomDataStore.getState().mous.length, 1);
      assert.equal(useMarcomDataStore.getState().mous[0].partnerName, "Partner A");

      store.invalidateMous();
      assert.equal(useMarcomDataStore.getState().isMousLoaded, false);
    });
  });

  describe("SWR Placements Cache", () => {
    it("sets, gets, and invalidates Placements", () => {
      useMarcomDataStore.setState({ placements: [], isPlacementsLoaded: false });
      const store = useMarcomDataStore.getState();

      const mockPlacements: MarcomPlacement[] = [
        {
          id: "plc-1",
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

      store.setCachedPlacements(mockPlacements);
      assert.equal(useMarcomDataStore.getState().isPlacementsLoaded, true);
      assert.equal(useMarcomDataStore.getState().placements.length, 1);
      assert.equal(useMarcomDataStore.getState().placements[0].picName, "Rudi");

      store.invalidatePlacements();
      assert.equal(useMarcomDataStore.getState().isPlacementsLoaded, false);
    });
  });

  describe("SWR Events Cache", () => {
    it("sets, gets, and invalidates Field Events", () => {
      useMarcomDataStore.setState({ events: [], isEventsLoaded: false });
      const store = useMarcomDataStore.getState();

      const mockEvents: FieldEventItem[] = [
        {
          id: "evt-1",
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

      store.setCachedEvents(mockEvents);
      assert.equal(useMarcomDataStore.getState().isEventsLoaded, true);
      assert.equal(useMarcomDataStore.getState().events.length, 1);
      assert.equal(useMarcomDataStore.getState().events[0].name, "Car Free Day Promo");

      store.invalidateEvents();
      assert.equal(useMarcomDataStore.getState().isEventsLoaded, false);
    });
  });

  describe("Reactive Mutation Actions", () => {
    it("adds, updates, and removes cached placements immutably", () => {
      useMarcomDataStore.setState({ placements: [] });
      const store = useMarcomDataStore.getState();
      const initial: MarcomPlacement = {
        id: "p-1",
        outletId: "out-1",
        materialId: "mat-1",
        status: "NOT_STARTED",
      } as unknown as MarcomPlacement;

      store.addCachedPlacement(initial);
      assert.equal(useMarcomDataStore.getState().placements.length, 1);
      assert.equal(useMarcomDataStore.getState().placements[0].status, "NOT_STARTED");

      store.updateCachedPlacement({ id: "p-1", status: "DONE" });
      assert.equal(useMarcomDataStore.getState().placements[0].status, "DONE");

      store.removeCachedPlacement("p-1");
      assert.equal(useMarcomDataStore.getState().placements.length, 0);
    });

    it("adds, updates, and removes cached MOUs immutably", () => {
      useMarcomDataStore.setState({ mous: [] });
      const store = useMarcomDataStore.getState();
      const initial: MarcomMou = {
        id: "m-1",
        partnerName: "Partner A",
        status: "DRAFT",
      } as unknown as MarcomMou;

      store.addCachedMou(initial);
      assert.equal(useMarcomDataStore.getState().mous.length, 1);

      store.updateCachedMou({ id: "m-1", status: "APPROVED" });
      assert.equal(useMarcomDataStore.getState().mous[0].status, "APPROVED");

      store.removeCachedMou("m-1");
      assert.equal(useMarcomDataStore.getState().mous.length, 0);
    });

    it("adds, updates, and removes cached Field Events immutably", () => {
      useMarcomDataStore.setState({ events: [] });
      const store = useMarcomDataStore.getState();
      const initial: FieldEventItem = {
        id: "e-1",
        name: "Initial Event",
        status: "UPCOMING",
      } as unknown as FieldEventItem;

      store.addCachedEvent(initial);
      assert.equal(useMarcomDataStore.getState().events.length, 1);

      store.updateCachedEvent({ id: "e-1", name: "Updated Event" });
      assert.equal(useMarcomDataStore.getState().events[0].name, "Updated Event");

      store.removeCachedEvent("e-1");
      assert.equal(useMarcomDataStore.getState().events.length, 0);
    });

    it("adds cached posts immutably without duplicates", () => {
      useMarcomDataStore.setState({ posts: [] });
      const store = useMarcomDataStore.getState();
      const initial: ContentPostItem = {
        id: "post-1",
        title: "Test Post",
        platform: "TIKTOK" as const,
        format: "REEL" as const,
        status: "IDEA" as const,
      } as unknown as ContentPostItem;

      store.addCachedPost(initial);
      assert.equal(useMarcomDataStore.getState().posts.length, 1);
      assert.equal(useMarcomDataStore.getState().posts[0].title, "Test Post");

      // Adding duplicate ID replaces or keeps single entry
      store.addCachedPost({ ...initial, title: "Test Post Updated" });
      assert.equal(useMarcomDataStore.getState().posts.length, 1);
      assert.equal(useMarcomDataStore.getState().posts[0].title, "Test Post Updated");
    });

    it("adds cached reports immutably", () => {
      useMarcomDataStore.setState({ reports: [] });
      const store = useMarcomDataStore.getState();
      const initial: MonthlyReport = {
        id: "rep-1",
        month: "October",
        year: 2026,
        summary: {},
        activities: [],
        achievements: [],
        keyIssues: [],
        actionPlans: [],
      } as unknown as MonthlyReport;

      store.addCachedReport(initial);
      assert.equal(useMarcomDataStore.getState().reports.length, 1);
      assert.equal(useMarcomDataStore.getState().reports[0].month, "October");
    });
  });
});


