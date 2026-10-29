"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Sparkles,
  CalendarDays,
  MapPin,
  List,
} from "lucide-react";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import type { MarcomWorkItem, MarcomWorkItemType } from "@/types";
import {
  getWorkItemTitle,
  getWorkItemDate,
  getWorkItemPic,
} from "@/lib/marcom/workItems";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";
import { cn } from "@/lib/utils";

const columnHelper = createMarcomColumnHelper<MarcomWorkItem>();

interface ProjectsListViewProps {
  onSelectItem?: (item: MarcomWorkItem) => void;
}

export function ProjectsListView({ onSelectItem }: ProjectsListViewProps) {
  const {
    posts,
    events,
    placements,
    fetchPosts,
    fetchEvents,
    fetchPlacements,
  } = useMarcomDataStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | MarcomWorkItemType>("all");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchPosts(), fetchEvents(), fetchPlacements()]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPosts, fetchEvents, fetchPlacements]);

  useEffect(() => {
    if (posts.length === 0 && events.length === 0 && placements.length === 0) {
      loadData();
    }
  }, [posts.length, events.length, placements.length, loadData]);

  const allRows = useMemo<MarcomWorkItem[]>(() => {
    const list: MarcomWorkItem[] = [
      ...posts.map((p) => ({ ...p, _type: "content" as const })),
      ...events.map((e) => ({ ...e, _type: "event" as const })),
      ...placements.map((p) => ({ ...p, _type: "placement" as const })),
    ];
    if (typeFilter === "all") return list;
    return list.filter((i) => i._type === typeFilter);
  }, [posts, events, placements, typeFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("_type", {
        header: "Type",
        size: 110,
        cell: ({ getValue }) => {
          const type = getValue();
          const badgeMap = {
            content: "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200/60",
            event: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/60",
            placement: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60",
          };
          const Icon = type === "content" ? Sparkles : type === "event" ? CalendarDays : MapPin;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize",
                badgeMap[type],
              )}
            >
              <Icon className="w-3 h-3" />
              <span>{type}</span>
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "title",
        header: "Work Item / Activity",
        size: 260,
        cell: ({ row }) => {
          const item = row.original;
          const title = getWorkItemTitle(item);
          return (
            <div
              onClick={() => onSelectItem?.(item)}
              className="flex flex-col gap-0.5 cursor-pointer group py-1"
            >
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors line-clamp-1">
                {title}
              </span>
              <span className="text-[11px] text-slate-400">
                {item._type === "content"
                  ? `${item.platform} • ${item.format}`
                  : item._type === "event"
                  ? item.location || "Venue TBD"
                  : item.outlet?.name || "Outlet placement"}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        size: 120,
        cell: ({ getValue }) => (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {getValue()}
          </span>
        ),
      }),
      columnHelper.display({
        id: "date",
        header: "Date",
        size: 120,
        cell: ({ row }) => {
          const d = getWorkItemDate(row.original);
          return (
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              {d ? d.slice(0, 10) : "—"}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "pic",
        header: "PIC / Owner",
        size: 140,
        cell: ({ row }) => {
          const pic = getWorkItemPic(row.original);
          return (
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {pic || "Unassigned"}
            </span>
          );
        },
      }),
    ],
    [onSelectItem],
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      {/* Type Filter Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
          {(["all", "content", "event", "placement"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer capitalize text-xs",
                typeFilter === t
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
              )}
            >
              {t === "all" ? "All Items" : `${t}s`}
            </button>
          ))}
        </div>
      </div>

      <MarcomTableShell
        data={allRows}
        columns={columns}
        getRowId={(row) => `${row._type}:${row.id}`}
        title="Unified Work Items"
        titleIcon={List}
        entityName="item"
        entityPlural="items"
        isLoading={isLoading}
        error={error}
        onRefresh={loadData}
        canDelete={false}
        onDeleteOne={async () => false}
        emptyLabel="No work items found matching criteria."
      />
    </div>
  );
}
