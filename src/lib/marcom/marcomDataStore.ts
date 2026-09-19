import { create } from "zustand";
import type {
  BranchItem,
  MaterialItem,
  OutletItem,
  ContentPostItem,
  MonthlyReport,
  DocumentItem,
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

  // Master data actions
  fetchBranches: (force?: boolean) => Promise<BranchItem[]>;
  fetchMaterials: (force?: boolean) => Promise<MaterialItem[]>;
  fetchOutlets: (force?: boolean) => Promise<OutletItem[]>;
  setBranches: (branches: BranchItem[]) => void;
  setMaterials: (materials: MaterialItem[]) => void;
  setOutlets: (outlets: OutletItem[]) => void;

  // View cache actions
  getCachedPosts: (workspaceId: string) => ContentPostItem[] | undefined;
  setCachedPosts: (workspaceId: string, posts: ContentPostItem[]) => void;
  updateCachedPost: (
    workspaceId: string,
    post: Partial<ContentPostItem> & { id: string }
  ) => void;
  removeCachedPost: (workspaceId: string, postId: string) => void;
  invalidatePosts: (workspaceId?: string) => void;

  getCachedReports: (workspaceId: string) => MonthlyReport[] | undefined;
  setCachedReports: (workspaceId: string, reports: MonthlyReport[]) => void;
  invalidateReports: (workspaceId?: string) => void;

  getCachedDocuments: (workspaceId: string) => DocumentItem[] | undefined;
  setCachedDocuments: (workspaceId: string, documents: DocumentItem[]) => void;
  invalidateDocuments: (workspaceId?: string) => void;
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
}));

