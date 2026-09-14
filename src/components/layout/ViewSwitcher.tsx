"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { ViewMode } from "@/types";
import {
  List as ListIcon,
  Kanban,
  TableProperties,
  CalendarDays,
  Milestone,
  Hash,
  Building2,
  Store,
  ClipboardList,
  FileText,
  Files,
  BarChart3,
  TrendingUp,
  Plus,
  Megaphone,
  Sparkles,
  Flag,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddViewModal } from "@/components/modals/AddViewModal";

interface ViewTabItem {
  id: ViewMode;
  label: string;
  icon: LucideIcon;
  iconColor: string;
  isAvailable: boolean;
}

const VIEWS: ViewTabItem[] = [
  { id: "channel", label: "Channel", icon: Hash, iconColor: "text-violet-500", isAvailable: true },
  { id: "list", label: "List", icon: ListIcon, iconColor: "text-blue-500", isAvailable: true },
  { id: "board", label: "Board", icon: Kanban, iconColor: "text-orange-500", isAvailable: true },
  { id: "calendar", label: "Calendar", icon: CalendarDays, iconColor: "text-rose-500", isAvailable: true },
  { id: "gantt", label: "Gantt", icon: Milestone, iconColor: "text-purple-500", isAvailable: true },
  { id: "table", label: "Table", icon: TableProperties, iconColor: "text-emerald-500", isAvailable: true },
];

export const WORK_ITEM_VIEWS: ViewTabItem[] = [
  { id: "content-planner", label: "Content Planner", icon: Sparkles, iconColor: "text-pink-500", isAvailable: true },
  { id: "events", label: "Field Events", icon: Flag, iconColor: "text-blue-500", isAvailable: true },
  { id: "placements", label: "Placements", icon: ClipboardList, iconColor: "text-lime-500", isAvailable: true },
  { id: "mous", label: "MOUs", icon: FileText, iconColor: "text-fuchsia-500", isAvailable: true },
];

export const MASTER_DATA_VIEWS: ViewTabItem[] = [
  { id: "branches", label: "Branches", icon: Building2, iconColor: "text-cyan-500", isAvailable: true },
  { id: "outlets", label: "Outlets", icon: Store, iconColor: "text-orange-500", isAvailable: true },
  { id: "documents", label: "Documents", icon: Files, iconColor: "text-sky-500", isAvailable: true },
  { id: "reports", label: "Reports", icon: BarChart3, iconColor: "text-indigo-500", isAvailable: true },
  { id: "analytics", label: "Analytics", icon: TrendingUp, iconColor: "text-teal-500", isAvailable: true },
];

export const MARKETING_VIEWS: ViewTabItem[] = [
  ...WORK_ITEM_VIEWS,
  ...MASTER_DATA_VIEWS,
];

function ViewTabButton({
  view,
  isActive,
  onSelect,
}: {
  view: ViewTabItem;
  isActive: boolean;
  onSelect: (id: ViewMode) => void;
}) {
  const Icon = view.icon;

  return (
    <button
      onClick={() => {
        if (view.isAvailable) {
          onSelect(view.id);
        }
      }}
      disabled={!view.isAvailable}
      className={cn(
        "relative flex items-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[34px] sm:min-h-0 rounded-md text-xs font-medium transition-colors cursor-pointer select-none whitespace-nowrap shrink-0",
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
}

export function ViewSwitcher() {
  const { activeView, setActiveView } = useWorkspaceStore();
  const [isAddViewOpen, setIsAddViewOpen] = useState(false);

  return (
    <>
      <div className="w-full flex items-center gap-0.5 overflow-x-auto no-scrollbar py-0.5 [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)] [-webkit-mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)]">
        {VIEWS.map((view) => (
          <ViewTabButton
            key={view.id}
            view={view}
            isActive={activeView === view.id}
            onSelect={setActiveView}
          />
        ))}

        {/* + View button */}
        <button
          type="button"
          onClick={() => setIsAddViewOpen(true)}
          title="Add or configure View"
          className="flex items-center gap-1 px-2.5 py-2 sm:py-1.5 min-h-[34px] sm:min-h-0 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-md transition-colors cursor-pointer ml-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
      </div>

      <AddViewModal
        isOpen={isAddViewOpen}
        onClose={() => setIsAddViewOpen(false)}
      />
    </>
  );
}
