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
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { formatDate, cn, formatIDR } from "@/lib/utils";
import {
  getWorkspaceSpacesAndLists,
  findSpaceByListId,
  getDefaultDestinationForChannel,
} from "@/lib/tasks/targetSpaceList";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";
import { KpiSummaryCards, type KpiCardItem } from "@/components/views/shared/KpiSummaryCards";

export type EventStatus = "UPCOMING" | "ON_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface EventFootage {
  id: string;
  eventId: string;
  title: string;
  filePath: string;
  duration: string;
}

export interface MarcomEvent {
  id: string;
  name: string;
  date: string | null;
  endDate: string | null;
  location: string;
  branchName: string;
  picName: string;
  eventType: string;
  status: EventStatus;
  budget: number;
  attendeeCount: number;
  targetAttendee: number;
  notes: string;
  footage?: EventFootage[];
}

export type ActivityViewMode = "cards" | "table";

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

const columnHelper = createMarcomColumnHelper<MarcomEvent>();

interface EventsViewProps {
  initialView?: ActivityViewMode;
}

export function EventsView({ initialView = "cards" }: EventsViewProps = {}) {
  const { can } = useMarcomPermissions();
  const {
    tasks,
    createTask,
    setSelectedTaskId,
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
    activeListId,
    marcomFilters,
    setMarcomFilter,
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

  const [events, setEvents] = useState<MarcomEvent[]>([]);
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
  const [eventStatus, setEventStatus] = useState<EventStatus>("UPCOMING");
  const [eventBudget, setEventBudget] = useState<number>(0);
  const [eventTargetAttendee, setEventTargetAttendee] = useState<number>(100);
  const [eventAttendeeCount, setEventAttendeeCount] = useState<number>(0);
  const [eventNotes, setEventNotes] = useState("");

  // Footage attachments
  const [eventFootageList, setEventFootageList] = useState<EventFootage[]>([]);
  const [newFootageTitle, setNewFootageTitle] = useState("");
  const [newFootageDuration, setNewFootageDuration] = useState("");
  const [newFootagePath, setNewFootagePath] = useState("");

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
        fetch("/api/marcom/events"),
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
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
  const openCreateModal = useCallback(() => {
    setEditId(null);
    setEventName("");
    setEventType("Roadshow");
    setEventBranchName(branches[0]?.name || "Jakarta Central");
    setEventLocation("");
    setEventStartDate(new Date().toISOString().slice(0, 10));
    setEventEndDate("");
    setEventPicName(members[0]?.name || "Field Team Lead");
    setEventStatus("UPCOMING");
    setEventBudget(15000000);
    setEventTargetAttendee(250);
    setEventAttendeeCount(0);
    setEventNotes("");
    setEventFootageList([]);
    setNewFootageTitle("");
    setNewFootageDuration("");
    setNewFootagePath("");
    setCreateExecutionTask(true);

    const dest = getDefaultDestinationForChannel(rawSpaces, "on_ground");
    setTargetSpaceId(dest.spaceId);
    setTargetListId(dest.listId);

    setIsModalOpen(true);
  }, [branches, members, rawSpaces]);

  // Open Edit Modal
  const openEditModal = useCallback((event: MarcomEvent) => {
    setEditId(event.id);
    setEventName(event.name || "");
    setEventType(event.eventType || "Roadshow");
    setEventBranchName(event.branchName || branches[0]?.name || "");
    setEventLocation(event.location || "");
    setEventStartDate(event.date ? event.date.slice(0, 10) : "");
    setEventEndDate(event.endDate ? event.endDate.slice(0, 10) : "");
    setEventPicName(event.picName || "");
    setEventStatus(event.status || "UPCOMING");
    setEventBudget(event.budget || 0);
    setEventTargetAttendee(event.targetAttendee || 100);
    setEventAttendeeCount(event.attendeeCount || 0);
    setEventNotes(event.notes || "");
    setEventFootageList(event.footage || []);
    setNewFootageTitle("");
    setNewFootageDuration("");
    setNewFootagePath("");

    const existingTask = tasks.find((t) => t.relatedMarcomId === event.id);
    if (existingTask) {
      const owningSpace = findSpaceByListId(rawSpaces, existingTask.listId);
      if (owningSpace) {
        setTargetSpaceId(owningSpace.id);
        setTargetListId(existingTask.listId);
      }
      setCreateExecutionTask(false);
    } else {
      const dest = getDefaultDestinationForChannel(rawSpaces, "on_ground");
      setTargetSpaceId(dest.spaceId);
      setTargetListId(dest.listId);
      setCreateExecutionTask(true);
    }

    setIsModalOpen(true);
  }, [branches, rawSpaces, tasks]);

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
      toast.error("Footage title is required");
      return;
    }
    const newFootage: EventFootage = {
      id: `vid-${Date.now()}`,
      eventId: editId || "",
      title: newFootageTitle.trim(),
      filePath: newFootagePath.trim() || "https://assets.mixkit.co/videos/preview/mixkit-crowd-at-an-outdoor-festival-42523-large.mp4",
      duration: newFootageDuration.trim() || "01:30",
    };
    setEventFootageList((prev) => [...prev, newFootage]);
    setNewFootageTitle("");
    setNewFootageDuration("");
    setNewFootagePath("");
    toast.success("Footage item added");
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
      };

      let savedId = editId;

      if (editId) {
        const res = await fetch(`/api/marcom/events/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update event");
        toast.success("Field event updated successfully");
      } else {
        const res = await fetch("/api/marcom/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create event");
        const created = await res.json();
        savedId = created.id;
        toast.success("Field event created successfully");
      }

      // Automatically create execution task in chosen Space & List if toggled
      if (createExecutionTask && savedId && !tasks.some((t) => t.relatedMarcomId === savedId)) {
        const chosenListId = targetListId || activeListId || "list-events-roadshows";
        const chosenSpace = flatSpaces.find((s) => s.id === targetSpaceId);
        const rawTargetSpace = rawSpaces.find((s) => s.id === targetSpaceId);
        const targetStatus = rawTargetSpace?.statuses[0]?.id || statuses[0]?.id || "status-todo";

        createTask({
          listId: chosenListId,
          title: `[Field Event] ${eventName.trim()}`,
          description: `<p><strong>Location:</strong> ${eventLocation || "TBD"}</p><p><strong>Branch:</strong> ${eventBranchName}</p><p><strong>Type:</strong> ${eventType}</p><p><strong>Budget:</strong> ${formatIDR(Number(eventBudget) || 0)}</p><p><strong>Target Attendees:</strong> ${eventTargetAttendee}</p>${eventNotes ? `<p><strong>Logistics Notes:</strong> ${eventNotes}</p>` : ""}`,
          statusId: targetStatus,
          priority: "high",
          assignees: members[0] ? [members[0]] : [],
          dueDate: eventStartDate || undefined,
          orderIndex: 0,
          tags: [],
          subtasks: [],
          relatedMarcomId: savedId,
        });
        toast.info(
          `Linked task created in ${chosenSpace?.name || "Target Space"}`
        );
      }

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

  // Track as Task (instant trigger)
  const handleTrackAsTask = useCallback((event: MarcomEvent) => {
    const existing = tasks.find((t) => t.relatedMarcomId === event.id);
    if (existing) {
      setSelectedTaskId(existing.id);
      toast.info("Opened existing execution task");
      return;
    }

    const dest = getDefaultDestinationForChannel(rawSpaces, "on_ground");
    const chosenSpace = rawSpaces.find((s) => s.id === dest.spaceId);
    const targetStatus = chosenSpace?.statuses[0]?.id || statuses[0]?.id || "status-todo";

    createTask({
      listId: dest.listId,
      title: `[Field Event] ${event.name}`,
      description: `<p><strong>Location:</strong> ${event.location || "TBD"}</p><p><strong>Branch:</strong> ${event.branchName}</p><p><strong>Type:</strong> ${event.eventType}</p><p><strong>Budget:</strong> ${formatIDR(event.budget)}</p><p><strong>Target Attendees:</strong> ${event.targetAttendee}</p>${event.notes ? `<p><strong>Notes:</strong> ${event.notes}</p>` : ""}`,
      statusId: targetStatus,
      priority: "high",
      assignees: members[0] ? [members[0]] : [],
      dueDate: event.date ? event.date.slice(0, 10) : undefined,
      orderIndex: 0,
      tags: [],
      subtasks: [],
      relatedMarcomId: event.id,
    });
    toast.success("Linked execution task created in Events & Roadshows list");
  }, [tasks, rawSpaces, statuses, createTask, members, setSelectedTaskId]);

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

  // KPI calculations
  const totalActivations = events.length;
  const activeCount = events.filter(
    (e) => e.status === "UPCOMING" || e.status === "ON_PROGRESS"
  ).length;
  const totalCommittedBudget = events.reduce((sum, e) => sum + (e.budget || 0), 0);
  const totalTargetAttendees = events.reduce((sum, e) => sum + (e.targetAttendee || 0), 0);
  const totalActualAttendees = events.reduce((sum, e) => sum + (e.attendeeCount || 0), 0);

  const kpis: KpiCardItem[] = [
    {
      label: "Active Activations",
      value: `${activeCount}`,
      helper: `${totalActivations} total planned`,
      icon: Flag,
      color: "blue",
    },
    {
      label: "Committed Budget",
      value: formatIDR(totalCommittedBudget),
      helper: "Across all branches",
      icon: Coins,
      color: "emerald",
    },
    {
      label: "Target Footfall",
      value: `${totalTargetAttendees.toLocaleString()}`,
      helper: `${totalActualAttendees.toLocaleString()} reached to date`,
      icon: Users,
      color: "violet",
    },
    {
      label: "Branch Coverage",
      value: `${branches.length || 5} Cities`,
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
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px]">
                    <Film className="w-3 h-3 text-blue-500" />
                    {e.footage.length} footage
                  </span>
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
      columnHelper.accessor("date", {
        header: "Schedule",
        size: 150,
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>
                {e.date ? formatDate(e.date) : "TBD"}
              </span>
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
        id: "actions",
        header: "Actions",
        size: 120,
        cell: ({ row }) => {
          const e = row.original;
          const linkedTask = tasks.find((t) => t.relatedMarcomId === e.id);
          return (
            <div className="flex items-center gap-1 justify-end">
              {linkedTask ? (
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(linkedTask.id)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-[11px] font-medium transition-colors"
                  title="Open linked execution task"
                >
                  <CheckSquare className="w-3 h-3" />
                  Task
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleTrackAsTask(e)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-medium transition-colors"
                  title="Track as task in board"
                >
                  <Plus className="w-3 h-3" />
                  Track
                </button>
              )}
              <button
                type="button"
                onClick={() => openEditModal(e)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit Event"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this field event?")) {
                    handleDeleteEvent(e.id);
                  }
                }}
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Delete Event"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        },
      }),
    ],
    [tasks, openEditModal, handleTrackAsTask, handleDeleteEvent, setSelectedTaskId]
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
            onClick={openCreateModal}
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
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>
                        {event.date ? formatDate(event.date) : "Date TBD"}
                        {event.endDate && ` – ${formatDate(event.endDate)}`}
                      </span>
                    </div>
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

                  {/* Video Footage summary badge if any */}
                  {event.footage && event.footage.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                      <Film className="w-3.5 h-3.5 text-blue-500" />
                      <span>{event.footage.length} B-roll clips attached</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500 truncate">
                    PIC: <span className="font-medium text-slate-700 dark:text-slate-300">{event.picName || "Unassigned"}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {linkedTask ? (
                      <button
                        type="button"
                        onClick={() => setSelectedTaskId(linkedTask.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-semibold transition-colors"
                        title="Open linked execution task"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        Task
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTrackAsTask(event)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold transition-colors"
                        title="Track as task in board"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Track
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditModal(event)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
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
        <MarcomTableShell<MarcomEvent>
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
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                >
                  ✕
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
                    <input
                      type="text"
                      placeholder="e.g. Budi Hartono"
                      value={eventPicName}
                      onChange={(e) => setEventPicName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                    />
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

                {/* B-roll Video Footage Manager */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                      <Film className="w-4 h-4 text-blue-500" />
                      <span>Event Footage & B-roll Assets</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {eventFootageList.length} attached
                    </span>
                  </div>

                  {eventFootageList.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {eventFootageList.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                              {f.title}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              ({f.duration})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFootage(f.id)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add footage input line */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Footage Title (e.g. Crowd Highlights)"
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
                    <button
                      type="button"
                      onClick={handleAddFootage}
                      className="px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Clip
                    </button>
                  </div>
                </div>

                {/* TARGET SPACE & LIST SELECTION (Superpower Integration) */}
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Target Workspace Destination
                      </span>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createExecutionTask}
                        onChange={(e) => setCreateExecutionTask(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Create execution task in board
                    </label>
                  </div>

                  {createExecutionTask && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Target Space
                        </label>
                        <select
                          value={targetSpaceId}
                          onChange={(e) => handleTargetSpaceChange(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-hidden font-medium"
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
                          Target List
                        </label>
                        <select
                          value={targetListId}
                          onChange={(e) => setTargetListId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-hidden font-medium"
                        >
                          {targetLists.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
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
    </div>
  );
}

// Re-export alias for convenience
export const FieldEventsView = EventsView;
