import { type ViewPreferences } from "@/types";

export const DEFAULT_VIEW_PREFERENCES: ViewPreferences = {
  density: "standard",
  visibleFields: {
    assignees: true,
    priority: true,
    dueDate: true,
    tags: true,
    subtasks: true,
  },
};

/**
 * Pure function to deep-merge view preferences updates.
 */
export function applyViewPreferences(
  current: ViewPreferences = DEFAULT_VIEW_PREFERENCES,
  prefs: Partial<ViewPreferences>,
): ViewPreferences {
  return {
    ...current,
    ...prefs,
    visibleFields: {
      ...current.visibleFields,
      ...prefs.visibleFields,
    },
  };
}

/**
 * Pure function to reset view preferences to default.
 */
export function getResetViewPreferences(): ViewPreferences {
  return DEFAULT_VIEW_PREFERENCES;
}
