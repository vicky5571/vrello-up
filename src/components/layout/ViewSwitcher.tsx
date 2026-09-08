"use client";

import { useState, useRef, useEffect } from "react";
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
  Sparkles,
  CalendarRange,
  ChevronDown,
  Megaphone,
  Check,
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

export const MARKETING_VIEWS: ViewTabItem[] = [
  { id: "content", label: "Content Planner", icon: Sparkles, iconColor: "text-pink-500", isAvailable: true },
  { id: "branches", label: "Branches", icon: Building2, iconColor: "text-cyan-500", isAvailable: true },
  { id: "outlets", label: "Outlets", icon: Store, iconColor: "text-orange-500", isAvailable: true },
  { id: "placements", label: "Placements", icon: ClipboardList, iconColor: "text-lime-500", isAvailable: true },
  { id: "mous", label: "MOUs", icon: FileText, iconColor: "text-fuchsia-500", isAvailable: true },
  { id: "events", label: "Events", icon: CalendarRange, iconColor: "text-rose-500", isAvailable: true },
  { id: "documents", label: "Documents", icon: Files, iconColor: "text-sky-500", isAvailable: true },
  { id: "reports", label: "Reports", icon: BarChart3, iconColor: "text-indigo-500", isAvailable: true },
  { id: "analytics", label: "Analytics", icon: TrendingUp, iconColor: "text-teal-500", isAvailable: true },
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
  const [isMarketingOpen, setIsMarketingOpen] = useState(false);
  const marketingDropdownRef = useRef<HTMLDivElement>(null);

  // Check if active view is one of marketing views
  const activeMarketingView = MARKETING_VIEWS.find((v) => v.id === activeView);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        marketingDropdownRef.current &&
        !marketingDropdownRef.current.contains(e.target as Node)
      ) {
        setIsMarketingOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Marketing Dropdown Tab */}
        <div ref={marketingDropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMarketingOpen(!isMarketingOpen)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[34px] sm:min-h-0 rounded-md text-xs font-medium transition-colors cursor-pointer select-none whitespace-nowrap",
              activeMarketingView
                ? "text-slate-900 dark:text-slate-100 font-semibold bg-slate-100 dark:bg-slate-800"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
            )}
          >
            {activeMarketingView ? (
              <>
                <activeMarketingView.icon
                  className={cn("w-3.5 h-3.5 shrink-0", activeMarketingView.iconColor)}
                />
                <span>{activeMarketingView.label}</span>
              </>
            ) : (
              <>
                <Megaphone className="w-3.5 h-3.5 shrink-0 text-pink-500" />
                <span>Marketing</span>
              </>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
          </button>

          {isMarketingOpen && (
            <div className="absolute left-0 top-full mt-1 w-52 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Marketing & Ops
              </div>
              {MARKETING_VIEWS.map((mv) => {
                const Icon = mv.icon;
                const isSelected = activeView === mv.id;
                return (
                  <button
                    key={mv.id}
                    type="button"
                    onClick={() => {
                      setActiveView(mv.id);
                      setIsMarketingOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer",
                      isSelected && "font-semibold bg-slate-50 dark:bg-slate-800/60"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", mv.iconColor)} />
                      <span className="truncate text-slate-700 dark:text-slate-200">
                        {mv.label}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* + View button */}
        <button
          type="button"
          onClick={() => setIsAddViewOpen(true)}
          title="Add or configure View"
          className="flex items-center gap-1 px-2.5 py-2 sm:py-1.5 min-h-[34px] sm:min-h-0 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded-md transition-colors cursor-pointer ml-0.5 shrink-0"
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
