"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { ViewMode } from "@/types";
import {
  List as ListIcon,
  Kanban,
  TableProperties,
  CalendarDays,
  Milestone,
  Hash,
  Plus,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewTabItem {
  id: ViewMode | "channel";
  label: string;
  icon: LucideIcon;
  iconColor: string;
  isAvailable: boolean;
}

const VIEWS: ViewTabItem[] = [
  { id: "channel", label: "Channel", icon: Hash, iconColor: "text-violet-500", isAvailable: false },
  { id: "list", label: "List", icon: ListIcon, iconColor: "text-blue-500", isAvailable: true },
  { id: "board", label: "Board", icon: Kanban, iconColor: "text-orange-500", isAvailable: true },
  { id: "calendar", label: "Calendar", icon: CalendarDays, iconColor: "text-rose-500", isAvailable: true },
  { id: "gantt", label: "Gantt", icon: Milestone, iconColor: "text-purple-500", isAvailable: true },
  { id: "table", label: "Table", icon: TableProperties, iconColor: "text-emerald-500", isAvailable: true },
];

export function ViewSwitcher() {
  const { activeView, setActiveView } = useWorkspaceStore();

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
      {VIEWS.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;

        return (
          <button
            key={view.id}
            onClick={() => {
              if (view.isAvailable) {
                setActiveView(view.id as ViewMode);
              }
            }}
            disabled={!view.isAvailable}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer select-none whitespace-nowrap",
              isActive
                ? "text-slate-900 dark:text-slate-100 font-semibold bg-slate-100 dark:bg-slate-800"
                : view.isAvailable
                ? "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                : "text-slate-400 dark:text-slate-600 opacity-60 cursor-not-allowed"
            )}
          >
            <Icon className={cn("w-3.5 h-3.5 shrink-0", view.iconColor)} />
            <span>{view.label}</span>
          </button>
        );
      })}

      {/* + View button */}
      <button
        type="button"
        title="Add View"
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-md transition-colors cursor-pointer ml-0.5"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>View</span>
      </button>
    </div>
  );
}
