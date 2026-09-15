"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Flag,
  Plus,
  Edit2,
  CheckSquare,
  RefreshCw,
  Video,
  Calendar,
  Trash2,
  Users,
  Coins,
  MapPin,
  Building2,
  LayoutGrid,
  TableProperties,
  Search,
  Film,
  Kanban,
  ExternalLink,
  Layers,
  ListTodo,
  RotateCcw,
  X,
  Clock,
  GanttChart,
  AlertTriangle,
  Play,
  Folder,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { formatDate, cn, formatIDR } from "@/lib/utils";
import type { Task, Subtask, User, FieldEventItem, EventStatus, EventFootage } from "@/types";
import {
  getWorkspaceSpacesAndLists,
  findSpaceByListId,
  getDefaultDestinationForChannel,
} from "@/lib/tasks/targetSpaceList";
import {
  getEventChecklistTemplate,
  findMemberForPic,
  buildEventDescription,
  buildEventTaskPayload,
  mapEventStatusToTaskStatusId,
  formatEventDateRange,
  detectEventConflicts,
  calculateFieldEventsKPI,
} from "@/lib/tasks/eventTaskSync";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";
import { EventsCalendarView } from "./EventsCalendarView";
import { EventsTimelineView } from "./EventsTimelineView";
import { EventFootageModal } from "./EventFootageModal";
import { useGoogleDrivePicker } from "@/lib/marcom/useGoogleDrivePicker";
import { GoogleDriveLinkModal } from "@/components/ui/GoogleDriveLinkModal";
import { parseGoogleDriveUrl } from "@/lib/marcom/googleDriveUtils";

export type FieldEvent = FieldEventItem;
export type MarcomEvent = FieldEventItem;
export type { EventStatus, EventFootage };

export type ActivityViewMode = "cards" | "table" | "calendar" | "timeline";

const STATUS_CONFIG: Record<
  EventStatus,
  { label: string; badge: string; text: string; bg: string; border: string }
> = {
  UPCOMING: {
    label: "Upcoming",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900/40",
  },
  ON_PROGRESS: {
    label: "On Progress",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900/40",
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900/40",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-900/40",
  },
};

const EVENT_TYPE_STYLES: Record<string, { label: string; badge: string }> = {
  Launch: { label: "Store Launch", badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  Roadshow: { label: "Mall Roadshow", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  Exhibition: { label: "Exhibition", badge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" },
  Booth: { label: "Pop-up Booth", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  Workshop: { label: "Workshop", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  Community: { label: "Community", badge: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20" },
};

const columnHelper = createMarcomColumnHelper<FieldEvent>();

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
  const currentSpace = useMemo(
    () => currentWorkspace?.spaces.find((s) => s.id === activeSpaceId),
    [currentWorkspace, activeSpaceId]
  );
  const statuses = useMemo(() => currentSpace?.statuses || [], [currentSpace]);

  // Destination Space & List resolution
  const rawSpaces = useMemo(
    () => currentWorkspace?.spaces || [],
    [currentWorkspace]
  );
  const flatSpaces = useMemo(
    () => getWorkspaceSpacesAndLists(rawSpaces),
    [rawSpaces]
  );

  const [events, setEvents] = useState<FieldEvent[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode and filters
  const [viewMode, setViewMode] = useState<ActivityViewMode>(initialView);
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState(marcomFilters["events"] || "");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Roadshow");
  const [eventBranchName, setEventBranchName] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStartDate, setEventStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventPicName, setEventPicName] = useState("");
  const [picMemberId, setPicMemberId] = useState<string>("");
  const [eventSubtasks, setEventSubtasks] = useState<
    { id: string; title: string; completed?: boolean }[]
  >([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [eventStatus, setEventStatus] = useState<EventStatus>("UPCOMING");
  const [eventBudget, setEventBudget] = useState<number>(0);
  const [eventTargetAttendee, setEventTargetAttendee] = useState<number>(100);
  const [eventAttendeeCount, setEventAttendeeCount] = useState<number>(0);
  const [eventNotes, setEventNotes] = useState("");

  // Footage attachments & documentation storage
  const [eventFootageList, setEventFootageList] = useState<EventFootage[]>([]);
  const [newFootageTitle, setNewFootageTitle] = useState("");
  const [newFootageDuration, setNewFootageDuration] = useState("");
  const [newFootagePath, setNewFootagePath] = useState("");
  const [eventMediaUrl, setEventMediaUrl] = useState("");
  const [activeFootageEvent, setActiveFootageEvent] = useState<FieldEvent | null>(null);
  const [activeClipIndex, setActiveClipIndex] = useState(0);

  // Google Drive Picker
  const {
    openSelector: openDriveSelector,
    isModalOpen: isDriveModalOpen,
    closeModal: closeDriveModal,
    handleManualAttach,
  } = useGoogleDrivePicker();

  const openFootageModal = useCallback((event: FieldEvent, clipIdx = 0) => {
    setActiveFootageEvent(event);
    setActiveClipIndex(clipIdx);
  }, []);

  const closeFootageModal = useCallback(() => {
    setActiveFootageEvent(null);
  }, []);

  // Target Space & List selection
  const [targetSpaceId, setTargetSpaceId] = useState<string>("");
  const [targetListId, setTargetListId] = useState<string>("");
  const [createExecutionTask, setCreateExecutionTask] = useState(true);

  const selectedTargetSpace = useMemo(
    () => flatSpaces.find((s) => s.id === targetSpaceId) || flatSpaces[0],
    [flatSpaces, targetSpaceId]
  );
  const targetLists = useMemo(
    () => selectedTargetSpace?.lists || [],
    [selectedTargetSpace]
  );

  const handleTargetSpaceChange = (newSpaceId: string) => {
    setTargetSpaceId(newSpaceId);
    const dest = getDefaultDestinationForChannel(rawSpaces, "on_ground", newSpaceId);
    setTargetListId(dest.listId);
  };

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resEvents, resBranches] = await Promise.all([
        fetch(`/api/marcom/events?workspaceId=${encodeURIComponent(activeWorkspaceId)}`),
        fetch("/api/marcom/branches"),
      ]);
      if (!resEvents.ok) throw new Error(`Request failed (${resEvents.status})`);
      const jsonEvents = await resEvents.json();
      setEvents(Array.isArray(jsonEvents.data) ? jsonEvents.data : []);
      if (resBranches.ok) {
        const jsonBranches = await resBranches.json();
        setBranches(Array.isArray(jsonBranches.data) ? jsonBranches.data : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load field events");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, activeWorkspaceId]);

  // Sync external search query
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

  // Open Create Modal
  const openCreateModal = useCallback((defaultDate?: string) => {
    setEditId(null);
    setEventName("");
    setEventType("Roadshow");
    setEventBranchName(branches[0]?.name || "Jakarta Central");
    setEventLocation("");
    setEventStartDate(defaultDate || new Date().toISOString().slice(0, 10));
    setEventEndDate("");
    const defaultMember = members[0];
    setPicMemberId(defaultMember?.id || "");
    setEventPicName(defaultMember?.name || "Field Team Lead");
    setEventStatus("UPCOMING");
    setEventBudget(15000000);
    setEventTargetAttendee(250);
    setEventAttendeeCount(0);
    setEventNotes("");
    setEventMediaUrl("");
    setEventFootageList([]);
    setNewFootageTitle("");
    setNewFootageDuration("");
    setNewFootagePath("");
    setCreateExecutionTask(true);
    setEventSubtasks(
      getEventChecklistTemplate("Roadshow").map((t, i) => ({
        id: `sub-init-${i}`,
        title: t,
        completed: false,
      }))
    );
    setNewSubtaskTitle("");

    const dest = getDefaultDestinationForChannel(rawSpaces, "on_ground");
    setTargetSpaceId(dest.spaceId);
    setTargetListId(dest.listId);

    setIsModalOpen(true);
  }, [branches, members, rawSpaces]);

  // Open Edit Modal
  const openEditModal = useCallback((event: FieldEvent) => {
    setEditId(event.id);
    setEventName(event.name || "");
    setEventType(event.eventType || "Roadshow");
    setEventBranchName(event.branchName || branches[0]?.name || "");
    setEventLocation(event.location || "");
    const dateVal = event.startDate || event.date;
    setEventStartDate(dateVal ? dateVal.slice(0, 10) : "");
    setEventEndDate(event.endDate ? event.endDate.slice(0, 10) : "");
    setEventStatus(event.status || "UPCOMING");
    setEventBudget(event.budget || 0);
    setEventTargetAttendee(event.targetAttendee || 100);
    setEventAttendeeCount(event.attendeeCount || 0);
    setEventNotes(event.notes || "");
    setEventMediaUrl(event.mediaUrl || "");
    setEventFootageList(event.footage || []);
    setNewFootageTitle("");
    setNewFootageDuration("");
    setNewFootagePath("");
    setCreateExecutionTask(true);

    const existingTask = tasks.find((t) => t.relatedMarcomId === event.id);
    if (existingTask) {
      const owningSpace = findSpaceByListId(rawSpaces, existingTask.listId);
      if (owningSpace) {
        setTargetSpaceId(owningSpace.id);
        setTargetListId(existingTask.listId);
      }
      const assignedUser = existingTask.assignees?.[0];
      if (assignedUser) {
        setPicMemberId(assignedUser.id);
        setEventPicName(assignedUser.name);
      } else {
        const matched = findMemberForPic(members, event.picName);
        setPicMemberId(matched?.id || "custom");
        setEventPicName(event.picName || "");
      }
      setEventSubtasks(
        Array.isArray(existingTask.subtasks) && existingTask.subtasks.length > 0
          ? existingTask.subtasks.map((s, i) => ({
              id: s.id || `sub-edit-${i}`,
              title: s.title,
              completed: Boolean(s.completed),
            }))
          : getEventChecklistTemplate(event.eventType || "Roadshow").map((t, i) => ({
              id: `sub-edit-${i}`,
              title: t,
              completed: false,
            }))
      );
    } else {
      const dest = getDefaultDestinationForChannel(rawSpaces, "on_ground");
      setTargetSpaceId(dest.spaceId);
      setTargetListId(dest.listId);
      const matched = findMemberForPic(members, event.picName);
      setPicMemberId(matched?.id || members[0]?.id || "custom");
      setEventPicName(event.picName || members[0]?.name || "");
      setEventSubtasks(
        getEventChecklistTemplate(event.eventType || "Roadshow").map((t, i) => ({
          id: `sub-edit-${i}`,
          title: t,
          completed: false,
        }))
      );
    }

    setIsModalOpen(true);
  }, [branches, rawSpaces, tasks, members]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Add footage
  const handleAddFootage = () => {
    if (!newFootageTitle.trim()) {
      toast.error("Footage clip title is required");
      return;
    }
    if (!newFootagePath.trim()) {
      toast.error("Video URL / Google Drive link is required");
      return;
    }
    const newFootage: EventFootage = {
      id: `vid-${Date.now()}`,
      eventId: editId || "",
      title: newFootageTitle.trim(),
      filePath: newFootagePath.trim(),
      duration: newFootageDuration.trim() || "01:30",
    };
    setEventFootageList((prev) => [...prev, newFootage]);
    setNewFootageTitle("");
    setNewFootageDuration("");
    setNewFootagePath("");
    toast.success("Footage clip added successfully");
  };

  const handleRemoveFootage = (id: string) => {
    setEventFootageList((prev) => prev.filter((f) => f.id !== id));
  };

  // Save Event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) {
      toast.error("Event name is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: eventName.trim(),
        eventType,
        branchName: eventBranchName,
        location: eventLocation.trim(),
        date: eventStartDate || undefined,
        endDate: eventEndDate || undefined,
        picName: eventPicName.trim(),
        status: eventStatus,
        budget: Number(eventBudget) || 0,
        targetAttendee: Number(eventTargetAttendee) || 0,
        attendeeCount: Number(eventAttendeeCount) || 0,
        notes: eventNotes.trim(),
        mediaUrl: eventMediaUrl.trim() || undefined,
        footage: eventFootageList,
        workspaceId: activeWorkspaceId,
      };

      let savedId = editId;

      if (editId) {
        const res = await fetch(`/api/marcom/events/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update event");
        savedId = editId;
      } else {
        const res = await fetch("/api/marcom/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create event");
        const created = await res.json();
        savedId = created.id;
      }

      const picMember =
        members.find((m) => m.id === picMemberId) ||
        findMemberForPic(members, eventPicName);

      const chosenListId =
        targetListId || activeListId || "list-field-ops";
      const targetSpace = rawSpaces.find((s) => s.id === targetSpaceId);
      const targetStatus = mapEventStatusToTaskStatusId(
        eventStatus,
        targetSpace?.statuses || statuses
      );

      const formattedSubtasks: Subtask[] = eventSubtasks.map((s, i) => ({
        id: s.id || `sub-${Date.now()}-${i}`,
        title: s.title,
        completed: Boolean(s.completed),
        createdAt: new Date().toISOString(),
      }));

      // Automatically create execution task in chosen Space & List if toggled
      const existingTask = savedId
        ? tasks.find((t) => t.relatedMarcomId === savedId)
        : undefined;

      if (!existingTask && createExecutionTask && savedId) {
        createTask({
          listId: chosenListId,
          title: `[Field Event] ${eventName.trim()}`,
          description: buildEventDescription({
            location: eventLocation,
            branchName: eventBranchName,
            eventType,
            budget: Number(eventBudget) || 0,
            targetAttendee: Number(eventTargetAttendee) || 0,
            notes: eventNotes,
          }),
          statusId: targetStatus,
          priority: "high",
          assignees: picMember ? [picMember] : members[0] ? [members[0]] : [],
          dueDate: eventStartDate || undefined,
          orderIndex: 0,
          tags: [],
          subtasks: formattedSubtasks,
          relatedMarcomId: savedId,
        });
      } else if (existingTask) {
        const updates: Partial<Task> = {
          title: `[Field Event] ${eventName.trim()}`,
          description: buildEventDescription({
            location: eventLocation,
            branchName: eventBranchName,
            eventType,
            budget: Number(eventBudget) || 0,
            targetAttendee: Number(eventTargetAttendee) || 0,
            notes: eventNotes,
          }),
          statusId: targetStatus,
          dueDate: eventStartDate || undefined,
          assignees: picMember ? [picMember] : [],
          subtasks: formattedSubtasks,
        };
        if (targetListId && targetListId !== existingTask.listId) {
          updates.listId = targetListId;
        }
        updateTask(existingTask.id, updates);
      }

      const targetListName =
        targetSpace?.lists.find((l) => l.id === targetListId)?.name ||
        targetSpace?.folders
          .flatMap((f) => f.lists)
          .find((l) => l.id === targetListId)?.name ||
        "List";
      const locationLabel = `${targetSpace?.name || "Space"} › ${targetListName}`;

      const savedItemForNav: FieldEvent = {
        id: savedId || "",
        name: eventName.trim(),
        eventType,
        branchName: eventBranchName,
        location: eventLocation,
        startDate: eventStartDate || null,
        date: eventStartDate || null,
        endDate: eventEndDate || null,
        picName: picMember?.name || eventPicName,
        status: eventStatus,
        budget: Number(eventBudget) || 0,
        targetAttendee: Number(eventTargetAttendee) || 0,
        attendeeCount: Number(eventAttendeeCount) || 0,
        notes: eventNotes,
        mediaUrl: eventMediaUrl.trim() || null,
        footage: eventFootageList,
      };

      toast.success(
        editId
          ? `Field event updated & synced to "${locationLabel}"`
          : `Field event created & saved in "${locationLabel}"`,
        {
          action: {
            label: "View on Board",
            onClick: () => navigateToTask(savedItemForNav),
          },
        }
      );

      closeModal();
      await fetchEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save field event");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Event
  const handleDeleteEvent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/marcom/events/${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      toast.success("Field event deleted");
      if (editId === id) closeModal();
      await fetchEvents();
      return true;
    } catch {
      toast.error("Failed to delete event");
      return false;
    }
  }, [editId, fetchEvents]);

  // Navigate to Board Task with full context switch
  const navigateToTask = useCallback(
    (event: FieldEvent) => {
      let existing = tasks.find((t) => t.relatedMarcomId === event.id);

      if (!existing) {
        const dest = getDefaultDestinationForChannel(rawSpaces, "on_ground", targetSpaceId);
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
      targetSpaceId,
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

  const handleTrackAsTask = (event: FieldEvent) => {
    navigateToTask(event);
  };

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

  // KPI calculations (strictly excludes CANCELLED events from committed budget & target footfall)
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

  // Table Columns Definition
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Event & Activation",
        size: 240,
        cell: ({ row }) => {
          const e = row.original;
          const typeStyle = EVENT_TYPE_STYLES[e.eventType] || {
            label: e.eventType,
            badge: "bg-slate-500/10 text-slate-600 border-slate-500/20",
          };
          return (
            <div className="flex flex-col gap-1 py-1 min-w-[200px]">
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-slate-900 dark:text-slate-100 text-xs hover:text-blue-600 transition-colors cursor-pointer truncate"
                  onClick={() => openEditModal(e)}
                >
                  {e.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border", typeStyle.badge)}>
                  {typeStyle.label}
                </span>
                {e.footage && e.footage.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openFootageModal(e, 0)}
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-[10px] cursor-pointer font-medium"
                    title="Watch footage & B-roll video"
                  >
                    <Film className="w-3 h-3 text-blue-500" />
                    <span>{e.footage.length} clips ▶</span>
                  </button>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("location", {
        header: "Venue & Branch",
        size: 200,
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="flex flex-col text-xs text-slate-600 dark:text-slate-300 gap-0.5">
              <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200 truncate">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                {e.location || "Venue TBD"}
              </span>
              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                {e.branchName || "Main Branch"}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.startDate || row.date || "", {
        id: "date",
        header: "Schedule",
        size: 210,
        cell: ({ row }) => {
          const e = row.original;
          const range = formatEventDateRange(e.date || e.startDate, e.endDate);
          const conflict = conflicts.get(e.id);
          return (
            <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {range.formatted}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1 pl-5">
                {range.isMultiDay && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
                    {range.durationDays}d duration
                  </span>
                )}
                {conflict?.hasSameBranchConflict && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60"
                    title={conflict.message}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                    Branch Conflict
                  </span>
                )}
                {conflict?.hasCrossBranchConflict && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60"
                    title={conflict.message}
                  >
                    🌐 {conflict.crossBranchCount} Branches Overlap
                  </span>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("budget", {
        header: "Budget (IDR)",
        size: 140,
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {formatIDR(e.budget)}
            </div>
          );
        },
      }),
      columnHelper.accessor("attendeeCount", {
        header: "Attendees / Footfall",
        size: 150,
        cell: ({ row }) => {
          const e = row.original;
          const pct = e.targetAttendee > 0 ? Math.min(100, Math.round((e.attendeeCount / e.targetAttendee) * 100)) : 0;
          return (
            <div className="flex flex-col gap-1 w-28">
              <div className="flex justify-between text-[10px] font-medium text-slate-600 dark:text-slate-300">
                <span>{e.attendeeCount.toLocaleString()}</span>
                <span className="text-slate-400">/ {e.targetAttendee.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : "bg-amber-500")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("picName", {
        header: "PIC / Assignee",
        size: 150,
        cell: ({ row }) => {
          const e = row.original;
          const linkedTask = tasks.find((t) => t.relatedMarcomId === e.id);
          const member =
            linkedTask?.assignees?.[0] ||
            findMemberForPic(members, e.picName);

          return (
            <div className="flex items-center gap-2 text-xs">
              {member ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-5 h-5 rounded-full bg-slate-200 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                {member?.name || e.picName || "Unassigned"}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        size: 120,
        cell: ({ row }) => {
          const s = STATUS_CONFIG[row.original.status] || STATUS_CONFIG.UPCOMING;
          return (
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border", s.badge)}>
              {s.label}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "destination",
        header: "Task Location (Workspace)",
        size: 190,
        cell: ({ row }) => {
          const e = row.original;
          const linkedTask = tasks.find((t) => t.relatedMarcomId === e.id);
          const linkedSpace = linkedTask
            ? findSpaceByListId(rawSpaces, linkedTask.listId)
            : null;
          const linkedList =
            linkedSpace?.lists.find((l) => l.id === linkedTask?.listId) ||
            linkedSpace?.folders
              .flatMap((f) => f.lists)
              .find((l) => l.id === linkedTask?.listId);

          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium">
                {linkedSpace && linkedList
                  ? `${linkedSpace.name} › ${linkedList.name}`
                  : "Not linked"}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        size: 140,
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="flex items-center gap-1.5 justify-end">
              <button
                type="button"
                onClick={() => navigateToTask(e)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-[10px] font-semibold transition-colors cursor-pointer"
                title="View task on Kanban Board"
              >
                <Kanban className="w-3 h-3" />
                <span>Board</span>
              </button>
              <button
                type="button"
                onClick={() => openEditModal(e)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Edit Event"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this field event?")) {
                    handleDeleteEvent(e.id);
                  }
                }}
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Delete Event"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
      }),
    ],
    [tasks, rawSpaces, members, openEditModal, navigateToTask, handleDeleteEvent, conflicts, openFootageModal]
  );

  return (
    <div className="space-y-6">
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
                "p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
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
                "p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
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
                "p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
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
                "p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
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
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Field Events"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-xs hover:shadow transition-all"
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
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
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
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5",
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
            className="mt-3 px-3 py-1.5 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
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
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create First Field Event
          </button>
        </div>
      ) : viewMode === "cards" ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => {
            const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.UPCOMING;
            const typeStyle = EVENT_TYPE_STYLES[event.eventType] || {
              label: event.eventType,
              badge: "bg-slate-500/10 text-slate-600 border-slate-500/20",
            };
            const linkedTask = tasks.find((t) => t.relatedMarcomId === event.id);
            const attendancePct =
              event.targetAttendee > 0
                ? Math.min(100, Math.round((event.attendeeCount / event.targetAttendee) * 100))
                : 0;

            return (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "group relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all",
                  event.status === "ON_PROGRESS" && "ring-1 ring-amber-500/30"
                )}
              >
                <div>
                  {/* Top Tags & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-semibold border",
                        typeStyle.badge
                      )}
                    >
                      {typeStyle.label}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
                        statusConfig.badge
                      )}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Title & Location */}
                  <h3
                    onClick={() => openEditModal(event)}
                    className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors line-clamp-1"
                  >
                    {event.name}
                  </h3>

                  <div className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{event.location || "Venue TBD"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{event.branchName || "Main Branch"}</span>
                    </div>
                    {(() => {
                      const range = formatEventDateRange(event.startDate || event.date, event.endDate);
                      const conflict = conflicts.get(event.id);
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="truncate">{range.formatted}</span>
                            </div>
                            {range.isMultiDay && (
                              <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50">
                                {range.durationDays}d duration
                              </span>
                            )}
                          </div>
                          {conflict?.hasSameBranchConflict && (
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate">Branch venue conflict</span>
                            </div>
                          )}
                          {conflict?.hasCrossBranchConflict && (
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                              <span className="shrink-0">🌐</span>
                              <span className="truncate">{conflict.crossBranchCount} branches active simultaneously</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Metrics: Budget & Attendance */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                        Budget
                      </span>
                      <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatIDR(event.budget)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                        Footfall / Target
                      </span>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {event.attendeeCount.toLocaleString()} /{" "}
                        <span className="text-slate-400 font-normal">
                          {event.targetAttendee.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${attendancePct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Video Footage Showcase & Interactive Player Trigger */}
                  {((event.footage && event.footage.length > 0) || event.mediaUrl) && (
                    <div className="mt-3 space-y-2">
                      {/* Video Preview Thumbnail / Frame */}
                      {(() => {
                        const primaryClip = event.footage?.[0];
                        const clipUrl = primaryClip?.filePath || event.mediaUrl;
                        if (!clipUrl) return null;
                        const driveInfo = parseGoogleDriveUrl(clipUrl);
                        const isVideo =
                          clipUrl.endsWith(".mp4") ||
                          clipUrl.endsWith(".mov") ||
                          clipUrl.endsWith(".webm") ||
                          clipUrl.includes("mixkit.co");

                        return (
                          <div
                            onClick={() => openFootageModal(event, 0)}
                            className="group/player relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-200/80 dark:border-slate-800 cursor-pointer shadow-xs hover:border-blue-500/50 transition-all"
                            title="Click to watch documentation video"
                          >
                            {driveInfo.isValid && driveInfo.embedUrl ? (
                              <iframe
                                src={driveInfo.embedUrl}
                                title={primaryClip?.title || event.name}
                                className="w-full h-full border-0 pointer-events-none"
                              />
                            ) : isVideo ? (
                              <video
                                src={clipUrl}
                                preload="metadata"
                                className="w-full h-full object-cover opacity-80 group-hover/player:opacity-100 transition-opacity"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 p-3 text-center">
                                <Film className="w-8 h-8 text-blue-400 mb-1 opacity-70" />
                                <span className="text-[11px] text-slate-300 font-medium truncate max-w-full">
                                  {primaryClip?.title || "Field Documentation"}
                                </span>
                              </div>
                            )}

                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 bg-black/35 group-hover/player:bg-black/15 flex items-center justify-center transition-colors">
                              <div className="w-10 h-10 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg group-hover/player:scale-110 transition-transform">
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              </div>
                            </div>

                            {/* Clip Duration Pill */}
                            {primaryClip?.duration && (
                              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono font-medium backdrop-blur-xs">
                                {primaryClip.duration}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Interactive Button & Links Bar */}
                      <div className="flex items-center justify-between text-[11px]">
                        {event.footage && event.footage.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => openFootageModal(event, 0)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-semibold transition-colors cursor-pointer"
                          >
                            <Film className="w-3.5 h-3.5" />
                            <span>Watch B-roll ({event.footage.length} clips) ▶</span>
                          </button>
                        ) : (
                          <span />
                        )}

                        {event.mediaUrl && (
                          <a
                            href={event.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                            title="Open field documentation archive folder"
                          >
                            <Folder className="w-3 h-3" />
                            <span>Archive Folder ↗</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Destination Breadcrumb */}
                  {(() => {
                    const linkedTask = tasks.find((t) => t.relatedMarcomId === event.id);
                    const linkedSpace = linkedTask
                      ? findSpaceByListId(rawSpaces, linkedTask.listId)
                      : null;
                    const linkedList =
                      linkedSpace?.lists.find((l) => l.id === linkedTask?.listId) ||
                      linkedSpace?.folders
                        .flatMap((f) => f.lists)
                        .find((l) => l.id === linkedTask?.listId);

                    return (
                      <div className="mt-3 flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5 min-w-0 text-slate-600 dark:text-slate-300">
                          <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-semibold truncate">
                            {linkedSpace && linkedList
                              ? `${linkedSpace.name} › ${linkedList.name}`
                              : "Workspace Task"}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                          Workspace Task
                        </span>
                      </div>
                    );
                  })()}

                  {/* Checklist summary */}
                  {(() => {
                    const linkedTask = tasks.find((t) => t.relatedMarcomId === event.id);
                    const subtasks = linkedTask?.subtasks || [];
                    if (subtasks.length === 0) return null;
                    const completedCount = subtasks.filter((s) => s.completed).length;
                    return (
                      <div className="mt-2 flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200/40 dark:border-blue-900/30">
                        <div className="flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>Preparation Checklist:</span>
                        </div>
                        <span className="font-semibold font-mono text-[10px]">
                          {completedCount}/{subtasks.length} Completed
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate min-w-0">
                    {(() => {
                      const linkedTask = tasks.find((t) => t.relatedMarcomId === event.id);
                      const picMember =
                        linkedTask?.assignees?.[0] ||
                        findMemberForPic(members, event.picName);

                      return (
                        <>
                          {picMember ? (
                            <img
                              src={picMember.avatar}
                              alt={picMember.name}
                              className="w-4 h-4 rounded-full bg-slate-200 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                            {picMember?.name || event.picName || "Unassigned"}
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => navigateToTask(event)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer transition-colors"
                      title="View task on Kanban Board"
                    >
                      <Kanban className="w-3 h-3" />
                      <span>View on Board</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(event)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Event"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this field event?")) {
                          handleDeleteEvent(event.id);
                        }
                      }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <MarcomTableShell<FieldEvent>
          data={filteredEvents}
          columns={columns}
          getRowId={(row) => row.id}
          initialSorting={[{ id: "date", desc: false }]}
          title="Field Events"
          titleIcon={Flag}
          entityName="event"
          entityPlural="events"
          isLoading={isLoading}
          error={error}
          onRefresh={fetchEvents}
          canDelete={can("CREATE_EVENT")}
          deleteRequiresMessage="Delete requires admin or manager role"
          onDeleteOne={handleDeleteEvent}
          hideHeader
          noPadding
        />
      )}

      {/* Unified Field Event Modal (Create / Edit) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Flag className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {editId ? "Edit Field Event" : "Create New Field Event"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      On-ground brand activation, venue permits, budget & logistics
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveEvent} className="space-y-4">
                {/* Event Name & Event Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Event / Activation Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Summer Mall Roadshow Vol. 2"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Activation Type
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                    >
                      <option value="Roadshow">Mall Roadshow</option>
                      <option value="Launch">Store Launch</option>
                      <option value="Booth">Pop-up Booth</option>
                      <option value="Exhibition">Exhibition / Expo</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Community">Community Meetup</option>
                    </select>
                  </div>
                </div>

                {/* Branch & Venue Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Organizing Branch
                    </label>
                    <select
                      value={eventBranchName}
                      onChange={(e) => setEventBranchName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                    >
                      {branches.length > 0 ? (
                        branches.map((b) => (
                          <option key={b.id} value={b.name}>
                            {b.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Jakarta Central">Jakarta Central</option>
                          <option value="Surabaya West">Surabaya West</option>
                          <option value="Bandung Dago">Bandung Dago</option>
                          <option value="Bali Kuta">Bali Kuta</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Venue / Specific Location *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Central Park Mall Atrium Lt. LG"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule Dates & PIC */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={eventStartDate}
                      onChange={(e) => setEventStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Person in Charge (PIC)
                    </label>
                    <select
                      value={picMemberId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPicMemberId(val);
                        if (val !== "custom") {
                          const m = members.find((mem) => mem.id === val);
                          if (m) setEventPicName(m.name);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden cursor-pointer"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                      <option value="custom">Custom PIC Name...</option>
                    </select>

                    {picMemberId === "custom" && (
                      <input
                        type="text"
                        placeholder="Enter PIC name..."
                        value={eventPicName}
                        onChange={(e) => setEventPicName(e.target.value)}
                        className="mt-1.5 w-full px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-hidden"
                      />
                    )}
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      PIC will automatically receive this task on Kanban Board & "My Tasks".
                    </span>
                  </div>
                </div>

                {/* Status, Budget, Attendees */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={eventStatus}
                      onChange={(e) => setEventStatus(e.target.value as EventStatus)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                    >
                      <option value="UPCOMING">Upcoming</option>
                      <option value="ON_PROGRESS">On Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Budget (IDR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500000}
                      value={eventBudget}
                      onChange={(e) => setEventBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                    />
                    <span className="text-[10px] text-emerald-600 font-mono mt-0.5 block">
                      {formatIDR(eventBudget)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Attendees
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={eventTargetAttendee}
                      onChange={(e) => setEventTargetAttendee(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Actual Attendees
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={eventAttendeeCount}
                      onChange={(e) => setEventAttendeeCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* Notes & Permits */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Logistics, Permits & Operational Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Mall management permit approved. Need 3 wireless mics, stage backdrop 6x3m, electricity 5500W..."
                    value={eventNotes}
                    onChange={(e) => setEventNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden resize-y"
                  />
                </div>

                {/* Storage Destination & Raw Documentation Folder */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                      <Folder className="w-4 h-4 text-amber-500" />
                      <span>Field Documentation Archive (Storage Destination)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        openDriveSelector({
                          defaultKind: "all",
                          onSelect: (atts) => {
                            if (atts[0]) {
                              setEventMediaUrl(atts[0].url);
                              toast.success("Google Drive documentation folder selected");
                            }
                          },
                        })
                      }
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Select from Google Drive</span>
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/... or cloud storage URL for raw footage archive"
                    value={eventMediaUrl}
                    onChange={(e) => setEventMediaUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden font-mono text-[11px]"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Folder link where the media team archives all event photos, raw footage, and coverage assets.
                  </p>
                </div>

                {/* B-roll Video Footage Manager */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                      <Film className="w-4 h-4 text-blue-500" />
                      <span>B-Roll Video Clips & Highlight Documentation</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {eventFootageList.length} clips attached
                    </span>
                  </div>

                  {eventFootageList.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {eventFootageList.map((f, idx) => (
                        <div
                          key={f.id || idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <Video className="w-4 h-4 text-blue-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {f.title}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  ({f.duration || "01:30"})
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 truncate block font-mono">
                                {f.filePath}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                openFootageModal(
                                  {
                                    id: editId || "temp",
                                    name: eventName || "Preview",
                                    eventType,
                                    status: eventStatus,
                                    budget: Number(eventBudget) || 0,
                                    targetAttendee: 0,
                                    attendeeCount: 0,
                                    footage: eventFootageList,
                                    mediaUrl: eventMediaUrl,
                                  },
                                  idx
                                );
                              }}
                              className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              title="Play / Preview video"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Play</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFootage(f.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                              title="Remove clip"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add footage input form */}
                  <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <span>Add New Clip:</span>
                      <button
                        type="button"
                        onClick={() =>
                          openDriveSelector({
                            defaultKind: "video",
                            onSelect: (atts) => {
                              if (atts[0]) {
                                setNewFootagePath(atts[0].url);
                                if (!newFootageTitle.trim()) {
                                  setNewFootageTitle(atts[0].name.replace(/\.[^/.]+$/, ""));
                                }
                                toast.success("Google Drive video selected");
                              }
                            },
                          })
                        }
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Select from Google Drive</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Clip Title (e.g. Crowd Highlights)"
                        value={newFootageTitle}
                        onChange={(e) => setNewFootageTitle(e.target.value)}
                        className="sm:col-span-2 px-2.5 py-1.5 rounded-md text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g. 02:15)"
                        value={newFootageDuration}
                        onChange={(e) => setNewFootageDuration(e.target.value)}
                        className="px-2.5 py-1.5 rounded-md text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="Video URL (Google Drive / Direct MP4 / WebM / Cloud URL)"
                        value={newFootagePath}
                        onChange={(e) => setNewFootagePath(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-md text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={handleAddFootage}
                        className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Clip
                      </button>
                    </div>
                  </div>
                </div>

                {/* EVENT PREPARATION CHECKLIST (Subtasks) */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                      <ListTodo className="w-4 h-4 text-blue-500" />
                      <span>Event Preparation Checklist (Task Subtasks)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {eventSubtasks.filter((s) => s.completed).length}/{eventSubtasks.length} completed
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const template = getEventChecklistTemplate(eventType);
                          setEventSubtasks(
                            template.map((t, i) => ({
                              id: `sub-${Date.now()}-${i}`,
                              title: t,
                              completed: false,
                            }))
                          );
                          toast.info(`Checklist reset to ${eventType} template`);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        title="Reload checklist template for this event type"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Template {eventType}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Field logistics and operational checklist. Items automatically sync as subtasks on the Kanban Board.
                  </p>

                  {eventSubtasks.length > 0 && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {eventSubtasks.map((s, idx) => (
                        <div
                          key={s.id || idx}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(s.completed)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setEventSubtasks((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, completed: checked } : item
                                  )
                                );
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <span
                              className={cn(
                                "truncate text-slate-800 dark:text-slate-200",
                                s.completed && "line-through text-slate-400 dark:text-slate-500"
                              )}
                            >
                              {s.title}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setEventSubtasks((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                            title="Remove checklist item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add subtask item */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add new checklist item... (e.g. Rent 10kVA generator)"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newSubtaskTitle.trim()) {
                            setEventSubtasks((prev) => [
                              ...prev,
                              {
                                id: `sub-${Date.now()}-${prev.length}`,
                                title: newSubtaskTitle.trim(),
                                completed: false,
                              },
                            ]);
                            setNewSubtaskTitle("");
                          }
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newSubtaskTitle.trim()) return;
                        setEventSubtasks((prev) => [
                          ...prev,
                          {
                            id: `sub-${Date.now()}-${prev.length}`,
                            title: newSubtaskTitle.trim(),
                            completed: false,
                          },
                        ]);
                        setNewSubtaskTitle("");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>

                {/* TARGET SPACE & LIST SELECTION (Superpower Integration) */}
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Target Space & List (Task Storage Destination)
                      </span>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={createExecutionTask}
                        onChange={(e) => setCreateExecutionTask(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Sync to Kanban Board
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Select the Workspace Space and List where this event task will be created and tracked alongside its checklist.
                  </p>

                  {createExecutionTask && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Select Space
                          </label>
                          <select
                            value={targetSpaceId}
                            onChange={(e) => handleTargetSpaceChange(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-hidden font-medium cursor-pointer"
                          >
                            {flatSpaces.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Select List
                          </label>
                          <select
                            value={targetListId}
                            onChange={(e) => setTargetListId(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-hidden font-medium cursor-pointer"
                          >
                            {targetLists.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Live destination preview pill */}
                      {(() => {
                        const currentSpace = flatSpaces.find((s) => s.id === targetSpaceId);
                        const currentList = targetLists.find((l) => l.id === targetListId);
                        return (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                            <span className="text-slate-400">Destination:</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-900/40">
                              <Layers className="w-3 h-3" />
                              {currentSpace?.name || "Space"} › {currentList?.name || "List"}
                            </span>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : editId ? "Update Event" : "Create Field Event"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Footage Player Modal */}
      <EventFootageModal
        isOpen={Boolean(activeFootageEvent)}
        onClose={closeFootageModal}
        event={activeFootageEvent}
        initialClipIndex={activeClipIndex}
      />

      {/* Google Drive Link Modal */}
      <GoogleDriveLinkModal
        isOpen={isDriveModalOpen}
        onClose={closeDriveModal}
        onAttach={handleManualAttach}
        defaultKind="video"
      />
    </div>
  );
}

// Re-export alias for convenience
export const FieldEventsView = EventsView;
