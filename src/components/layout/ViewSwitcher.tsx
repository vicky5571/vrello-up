"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { ViewMode } from "@/types";
import { Kanban, TableProperties, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const VIEWS: { id: ViewMode; label: string; icon: typeof Kanban }[] = [
  { id: "board", label: "Board", icon: Kanban },
  { id: "table", label: "Table", icon: TableProperties },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

export function ViewSwitcher() {
  const { activeView, setActiveView } = useWorkspaceStore();

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
      {VIEWS.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;

        return (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer select-none",
              isActive
                ? "text-teal-700 dark:text-teal-300"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeViewIndicator"
                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-200/50 dark:border-slate-700/50"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <Icon className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
