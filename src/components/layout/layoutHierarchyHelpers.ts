import type { ViewMode, AppMode } from "@/types";

export const WORK_ITEM_VIEWS = new Set<ViewMode>([
  "board",
  "list",
  "calendar",
]);

export const GLOBAL_ACCOUNT_VIEWS = new Set<ViewMode>([
  "profile",
  "users",
]);

/**
 * Resolves whether the contextual module Sidebar should be rendered.
 * Global account views (personal profile and administrative user management)
 * require full stage focus without operational module sidebar clutter.
 */
export function shouldRenderSidebar(activeView: ViewMode | string): boolean {
  if (GLOBAL_ACCOUNT_VIEWS.has(activeView as ViewMode)) {
    return false;
  }
  return true;
}

/**
 * Resolves whether the ProjectsFilterBar should be rendered in TopNav.
 * Restricts work-item filters strictly to task views (board, list, calendar).
 */
export function shouldRenderProjectsFilterBar(
  appMode: string,
  activeView: ViewMode | string
): boolean {
  if (appMode !== "tasks") {
    return false;
  }
  return WORK_ITEM_VIEWS.has(activeView as ViewMode);
}

export interface GlobalBreadcrumbInfo {
  label: string;
  iconName: "user" | "users" | "home";
}

/**
 * Resolves breadcrumb label and icon name for top-level global account views.
 * Returns null if the view is contextual (Projects or Marcom).
 */
export function getGlobalBreadcrumbInfo(
  activeView: ViewMode | string
): GlobalBreadcrumbInfo | null {
  if (activeView === "profile") {
    return {
      label: "Profil & Keamanan Akun",
      iconName: "user",
    };
  }

  if (activeView === "users") {
    return {
      label: "Manajemen Pengguna",
      iconName: "users",
    };
  }

  return null;
}

export interface WorkspaceReturnTarget {
  targetView: ViewMode;
  targetMode: AppMode;
  label: string;
}

/**
 * Resolves a guaranteed operational workspace view to return to from a global view.
 * Ensures the target is strictly an operational view (Projects work items or Marcom),
 * and NEVER a global account view like 'profile' or 'users'.
 */
export function resolveWorkspaceReturnTarget(params: {
  appMode?: string;
  lastTaskView?: ViewMode | string;
  lastMarcomView?: ViewMode | string;
}): WorkspaceReturnTarget {
  const isMarcom = params.appMode === "marcom";

  if (isMarcom) {
    const rawMarcom = params.lastMarcomView as ViewMode;
    const safeMarcom =
      rawMarcom &&
      !GLOBAL_ACCOUNT_VIEWS.has(rawMarcom) &&
      rawMarcom !== "profile" &&
      rawMarcom !== "users"
        ? rawMarcom
        : "events";
    return {
      targetView: safeMarcom,
      targetMode: "marcom",
      label: "Marketing Hub",
    };
  }

  const rawTask = params.lastTaskView as ViewMode;
  const safeTask =
    rawTask && WORK_ITEM_VIEWS.has(rawTask)
      ? rawTask
      : "board";

  return {
    targetView: safeTask,
    targetMode: "tasks",
    label: "Workspace",
  };
}

