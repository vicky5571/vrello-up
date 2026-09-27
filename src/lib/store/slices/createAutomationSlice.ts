import type { StateCreator } from "zustand";
import type { WorkspaceStore, AutomationSlice } from "./types";
import type { User } from "@/types";
import {
  resolveActor,
  applyAddComment,
  applyDeleteComment,
  applyAddChannelMessage,
  applyLogActivity,
} from "@/lib/store/commentOperations";
import {
  applyAddCustomAutomation,
  applyRemoveCustomAutomation,
  applyToggleCustomAutomation,
  executeAutomationsForTrigger,
} from "@/lib/store/automationOperations";
import { findSpaceForListId } from "@/lib/store/workspaceSync";
import { SEED_USERS, INITIAL_CHANNEL_MESSAGES } from "@/lib/constants/seeds";
import { syncAddComment } from "./syncHelpers";

export function getActor(state: WorkspaceStore, provided?: User): User {
  return resolveActor(
    state.workspaces,
    state.activeWorkspaceId,
    state.currentUserId,
    SEED_USERS,
    provided,
  );
}

export const createAutomationSlice: StateCreator<
  WorkspaceStore,
  [],
  [],
  AutomationSlice
> = (set, get) => ({
  channelMessages: INITIAL_CHANNEL_MESSAGES,
  automationEnabled: {
    "rule-1": true,
    "rule-2": true,
    "rule-3": true,
    "rule-4": false,
  },
  automationRuns: {},
  customAutomations: [],

  addComment: (taskId, content, user, attachments) => {
    const actor = getActor(get(), user);
    const { nextTasks, newComment } = applyAddComment(
      get().tasks,
      taskId,
      content,
      actor,
      attachments,
    );
    if (!newComment) return;
    set({ tasks: nextTasks });
    syncAddComment(taskId, newComment);
  },

  deleteComment: (taskId, commentId) => {
    const { nextTasks } = applyDeleteComment(get().tasks, taskId, commentId);
    set({ tasks: nextTasks });
  },

  logActivity: (taskId, action, user) => {
    const actor = getActor(get(), user);
    const { nextTasks } = applyLogActivity(get().tasks, taskId, action, actor);
    set({ tasks: nextTasks });
  },

  addChannelMessage: (channelId, content, user) => {
    const actor = getActor(get(), user);
    const { nextMessages, newMessage } = applyAddChannelMessage(
      get().channelMessages,
      channelId,
      content,
      actor,
    );
    if (!newMessage) return;
    set({ channelMessages: nextMessages });
  },

  setAutomationEnabled: (id, enabled) =>
    set((state) => ({
      automationEnabled: { ...state.automationEnabled, [id]: enabled },
    })),

  addCustomAutomation: (ruleData) => {
    const { nextRules, newRule } = applyAddCustomAutomation(
      get().customAutomations,
      ruleData,
    );
    set({ customAutomations: nextRules });
    return newRule;
  },

  removeCustomAutomation: (id) =>
    set((state) => ({
      customAutomations: applyRemoveCustomAutomation(
        state.customAutomations,
        id,
      ).nextRules,
    })),

  toggleCustomAutomation: (id, enabled) =>
    set((state) => ({
      customAutomations: applyToggleCustomAutomation(
        state.customAutomations,
        id,
        enabled,
      ).nextRules,
    })),

  runAutomationsForTrigger: async (trigger, payload = {}) => {
    const state = get();
    const { executedCount, nextAutomations } =
      await executeAutomationsForTrigger(
        state.customAutomations,
        trigger,
        payload,
        {
          createTask: state.createTask,
          updateTask: state.updateTask,
          logActivity: state.logActivity,
          tasks: state.tasks,
          workspaces: state.workspaces,
          activeWorkspaceId: state.activeWorkspaceId,
          activeListId: state.activeListId,
          actor: getActor(state),
          findSpaceForListId,
        },
      );
    if (executedCount > 0) {
      set({ customAutomations: nextAutomations });
    }
    return executedCount;
  },
});
