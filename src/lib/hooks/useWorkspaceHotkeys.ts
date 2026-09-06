"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import type { ViewMode } from "@/types";

// Mirrors HelpDocsModal: 1-5 → List, Board, Calendar, Gantt, Home
const VIEW_SHORTCUTS: Record<string, ViewMode> = {
  "1": "list",
  "2": "board",
  "3": "calendar",
  "4": "gantt",
  "5": "home",
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function useWorkspaceHotkeys() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useWorkspaceStore.getState();

      if (isTypingTarget(e.target)) return;
      if (
        state.isCommandPaletteOpen ||
        state.isCreateTaskModalOpen ||
        state.isHelpDocsOpen ||
        state.isAiDrawerOpen ||
        state.selectedTaskId !== null
      ) {
        return;
      }

      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "f"
      ) {
        e.preventDefault();
        state.setFilterBarOpen(!state.isFilterBarOpen);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === "c" || key === "n") {
        e.preventDefault();
        state.setCreateTaskModalOpen(true);
        return;
      }

      const view = VIEW_SHORTCUTS[e.key];
      if (view) {
        e.preventDefault();
        state.setActiveView(view);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        state.setHelpDocsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
