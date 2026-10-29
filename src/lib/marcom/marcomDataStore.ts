import { create } from "zustand";
import type {
  BranchItem,
  MaterialItem,
  OutletItem,
  ContentPostItem,
  MonthlyReport,
  DocumentItem,
  MarcomMou,
  MarcomPlacement,
  FieldEventItem,
} from "@/types";

export interface MarcomDataState {
  // Master data
  branches: BranchItem[];
  isBranchesLoaded: boolean;
  isBranchesLoading: boolean;
  materials: MaterialItem[];
  isMaterialsLoaded: boolean;
  isMaterialsLoading: boolean;
  outlets: OutletItem[];
  isOutletsLoaded: boolean;
  isOutletsLoading: boolean;

  // Operational data
  posts: ContentPostItem[];
  isPostsLoaded: boolean;
  isPostsLoading: boolean;
  reports: MonthlyReport[];
  isReportsLoaded: boolean;
  isReportsLoading: boolean;
  documents: DocumentItem[];
  isDocumentsLoaded: boolean;
  isDocumentsLoading: boolean;
  mous: MarcomMou[];
  isMousLoaded: boolean;
  isMousLoading: boolean;
  placements: MarcomPlacement[];
  isPlacementsLoaded: boolean;
  isPlacementsLoading: boolean;
  events: FieldEventItem[];
  isEventsLoaded: boolean;
  isEventsLoading: boolean;

  // Resilient Error Tracking
  lastError: string | null;
  clearError: () => void;

  // Master data actions
  fetchBranches: (force?: boolean) => Promise<BranchItem[]>;
  fetchMaterials: (force?: boolean) => Promise<MaterialItem[]>;
  fetchOutlets: (force?: boolean) => Promise<OutletItem[]>;
  setBranches: (branches: BranchItem[]) => void;
  setMaterials: (materials: MaterialItem[]) => void;
  setOutlets: (outlets: OutletItem[]) => void;
  updateCachedOutlet: (outlet: Partial<OutletItem> & { id: string }) => void;
  invalidateBranches: () => void;
  invalidateMaterials: () => void;
  invalidateOutlets: () => void;

  // Operational data actions
  fetchPosts: (force?: boolean) => Promise<ContentPostItem[]>;
  setCachedPosts: (posts: ContentPostItem[]) => void;
  updateCachedPost: (post: Partial<ContentPostItem> & { id: string }) => void;
  removeCachedPost: (postId: string) => void;
  addCachedPost: (post: ContentPostItem) => void;
  invalidatePosts: () => void;

  fetchReports: (force?: boolean) => Promise<MonthlyReport[]>;
  setCachedReports: (reports: MonthlyReport[]) => void;
  addCachedReport: (report: MonthlyReport) => void;
  removeCachedReport: (reportId: string) => void;
  invalidateReports: () => void;

  fetchDocuments: (force?: boolean) => Promise<DocumentItem[]>;
  setCachedDocuments: (documents: DocumentItem[]) => void;
  invalidateDocuments: () => void;

  fetchMous: (force?: boolean) => Promise<MarcomMou[]>;
  setCachedMous: (mous: MarcomMou[]) => void;
  addCachedMou: (mou: MarcomMou) => void;
  updateCachedMou: (mou: Partial<MarcomMou> & { id: string }) => void;
  removeCachedMou: (mouId: string) => void;
  invalidateMous: () => void;

  fetchPlacements: (force?: boolean) => Promise<MarcomPlacement[]>;
  setCachedPlacements: (placements: MarcomPlacement[]) => void;
  addCachedPlacement: (placement: MarcomPlacement) => void;
  updateCachedPlacement: (
    placement: Partial<MarcomPlacement> & { id: string }
  ) => void;
  removeCachedPlacement: (placementId: string) => void;
  invalidatePlacements: () => void;

  fetchEvents: (force?: boolean) => Promise<FieldEventItem[]>;
  setCachedEvents: (events: FieldEventItem[]) => void;
  addCachedEvent: (event: FieldEventItem) => void;
  updateCachedEvent: (
    event: Partial<FieldEventItem> & { id: string }
  ) => void;
  removeCachedEvent: (eventId: string) => void;
  invalidateEvents: () => void;
}

export const useMarcomDataStore = create<MarcomDataState>((set, get) => ({
  branches: [],
  isBranchesLoaded: false,
  isBranchesLoading: false,

  materials: [],
  isMaterialsLoaded: false,
  isMaterialsLoading: false,

  outlets: [],
  isOutletsLoaded: false,
  isOutletsLoading: false,

  posts: [],
  isPostsLoaded: false,
  isPostsLoading: false,

  reports: [],
  isReportsLoaded: false,
  isReportsLoading: false,

  documents: [],
  isDocumentsLoaded: false,
  isDocumentsLoading: false,

  mous: [],
  isMousLoaded: false,
  isMousLoading: false,

  placements: [],
  isPlacementsLoaded: false,
  isPlacementsLoading: false,

  events: [],
  isEventsLoaded: false,
  isEventsLoading: false,

  lastError: null,
  clearError: () => set({ lastError: null }),

  fetchBranches: async (force = false) => {
    const state = get();
    if (state.isBranchesLoaded && state.branches.length > 0 && !force) {
      return state.branches;
    }
    if (state.isBranchesLoading) {
      return state.branches;
    }

    set({ isBranchesLoading: true, lastError: null });
    try {
      const res = await fetch("/api/marcom/branches");
      if (!res.ok) throw new Error(`Failed to fetch branches (${res.status})`);
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      set({ branches: list, isBranchesLoaded: true, isBranchesLoading: false });
      return list;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch branches";
      console.error("[marcomDataStore] fetchBranches error:", err);
      set({ isBranchesLoading: false, lastError: message });
      return state.branches;
    }
  },

  fetchMaterials: async (force = false) => {
    const state = get();
    if (state.isMaterialsLoaded && state.materials.length > 0 && !force) {
      return state.materials;
    }
    if (state.isMaterialsLoading) {
      return state.materials;
    }

    set({ isMaterialsLoading: true, lastError: null });
    try {
      const res = await fetch("/api/marcom/materials");
      if (!res.ok) throw new Error(`Failed to fetch materials (${res.status})`);
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      set({ materials: list, isMaterialsLoaded: true, isMaterialsLoading: false });
      return list;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch materials";
      console.error("[marcomDataStore] fetchMaterials error:", err);
      set({ isMaterialsLoading: false, lastError: message });
      return state.materials;
    }
  },

  fetchOutlets: async (force = false) => {
    const state = get();
    if (state.isOutletsLoaded && state.outlets.length > 0 && !force) {
      return state.outlets;
    }
    if (state.isOutletsLoading) {
      return state.outlets;
    }

    set({ isOutletsLoading: true, lastError: null });
    try {
      const res = await fetch("/api/marcom/outlets");
      if (!res.ok) throw new Error(`Failed to fetch outlets (${res.status})`);
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      set({ outlets: list, isOutletsLoaded: true, isOutletsLoading: false });
      return list;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch outlets";
      console.error("[marcomDataStore] fetchOutlets error:", err);
      set({ isOutletsLoading: false, lastError: message });
      return state.outlets;
    }
  },

  setBranches: (branches: BranchItem[]) => {
    set({ branches, isBranchesLoaded: true });
  },

  setMaterials: (materials: MaterialItem[]) => {
    set({ materials, isMaterialsLoaded: true });
  },

  setOutlets: (outlets: OutletItem[]) => {
    set({ outlets, isOutletsLoaded: true });
  },

  updateCachedOutlet: (outlet: Partial<OutletItem> & { id: string }) => {
    set((s) => ({
      outlets: s.outlets.map((o) =>
        o.id === outlet.id ? ({ ...o, ...outlet } as OutletItem) : o
      ),
    }));
  },

  invalidateBranches: () => {
    set({ isBranchesLoaded: false });
  },

  invalidateMaterials: () => {
    set({ isMaterialsLoaded: false });
  },

  invalidateOutlets: () => {
    set({ isOutletsLoaded: false });
  },

  // Posts
  fetchPosts: async (force = false) => {
    const state = get();
    if (state.isPostsLoaded && !force) {
      return state.posts;
    }
    if (state.isPostsLoading) {
      return state.posts;
    }
    set({ isPostsLoading: true });
    try {
      const res = await fetch("/api/marcom/content");
      if (!res.ok) throw new Error(`Failed to fetch content posts (${res.status})`);
      const json = await res.json();
      const list: ContentPostItem[] = Array.isArray(json.data) ? json.data : [];
      set({ posts: list, isPostsLoaded: true, isPostsLoading: false });
      return list;
    } catch (err) {
      console.error("[marcomDataStore] fetchPosts error:", err);
      set({ isPostsLoading: false });
      return state.posts;
    }
  },

  setCachedPosts: (posts: ContentPostItem[]) => {
    set({ posts, isPostsLoaded: true });
  },

  updateCachedPost: (post: Partial<ContentPostItem> & { id: string }) => {
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === post.id ? ({ ...p, ...post } as ContentPostItem) : p
      ),
    }));
  },

  removeCachedPost: (postId: string) => {
    set((s) => ({
      posts: s.posts.filter((p) => p.id !== postId),
    }));
  },

  addCachedPost: (post: ContentPostItem) => {
    set((s) => ({
      posts: [post, ...s.posts.filter((p) => p.id !== post.id)],
    }));
  },

  invalidatePosts: () => {
    set({ isPostsLoaded: false });
  },

  // Reports
  fetchReports: async (force = false) => {
    const state = get();
    if (state.isReportsLoaded && !force) {
      return state.reports;
    }
    if (state.isReportsLoading) {
      return state.reports;
    }
    set({ isReportsLoading: true });
    try {
      const res = await fetch("/api/marcom/reports");
      if (!res.ok) throw new Error(`Failed to fetch reports (${res.status})`);
      const json = await res.json();
      const list: MonthlyReport[] = Array.isArray(json.data) ? json.data : [];
      set({ reports: list, isReportsLoaded: true, isReportsLoading: false });
      return list;
    } catch (err) {
      console.error("[marcomDataStore] fetchReports error:", err);
      set({ isReportsLoading: false });
      return state.reports;
    }
  },

  setCachedReports: (reports: MonthlyReport[]) => {
    set({ reports, isReportsLoaded: true });
  },

  addCachedReport: (report: MonthlyReport) => {
    set((s) => ({
      reports: [report, ...s.reports.filter((r) => r.id !== report.id)],
    }));
  },

  removeCachedReport: (reportId: string) => {
    set((s) => ({
      reports: s.reports.filter((r) => r.id !== reportId),
    }));
  },

  invalidateReports: () => {
    set({ isReportsLoaded: false });
  },

  // Documents
  fetchDocuments: async (force = false) => {
    const state = get();
    if (state.isDocumentsLoaded && !force) {
      return state.documents;
    }
    if (state.isDocumentsLoading) {
      return state.documents;
    }
    set({ isDocumentsLoading: true });
    try {
      const res = await fetch("/api/marcom/documents");
      if (!res.ok) throw new Error(`Failed to fetch documents (${res.status})`);
      const json = await res.json();
      const list: DocumentItem[] = Array.isArray(json.data) ? json.data : [];
      set({ documents: list, isDocumentsLoaded: true, isDocumentsLoading: false });
      return list;
    } catch (err) {
      console.error("[marcomDataStore] fetchDocuments error:", err);
      set({ isDocumentsLoading: false });
      return state.documents;
    }
  },

  setCachedDocuments: (documents: DocumentItem[]) => {
    set({ documents, isDocumentsLoaded: true });
  },

  invalidateDocuments: () => {
    set({ isDocumentsLoaded: false });
  },

  // MoUs
  fetchMous: async (force = false) => {
    const state = get();
    if (state.isMousLoaded && !force) {
      return state.mous;
    }
    if (state.isMousLoading) {
      return state.mous;
    }
    set({ isMousLoading: true });
    try {
      const res = await fetch("/api/marcom/mous");
      if (!res.ok) throw new Error(`Failed to fetch mous (${res.status})`);
      const json = await res.json();
      const list: MarcomMou[] = Array.isArray(json.data) ? json.data : [];
      set({ mous: list, isMousLoaded: true, isMousLoading: false });
      return list;
    } catch (err) {
      console.error("[marcomDataStore] fetchMous error:", err);
      set({ isMousLoading: false });
      return state.mous;
    }
  },

  setCachedMous: (mous: MarcomMou[]) => {
    set({ mous, isMousLoaded: true });
  },

  addCachedMou: (mou: MarcomMou) => {
    set((s) => ({
      mous: [mou, ...s.mous.filter((m) => m.id !== mou.id)],
    }));
  },

  updateCachedMou: (mou: Partial<MarcomMou> & { id: string }) => {
    set((s) => ({
      mous: s.mous.map((m) =>
        m.id === mou.id ? ({ ...m, ...mou } as MarcomMou) : m
      ),
    }));
  },

  removeCachedMou: (mouId: string) => {
    set((s) => ({
      mous: s.mous.filter((m) => m.id !== mouId),
    }));
  },

  invalidateMous: () => {
    set({ isMousLoaded: false });
  },

  // Placements
  fetchPlacements: async (force = false) => {
    const state = get();
    if (state.isPlacementsLoaded && !force) {
      return state.placements;
    }
    if (state.isPlacementsLoading) {
      return state.placements;
    }
    set({ isPlacementsLoading: true });
    try {
      const res = await fetch("/api/marcom/placements");
      if (!res.ok) throw new Error(`Failed to fetch placements (${res.status})`);
      const json = await res.json();
      const list: MarcomPlacement[] = Array.isArray(json.data) ? json.data : [];
      set({ placements: list, isPlacementsLoaded: true, isPlacementsLoading: false });
      return list;
    } catch (err) {
      console.error("[marcomDataStore] fetchPlacements error:", err);
      set({ isPlacementsLoading: false });
      return state.placements;
    }
  },

  setCachedPlacements: (placements: MarcomPlacement[]) => {
    set({ placements, isPlacementsLoaded: true });
  },

  addCachedPlacement: (placement: MarcomPlacement) => {
    set((s) => ({
      placements: [placement, ...s.placements.filter((p) => p.id !== placement.id)],
    }));
  },

  updateCachedPlacement: (
    placement: Partial<MarcomPlacement> & { id: string }
  ) => {
    set((s) => ({
      placements: s.placements.map((p) =>
        p.id === placement.id ? ({ ...p, ...placement } as MarcomPlacement) : p
      ),
    }));
  },

  removeCachedPlacement: (placementId: string) => {
    set((s) => ({
      placements: s.placements.filter((p) => p.id !== placementId),
    }));
  },

  invalidatePlacements: () => {
    set({ isPlacementsLoaded: false });
  },

  // Events
  fetchEvents: async (force = false) => {
    const state = get();
    if (state.isEventsLoaded && !force) {
      return state.events;
    }
    if (state.isEventsLoading) {
      return state.events;
    }
    set({ isEventsLoading: true });
    try {
      const res = await fetch("/api/marcom/events");
      if (!res.ok) throw new Error(`Failed to fetch events (${res.status})`);
      const json = await res.json();
      const list: FieldEventItem[] = Array.isArray(json.data) ? json.data : [];
      set({ events: list, isEventsLoaded: true, isEventsLoading: false });
      return list;
    } catch (err) {
      console.error("[marcomDataStore] fetchEvents error:", err);
      set({ isEventsLoading: false });
      return state.events;
    }
  },

  setCachedEvents: (events: FieldEventItem[]) => {
    set({ events, isEventsLoaded: true });
  },

  addCachedEvent: (event: FieldEventItem) => {
    set((s) => ({
      events: [event, ...s.events.filter((e) => e.id !== event.id)],
    }));
  },

  updateCachedEvent: (event: Partial<FieldEventItem> & { id: string }) => {
    set((s) => ({
      events: s.events.map((e) =>
        e.id === event.id ? ({ ...e, ...event } as FieldEventItem) : e
      ),
    }));
  },

  removeCachedEvent: (eventId: string) => {
    set((s) => ({
      events: s.events.filter((e) => e.id !== eventId),
    }));
  },

  invalidateEvents: () => {
    set({ isEventsLoaded: false });
  },
}));
