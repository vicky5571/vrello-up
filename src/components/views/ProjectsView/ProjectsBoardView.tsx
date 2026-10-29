"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Search, RefreshCw, Kanban } from "lucide-react";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import type {
  MarcomWorkItem,
  ProjectsColumn,
  MarcomWorkItemType,
  PostStatus,
  EventStatus,
  PlacementStatus,
} from "@/types";
import {
  PROJECTS_COLUMN_ORDER,
  getWorkItemColumn,
  mapColumnToStatus,
  getWorkItemTitle,
} from "@/lib/marcom/workItems";
import { ProjectsBoardColumn } from "./ProjectsBoardColumn";
import { ProjectsWorkItemCard } from "./ProjectsWorkItemCard";
import { cn } from "@/lib/utils";

interface ProjectsBoardViewProps {
  onSelectItem?: (item: MarcomWorkItem) => void;
}

export function ProjectsBoardView({ onSelectItem }: ProjectsBoardViewProps) {
  const {
    posts,
    events,
    placements,
    fetchPosts,
    fetchEvents,
    fetchPlacements,
    updateCachedPost,
    updateCachedEvent,
    updateCachedPlacement,
  } = useMarcomDataStore();

  const [isLoading, setIsLoading] = useState(false);
  const [activeItem, setActiveItem] = useState<MarcomWorkItem | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | MarcomWorkItemType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchPosts(), fetchEvents(), fetchPlacements()]);
    } catch (err) {
      console.error("Failed to load work items:", err);
      toast.error("Gagal memuat work items");
    } finally {
      setIsLoading(false);
    }
  }, [fetchPosts, fetchEvents, fetchPlacements]);

  useEffect(() => {
    if (posts.length === 0 && events.length === 0 && placements.length === 0) {
      loadData();
    }
  }, [posts.length, events.length, placements.length, loadData]);

  const allWorkItems = useMemo<MarcomWorkItem[]>(() => {
    const list: MarcomWorkItem[] = [
      ...posts.map((p) => ({ ...p, _type: "content" as const })),
      ...events.map((e) => ({ ...e, _type: "event" as const })),
      ...placements.map((p) => ({ ...p, _type: "placement" as const })),
    ];

    return list.filter((item) => {
      if (typeFilter !== "all" && item._type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = getWorkItemTitle(item).toLowerCase();
        if (!title.includes(q)) return false;
      }
      return true;
    });
  }, [posts, events, placements, typeFilter, searchQuery]);

  const itemsByColumn = useMemo(() => {
    const map = new Map<ProjectsColumn, MarcomWorkItem[]>();
    for (const col of PROJECTS_COLUMN_ORDER) {
      map.set(col, []);
    }
    for (const item of allWorkItems) {
      const col = getWorkItemColumn(item);
      map.get(col)?.push(item);
    }
    return map;
  }, [allWorkItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as MarcomWorkItem | undefined;
    if (item) setActiveItem(item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;

    const activeItemData = active.data.current?.item as MarcomWorkItem | undefined;
    if (!activeItemData) return;

    let targetColumn: ProjectsColumn | null = null;
    const overId = String(over.id);

    if (PROJECTS_COLUMN_ORDER.includes(overId as ProjectsColumn)) {
      targetColumn = overId as ProjectsColumn;
    } else if (overId.includes(":")) {
      const overItem = allWorkItems.find((i) => `${i._type}:${i.id}` === overId);
      if (overItem) targetColumn = getWorkItemColumn(overItem);
    }

    if (!targetColumn) return;

    const currentColumn = getWorkItemColumn(activeItemData);
    if (currentColumn === targetColumn) return;

    const newStatus = mapColumnToStatus(activeItemData._type, targetColumn);
    if (!newStatus) {
      toast.info(`Transisi status tidak didukung untuk kolom "${targetColumn}"`);
      return;
    }

    try {
      const endpoint =
        activeItemData._type === "content"
          ? `/api/marcom/content/${activeItemData.id}`
          : activeItemData._type === "event"
          ? `/api/marcom/events/${activeItemData.id}`
          : `/api/marcom/placements/${activeItemData.id}`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Update status failed");

      if (activeItemData._type === "content") {
        updateCachedPost({ id: activeItemData.id, status: newStatus as PostStatus });
      } else if (activeItemData._type === "event") {
        updateCachedEvent({ id: activeItemData.id, status: newStatus as EventStatus });
      } else {
        updateCachedPlacement({ id: activeItemData.id, status: newStatus as PlacementStatus });
      }

      toast.success(`Dipindahkan ke ${targetColumn}`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui status di server");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] p-4 space-y-3">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Kanban className="w-5 h-5 text-blue-500" />
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Work Items Board
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
            {allWorkItems.length}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter Pills */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            {(["all", "content", "event", "placement"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer capitalize text-xs",
                  typeFilter === t
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900",
                )}
              >
                {t === "all" ? "All Types" : t}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden w-40"
            />
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-50"
            title="Refresh items"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-blue-500")} />
          </button>
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
          <div className="flex gap-3 h-full min-w-max">
            {PROJECTS_COLUMN_ORDER.map((column) => (
              <ProjectsBoardColumn
                key={column}
                column={column}
                items={itemsByColumn.get(column) || []}
                onSelect={onSelectItem}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeItem && <ProjectsWorkItemCard item={activeItem} isOverlay />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

