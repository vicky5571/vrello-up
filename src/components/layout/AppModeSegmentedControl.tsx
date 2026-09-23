"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Kanban, Megaphone } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { countOpenTasks } from "@/lib/tasks/openTasksCount";
import { cn } from "@/lib/utils";

interface AppModeSegmentedControlProps {
  showBadges?: boolean;
}

export function AppModeSegmentedControl({
  showBadges = false,
}: AppModeSegmentedControlProps) {
  const appMode = useWorkspaceStore((s) => s.appMode);
  const setAppMode = useWorkspaceStore((s) => s.setAppMode);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const tasks = useWorkspaceStore((s) => s.tasks);

  const shouldReduceMotion = useReducedMotion();

  const activeWs = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId]
  );

  const openTasks = useMemo(() => {
    if (!showBadges) return 0;
    return countOpenTasks(tasks, activeWs?.spaces || []);
  }, [showBadges, tasks, activeWs]);

  return (
    <div className="px-2.5 pt-2.5 pb-1.5 shrink-0">
      <div
        role="tablist"
        aria-label="Workspace Context Switcher"
        className="relative p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-stretch gap-0.5 select-none"
      >
        {/* Projects & Tasks Mode Button */}
        <button
          type="button"
          role="tab"
          aria-selected={appMode === "tasks"}
          onClick={() => setAppMode("tasks")}
          className={cn(
            "relative flex-1 self-stretch min-h-[38px] flex items-center justify-center py-1 px-1.5 sm:px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors duration-200 group",
            appMode === "tasks"
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5"
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
                  : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              )}
            />
            <span>Projects</span>
            {showBadges && openTasks > 0 && (
              <span
                title={`${openTasks} open tasks`}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 leading-none rounded-full font-mono font-medium transition-colors shrink-0",
                  appMode === "tasks"
                    ? "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300"
                    : "bg-slate-200/70 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                )}
              >
                {openTasks > 99 ? "99+" : openTasks}
              </span>
            )}
          </span>
        </button>

        {/* Marketing & Communications Mode Button */}
        <button
          type="button"
          role="tab"
          aria-selected={appMode === "marcom"}
          onClick={() => setAppMode("marcom")}
          className={cn(
            "relative flex-1 self-stretch min-h-[38px] flex items-center justify-center py-1 px-1.5 sm:px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors duration-200 group",
            appMode === "marcom"
              ? "text-pink-600 dark:text-pink-400"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5"
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
                  : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              )}
            />
            <span>Marcom Hub</span>
            {showBadges && (
              <span
                title="Marketing & Communications Hub"
                className={cn(
                  "text-[9px] px-1.5 py-0.5 leading-none rounded-full font-semibold tracking-wider uppercase transition-colors shrink-0",
                  appMode === "marcom"
                    ? "bg-pink-100 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300"
                    : "bg-slate-200/70 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                )}
              >
                HUB
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

