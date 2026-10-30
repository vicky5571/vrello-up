"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Flag,
  Plus,
  RefreshCw,
  Search,
  Coins,
  Users,
  Building2,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { cn, formatIDR } from "@/lib/utils";
import type { FieldEventItem, EventStatus, EventFootage } from "@/types";
import {
  findMemberForPic,
  detectEventConflicts,
  calculateFieldEventsKPI,
} from "@/lib/marcom/eventChecklist";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import { EventsHeader } from "./EventsHeader";
import { EventsCalendarView } from "./EventsCalendarView";
import { EventsTimelineView } from "./EventsTimelineView";
import { EventFootageModal } from "./EventFootageModal";
import { EventCardsView } from "./EventCardsView";
import { EventTableView } from "./EventTableView";
import { EventFormModal } from "./EventFormModal";
import {
  STATUS_CONFIG,
  type ActivityViewMode,
} from "./eventsConstants";
import { matchOutletQuery } from "@/lib/marcom/outletRelations";

export type FieldEvent = FieldEventItem;
export type MarcomEvent = FieldEventItem;
export type { EventStatus, EventFootage, ActivityViewMode };

interface EventsViewProps {
  initialView?: ActivityViewMode;
}

export function EventsView({ initialView = "cards" }: EventsViewProps = {}) {
  const { can } = useMarcomPermissions();
  const {
    users,
    marcomFilters,
  } = useWorkspaceStore(
    useShallow((s) => ({
      users: s.users,
      marcomFilters: s.marcomFilters,
    })),
  );

  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
  const setMarcomFilter = useWorkspaceStore((s) => s.setMarcomFilter);

  const members = users;

  const fetchBranches = useMarcomDataStore((s) => s.fetchBranches);
  const storeBranches = useMarcomDataStore((s) => s.branches);
  const events = useMarcomDataStore((s) => s.events);
  const storeFetchEvents = useMarcomDataStore((s) => s.fetchEvents);
  const storeFetchBorrowRecords = useMarcomDataStore((s) => s.fetchBorrowRecords);
  const addCachedEvent = useMarcomDataStore((s) => s.addCachedEvent);
  const updateCachedEvent = useMarcomDataStore((s) => s.updateCachedEvent);
  const removeCachedEvent = useMarcomDataStore((s) => s.removeCachedEvent);

  const branches = useMemo(
    () => storeBranches.map((b) => ({ id: b.id, name: b.name })),
    [storeBranches]
  );
  const [isLoading, setIsLoading] = useState(
    () => useMarcomDataStore.getState().events.length === 0
  );
  const [error, setError] = useState<string | null>(null);

  // View mode and filters
  const [viewMode, setViewMode] = useState<ActivityViewMode>(initialView);
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState(marcomFilters["events"] || "");

  // Form modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FieldEventItem | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  // Video footage modal state
  const [activeFootageEvent, setActiveFootageEvent] = useState<FieldEventItem | null>(null);
  const [activeClipIndex, setActiveClipIndex] = useState(0);

  const openFootageModal = useCallback((event: FieldEventItem, clipIdx = 0) => {
    setActiveFootageEvent(event);
    setActiveClipIndex(clipIdx);
  }, []);

  const closeFootageModal = useCallback(() => {
    setActiveFootageEvent(null);
  }, []);

  // Fetch field events and branches
  const fetchEvents = useCallback(async (force = false) => {
    const hasCache = useMarcomDataStore.getState().events.length > 0;
    if (!hasCache) setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        storeFetchEvents(force),
        fetchBranches(),
        storeFetchBorrowRecords(force),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load field events");
    } finally {
      setIsLoading(false);
    }
  }, [fetchBranches, storeFetchEvents, storeFetchBorrowRecords]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Sync external search query from command palette / top filters
  const prevFilter = useRef(marcomFilters["events"]);
  useEffect(() => {
    if (prevFilter.current !== marcomFilters["events"]) {
      prevFilter.current = marcomFilters["events"];
      setSearchQuery(marcomFilters["events"] || "");
    }
  }, [marcomFilters]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setMarcomFilter("events", val);
  };

  // Open Create / Edit Modals
  const openCreateModal = useCallback((initialDate?: string) => {
    setEditingEvent(null);
    setDefaultDate(initialDate);
    setIsFormModalOpen(true);
  }, []);

  const openEditModal = useCallback((event: FieldEventItem) => {
    setEditingEvent(event);
    setDefaultDate(undefined);
    setIsFormModalOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingEvent(null);
    setDefaultDate(undefined);
  }, []);

  // Delete event
  const handleDeleteEvent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/marcom/events/${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      toast.success("Field event deleted");
      removeCachedEvent(id);
      if (editingEvent?.id === id) closeFormModal();
      return true;
    } catch {
      toast.error("Failed to delete event");
      return false;
    }
  }, [editingEvent, closeFormModal, removeCachedEvent]);

  const handleEventSaved = useCallback(
    (savedItem: FieldEventItem) => {
      toast.success(
        editingEvent
          ? "Field event updated successfully"
          : "Field event created successfully"
      );
      if (editingEvent) {
        updateCachedEvent(savedItem);
      } else {
        addCachedEvent(savedItem);
      }
      storeFetchEvents(true);
    },
    [
      editingEvent,
      addCachedEvent,
      updateCachedEvent,
      storeFetchEvents,
    ]
  );

  // Filtered Events
  const filteredEvents = useMemo(() => {
    let list = events;
    if (selectedStatus !== "all") {
      list = list.filter((e) => e.status === selectedStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.branchName?.toLowerCase().includes(q) ||
          e.picName?.toLowerCase().includes(q) ||
          e.eventType?.toLowerCase().includes(q) ||
          matchOutletQuery(q, e.outlet)
      );
    }
    return list;
  }, [events, selectedStatus, searchQuery]);

  // Conflict detection
  const conflicts = useMemo(() => detectEventConflicts(events), [events]);

  // KPI calculations
  const kpiSummary = useMemo(
    () => calculateFieldEventsKPI(events, branches.length),
    [events, branches.length]
  );

  const kpis: KpiCardItem[] = [
    {
      label: "Active Activations",
      value: `${kpiSummary.activeCount}`,
      helper:
        kpiSummary.cancelledCount > 0
          ? `${kpiSummary.totalActivations} planned (${kpiSummary.cancelledCount} cancelled)`
          : `${kpiSummary.totalActivations} total planned`,
      icon: Flag,
      color: "blue",
    },
    {
      label: "Committed Budget",
      value: formatIDR(kpiSummary.totalCommittedBudget),
      helper:
        kpiSummary.avgCostPerAttendee > 0
          ? `Avg ${formatIDR(kpiSummary.avgCostPerAttendee)} / pengunjung`
          : kpiSummary.cancelledCount > 0
          ? `Excludes ${formatIDR(kpiSummary.cancelledBudget)} cancelled`
          : "Across all active branches",
      icon: Coins,
      color: "emerald",
    },
    {
      label: "Target Footfall",
      value: `${kpiSummary.totalTargetAttendees.toLocaleString()}`,
      helper:
        kpiSummary.overallTargetReachRate > 0
          ? `${kpiSummary.totalActualAttendees.toLocaleString()} reached (${kpiSummary.overallTargetReachRate}% target)`
          : `${kpiSummary.totalActualAttendees.toLocaleString()} reached (active events)`,
      icon: Users,
      color: "violet",
    },
    {
      label: "Branch Coverage",
      value: `${kpiSummary.branchCoverageCount} Cities`,
      helper: "Active city network",
      icon: Building2,
      color: "amber",
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6 pb-20">
      {/* Top Header (Card-Banner Container) */}
      <EventsHeader
        totalEvents={events.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isLoading={isLoading}
        onRefresh={() => fetchEvents(true)}
        canManage={can("CREATE_EVENT")}
        onAddEvent={() => openCreateModal()}
      />

      {/* KPI Cards */}
      <KpiSummaryCards items={kpis} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedStatus("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
              selectedStatus === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            All Activations ({events.length})
          </button>
          {(["UPCOMING", "ON_PROGRESS", "COMPLETED", "CANCELLED"] as EventStatus[]).map(
            (status) => {
              const count = events.filter((e) => e.status === status).length;
              const cfg = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                    selectedStatus === status
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      status === "UPCOMING" && "bg-blue-500",
                      status === "ON_PROGRESS" && "bg-amber-500",
                      status === "COMPLETED" && "bg-emerald-500",
                      status === "CANCELLED" && "bg-rose-500"
                    )}
                  />
                  {cfg.label} ({count})
                </button>
              );
            }
          )}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search venue, city, PIC..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm font-medium">Loading field events & activations...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400">
          <p className="font-semibold">Unable to load field events</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            type="button"
            onClick={() => fetchEvents(true)}
            className="mt-3 px-3 py-1.5 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : viewMode === "calendar" ? (
        <EventsCalendarView
          events={filteredEvents}
          conflicts={conflicts}
          onSelectEvent={openEditModal}
          onOpenCreateModal={openCreateModal}
        />
      ) : viewMode === "timeline" ? (
        <EventsTimelineView
          events={filteredEvents}
          conflicts={conflicts}
          onSelectEvent={openEditModal}
        />
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
            <Flag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            No field events found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            {searchQuery || selectedStatus !== "all"
              ? "No activations match your current filter criteria."
              : "Get started by planning your first physical mall activation, exhibition, or brand roadshow."}
          </p>
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create First Field Event
          </button>
        </div>
      ) : viewMode === "cards" ? (
        <EventCardsView
          events={filteredEvents}
          conflicts={conflicts}
          members={members}
          onSelectEvent={openEditModal}
          onDeleteEvent={handleDeleteEvent}
          onOpenFootageModal={openFootageModal}
        />
      ) : (
        <EventTableView
          events={filteredEvents}
          conflicts={conflicts}
          members={members}
          isLoading={isLoading}
          error={error}
          canDelete={can("CREATE_EVENT")}
          onRefresh={() => fetchEvents(true)}
          onSelectEvent={openEditModal}
          onDeleteEvent={handleDeleteEvent}
          onOpenFootageModal={openFootageModal}
        />
      )}

      {/* Form Modal (Create / Edit) */}
      <EventFormModal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        event={editingEvent}
        defaultDate={defaultDate}
        branches={branches}
        members={members}
        onSaved={handleEventSaved}
        onOpenFootageModal={openFootageModal}
      />

      {/* Event Footage Player Modal */}
      <EventFootageModal
        isOpen={Boolean(activeFootageEvent)}
        onClose={closeFootageModal}
        event={activeFootageEvent}
        initialClipIndex={activeClipIndex}
      />
    </div>
  );
}

// Re-export alias for convenience
export const FieldEventsView = EventsView;
