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
