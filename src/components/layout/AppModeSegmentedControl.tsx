"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Kanban, Megaphone } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

export function AppModeSegmentedControl() {
  const { appMode, activeView } = useWorkspaceStore(
    useShallow((s) => ({
      appMode: s.appMode,
      activeView: s.activeView,
    })),
  );
  const setAppMode = useWorkspaceStore((s) => s.setAppMode);
  const setActiveView = useWorkspaceStore((s) => s.setActiveView);

  const shouldReduceMotion = useReducedMotion();

  const handleSelectTasks = () => {
    setAppMode("tasks");
    if (!["board", "list", "calendar"].includes(activeView)) {
      setActiveView("board");
    }
  };

  const handleSelectMarcom = () => {
    setAppMode("marcom");
    if (["board", "list", "calendar"].includes(activeView)) {
      setActiveView("pipeline");
    }
  };

  return (
    <div className="p-2 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
      <div
        role="tablist"
        aria-label="App Mode Switcher"
        className="relative grid grid-cols-2 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 text-xs font-medium select-none"
      >
        {/* Projects Mode Button */}
        <button
          type="button"
          role="tab"
          aria-selected={appMode === "tasks"}
          onClick={handleSelectTasks}
          className={cn(
            "relative flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors duration-200",
            appMode === "tasks"
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
          )}
        >
          {appMode === "tasks" && (
            <motion.div
              layoutId="activeAppModeIndicator"
              className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-2xs"
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 450, damping: 35 }
              }
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-1.5">
            <Kanban className="w-3.5 h-3.5 shrink-0" />
            <span>Projects</span>
          </span>
        </button>

        {/* Marcom Hub Mode Button */}
        <button
          type="button"
          role="tab"
          aria-selected={appMode === "marcom"}
          onClick={handleSelectMarcom}
          className={cn(
            "relative flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors duration-200",
            appMode === "marcom"
              ? "text-pink-600 dark:text-pink-400"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
          )}
        >
          {appMode === "marcom" && (
            <motion.div
              layoutId="activeAppModeIndicator"
              className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-2xs"
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 450, damping: 35 }
              }
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5 shrink-0" />
            <span>Marcom Hub</span>
          </span>
        </button>
      </div>
    </div>
  );
}
