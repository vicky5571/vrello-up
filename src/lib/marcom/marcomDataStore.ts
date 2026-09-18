import { create } from "zustand";
import type {
  BranchItem,
  MaterialItem,
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

  // SWR View Caches keyed by workspaceId
  postsByWorkspace: Record<string, ContentPostItem[]>;
  reportsByWorkspace: Record<string, MonthlyReport[]>;
  documentsByWorkspace: Record<string, DocumentItem[]>;

  // Master data actions
  fetchBranches: (force?: boolean) => Promise<BranchItem[]>;
  fetchMaterials: (force?: boolean) => Promise<MaterialItem[]>;
  setBranches: (branches: BranchItem[]) => void;

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

    set({ isBranchesLoading: true });
    try {
      const res = await fetch("/api/marcom/branches");
      if (!res.ok) throw new Error("Failed to fetch branches");
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      set({ branches: list, isBranchesLoaded: true, isBranchesLoading: false });
      return list;
    } catch {
      set({ isBranchesLoading: false });
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

    set({ isMaterialsLoading: true });
    try {
      const res = await fetch("/api/marcom/materials");
      if (!res.ok) throw new Error("Failed to fetch materials");
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      set({ materials: list, isMaterialsLoaded: true, isMaterialsLoading: false });
      return list;
    } catch {
      set({ isMaterialsLoading: false });
      return state.materials;
    }
  },

  setBranches: (branches: BranchItem[]) => {
    set({ branches, isBranchesLoaded: true });
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

