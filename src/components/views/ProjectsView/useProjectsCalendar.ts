"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
  format,
} from "date-fns";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import type { MarcomWorkItem } from "@/types";
import { getWorkItemDate } from "@/lib/marcom/workItems";
import { applyProjectsFilters } from "@/lib/marcom/projectsFilters";

export function useProjectsCalendar() {
  const {
    posts,
    events,
    placements,
    fetchPosts,
    fetchEvents,
    fetchPlacements,
    fetchOutlets,
    fetchMaterials,
  } = useMarcomDataStore();

  const projectsFilters = useWorkspaceStore((s) => s.projectsFilters);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchPosts(),
      fetchEvents(),
      fetchPlacements(),
      fetchOutlets(),
      fetchMaterials(),
    ]);
  }, [fetchPosts, fetchEvents, fetchPlacements, fetchOutlets, fetchMaterials]);

  useEffect(() => {
    if (posts.length === 0 && events.length === 0 && placements.length === 0) {
      loadData();
    }
  }, [posts.length, events.length, placements.length, loadData]);

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

  return {
    currentMonth,
    setCurrentMonth,
    days,
    itemsByDate,
    loadData,
  };
}
