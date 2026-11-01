import type { StateCreator } from "zustand";
import type { WorkspaceStore, DataSlice } from "./types";
import { SEED_USERS } from "@/lib/constants/seeds";

export const createDataSlice: StateCreator<
  WorkspaceStore,
  [],
  [],
  DataSlice
> = (set, get) => ({
  spaces: [],
  users: SEED_USERS,

  addUser: (name, email, role) => {
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80`,
    };
    set((state) => ({ users: [...state.users, newUser] }));
    return newUser;
  },

  removeUser: (userId) => {
    set((state) => ({ users: state.users.filter((u) => u.id !== userId) }));
  },

  syncSessionUser: (user) => {
    set((state) => {
      const existing = state.users.find((u) => u.id === user.id);
      if (existing) {
        return {
          users: state.users.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  name: user.name || u.name,
                  email: user.email || u.email,
                  avatar: user.avatar || u.avatar,
                  role: user.role || u.role,
                  assignedBranchIds: user.assignedBranchIds || u.assignedBranchIds,
                }
              : u,
          ),
        };
      }
      return {
        users: [
          ...state.users,
          {
            id: user.id,
            name: user.name || "User",
            email: user.email || "",
            avatar: user.avatar || "",
            role: user.role,
            assignedBranchIds: user.assignedBranchIds ?? [],
          },
        ],
      };
    });
  },

  importBackup: () => {
    return true;
  },

  fetchServerData: async () => {
    // Task server sync removed in marcom unified architecture
  },

  fetchServerTasks: async () => {
    return get().fetchServerData();
  },
});
