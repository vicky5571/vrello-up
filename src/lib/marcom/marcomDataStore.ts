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

  // Resilient Error Tracking
  lastError: string | null;
  clearError: () => void;

  // SWR View Caches keyed by workspaceId
  postsByWorkspace: Record<string, ContentPostItem[]>;
  reportsByWorkspace: Record<string, MonthlyReport[]>;
  documentsByWorkspace: Record<string, DocumentItem[]>;
  mousByWorkspace: Record<string, MarcomMou[]>;
  placementsByWorkspace: Record<string, MarcomPlacement[]>;
  eventsByWorkspace: Record<string, FieldEventItem[]>;

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

  // View cache actions
  getCachedPosts: (workspaceId: string) => ContentPostItem[] | undefined;
  setCachedPosts: (workspaceId: string, posts: ContentPostItem[]) => void;
  updateCachedPost: (
    workspaceId: string,
    post: Partial<ContentPostItem> & { id: string }
  ) => void;
  removeCachedPost: (workspaceId: string, postId: string) => void;
  addCachedPost: (workspaceId: string, post: ContentPostItem) => void;
  fetchPosts: (workspaceId: string, force?: boolean) => Promise<ContentPostItem[]>;
  invalidatePosts: (workspaceId?: string) => void;

  getCachedReports: (workspaceId: string) => MonthlyReport[] | undefined;
  setCachedReports: (workspaceId: string, reports: MonthlyReport[]) => void;
  addCachedReport: (workspaceId: string, report: MonthlyReport) => void;
  fetchReports: (workspaceId: string, force?: boolean) => Promise<MonthlyReport[]>;
  invalidateReports: (workspaceId?: string) => void;

  getCachedDocuments: (workspaceId: string) => DocumentItem[] | undefined;
  setCachedDocuments: (workspaceId: string, documents: DocumentItem[]) => void;
  fetchDocuments: (workspaceId: string, force?: boolean) => Promise<DocumentItem[]>;
  invalidateDocuments: (workspaceId?: string) => void;

  getCachedMous: (workspaceId: string) => MarcomMou[] | undefined;
  setCachedMous: (workspaceId: string, mous: MarcomMou[]) => void;
  invalidateMous: (workspaceId?: string) => void;

  getCachedPlacements: (workspaceId: string) => MarcomPlacement[] | undefined;
  setCachedPlacements: (workspaceId: string, placements: MarcomPlacement[]) => void;
  invalidatePlacements: (workspaceId?: string) => void;

  getCachedEvents: (workspaceId: string) => FieldEventItem[] | undefined;
  setCachedEvents: (workspaceId: string, events: FieldEventItem[]) => void;
  invalidateEvents: (workspaceId?: string) => void;
  fetchEvents: (workspaceId: string, force?: boolean) => Promise<FieldEventItem[]>;
  fetchMous: (workspaceId: string, force?: boolean) => Promise<MarcomMou[]>;
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

  lastError: null,
  clearError: () => set({ lastError: null }),

  postsByWorkspace: {},
  reportsByWorkspace: {},
  documentsByWorkspace: {},
  mousByWorkspace: {},
  placementsByWorkspace: {},
  eventsByWorkspace: {},

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

  getCachedPosts: (workspaceId: string) => {
    return get().postsByWorkspace[workspaceId];
  },

  setCachedPosts: (workspaceId: string, posts: ContentPostItem[]) => {
    set((s) => ({
      postsByWorkspace: { ...s.postsByWorkspace, [workspaceId]: posts },
    }));
  },

  updateCachedPost: (
    workspaceId: string,
    post: Partial<ContentPostItem> & { id: string }
  ) => {
    set((s) => {
      const existing = s.postsByWorkspace[workspaceId];
      if (!existing) return s;
      return {
        postsByWorkspace: {
          ...s.postsByWorkspace,
          [workspaceId]: existing.map((p) =>
            p.id === post.id ? ({ ...p, ...post } as ContentPostItem) : p
          ),
        },
      };
    });
  },

  removeCachedPost: (workspaceId: string, postId: string) => {
    set((s) => {
      const existing = s.postsByWorkspace[workspaceId];
      if (!existing) return s;
      return {
        postsByWorkspace: {
          ...s.postsByWorkspace,
          [workspaceId]: existing.filter((p) => p.id !== postId),
        },
      };
    });
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

  invalidatePosts: (workspaceId?: string) => {
    set((s) => {
      if (workspaceId) {
        const copy = { ...s.postsByWorkspace };
        delete copy[workspaceId];
        return { postsByWorkspace: copy };
      }
      return { postsByWorkspace: {} };
    });
  },

  getCachedReports: (workspaceId: string) => {
    return get().reportsByWorkspace[workspaceId];
  },

  setCachedReports: (workspaceId: string, reports: MonthlyReport[]) => {
    set((s) => ({
      reportsByWorkspace: { ...s.reportsByWorkspace, [workspaceId]: reports },
    }));
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

  invalidateReports: (workspaceId?: string) => {
    set((s) => {
      if (workspaceId) {
        const copy = { ...s.reportsByWorkspace };
        delete copy[workspaceId];
        return { reportsByWorkspace: copy };
      }
      return { reportsByWorkspace: {} };
    });
  },

  getCachedDocuments: (workspaceId: string) => {
    return get().documentsByWorkspace[workspaceId];
  },

  setCachedDocuments: (workspaceId: string, documents: DocumentItem[]) => {
    set((s) => ({
      documentsByWorkspace: { ...s.documentsByWorkspace, [workspaceId]: documents },
    }));
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

  invalidateDocuments: (workspaceId?: string) => {
    set((s) => {
      if (workspaceId) {
        const copy = { ...s.documentsByWorkspace };
        delete copy[workspaceId];
        return { documentsByWorkspace: copy };
      }
      return { documentsByWorkspace: {} };
    });
  },

  getCachedMous: (workspaceId: string) => {
    return get().mousByWorkspace[workspaceId];
  },

  setCachedMous: (workspaceId: string, mous: MarcomMou[]) => {
    set((s) => ({
      mousByWorkspace: { ...s.mousByWorkspace, [workspaceId]: mous },
    }));
  },

  invalidateMous: (workspaceId?: string) => {
    set((s) => {
      if (workspaceId) {
        const copy = { ...s.mousByWorkspace };
        delete copy[workspaceId];
        return { mousByWorkspace: copy };
      }
      return { mousByWorkspace: {} };
    });
  },

  getCachedPlacements: (workspaceId: string) => {
    return get().placementsByWorkspace[workspaceId];
  },

  setCachedPlacements: (workspaceId: string, placements: MarcomPlacement[]) => {
    set((s) => ({
      placementsByWorkspace: { ...s.placementsByWorkspace, [workspaceId]: placements },
    }));
  },

  invalidatePlacements: (workspaceId?: string) => {
    set((s) => {
      if (workspaceId) {
        const copy = { ...s.placementsByWorkspace };
        delete copy[workspaceId];
        return { placementsByWorkspace: copy };
      }
      return { placementsByWorkspace: {} };
    });
  },

  getCachedEvents: (workspaceId: string) => {
    return get().eventsByWorkspace[workspaceId];
  },

  setCachedEvents: (workspaceId: string, events: FieldEventItem[]) => {
    set((s) => ({
      eventsByWorkspace: { ...s.eventsByWorkspace, [workspaceId]: events },
    }));
  },

  invalidateEvents: (workspaceId?: string) => {
    set((s) => {
      if (workspaceId) {
        const copy = { ...s.eventsByWorkspace };
        delete copy[workspaceId];
        return { eventsByWorkspace: copy };
      }
      return { eventsByWorkspace: {} };
    });
  },

  fetchEvents: async (workspaceId: string, force = false) => {
    if (!workspaceId) return [];
    const state = get();
    const cached = state.eventsByWorkspace[workspaceId];
    if (cached && !force) {
      return cached;
    }
    try {
      const res = await fetch(`/api/marcom/events?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (!res.ok) throw new Error(`Failed to fetch events (${res.status})`);
      const json = await res.json();
      const list: FieldEventItem[] = Array.isArray(json.data) ? json.data : [];
      set((s) => ({
        eventsByWorkspace: { ...s.eventsByWorkspace, [workspaceId]: list },
      }));
      return list;
    } catch (err) {
      console.error("[marcomDataStore] fetchEvents error:", err);
      return cached || [];
    }
  },

  fetchMous: async (workspaceId: string, force = false) => {
    if (!workspaceId) return [];
    const state = get();
    const cached = state.mousByWorkspace[workspaceId];
    if (cached && !force) {
      return cached;
    }
    try {
      const res = await fetch(`/api/marcom/mous?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (!res.ok) throw new Error(`Failed to fetch mous (${res.status})`);
      const json = await res.json();
      const list: MarcomMou[] = Array.isArray(json.data) ? json.data : [];
      set((s) => ({
        mousByWorkspace: { ...s.mousByWorkspace, [workspaceId]: list },
      }));
      return list;
    } catch (err) {
      console.error("[marcomDataStore] fetchMous error:", err);
      return cached || [];
    }
  },

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
}));

