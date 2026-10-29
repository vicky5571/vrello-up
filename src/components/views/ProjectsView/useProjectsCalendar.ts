"use client";

import { useState, useMemo, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
  format,
} from "date-fns";
import { toast } from "sonner";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import type { MarcomWorkItem, MarcomWorkItemType } from "@/types";
import { getWorkItemDate } from "@/lib/marcom/workItems";
import { applyProjectsFilters } from "@/lib/marcom/projectsFilters";

export function useProjectsCalendar() {
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
  } = useMarcomDataStore();

  const projectsFilters = useWorkspaceStore((s) => s.projectsFilters);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (posts.length === 0 && events.length === 0 && placements.length === 0) {
      fetchPosts();
      fetchEvents();
      fetchPlacements();
      fetchOutlets();
      fetchMaterials();
    }
  }, [posts.length, events.length, placements.length, fetchPosts, fetchEvents, fetchPlacements, fetchOutlets, fetchMaterials]);

  const allFilteredItems = useMemo<MarcomWorkItem[]>(() => {
    const list: MarcomWorkItem[] = [
      ...posts.map((p) => ({ ...p, _type: "content" as const })),
      ...events.map((e) => ({ ...e, _type: "event" as const })),
      ...placements.map((p) => ({ ...p, _type: "placement" as const })),
    ];
    return applyProjectsFilters(list, projectsFilters);
  }, [posts, events, placements, projectsFilters]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = useMemo(
    () => eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
    [calendarStart, calendarEnd],
  );

  // Group items by date, supporting multi-day field events
  const itemsByDate = useMemo(() => {
    const map = new Map<string, Array<{ item: MarcomWorkItem; isContinuation?: boolean }>>();

    for (const item of allFilteredItems) {
      if (item._type === "event" && item.startDate && item.endDate) {
        try {
          const start = parseISO(item.startDate);
          const end = parseISO(item.endDate);
          if (start <= end) {
            const spanDays = eachDayOfInterval({ start, end });
            spanDays.forEach((d, idx) => {
              const dKey = format(d, "yyyy-MM-dd");
              const list = map.get(dKey) || [];
              list.push({ item, isContinuation: idx > 0 });
              map.set(dKey, list);
            });
            continue;
          }
        } catch {
          // fallback to single date
        }
      }

      const d = getWorkItemDate(item);
      if (!d) continue;
      const dateKey = d.slice(0, 10);
      const list = map.get(dateKey) || [];
      list.push({ item, isContinuation: false });
      map.set(dateKey, list);
    }
    return map;
  }, [allFilteredItems]);

  const handleCreateType = async (type: MarcomWorkItemType, dateStr: string) => {
    try {
      const dateIso = new Date(dateStr).toISOString();
      if (type === "content") {
        await fetch("/api/marcom/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `New Post (${dateStr})`,
            platform: "instagram",
            format: "single",
            publishDate: dateIso,
            status: "SCHEDULED",
          }),
        });
        await fetchPosts();
      } else if (type === "event") {
        await fetch("/api/marcom/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `New Event (${dateStr})`,
            eventType: "OTHER",
            startDate: dateIso,
            status: "UPCOMING",
          }),
        });
        await fetchEvents();
      } else {
        const firstOutlet = outlets[0]?.id;
        const firstMat = materials[0]?.id;
        if (!firstOutlet || !firstMat) {
          toast.error("Memerlukan minimal 1 outlet dan 1 material");
          return;
        }
        await fetch("/api/marcom/placements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            outletId: firstOutlet,
            materialId: firstMat,
            date: dateIso,
            notes: `New Placement (${dateStr})`,
            status: "PLANNED",
          }),
        });
        await fetchPlacements();
      }
      toast.success(`${type} berhasil dijadwalkan untuk ${dateStr}`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menjadwalkan item baru");
    }
  };

  return {
    currentMonth,
    setCurrentMonth,
    days,
    itemsByDate,
    handleCreateType,
  };
}

