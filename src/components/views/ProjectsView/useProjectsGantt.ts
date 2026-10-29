"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  addDays,
  subDays,
  differenceInDays,
  startOfWeek,
  eachDayOfInterval,
  parseISO,
  format,
} from "date-fns";
import { toast } from "sonner";
import { Sparkles, CalendarDays, MapPin } from "lucide-react";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import type { MarcomWorkItem } from "@/types";
import { getWorkItemTitle, getWorkItemDate } from "@/lib/marcom/workItems";
import { applyProjectsFilters } from "@/lib/marcom/projectsFilters";
import type { GanttDragState } from "./GanttBar";

export type GanttZoomLevel = "day" | "week" | "month";

const ZOOM_CONFIG: Record<GanttZoomLevel, { columnWidth: number; totalDays: number }> = {
  day: { columnWidth: 48, totalDays: 35 },
  week: { columnWidth: 36, totalDays: 56 },
  month: { columnWidth: 24, totalDays: 84 },
};

export function useProjectsGantt() {
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

  const projectsFilters = useWorkspaceStore((s) => s.projectsFilters);

  const [zoom, setZoom] = useState<GanttZoomLevel>("day");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [baseDate, setBaseDate] = useState(() => startOfWeek(new Date()));
  const [announcement, setAnnouncement] = useState("");
  const [dragState, setDragState] = useState<GanttDragState | null>(null);

  const { columnWidth, totalDays } = ZOOM_CONFIG[zoom];

  useEffect(() => {
    if (posts.length === 0 && events.length === 0 && placements.length === 0) {
      fetchPosts();
      fetchEvents();
      fetchPlacements();
    }
  }, [posts.length, events.length, placements.length, fetchPosts, fetchEvents, fetchPlacements]);

  const startDate = baseDate;
  const endDate = useMemo(() => addDays(startDate, totalDays - 1), [startDate, totalDays]);
  const days = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);

  const prevPeriod = () => setBaseDate((prev) => subDays(prev, Math.round(totalDays / 2)));
  const nextPeriod = () => setBaseDate((prev) => addDays(prev, Math.round(totalDays / 2)));
  const goToToday = () => setBaseDate(startOfWeek(new Date()));

  // Filter items
  const filteredItems = useMemo<MarcomWorkItem[]>(() => {
    const raw: MarcomWorkItem[] = [
      ...posts.map((p) => ({ ...p, _type: "content" as const })),
      ...events.map((e) => ({ ...e, _type: "event" as const })),
      ...placements.map((p) => ({ ...p, _type: "placement" as const })),
    ];
    return applyProjectsFilters(raw, projectsFilters);
  }, [posts, events, placements, projectsFilters]);

  const unscheduledItems = useMemo(() => {
    return filteredItems.filter((item) => {
      if (item._type === "event") return !item.startDate && !item.date;
      if (item._type === "content") return !item.publishDate;
      return !item.date;
    });
  }, [filteredItems]);

  const groups = useMemo(() => [
    {
      type: "event" as const,
      title: "Field Events & Activations",
      icon: CalendarDays,
      iconColor: "text-blue-500",
      items: filteredItems.filter((i) => i._type === "event" && (i.startDate || i.date)),
    },
    {
      type: "content" as const,
      title: "Social & Digital Content",
      icon: Sparkles,
      iconColor: "text-pink-500",
      items: filteredItems.filter((i) => i._type === "content" && i.publishDate),
    },
    {
      type: "placement" as const,
      title: "Media Placements",
      icon: MapPin,
      iconColor: "text-emerald-500",
      items: filteredItems.filter((i) => i._type === "placement" && i.date),
    },
  ], [filteredItems]);

  const getItemBar = useCallback((item: MarcomWorkItem) => {
    try {
      let itemStart: Date;
      let durationDays = 1;

      if (item._type === "event") {
        const startStr = item.startDate || item.date;
        if (!startStr) return null;
        itemStart = parseISO(startStr);
        if (item.endDate) {
          const itemEnd = parseISO(item.endDate);
          durationDays = Math.max(1, differenceInDays(itemEnd, itemStart) + 1);
        }
      } else {
        const dateStr = getWorkItemDate(item);
        if (!dateStr) return null;
        itemStart = parseISO(dateStr);
      }

      const offsetDays = differenceInDays(itemStart, startDate);
      if (offsetDays + durationDays < 0 || offsetDays >= totalDays) return null;

      const left = Math.max(0, offsetDays) * columnWidth;
      const width = Math.max(columnWidth, durationDays * columnWidth - 4);

      return { left, width };
    } catch {
      return null;
    }
  }, [startDate, totalDays, columnWidth]);

  // Drag handlers
  const handleStartDrag = (
    e: React.PointerEvent,
    item: MarcomWorkItem,
    type: GanttDragState["type"],
    left: number,
    width: number,
    progress?: number,
  ) => {
    setDragState({
      item,
      type,
      startX: e.clientX,
      initialLeft: left,
      initialWidth: width,
      initialProgress: progress,
    });
    setAnnouncement(`Dragging ${getWorkItemTitle(item)}`);
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (!dragState) return;
    const { item, type, startX, initialProgress } = dragState;
    const deltaX = e.clientX - startX;
    const deltaDays = Math.round(deltaX / columnWidth);
    setDragState(null);

    if (deltaDays === 0 && type !== "progress") {
      setAnnouncement("Drag cancelled.");
      return;
    }

    try {
      if (type === "progress") {
        const deltaProgress = Math.round((deltaX / dragState.initialWidth) * 100);
        const newProgress = Math.min(100, Math.max(0, (initialProgress || 0) + deltaProgress));
        if (item._type === "event") {
          const res = await fetch(`/api/marcom/events/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notes: `progress:${newProgress}` }), // or progress
          });
          if (res.ok) {
            toast.success(`Progress event diubah ke ${newProgress}%`);
            await fetchEvents();
          }
        }
        return;
      }

      if (item._type === "event") {
        const currentStart = parseISO(item.startDate || item.date || new Date().toISOString());
        const currentEnd = item.endDate ? parseISO(item.endDate) : currentStart;

        let newStart = currentStart;
        let newEnd = currentEnd;

        if (type === "move") {
          newStart = addDays(currentStart, deltaDays);
          newEnd = addDays(currentEnd, deltaDays);
        } else if (type === "resize-start") {
          newStart = addDays(currentStart, deltaDays);
          if (newStart > newEnd) newStart = newEnd;
        } else if (type === "resize-end") {
          newEnd = addDays(currentEnd, deltaDays);
          if (newEnd < newStart) newEnd = newStart;
        }

        const res = await fetch(`/api/marcom/events/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: newStart.toISOString(),
            endDate: newEnd.toISOString(),
          }),
        });

        if (res.ok) {
          updateCachedEvent({
            id: item.id,
            startDate: newStart.toISOString(),
            endDate: newEnd.toISOString(),
          });
          toast.success(`${getWorkItemTitle(item)} dijadwalkan ulang`);
          setAnnouncement(`${getWorkItemTitle(item)} rescheduled`);
        }
      } else if (item._type === "content") {
        const currentPublish = parseISO(item.publishDate || new Date().toISOString());
        const newPublish = addDays(currentPublish, deltaDays);

        const res = await fetch(`/api/marcom/content/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publishDate: newPublish.toISOString() }),
        });

        if (res.ok) {
          updateCachedPost({ id: item.id, publishDate: newPublish.toISOString() });
          toast.success(`${getWorkItemTitle(item)} dijadwalkan ulang`);
        }
      } else {
        const currentDate = parseISO(item.date || new Date().toISOString());
        const newDate = addDays(currentDate, deltaDays);

        const res = await fetch(`/api/marcom/placements/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: newDate.toISOString() }),
        });

        if (res.ok) {
          updateCachedPlacement({ id: item.id, date: newDate.toISOString() });
          toast.success(`${getWorkItemTitle(item)} dijadwalkan ulang`);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menjadwalkan ulang item");
    }
  };

  const handleScheduleItem = async (item: MarcomWorkItem, dateStr: string) => {
    try {
      const dateIso = new Date(dateStr).toISOString();
      const endpoint =
        item._type === "content"
          ? `/api/marcom/content/${item.id}`
          : item._type === "event"
          ? `/api/marcom/events/${item.id}`
          : `/api/marcom/placements/${item.id}`;

      const body =
        item._type === "content"
          ? { publishDate: dateIso }
          : item._type === "event"
          ? { startDate: dateIso, endDate: dateIso }
          : { date: dateIso };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Scheduling failed");

      if (item._type === "content") await fetchPosts();
      else if (item._type === "event") await fetchEvents();
      else await fetchPlacements();

      toast.success(`${getWorkItemTitle(item)} dijadwalkan untuk ${dateStr}`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menjadwalkan item");
    }
  };

  return {
    zoom,
    setZoom,
    isSidebarOpen,
    setIsSidebarOpen,
    startDate,
    endDate,
    days,
    columnWidth,
    totalDays,
    groups,
    unscheduledItems,
    announcement,
    prevPeriod,
    nextPeriod,
    goToToday,
    getItemBar,
    handleStartDrag,
    handlePointerUp,
    handleScheduleItem,
  };
}

