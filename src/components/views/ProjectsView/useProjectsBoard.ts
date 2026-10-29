"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
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
import { applyProjectsFilters } from "@/lib/marcom/projectsFilters";

export function useProjectsBoard() {
  const {
    posts,
    events,
    placements,
    outlets,
    materials,
    fetchPosts,
    fetchEvents,
    fetchPlacements,
    fetchOutlets,
    fetchMaterials,
    updateCachedPost,
    updateCachedEvent,
    updateCachedPlacement,
  } = useMarcomDataStore();

  const projectsFilters = useWorkspaceStore((s) => s.projectsFilters);
  const viewPreferences = useWorkspaceStore((s) => s.viewPreferences);
  const setViewPreferences = useWorkspaceStore((s) => s.setViewPreferences);

  const [isLoading, setIsLoading] = useState(false);
  const [activeItem, setActiveItem] = useState<MarcomWorkItem | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    column: ProjectsColumn;
    itemKey: string | null;
    position: "before" | "after" | "bottom";
  } | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [announcement, setAnnouncement] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchPosts(),
        fetchEvents(),
        fetchPlacements(),
        fetchOutlets(),
        fetchMaterials(),
      ]);
    } catch (err) {
      console.error("Failed to load work items:", err);
      toast.error("Gagal memuat work items");
    } finally {
      setIsLoading(false);
    }
  }, [fetchPosts, fetchEvents, fetchPlacements, fetchOutlets, fetchMaterials]);

  useEffect(() => {
    if (posts.length === 0 && events.length === 0 && placements.length === 0) {
      loadData();
    }
  }, [posts.length, events.length, placements.length, loadData]);

  // Merge items and apply global filters
  const allWorkItems = useMemo<MarcomWorkItem[]>(() => {
    const rawList: MarcomWorkItem[] = [
      ...posts.map((p) => ({ ...p, _type: "content" as const })),
      ...events.map((e) => ({ ...e, _type: "event" as const })),
      ...placements.map((p) => ({ ...p, _type: "placement" as const })),
    ];
    return applyProjectsFilters(rawList, projectsFilters);
  }, [posts, events, placements, projectsFilters]);

  // Group items by column respecting local within-column order
  const itemsByColumn = useMemo(() => {
    const map = new Map<ProjectsColumn, MarcomWorkItem[]>();
    for (const col of PROJECTS_COLUMN_ORDER) {
      map.set(col, []);
    }
    for (const item of allWorkItems) {
      const col = getWorkItemColumn(item);
      map.get(col)?.push(item);
    }

    const savedOrder = viewPreferences.projectsBoardOrder || {};
    for (const col of PROJECTS_COLUMN_ORDER) {
      const colItems = map.get(col) || [];
      const orderKeys = savedOrder[col];
      if (orderKeys && orderKeys.length > 0) {
        const sorted = [...colItems].sort((a, b) => {
          const keyA = `${a._type}:${a.id}`;
          const keyB = `${b._type}:${b.id}`;
          const idxA = orderKeys.indexOf(keyA);
          const idxB = orderKeys.indexOf(keyB);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
        map.set(col, sorted);
      }
    }
    return map;
  }, [allWorkItems, viewPreferences.projectsBoardOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as MarcomWorkItem | undefined;
    if (item) {
      setActiveItem(item);
      setAnnouncement(`Picked up ${getWorkItemTitle(item)}`);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setDropIndicator(null);
      return;
    }

    const activeItemData = active.data.current?.item as MarcomWorkItem | undefined;
    if (!activeItemData) return;

    const overId = String(over.id);
    let targetColumn: ProjectsColumn | null = null;
    let targetKey: string | null = null;

    if (PROJECTS_COLUMN_ORDER.includes(overId as ProjectsColumn)) {
      targetColumn = overId as ProjectsColumn;
      setDropIndicator({ column: targetColumn, itemKey: null, position: "bottom" });
      return;
    }

    if (overId.includes(":")) {
      const overItem = allWorkItems.find((i) => `${i._type}:${i.id}` === overId);
      if (overItem) {
        targetColumn = getWorkItemColumn(overItem);
        targetKey = overId;
        setDropIndicator({
          column: targetColumn,
          itemKey: targetKey,
          position: "after",
        });
      }
    }
  };

  const moveToColumn = useCallback(
    async (item: MarcomWorkItem, targetColumn: ProjectsColumn) => {
      const currentColumn = getWorkItemColumn(item);
      if (currentColumn === targetColumn) return;

      const newStatus = mapColumnToStatus(item._type, targetColumn);
      if (!newStatus) {
        toast.info(`Transisi status tidak didukung untuk kolom "${targetColumn}"`);
        return;
      }

      try {
        const endpoint =
          item._type === "content"
            ? `/api/marcom/content/${item.id}`
            : item._type === "event"
            ? `/api/marcom/events/${item.id}`
            : `/api/marcom/placements/${item.id}`;

        const res = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) throw new Error("Update status failed");

        if (item._type === "content") {
          updateCachedPost({ id: item.id, status: newStatus as PostStatus });
        } else if (item._type === "event") {
          updateCachedEvent({ id: item.id, status: newStatus as EventStatus });
        } else {
          updateCachedPlacement({ id: item.id, status: newStatus as PlacementStatus });
        }

        toast.success(`Dipindahkan ke ${targetColumn}`);
        setAnnouncement(`Moved ${getWorkItemTitle(item)} to ${targetColumn}`);
      } catch (err) {
        console.error(err);
        toast.error("Gagal memperbarui status di server");
      }
    },
    [updateCachedPost, updateCachedEvent, updateCachedPlacement],
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    setDropIndicator(null);
    if (!over) return;

    const activeItemData = active.data.current?.item as MarcomWorkItem | undefined;
    if (!activeItemData) return;

    const overId = String(over.id);
    const activeKey = `${activeItemData._type}:${activeItemData.id}`;
    let targetColumn: ProjectsColumn | null = null;

    if (PROJECTS_COLUMN_ORDER.includes(overId as ProjectsColumn)) {
      targetColumn = overId as ProjectsColumn;
    } else if (overId.includes(":")) {
      const overItem = allWorkItems.find((i) => `${i._type}:${i.id}` === overId);
      if (overItem) targetColumn = getWorkItemColumn(overItem);
    }

    if (!targetColumn) return;

    const currentColumn = getWorkItemColumn(activeItemData);

    // Same column: local reordering
    if (currentColumn === targetColumn) {
      const colItems = itemsByColumn.get(currentColumn) || [];
      const currentKeys = colItems.map((i) => `${i._type}:${i.id}`);
      const oldIndex = currentKeys.indexOf(activeKey);
      const newIndex = currentKeys.indexOf(overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = [...currentKeys];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);

        setViewPreferences({
          projectsBoardOrder: {
            ...(viewPreferences.projectsBoardOrder || {}),
            [currentColumn]: reordered,
          },
        });
      }
      return;
    }

    // Different column: status update
    await moveToColumn(activeItemData, targetColumn);
  };

  const handleToggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleToggleSelectAll = (column: ProjectsColumn) => {
    const colItems = itemsByColumn.get(column) || [];
    const colKeys = colItems.map((i) => `${i._type}:${i.id}`);
    const allSelected = colKeys.every((k) => selectedKeys.has(k));

    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        colKeys.forEach((k) => next.delete(k));
      } else {
        colKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  const handleClearSelection = () => setSelectedKeys(new Set());

  const handleBulkMove = async (
    keys: Set<string>,
    targetColumn: ProjectsColumn,
  ) => {
    const selectedList = allWorkItems.filter((i) =>
      keys.has(`${i._type}:${i.id}`),
    );
    if (selectedList.length === 0) return;

    let successCount = 0;
    for (const item of selectedList) {
      const newStatus = mapColumnToStatus(item._type, targetColumn);
      if (!newStatus) continue;

      const endpoint =
        item._type === "content"
          ? `/api/marcom/content/${item.id}`
          : item._type === "event"
          ? `/api/marcom/events/${item.id}`
          : `/api/marcom/placements/${item.id}`;

      try {
        const res = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          successCount++;
          if (item._type === "content") {
            updateCachedPost({ id: item.id, status: newStatus as PostStatus });
          } else if (item._type === "event") {
            updateCachedEvent({ id: item.id, status: newStatus as EventStatus });
          } else {
            updateCachedPlacement({ id: item.id, status: newStatus as PlacementStatus });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    toast.success(`${successCount} item dipindahkan ke ${targetColumn}`);
    setSelectedKeys(new Set());
  };

  const handleBulkDelete = async (keys: Set<string>) => {
    const selectedList = allWorkItems.filter((i) =>
      keys.has(`${i._type}:${i.id}`),
    );
    if (selectedList.length === 0) return;

    let deletedCount = 0;
    for (const item of selectedList) {
      const endpoint =
        item._type === "content"
          ? `/api/marcom/content/${item.id}`
          : item._type === "event"
          ? `/api/marcom/events/${item.id}`
          : `/api/marcom/placements/${item.id}`;

      try {
        const res = await fetch(endpoint, { method: "DELETE" });
        if (res.ok) deletedCount++;
      } catch (err) {
        console.error(err);
      }
    }

    toast.success(`${deletedCount} item dihapus`);
    setSelectedKeys(new Set());
    await loadData();
  };

  const handleQuickCreate = async (
    type: MarcomWorkItemType,
    column: ProjectsColumn,
    title: string,
  ) => {
    const status = mapColumnToStatus(type, column);
    try {
      if (type === "content") {
        const res = await fetch("/api/marcom/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            platform: "instagram",
            format: "single",
            status: status || "SCHEDULED",
          }),
        });
        if (!res.ok) throw new Error("Failed to create content post");
        await fetchPosts();
      } else if (type === "event") {
        const res = await fetch("/api/marcom/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: title,
            eventType: "OTHER",
            status: status || "UPCOMING",
          }),
        });
        if (!res.ok) throw new Error("Failed to create field event");
        await fetchEvents();
      } else {
        const firstOutletId = outlets[0]?.id;
        const firstMaterialId = materials[0]?.id;
        if (!firstOutletId || !firstMaterialId) {
          toast.error("Memerlukan minimal 1 outlet dan 1 material untuk placement");
          return;
        }
        const res = await fetch("/api/marcom/placements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            outletId: firstOutletId,
            materialId: firstMaterialId,
            notes: title,
            status: status || "PLANNED",
          }),
        });
        if (!res.ok) throw new Error("Failed to create placement");
        await fetchPlacements();
      }
      toast.success(`${type} "${title}" berhasil dibuat`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat item baru");
    }
  };

  return {
    isLoading,
    allWorkItems,
    itemsByColumn,
    activeItem,
    dropIndicator,
    selectedKeys,
    announcement,
    density: viewPreferences.density as "compact" | "default" | "relaxed",
    sensors,
    loadData,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    moveToColumn,
    handleToggleSelect,
    handleToggleSelectAll,
    handleClearSelection,
    handleBulkMove,
    handleBulkDelete,
    handleQuickCreate,
  };
}

