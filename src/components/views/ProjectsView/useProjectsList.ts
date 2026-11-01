"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import type {
  MarcomWorkItem,
  ProjectsColumn,
  PostStatus,
  EventStatus,
  PlacementStatus,
} from "@/types";
import {
  getWorkItemTitle,
  getWorkItemDate,
  getWorkItemPic,
  mapColumnToStatus,
} from "@/lib/marcom/workItems";
import { applyProjectsFilters } from "@/lib/marcom/projectsFilters";

export type GroupByOption = "type" | "status" | "branch" | "pic" | "none";
export type SortField = "type" | "name" | "status" | "date" | "branch" | "pic";

export function useProjectsList() {
  const {
    posts,
    events,
    placements,
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
  const [groupBy, setGroupBy] = useState<GroupByOption>("type");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

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
      console.error(err);
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

  // Merge and apply global filters
  const filteredItems = useMemo<MarcomWorkItem[]>(() => {
    const raw: MarcomWorkItem[] = [
      ...posts.map((p) => ({ ...p, _type: "content" as const })),
      ...events.map((e) => ({ ...e, _type: "event" as const })),
      ...placements.map((p) => ({ ...p, _type: "placement" as const })),
    ];
    return applyProjectsFilters(raw, projectsFilters);
  }, [posts, events, placements, projectsFilters]);

  // Apply sorting
  const sortedItems = useMemo<MarcomWorkItem[]>(() => {
    if (!sortField) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      let valA = "";
      let valB = "";

      if (sortField === "type") {
        valA = a._type;
        valB = b._type;
      } else if (sortField === "name") {
        valA = getWorkItemTitle(a);
        valB = getWorkItemTitle(b);
      } else if (sortField === "status") {
        valA = a.status;
        valB = b.status;
      } else if (sortField === "date") {
        valA = getWorkItemDate(a) || "";
        valB = getWorkItemDate(b) || "";
      } else if (sortField === "branch") {
        valA = (a._type === "placement" ? a.outlet?.branchId : a.branchName) || "";
        valB = (b._type === "placement" ? b.outlet?.branchId : b.branchName) || "";
      } else if (sortField === "pic") {
        valA = getWorkItemPic(a) || "";
        valB = getWorkItemPic(b) || "";
      }

      const cmp = valA.localeCompare(valB);
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filteredItems, sortField, sortDirection]);

  // Group items
  const groupedSections = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "All Items", items: sortedItems }];
    }

    const map = new Map<string, { label: string; items: MarcomWorkItem[] }>();

    for (const item of sortedItems) {
      let key = "other";
      let label = "Other";

      if (groupBy === "type") {
        key = item._type;
        label = item._type === "content" ? "Content Posts" : item._type === "event" ? "Field Events" : "Placements";
      } else if (groupBy === "status") {
        key = item.status;
        label = item.status;
      } else if (groupBy === "branch") {
        const br = item._type === "placement" ? item.outlet?.branchId : item.branchName;
        key = br || "unassigned";
        label = br || "Unassigned Branch";
      } else if (groupBy === "pic") {
        const p = getWorkItemPic(item);
        key = p || "unassigned";
        label = p || "Unassigned PIC";
      }

      if (!map.has(key)) {
        map.set(key, { label, items: [] });
      }
      map.get(key)!.items.push(item);
    }

    return Array.from(map.entries()).map(([k, v]) => ({
      key: k,
      label: v.label,
      items: v.items,
    }));
  }, [sortedItems, groupBy]);

  const toggleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortField(null);
    }
  };

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedKeys.size === sortedItems.length && sortedItems.length > 0) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(sortedItems.map((i) => `${i._type}:${i.id}`)));
    }
  };

  const updateTitle = async (item: MarcomWorkItem, newTitle: string) => {
    try {
      const endpoint =
        item._type === "content"
          ? `/api/marcom/content/${item.id}`
          : item._type === "event"
          ? `/api/marcom/events/${item.id}`
          : `/api/marcom/placements/${item.id}`;

      const body =
        item._type === "content"
          ? { title: newTitle }
          : item._type === "event"
          ? { name: newTitle }
          : { notes: newTitle };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Update title failed");
      toast.success("Judul berhasil diperbarui");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui judul");
    }
  };

  const updateStatus = async (item: MarcomWorkItem, newStatus: string) => {
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
      toast.success(`Status diubah ke ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui status");
    }
  };

  const updateDate = async (item: MarcomWorkItem, newDate: string) => {
    try {
      const endpoint =
        item._type === "content"
          ? `/api/marcom/content/${item.id}`
          : item._type === "event"
          ? `/api/marcom/events/${item.id}`
          : `/api/marcom/placements/${item.id}`;

      const body =
        item._type === "content"
          ? { publishDate: new Date(newDate).toISOString() }
          : item._type === "event"
          ? { startDate: new Date(newDate).toISOString() }
          : { date: new Date(newDate).toISOString() };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Update date failed");
      toast.success("Tanggal berhasil diperbarui");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui tanggal");
    }
  };

  const updatePic = async (item: MarcomWorkItem, newPic: string) => {
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
        body: JSON.stringify({ picName: newPic }),
      });

      if (!res.ok) throw new Error("Update PIC failed");
      toast.success("PIC berhasil diperbarui");
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui PIC");
    }
  };

  const handleBulkMove = async (keys: Set<string>, targetColumn: ProjectsColumn) => {
    const selectedList = sortedItems.filter((i) => keys.has(`${i._type}:${i.id}`));
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
        if (res.ok) successCount++;
      } catch (err) {
        console.error(err);
      }
    }

    toast.success(`${successCount} item dipindahkan ke ${targetColumn}`);
    setSelectedKeys(new Set());
    await loadData();
  };

  const handleBulkDelete = async (keys: Set<string>) => {
    const selectedList = sortedItems.filter((i) => keys.has(`${i._type}:${i.id}`));
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

  return {
    isLoading,
    sortedItems,
    groupedSections,
    groupBy,
    sortField,
    sortDirection,
    collapsedGroups,
    selectedKeys,
    visibleFields: viewPreferences.visibleFields,
    loadData,
    setGroupBy,
    toggleSort,
    clearSort: () => setSortField(null),
    toggleGroupCollapse,
    toggleSelect,
    toggleSelectAll,
    clearSelection: () => setSelectedKeys(new Set()),
    updateTitle,
    updateStatus,
    updateDate,
    updatePic,
    handleBulkMove,
    handleBulkDelete,
    toggleVisibleField: (field: keyof typeof viewPreferences.visibleFields) => {
      setViewPreferences({
        visibleFields: {
          [field]: !viewPreferences.visibleFields[field],
        },
      });
    },
  };
}

