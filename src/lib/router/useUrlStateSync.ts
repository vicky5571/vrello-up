"use client";

import { useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import {
  parseUrlNavState,
  serializeUrlNavState,
  type UrlNavState,
} from "./urlState";

/**
 * Hook that binds workspace navigation state bidirectionally to URL search parameters.
 * - Hydrates store state on initial deep-link load.
 * - Handles browser Back/Forward (popstate) to navigate views and task drawers.
 * - Pushes/replaces history entries when the user interacts with the app.
 */
export function useUrlStateSync() {
  const appMode = useWorkspaceStore((s) => s.appMode);
  const activeView = useWorkspaceStore((s) => s.activeView);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activeSpaceId = useWorkspaceStore((s) => s.activeSpaceId);
  const activeListId = useWorkspaceStore((s) => s.activeListId);
  const selectedTaskId = useWorkspaceStore((s) => s.selectedTaskId);

  // Track if navigation is currently driven by a popstate (Back/Forward) event to prevent push loops
  const isPopstateEvent = useRef(false);
  const isInitialMount = useRef(true);
  const prevTaskId = useRef<string | null>(selectedTaskId);
  const prevView = useRef<string>(activeView);

  // 1. Initial hydration on mount from URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    const nav = parseUrlNavState(window.location.search);
    const api = useWorkspaceStore.getState();

    if (nav.appMode && nav.appMode !== api.appMode) {
      api.setAppMode(nav.appMode);
    }
    if (nav.workspaceId && nav.workspaceId !== api.activeWorkspaceId) {
      api.setActiveWorkspace(nav.workspaceId);
    }
    if (nav.spaceId && nav.spaceId !== api.activeSpaceId) {
      api.setActiveSpace(nav.spaceId);
    }
    if (nav.listId !== undefined && nav.listId !== api.activeListId) {
      api.setActiveList(nav.listId);
    }
    if (nav.view && nav.view !== api.activeView) {
      api.setActiveView(nav.view);
    }
    if (nav.taskId) {
      api.setSelectedTaskId(nav.taskId);
    }

    isInitialMount.current = false;
  }, []);

  // 2. Listen to browser Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      isPopstateEvent.current = true;
      const nav = parseUrlNavState(window.location.search);
      const api = useWorkspaceStore.getState();

      if (nav.appMode && nav.appMode !== api.appMode) {
        api.setAppMode(nav.appMode);
      }
      if (nav.workspaceId && nav.workspaceId !== api.activeWorkspaceId) {
        api.setActiveWorkspace(nav.workspaceId);
      }
      if (nav.spaceId && nav.spaceId !== api.activeSpaceId) {
        api.setActiveSpace(nav.spaceId);
      }
      if (nav.listId !== undefined && nav.listId !== api.activeListId) {
        api.setActiveList(nav.listId);
      }
      if (nav.view && nav.view !== api.activeView) {
        api.setActiveView(nav.view);
      }
      // Reconcile task selection: if URL has task, open drawer; if URL has no task, close drawer
      const targetTaskId = nav.taskId || null;
      if (targetTaskId !== api.selectedTaskId) {
        api.setSelectedTaskId(targetTaskId);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // 3. Sync state changes to the URL
  useEffect(() => {
    if (typeof window === "undefined" || isInitialMount.current) return;

    // Skip pushing history if the state change was initiated by browser Back/Forward
    if (isPopstateEvent.current) {
      isPopstateEvent.current = false;
      prevTaskId.current = selectedTaskId;
      prevView.current = activeView;
      return;
    }

    const currentQuery = window.location.search;
    const currentState: UrlNavState = {
      appMode,
      view: activeView,
      workspaceId: activeWorkspaceId,
      spaceId: activeSpaceId,
      listId: activeListId || undefined,
      taskId: selectedTaskId || undefined,
    };

    const targetQuery = serializeUrlNavState(currentState);

    // Prevent redundant history entries if query hasn't changed
    if (targetQuery === currentQuery) return;

    const targetUrl = targetQuery || window.location.pathname;

    // Use pushState for deliberate view transitions or opening/closing task drawer
    const isViewChange = activeView !== prevView.current;
    const isTaskToggle = selectedTaskId !== prevTaskId.current;

    prevTaskId.current = selectedTaskId;
    prevView.current = activeView;

    if (isViewChange || isTaskToggle) {
      window.history.pushState(null, "", targetUrl);
    } else {
      window.history.replaceState(null, "", targetUrl);
    }
  }, [
    appMode,
    activeView,
    activeWorkspaceId,
    activeSpaceId,
    activeListId,
    selectedTaskId,
  ]);
}
