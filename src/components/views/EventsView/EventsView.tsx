"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Flag,
  Plus,
  RefreshCw,
  LayoutGrid,
  TableProperties,
  Calendar,
  GanttChart,
  Search,
  Coins,
  Users,
  Building2,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { cn, formatIDR } from "@/lib/utils";
import type { FieldEventItem, EventStatus, EventFootage } from "@/types";
import {
  findSpaceByListId,
  getDefaultDestinationForChannel,
} from "@/lib/tasks/targetSpaceList";
import {
  getEventChecklistTemplate,
  findMemberForPic,
  buildEventDescription,
  detectEventConflicts,
  calculateFieldEventsKPI,
} from "@/lib/tasks/eventTaskSync";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
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

export type FieldEvent = FieldEventItem;
export type MarcomEvent = FieldEventItem;
export type { EventStatus, EventFootage, ActivityViewMode };

interface EventsViewProps {
  initialView?: ActivityViewMode;
}

export function EventsView({ initialView = "cards" }: EventsViewProps = {}) {
  const { can } = useMarcomPermissions();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId) || "ws-main";
  const {
    tasks,
    createTask,
    updateTask,
    setSelectedTaskId,
    setAppMode,
    setActiveSpace,
    setActiveList,
    setActiveView,
    workspaces,
    activeSpaceId,
    activeListId,
    marcomFilters,
    setMarcomFilter,
    setNavigatedFromMarcom,
  } = useWorkspaceStore();

  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const members = useMemo(
    () => currentWorkspace?.members || [],
    [currentWorkspace]
  );
  const rawSpaces = useMemo(
    () => currentWorkspace?.spaces || [],
    [currentWorkspace]
  );
  const currentSpace = useMemo(
    () => currentWorkspace?.spaces.find((s) => s.id === activeSpaceId),
    [currentWorkspace, activeSpaceId]
  );
  const statuses = useMemo(() => currentSpace?.statuses || [], [currentSpace]);

  const { fetchBranches, getCachedEvents, setCachedEvents } = useMarcomDataStore();

  // Server state
  const cachedEvents = getCachedEvents(activeWorkspaceId);
  const [events, setEvents] = useState<FieldEventItem[]>(() => cachedEvents || []);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>(() =>
    useMarcomDataStore.getState().branches.length > 0
      ? useMarcomDataStore.getState().branches
      : []
  );
  const [isLoading, setIsLoading] = useState(!cachedEvents);
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
  const fetchEvents = useCallback(async () => {
    if (!getCachedEvents(activeWorkspaceId)) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const [resEvents, branchList] = await Promise.all([
        fetch(`/api/marcom/events?workspaceId=${encodeURIComponent(activeWorkspaceId)}`),
        fetchBranches(),
      ]);
      if (!resEvents.ok) throw new Error(`Request failed (${resEvents.status})`);
      const jsonEvents = await resEvents.json();
      const eventsData = Array.isArray(jsonEvents.data) ? jsonEvents.data : [];
      setEvents(eventsData);
      setCachedEvents(activeWorkspaceId, eventsData);
      if (Array.isArray(branchList)) {
        setBranches(branchList);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load field events");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId, fetchBranches, getCachedEvents, setCachedEvents]);

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
      if (editingEvent?.id === id) closeFormModal();
      await fetchEvents();
      return true;
    } catch {
      toast.error("Failed to delete event");
      return false;
    }
  }, [editingEvent, closeFormModal, fetchEvents]);

  // Navigate to linked Board Task
  const navigateToTask = useCallback(
    (event: FieldEventItem) => {
      let existing = tasks.find((t) => t.relatedMarcomId === event.id);

      if (!existing) {
        const dest = getDefaultDestinationForChannel(rawSpaces, "on_ground");
        const chosenListId = dest.listId || activeListId || "list-field-ops";
        const targetSpace = rawSpaces.find((s) => s.id === dest.spaceId) || rawSpaces[0];
        const targetStatus = targetSpace?.statuses[0]?.id || statuses[0]?.id || "status-todo";
        const picMember = findMemberForPic(members, event.picName) || members[0];
        const eventDateVal = event.startDate || event.date;

        existing = createTask({
          listId: chosenListId,
          title: `[Field Event] ${event.name}`,
          description: buildEventDescription({
            location: event.location,
            branchName: event.branchName,
            eventType: event.eventType,
            budget: event.budget,
            targetAttendee: event.targetAttendee,
            notes: event.notes,
          }),
          statusId: targetStatus,
          priority: "high",
          assignees: picMember ? [picMember] : [],
          dueDate: eventDateVal ? eventDateVal.slice(0, 10) : undefined,
          orderIndex: 0,
          tags: [],
          subtasks: getEventChecklistTemplate(event.eventType || "Roadshow").map((t, i) => ({
            id: `sub-${Date.now()}-${i}`,
            title: t,
            completed: false,
            createdAt: new Date().toISOString(),
          })),
          relatedMarcomId: event.id,
        });
      }

      const owningSpace = findSpaceByListId(rawSpaces, existing.listId);
      if (owningSpace) {
        setActiveSpace(owningSpace.id);
        setActiveList(existing.listId);
      }
      setNavigatedFromMarcom({ view: "events", label: "Field Events" });
      setAppMode("tasks");
      setActiveView("board");
      setSelectedTaskId(existing.id);
      toast.info(`Beralih ke ${owningSpace?.name || "Workspace"} › Board`);
    },
    [
      tasks,
      rawSpaces,
      activeListId,
      statuses,
      members,
      createTask,
      setActiveSpace,
      setActiveList,
      setNavigatedFromMarcom,
      setAppMode,
      setActiveView,
      setSelectedTaskId,
    ]
  );

  const handleEventSaved = useCallback(
    (savedItem: FieldEventItem, locationLabel: string) => {
      toast.success(
        editingEvent
          ? `Field event updated & synced to "${locationLabel}"`
          : `Field event created & saved in "${locationLabel}"`,
        {
          action: {
            label: "View on Board",
            onClick: () => navigateToTask(savedItem),
          },
        }
      );
      fetchEvents();
    },
    [editingEvent, navigateToTask, fetchEvents]
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
          e.eventType?.toLowerCase().includes(q)
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
        kpiSummary.cancelledCount > 0
          ? `Excludes ${formatIDR(kpiSummary.cancelledBudget)} cancelled`
          : "Across all active branches",
      icon: Coins,
      color: "emerald",
    },
    {
      label: "Target Footfall",
      value: `${kpiSummary.totalTargetAttendees.toLocaleString()}`,
      helper: `${kpiSummary.totalActualAttendees.toLocaleString()} reached (active events)`,
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Flag className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Field Events
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage on-ground activations, mall roadshows, venue logistics, budgets in IDR, and event footage.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View switcher */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
                viewMode === "cards"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
                viewMode === "table"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
              title="Table View"
            >
              <TableProperties className="w-3.5 h-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={cn(
                "p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
                viewMode === "calendar"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
              title="Calendar Month View"
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={cn(
                "p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer",
                viewMode === "timeline"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              )}
              title="Timeline (Gantt) View"
            >
              <GanttChart className="w-3.5 h-3.5" />
              Timeline
            </button>
          </div>

          <button
            type="button"
            onClick={fetchEvents}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh Field Events"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Field Event
          </button>
        </div>
      </div>

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
            onClick={fetchEvents}
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
          tasks={tasks}
          rawSpaces={rawSpaces}
          members={members}
          onSelectEvent={openEditModal}
          onNavigateToTask={navigateToTask}
          onDeleteEvent={handleDeleteEvent}
          onOpenFootageModal={openFootageModal}
        />
      ) : (
        <EventTableView
          events={filteredEvents}
          conflicts={conflicts}
          tasks={tasks}
          rawSpaces={rawSpaces}
          members={members}
          isLoading={isLoading}
          error={error}
          canDelete={can("CREATE_EVENT")}
          onRefresh={fetchEvents}
          onSelectEvent={openEditModal}
          onNavigateToTask={navigateToTask}
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
        rawSpaces={rawSpaces}
        activeWorkspaceId={activeWorkspaceId}
        tasks={tasks}
        createTask={createTask}
        updateTask={updateTask}
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
