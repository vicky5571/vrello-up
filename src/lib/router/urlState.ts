import { type ViewMode, type AppMode } from "@/types";

export interface UrlNavState {
  appMode?: AppMode;
  view?: ViewMode;
  workspaceId?: string;
  spaceId?: string;
  listId?: string;
  taskId?: string;
}

export const VALID_VIEW_MODES = new Set<ViewMode>([
  "pipeline",
  "home",
  "list",
  "board",
  "table",
  "calendar",
  "gantt",
  "channel",
  "content-planner",
  "branches",
  "outlets",
  "placements",
  "mous",
  "events",
  "documents",
  "reports",
  "analytics",
]);

export const MARCOM_VIEWS = new Set<ViewMode>([
  "pipeline",
  "content-planner",
  "events",
  "placements",
  "mous",
  "branches",
  "outlets",
  "documents",
  "reports",
  "analytics",
]);

/**
 * Parses URL search parameters into a sanitized, validated navigation state.
 */
export function parseUrlNavState(
  searchOrParams: string | URLSearchParams,
): UrlNavState {
  const params =
    typeof searchOrParams === "string"
      ? new URLSearchParams(
          searchOrParams.startsWith("?")
            ? searchOrParams.slice(1)
            : searchOrParams,
        )
      : searchOrParams;

  const state: UrlNavState = {};

  // Raw parameter resolution (supporting standard and concise alias keys)
  const rawMode = params.get("mode") || params.get("m");
  const rawView = params.get("view") || params.get("v");
  const rawSpace = params.get("space") || params.get("s");
  const rawList = params.get("list") || params.get("l");
  const rawTask = params.get("task") || params.get("t");
  const rawWorkspace = params.get("workspace") || params.get("ws");

  if (rawWorkspace) {
    state.workspaceId = rawWorkspace.trim();
  }
  if (rawSpace) {
    state.spaceId = rawSpace.trim();
  }
  if (rawList) {
    state.listId = rawList.trim();
  }
  if (rawTask) {
    state.taskId = rawTask.trim();
  }

  // View validation and normalization
  if (rawView) {
    const trimmedView = rawView.trim();
    if (trimmedView === "content") {
      state.view = "content-planner";
    } else if (VALID_VIEW_MODES.has(trimmedView as ViewMode)) {
      state.view = trimmedView as ViewMode;
    }
  }

  // Mode validation
  if (rawMode === "tasks" || rawMode === "marcom") {
    state.appMode = rawMode;
  } else if (state.view && MARCOM_VIEWS.has(state.view)) {
    state.appMode = "marcom";
  }

  return state;
}

/**
 * Serializes a navigation state into a clean query string (e.g. "?view=board&task=task-1").
 */
export function serializeUrlNavState(state: UrlNavState): string {
  const params = new URLSearchParams();

  if (state.appMode) {
    params.set("mode", state.appMode);
  }
  if (state.view) {
    params.set("view", state.view);
  }
  if (state.workspaceId) {
    params.set("workspace", state.workspaceId);
  }
  if (state.spaceId) {
    params.set("space", state.spaceId);
  }
  if (state.listId) {
    params.set("list", state.listId);
  }
  if (state.taskId) {
    params.set("task", state.taskId);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Constructs a shareable deep-link URL for a specific task.
 * Retains relevant existing context (e.g. view, space, workspace) if available.
 */
export function buildShareableTaskUrl(
  taskId: string,
  currentSearch?: string,
): string {
  const currentNav = currentSearch ? parseUrlNavState(currentSearch) : {};
  const nextNav: UrlNavState = {
    ...currentNav,
    taskId: taskId.trim(),
  };

  const serialized = serializeUrlNavState(nextNav);
  return `/${serialized}`;
}
