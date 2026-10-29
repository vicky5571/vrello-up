"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import type { ViewMode } from "@/types";

// Mirrors hotkeys: 1-3 → List, Board, Calendar
const VIEW_SHORTCUTS: Record<string, ViewMode> = {
  "1": "list",
  "2": "board",
  "3": "calendar",
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

      // Esc closes one layer per press, even from inputs
      if (e.key === "Escape") {
        if (state.isCommandPaletteOpen) state.closeCommandPalette();
        else if (state.isHelpDocsOpen) state.setHelpDocsOpen(false);
        else if (state.isAiDrawerOpen) state.setAiDrawerOpen(false);
        return;
      }

      if (isTypingTarget(e.target)) return;

      if (
        state.isCommandPaletteOpen ||
        state.isHelpDocsOpen ||
        state.isAiDrawerOpen
      ) {
        return;
      }

      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "f"
      ) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Search"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          toast.info("Gunakan filter dan kolom pencarian pada modul ini");
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

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
