import type { ViewMode } from "@/types";

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

