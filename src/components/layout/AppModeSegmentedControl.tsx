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
    <div className="px-2.5 pt-2.5 pb-1.5 shrink-0">
      <div
        role="tablist"
        aria-label="App Mode Switcher"
        className="relative p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-stretch gap-0.5 select-none"
      >
        {/* Projects Mode Button */}
        <button
          type="button"
          role="tab"
          aria-selected={appMode === "tasks"}
          onClick={handleSelectTasks}
          className={cn(
            "relative flex-1 self-stretch min-h-[38px] flex items-center justify-center py-1 px-1.5 sm:px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors duration-200 group",
            appMode === "tasks"
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5",
          )}
        >
          {appMode === "tasks" && (
            <motion.div
              layoutId="activeAppModeIndicator"
              className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-200/80 dark:border-white/10"
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 450, damping: 35 }
              }
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-1.5 text-center leading-tight my-auto">
            <Kanban
              className={cn(
                "w-3.5 h-3.5 shrink-0 transition-colors duration-200",
                appMode === "tasks"
                  ? "text-blue-500"
                  : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300",
              )}
            />
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
            "relative flex-1 self-stretch min-h-[38px] flex items-center justify-center py-1 px-1.5 sm:px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors duration-200 group",
            appMode === "marcom"
              ? "text-pink-600 dark:text-pink-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5",
          )}
        >
          {appMode === "marcom" && (
            <motion.div
              layoutId="activeAppModeIndicator"
              className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-200/80 dark:border-white/10"
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 450, damping: 35 }
              }
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-1.5 text-center leading-tight my-auto">
            <Megaphone
              className={cn(
                "w-3.5 h-3.5 shrink-0 transition-colors duration-200",
                appMode === "marcom"
                  ? "text-pink-500"
                  : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300",
              )}
            />
            <span className="flex flex-col text-center leading-tight">
              <span>Marcom</span>
              <span>Hub</span>
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
