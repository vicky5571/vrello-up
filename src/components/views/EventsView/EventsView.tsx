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
  Sparkles,
  Video,
  Image as ImageIcon,
  Layers,
  FileText,
  Clock,
  Calendar,
  Play,
  Flame,
  MessageSquare,
  Trash2,
  Users,
  Coins,
  Megaphone,
  LayoutGrid,
  TableProperties,
  MapPin,
  Building2,
  Search,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { PostPlatform, PostFormat, Priority } from "@/types";
import { formatDate, cn, formatIDR } from "@/lib/utils";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";
import { KpiSummaryCards } from "@/components/views/shared/KpiSummaryCards";

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
  postPlatform?: PostPlatform | null;
  postFormat?: PostFormat | null;
  mediaUrl?: string | null;
  footage: EventFootage[];
}

export type ActivityChannel = "all" | "social" | "on_ground";
export type ActivityViewMode = "cards" | "table";

const columnHelper = createMarcomColumnHelper<MarcomEvent>();

const STATUS_STYLES: Record<EventStatus, { badge: string; text: string; label: string }> = {
  UPCOMING: {
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    label: "Upcoming",
  },
  ON_PROGRESS: {
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    label: "On Progress",
  },
  COMPLETED: {
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "Completed",
  },
  CANCELLED: {
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    label: "Cancelled",
  },
};

function isVideo(path: string) {
  return path.toLowerCase().endsWith(".mp4");
}

export function isSocialActivity(event: MarcomEvent): boolean {
  return Boolean(event.postPlatform) || event.eventType?.toLowerCase() === "content";
}

interface BranchOption {
  id: string;
  name: string;
}

const PLATFORM_CONFIG: Record<
  PostPlatform,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  instagram: {
    label: "Instagram",
    bg: "bg-pink-500/10 dark:bg-pink-500/20",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-500/30",
    icon: "📸",
  },
  tiktok: {
    label: "TikTok",
    bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/30",
    icon: "🎵",
  },
  youtube: {
    label: "YouTube",
    bg: "bg-red-500/10 dark:bg-red-500/20",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/30",
    icon: "▶️",
  },
  linkedin: {
    label: "LinkedIn",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    icon: "💼",
  },
  facebook: {
    label: "Facebook",
    bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/30",
    icon: "👥",
  },
  twitter: {
    label: "Twitter / X",
    bg: "bg-slate-500/10 dark:bg-slate-500/20",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/30",
    icon: "𝕏",
  },
  blog: {
    label: "Blog",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    icon: "✍️",
  },
  press: {
    label: "Press Release",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    icon: "📰",
  },
};

const FORMAT_ICONS: Record<PostFormat, typeof Video> = {
  reel: Video,
  carousel: Layers,
  image: ImageIcon,
  story: Clock,
  article: FileText,
  thread: MessageSquare,
};

const DEFAULT_POST_SUBTASKS = [
  "Write caption & copy",
  "Visual asset production / video cut",
  "Stakeholder approval & schedule",
];

interface EventsViewProps {
  initialTab?: "events" | "content";
  initialChannel?: "all" | "social" | "on_ground";
  initialView?: ActivityViewMode;
}

export function EventsView({
  initialTab,
  initialChannel,
  initialView = "cards",
}: EventsViewProps = {}) {
  const { can } = useMarcomPermissions();
  const {
    tasks,
    createTask,
    setSelectedTaskId,
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
    activeListId,
    tags,
    isCreatePostModalOpen,
    setCreatePostModalOpen,
    marcomFilters,
    setMarcomFilter,
  } = useWorkspaceStore();

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const members = useMemo(() => currentWorkspace?.members || [], [currentWorkspace]);
  const currentSpace = useMemo(
    () => currentWorkspace?.spaces.find((s) => s.id === activeSpaceId),
    [currentWorkspace, activeSpaceId]
  );
  const statuses = useMemo(() => currentSpace?.statuses || [], [currentSpace]);

  const [events, setEvents] = useState<MarcomEvent[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state: Cards vs Table, Channel Filters
  const [viewMode, setViewMode] = useState<ActivityViewMode>(initialView);
  const initialChannelFilter: ActivityChannel =
    initialChannel ||
    (initialTab === "content" ? "social" : initialTab === "events" ? "on_ground" : "all");
  const [channelFilter, setChannelFilter] = useState<ActivityChannel>(initialChannelFilter);
  const [selectedPlatform, setSelectedPlatform] = useState<PostPlatform | "all">("all");

  // Unified Activity Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalChannel, setModalChannel] = useState<"social" | "on_ground">("social");
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [editId, setEditId] = useState<string | null>(null);
  const [activityName, setActivityName] = useState("");
  const [activityBranchName, setActivityBranchName] = useState("");
  const [activityStatus, setActivityStatus] = useState<EventStatus>("UPCOMING");
  const [activityNotes, setActivityNotes] = useState("");

  // Social Specific Fields
  const [postPlatform, setPostPlatform] = useState<PostPlatform>("instagram");
  const [postFormat, setPostFormat] = useState<PostFormat>("reel");
  const [postDate, setPostDate] = useState(new Date().toISOString().slice(0, 10));
  const [postMediaUrl, setPostMediaUrl] = useState("");
  const [postPriority, setPostPriority] = useState<Priority>("normal");
  const [postStatusId, setPostStatusId] = useState<string>("");
  const [postAssigneeIds, setPostAssigneeIds] = useState<string[]>([]);
  const [postTagIds, setPostTagIds] = useState<string[]>([]);
  const [postSubtasks, setPostSubtasks] = useState<{ id: string; title: string }[]>(() =>
    DEFAULT_POST_SUBTASKS.map((title, i) => ({ id: `sub-init-${i}`, title }))
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // On-ground Specific Fields
  const [eventType, setEventType] = useState("Launch");
  const [eventStartDate, setEventStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventPicName, setEventPicName] = useState("");
  const [eventBudget, setEventBudget] = useState<number>(0);
  const [eventTargetAttendee, setEventTargetAttendee] = useState<number>(100);
  const [eventAttendeeCount, setEventAttendeeCount] = useState<number>(0);

  const canManage = can("CREATE_EVENT");

  const openCreateModal = useCallback((channel: "social" | "on_ground" = "social") => {
    setEditId(null);
    setModalChannel(channel);
    setActivityName("");
    setActivityBranchName(branches[0]?.name || "");
    setActivityStatus("UPCOMING");
    setActivityNotes("");

    // Social defaults
    setPostPlatform("instagram");
    setPostFormat("reel");
    setPostDate(new Date().toISOString().slice(0, 10));
    setPostMediaUrl("");
    setPostPriority("normal");
    setPostStatusId(statuses[0]?.id || "status-todo");
    setPostAssigneeIds(members[0] ? [members[0].id] : []);
    setPostTagIds([]);
    setPostSubtasks(DEFAULT_POST_SUBTASKS.map((title, i) => ({ id: `sub-init-${i}`, title })));
    setNewSubtaskTitle("");

    // On-ground defaults
    setEventType("Launch");
    setEventStartDate(new Date().toISOString().slice(0, 10));
    setEventEndDate("");
    setEventLocation("");
    setEventPicName("");
    setEventBudget(0);
    setEventTargetAttendee(100);
    setEventAttendeeCount(0);

    setIsModalOpen(true);
  }, [branches, statuses, members]);

  // Sync with global store trigger for New Post modal
  useEffect(() => {
    if (isCreatePostModalOpen) {
      openCreateModal("social");
    }
  }, [isCreatePostModalOpen, openCreateModal]);

  const openEditModal = (activity: MarcomEvent) => {
    const isSocial = isSocialActivity(activity);
    setEditId(activity.id);
    setModalChannel(isSocial ? "social" : "on_ground");
    setActivityName(activity.name || "");
    setActivityBranchName(activity.branchName || branches[0]?.name || "");
    setActivityStatus(activity.status || "UPCOMING");
    setActivityNotes(activity.notes || "");

    if (isSocial) {
      setPostPlatform(activity.postPlatform || "instagram");
      setPostFormat(activity.postFormat || "reel");
      setPostDate(activity.date ? activity.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setPostMediaUrl(activity.mediaUrl || "");
      setPostPriority("normal");
      setPostStatusId(statuses[0]?.id || "status-todo");
      setPostAssigneeIds(members[0] ? [members[0].id] : []);
      setPostTagIds([]);
      setPostSubtasks(DEFAULT_POST_SUBTASKS.map((title, i) => ({ id: `sub-edit-${i}`, title })));
    } else {
      setEventType(activity.eventType || "Launch");
      setEventStartDate(activity.date ? activity.date.slice(0, 10) : "");
      setEventEndDate(activity.endDate ? activity.endDate.slice(0, 10) : "");
      setEventLocation(activity.location || "");
      setEventPicName(activity.picName || "");
      setEventBudget(activity.budget || 0);
      setEventTargetAttendee(activity.targetAttendee || 100);
      setEventAttendeeCount(activity.attendeeCount || 0);
    }
  };

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditId(null);
    setCreatePostModalOpen(false);
  }, [setCreatePostModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (editId || isModalOpen)) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editId, isModalOpen, closeModal]);

  // Auto-switch channel to "all" if search filter arrives from external navigation (e.g. Command Palette)
  // and has matches in other channels but not the currently selected channel tab.
  const prevEventsFilter = useRef(marcomFilters["events"]);
  useEffect(() => {
    if (prevEventsFilter.current !== marcomFilters["events"]) {
      prevEventsFilter.current = marcomFilters["events"];
      const q = (marcomFilters["events"] || "").trim().toLowerCase();
      if (!q || channelFilter === "all" || events.length === 0) return;
      const hasCurrentHit = events.some((e) => {
        const isSocial = isSocialActivity(e);
        if (channelFilter === "social" && !isSocial) return false;
        if (channelFilter === "on_ground" && isSocial) return false;
        return (
          e.name.toLowerCase().includes(q) ||
          Boolean(e.branchName?.toLowerCase().includes(q)) ||
          Boolean(e.location?.toLowerCase().includes(q))
        );
      });
      if (!hasCurrentHit) {
        setChannelFilter("all");
        setSelectedPlatform("all");
      }
    }
  }, [marcomFilters, events, channelFilter]);

  const handleDeleteActivity = async () => {
    if (!editId) return;
    if (!confirm("Are you sure you want to delete this activity?")) return;
    const ok = await deleteOne(editId);
    if (ok) {
      toast.success("Activity deleted successfully");
      closeModal();
      await fetchEvents();
    } else {
      toast.error("Failed to delete activity");
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setPostSubtasks((prev) => [
      ...prev,
      { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim() },
    ]);
    setNewSubtaskTitle("");
  };

  const handleUpdateSubtask = (id: string, newTitle: string) => {
    setPostSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setPostSubtasks((prev) => prev.filter((s) => s.id !== id));
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
      setError(e instanceof Error ? e.message : "Failed to load campaigns and events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleTrackAsTask = (event: MarcomEvent) => {
    const existing = tasks.find((t) => t.relatedMarcomId === event.id);
    if (existing) {
      setSelectedTaskId(existing.id);
      toast.info("Opened existing execution task");
      return;
    }

    const isSocial = isSocialActivity(event);

    if (isSocial) {
      const targetListId = activeListId || "list-content-planner";
      const targetStatus = statuses[0]?.id || "status-todo";
      const task = createTask({
        listId: targetListId,
        title: `[Content] ${event.name}`,
        description: event.notes ? `<p>${event.notes}</p>` : "<p>Draft post copy...</p>",
        statusId: targetStatus,
        priority: "normal",
        assignees: members[0] ? [members[0]] : [],
        dueDate: event.date ? event.date.slice(0, 10) : undefined,
        postPlatform: event.postPlatform || undefined,
        postFormat: event.postFormat || undefined,
        mediaUrl: event.mediaUrl || event.footage?.[0]?.filePath || undefined,
        relatedMarcomId: event.id,
        tags: [],
        subtasks: DEFAULT_POST_SUBTASKS.map((title, i) => ({
          id: `sub-post-${Date.now()}-${i}`,
          title,
          completed: false,
          createdAt: new Date().toISOString(),
        })),
        orderIndex:
          Math.max(-1, ...tasks.filter((t) => t.postPlatform != null).map((t) => t.orderIndex)) + 1,
      });
      toast.success("Content post linked to execution task!");
      setSelectedTaskId(task.id);
    } else {
      const firstFootage = event.footage?.[0]?.filePath;
      const statusId = event.status === "COMPLETED" ? "status-done" : "status-in-progress";
      const task = createTask({
        listId: "list-field-ops",
        title: `[Event] ${event.name} (${event.branchName || "Main"})`,
        description: `<p><strong>Location:</strong> ${event.location || "TBD"}</p><p><strong>Target Attendees:</strong> ${event.targetAttendee}</p><p><strong>Budget:</strong> ${formatIDR(event.budget)}</p><p>${event.notes || ""}</p>`,
        statusId,
        priority: event.status === "UPCOMING" ? "high" : "normal",
        assignees: members[0] ? [members[0]] : [],
        dueDate: event.date ? event.date.slice(0, 10) : undefined,
        startDate: event.date ? event.date.slice(0, 10) : undefined,
        relatedMarcomId: event.id,
        mediaUrl: firstFootage || undefined,
        tags: [],
        subtasks: [
          {
            id: `st-ev-${Date.now()}-1`,
            title: `Venue booking & permits (${event.location || "Venue"})`,
            completed: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: `st-ev-${Date.now()}-2`,
            title: "Stage, sound, & branding production setup",
            completed: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: `st-ev-${Date.now()}-3`,
            title: "Capture 4K video footage & b-roll clips",
            completed: Boolean(event.footage?.length),
            createdAt: new Date().toISOString(),
          },
          {
            id: `st-ev-${Date.now()}-4`,
            title: "Compile attendee counts & post-event report",
            completed: false,
            createdAt: new Date().toISOString(),
          },
        ],
        orderIndex:
          Math.max(-1, ...tasks.filter((t) => t.statusId === statusId).map((t) => t.orderIndex)) + 1,
      });
      toast.success("Event execution task created in Field Operations!");
      setSelectedTaskId(task.id);
    }
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName.trim()) {
      toast.error("Please enter an activity name or title");
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = Boolean(editId);
      const url = isEditing ? `/api/marcom/events/${editId}` : "/api/marcom/events";
      const method = isEditing ? "PATCH" : "POST";

      let payload: Record<string, unknown>;

      if (modalChannel === "social") {
        payload = {
          name: activityName.trim(),
          eventType: "Content",
          date: postDate || undefined,
          endDate: undefined,
          location: undefined,
          branchName: activityBranchName?.trim() || undefined,
          picName: postAssigneeIds.length
            ? members.find((m) => m.id === postAssigneeIds[0])?.name || undefined
            : undefined,
          budget: 0,
          attendeeCount: 0,
          targetAttendee: 0,
          status: activityStatus,
          notes: activityNotes?.trim() || undefined,
          postPlatform,
          postFormat,
          mediaUrl: postMediaUrl.trim() || undefined,
        };
      } else {
        if (!eventType.trim()) {
          toast.error("Event Type is required for on-ground activations");
          setIsSaving(false);
          return;
        }
        payload = {
          name: activityName.trim(),
          eventType: eventType.trim(),
          date: eventStartDate || undefined,
          endDate: eventEndDate || undefined,
          location: eventLocation.trim() || undefined,
          branchName: activityBranchName?.trim() || undefined,
          picName: eventPicName.trim() || undefined,
          budget: Number(eventBudget) || 0,
          attendeeCount: Number(eventAttendeeCount) || 0,
          targetAttendee: Number(eventTargetAttendee) || 0,
          status: activityStatus,
          notes: activityNotes?.trim() || undefined,
          postPlatform: null,
          postFormat: null,
          mediaUrl: undefined,
        };
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed with status ${res.status}`);
      }

      const savedItem: MarcomEvent = await res.json();

      // If creating a social post, link to a task as well
      if (!isEditing && modalChannel === "social") {
        const targetListId = activeListId || "list-content-planner";
        const targetStatus = postStatusId || statuses[0]?.id || "status-todo";
        const assignedUsers = members.filter((u) => postAssigneeIds.includes(u.id));
        const selectedTags = (tags || []).filter((t) => postTagIds.includes(t.id));

        createTask({
          listId: targetListId,
          title: activityName.trim(),
          description: activityNotes.trim()
            ? `<p>${activityNotes.trim()}</p>`
            : "<p>Draft post copy...</p>",
          statusId: targetStatus,
          priority: postPriority,
          assignees: assignedUsers.length > 0 ? assignedUsers : members[0] ? [members[0]] : [],
          dueDate: postDate,
          postPlatform,
          postFormat,
          mediaUrl: postMediaUrl.trim() || undefined,
          relatedMarcomId: savedItem.id,
          tags: selectedTags,
          subtasks: postSubtasks
            .filter((s) => s.title.trim().length > 0)
            .map((s, idx) => ({
              id: `sub-${Date.now()}-${idx}`,
              title: s.title.trim(),
              completed: false,
              createdAt: new Date().toISOString(),
            })),
          orderIndex:
            Math.max(
              -1,
              ...tasks.filter((t) => t.postPlatform != null).map((t) => t.orderIndex)
            ) + 1,
        });
      }

      toast.success(
        isEditing
          ? "Activity updated successfully"
          : modalChannel === "social"
          ? "Content post scheduled & task created!"
          : "On-ground activation created successfully!"
      );
      closeModal();
      await fetchEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save activity");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOne = useCallback(async (id: string) => {
    const res = await fetch(`/api/marcom/events/${id}`, { method: "DELETE" });
    return res.ok;
  }, []);

  // Filtered Activities
  const filteredEvents = useMemo(() => {
    const q = (marcomFilters["events"] || "").trim().toLowerCase();
    const matchesQuery = (e: MarcomEvent) =>
      !q ||
      e.name.toLowerCase().includes(q) ||
      Boolean(e.location && e.location.toLowerCase().includes(q)) ||
      Boolean(e.branchName && e.branchName.toLowerCase().includes(q)) ||
      Boolean(e.picName && e.picName.toLowerCase().includes(q)) ||
      Boolean(e.eventType && e.eventType.toLowerCase().includes(q)) ||
      Boolean(e.notes && e.notes.toLowerCase().includes(q));

    const hasChannelMatch =
      !q ||
      channelFilter === "all" ||
      events.some((e) => {
        const isSocial = isSocialActivity(e);
        if (channelFilter === "social" && !isSocial) return false;
        if (channelFilter === "on_ground" && isSocial) return false;
        return matchesQuery(e);
      });

    return events.filter((e) => {
      if (!matchesQuery(e)) return false;

      if (hasChannelMatch) {
        const isSocial = isSocialActivity(e);
        if (channelFilter === "social" && !isSocial) return false;
        if (channelFilter === "on_ground" && isSocial) return false;

        if (channelFilter !== "on_ground" && selectedPlatform !== "all") {
          if (e.postPlatform !== selectedPlatform) return false;
        }
      }

      return true;
    });
  }, [events, channelFilter, selectedPlatform, marcomFilters]);

  // Unified KPI Summary
  const kpiItems = useMemo(() => {
    const activeActivities = events.filter(
      (e) => e.status === "UPCOMING" || e.status === "ON_PROGRESS"
    ).length;

    const socialQueueCount = events.filter((e) => {
      if (e.status === "CANCELLED") return false;
      return isSocialActivity(e);
    }).length;

    const totalBudget = events
      .filter((e) => e.status !== "CANCELLED")
      .reduce((acc, e) => acc + (e.budget || 0), 0);

    const totalExpectedReach = events
      .filter((e) => e.status !== "CANCELLED")
      .reduce((acc, e) => acc + (e.targetAttendee || e.attendeeCount || 0), 0);

    return [
      {
        label: "Active Campaigns & Posts",
        value: activeActivities,
        helper: "Upcoming & in-progress initiatives",
        icon: Megaphone,
        color: "teal" as const,
      },
      {
        label: "Social Content Queue",
        value: `${socialQueueCount} scheduled`,
        helper: "Digital content pipelines",
        icon: Sparkles,
        color: "rose" as const,
      },
      {
        label: "Committed Budget",
        value: formatIDR(totalBudget),
        helper: "Allocated event budgets",
        icon: Coins,
        color: "amber" as const,
      },
      {
        label: "Target Audience Reach",
        value: `${totalExpectedReach.toLocaleString()} reach`,
        helper: "Targeted on-ground attendance",
        icon: Users,
        color: "violet" as const,
      },
    ];
  }, [events]);

  const socialCount = useMemo(() => events.filter((e) => isSocialActivity(e)).length, [events]);
  const onGroundCount = useMemo(() => events.filter((e) => !isSocialActivity(e)).length, [events]);

  // Columns for Table View
  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                aria-label="Select all activities"
                checked={table.getIsAllRowsSelected()}
                ref={(el) => {
                  if (el) el.indeterminate = table.getIsSomeRowsSelected();
                }}
                onChange={table.getToggleAllRowsSelectedHandler()}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                aria-label={`Select ${row.original.name}`}
                checked={row.getIsSelected()}
                disabled={!row.getCanSelect()}
                onChange={row.getToggleSelectedHandler()}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
              />
            </div>
          ),
          size: 36,
          minSize: 36,
          maxSize: 36,
          enableSorting: false,
        }),
        columnHelper.display({
          id: "name",
          header: "Campaign / Activity",
          size: 240,
          minSize: 160,
          cell: ({ row }) => {
            const isSocial = isSocialActivity(row.original);
            const conf = row.original.postPlatform
              ? PLATFORM_CONFIG[row.original.postPlatform]
              : null;
            return (
              <div className="flex items-center gap-2 truncate">
                <span className="text-base shrink-0 select-none">
                  {isSocial ? conf?.icon || "📱" : "🎪"}
                </span>
                <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                  {row.original.name}
                </span>
              </div>
            );
          },
        }),
        columnHelper.display({
          id: "channelType",
          header: "Channel & Type",
          size: 170,
          minSize: 130,
          cell: ({ row }) => {
            const isSocial = isSocialActivity(row.original);
            if (isSocial) {
              const platformKey = row.original.postPlatform || "instagram";
              const conf = PLATFORM_CONFIG[platformKey] || PLATFORM_CONFIG.instagram;
              return (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                    conf.bg,
                    conf.text,
                    conf.border
                  )}
                >
                  <span>{conf.icon}</span>
                  <span className="capitalize">{conf.label}</span>
                  {row.original.postFormat && (
                    <span className="opacity-70 text-[10px]">· {row.original.postFormat}</span>
                  )}
                </span>
              );
            }
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <span>🎪</span>
                <span>{row.original.eventType || "Event"}</span>
              </span>
            );
          },
        }),
        columnHelper.display({
          id: "schedule",
          header: "Date / Schedule",
          size: 160,
          minSize: 120,
          cell: ({ row }) => {
            const d = row.original.date ? formatDate(row.original.date) : "—";
            const endD = row.original.endDate ? formatDate(row.original.endDate) : null;
            return (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {d}
                  {endD && endD !== d ? ` → ${endD}` : ""}
                </span>
              </div>
            );
          },
        }),
        columnHelper.display({
          id: "locationBranch",
          header: "Location / Branch",
          size: 170,
          minSize: 120,
          cell: ({ row }) => {
            const loc = row.original.location;
            const branch = row.original.branchName;
            if (!loc && !branch) return <span className="text-slate-400 text-xs">—</span>;
            return (
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 truncate">
                {loc ? (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{loc}</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{branch}</span>
                  </>
                )}
              </div>
            );
          },
        }),
        columnHelper.accessor("status", {
          id: "status",
          header: "Status",
          size: 120,
          minSize: 100,
          cell: ({ row }) => {
            const st = STATUS_STYLES[row.original.status] || STATUS_STYLES.UPCOMING;
            return (
              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold", st.badge)}>
                {st.label}
              </span>
            );
          },
        }),
        columnHelper.display({
          id: "budgetOrMetric",
          header: "Budget / Scope",
          size: 140,
          minSize: 110,
          cell: ({ row }) => {
            const isSocial = isSocialActivity(row.original);
            if (isSocial) {
              return (
                <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {row.original.postFormat || "Post"}
                </span>
              );
            }
            return (
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {row.original.budget ? formatIDR(row.original.budget) : "Rp 0"}
              </span>
            );
          },
        }),
        columnHelper.display({
          id: "footage",
          header: "Footage",
          size: 80,
          minSize: 70,
          enableSorting: false,
          cell: ({ row }) => (
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              {row.original.footage?.length ?? 0}
            </span>
          ),
        }),
        columnHelper.display({
          id: "expander",
          header: () => null,
          size: 40,
          minSize: 40,
          maxSize: 40,
          enableSorting: false,
          cell: () => (
            <div className="flex justify-end">
              <span className="w-4 h-4 text-slate-400 flex items-center justify-center">›</span>
            </div>
          ),
        }),
      ]),
    []
  );

  const editingEvent = editId ? events.find((e) => e.id === editId) : null;

  const renderActivityForm = (isDrawer = false) => (
    <form onSubmit={handleSaveActivity} className="space-y-3.5">
              {/* Common Activity Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {modalChannel === "social" ? "Post Title / Concept *" : "Event Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    modalChannel === "social"
                      ? "e.g. Behind-the-Scenes: Field Officer Solo Roadshow"
                      : "e.g. Grand Opening & Community Expo"
                  }
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* SOCIAL MEDIA FIELDS */}
              {modalChannel === "social" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-500" /> Status
                      </label>
                      <select
                        value={activityStatus}
                        onChange={(e) => setActivityStatus(e.target.value as EventStatus)}
                        className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                      >
                        <option value="UPCOMING">UPCOMING</option>
                        <option value="ON_PROGRESS">ON_PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" /> Priority
                      </label>
                      <select
                        value={postPriority}
                        onChange={(e) => setPostPriority(e.target.value as Priority)}
                        className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                        <option value="none">None</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1 cursor-pointer">
                        <Calendar className="w-3 h-3 text-blue-500" /> Publish Date
                      </label>
                      <input
                        type="date"
                        value={postDate}
                        onClick={(e) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch {}
                        }}
                        onFocus={(e) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch {}
                        }}
                        onChange={(e) => setPostDate(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Platform
                      </label>
                      <select
                        value={postPlatform}
                        onChange={(e) => setPostPlatform(e.target.value as PostPlatform)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                      >
                        {Object.keys(PLATFORM_CONFIG).map((p) => (
                          <option key={p} value={p}>
                            {PLATFORM_CONFIG[p as PostPlatform].icon} {PLATFORM_CONFIG[p as PostPlatform].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Format
                      </label>
                      <select
                        value={postFormat}
                        onChange={(e) => setPostFormat(e.target.value as PostFormat)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                      >
                        <option value="reel">Reel / Video</option>
                        <option value="carousel">Carousel</option>
                        <option value="image">Single Image</option>
                        <option value="story">Story</option>
                        <option value="article">Article / Press</option>
                        <option value="thread">Thread</option>
                      </select>
                    </div>
                  </div>

                  {/* Branch selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Featured Branch (optional)
                    </label>
                    <select
                      value={activityBranchName}
                      onChange={(e) => setActivityBranchName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                    >
                      <option value="">National / General (No branch)</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Media URL */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Media / Thumbnail URL (optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={postMediaUrl}
                      onChange={(e) => setPostMediaUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  {/* Assignees */}
                  {members.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Assign To
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {members.map((user) => {
                          const isSelected = postAssigneeIds.includes(user.id);
                          return (
                            <button
                              type="button"
                              key={user.id}
                              onClick={() => {
                                setPostAssigneeIds((prev) =>
                                  isSelected ? prev.filter((id) => id !== user.id) : [...prev, user.id]
                                );
                              }}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                                isSelected
                                  ? "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30"
                                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                              )}
                            >
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  isSelected ? "bg-pink-500" : "bg-slate-400"
                                )}
                              />
                              {user.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Draft Copy */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Draft Copy / Hashtags / Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Enter draft caption, hashtags, and production notes..."
                      value={activityNotes}
                      onChange={(e) => setActivityNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 resize-none"
                    />
                  </div>

                  {/* Production Subtasks Checklist (only when creating) */}
                  {!editId && (
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-pink-500" />
                          Production Subtasks ({postSubtasks.length})
                        </label>
                        {postSubtasks.length === 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPostSubtasks(
                                DEFAULT_POST_SUBTASKS.map((title, i) => ({
                                  id: `sub-init-${Date.now()}-${i}`,
                                  title,
                                }))
                              )
                            }
                            className="text-[11px] text-pink-600 hover:text-pink-700 font-semibold cursor-pointer"
                          >
                            + Restore defaults
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Editable checklist</span>
                        )}
                      </div>

                      {postSubtasks.length > 0 && (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                          {postSubtasks.map((sub, idx) => (
                            <div
                              key={sub.id}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 group focus-within:ring-1 focus-within:ring-pink-500"
                            >
                              <span className="text-[10px] font-medium text-slate-400 w-4 text-center shrink-0">
                                {idx + 1}.
                              </span>
                              <input
                                type="text"
                                value={sub.title}
                                onChange={(e) => handleUpdateSubtask(sub.id, e.target.value)}
                                placeholder="Subtask title..."
                                className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none placeholder:text-slate-400"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveSubtask(sub.id)}
                                className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSubtask();
                            }
                          }}
                          placeholder="+ Add custom subtask..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-pink-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddSubtask}
                          disabled={!newSubtaskTitle.trim()}
                          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* ON-GROUND ACTIVATION FIELDS */
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Event Type *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Launch, Workshop, Exhibition..."
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Branch
                      </label>
                      <select
                        value={activityBranchName}
                        onChange={(e) => setActivityBranchName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="">No branch</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 cursor-pointer">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={eventStartDate}
                        onClick={(e) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch {}
                        }}
                        onFocus={(e) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch {}
                        }}
                        onChange={(e) => setEventStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 cursor-pointer">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={eventEndDate}
                        onClick={(e) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch {}
                        }}
                        onFocus={(e) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch {}
                        }}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Location / Venue
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Main Atrium, Solo Paragon"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        PIC / Contact Person
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins"
                        value={eventPicName}
                        onChange={(e) => setEventPicName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Status
                      </label>
                      <select
                        value={activityStatus}
                        onChange={(e) => setActivityStatus(e.target.value as EventStatus)}
                        className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="UPCOMING">UPCOMING</option>
                        <option value="ON_PROGRESS">ON_PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Target Attendees
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={eventTargetAttendee}
                        onChange={(e) => setEventTargetAttendee(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Actual Attendees
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={eventAttendeeCount}
                        onChange={(e) => setEventAttendeeCount(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Budget (IDR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={eventBudget}
                      onChange={(e) => setEventBudget(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Event Logistics & Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Special instructions, vendor info, permit notes..."
                      value={activityNotes}
                      onChange={(e) => setActivityNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>
                </>
              )}

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {isDrawer && editId ? (
                  <button
                    type="button"
                    onClick={handleDeleteActivity}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer px-2 py-1 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3.5 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={cn(
                      "px-4 py-1.5 text-xs rounded-xl font-bold text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5",
                      modalChannel === "social"
                        ? "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                        : "bg-teal-600 hover:bg-teal-700"
                    )}
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>
                      {editId
                        ? "Save Changes"
                        : modalChannel === "social"
                        ? "Schedule Social Post"
                        : "Create Activation"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAFBFC] dark:bg-[#121316]">
      {/* View Switcher & Channel Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-[#18191B]/60 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Megaphone className="w-4 h-4" />
            </span>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Campaigns & Content
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {events.length} total
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Unified schedule for social campaigns, footage, and physical activations
              </p>
            </div>
          </div>

          {/* Channel Filter Chips */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs ml-2">
            <button
              type="button"
              onClick={() => setChannelFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
                channelFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              )}
            >
              All ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter("social")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1",
                channelFilter === "social"
                  ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              )}
            >
              <Sparkles className="w-3 h-3 text-pink-500" />
              <span>Social Media</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300">
                {socialCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter("on_ground")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1",
                channelFilter === "on_ground"
                  ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              )}
            >
              <Flag className="w-3 h-3 text-teal-600" />
              <span>On-Ground</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                {onGroundCount}
              </span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher + Action CTA */}
        <div className="flex items-center gap-2">
          {/* Platform filter if viewing social or all */}
          {channelFilter !== "on_ground" && (
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as PostPlatform | "all")}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-pink-500"
            >
              <option value="all">All Platforms</option>
              {Object.keys(PLATFORM_CONFIG).map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_CONFIG[p as PostPlatform].icon} {PLATFORM_CONFIG[p as PostPlatform].label}
                </option>
              ))}
            </select>
          )}

          {/* Cards / Table toggle */}
          <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              title="Cards view"
              className={cn(
                "p-1.5 rounded-md transition-all cursor-pointer",
                viewMode === "cards"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Table spreadsheet view"
              className={cn(
                "p-1.5 rounded-md transition-all cursor-pointer",
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              )}
            >
              <TableProperties className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative hidden sm:flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search activities..."
              value={marcomFilters["events"] || ""}
              onChange={(e) => setMarcomFilter("events", e.target.value)}
              className="w-44 lg:w-56 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Unified Create Button */}
          {canManage && (
            <button
              type="button"
              onClick={() =>
                openCreateModal(channelFilter === "on_ground" ? "on_ground" : "social")
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Activity</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "cards" ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* KPI Summary above cards */}
          <div className="p-4 px-6 pb-0">
            <KpiSummaryCards items={kpiItems} />
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8">
                <span className="p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-500 mb-3">
                  <Megaphone className="w-6 h-6" />
                </span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No marketing activities found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
                  Schedule social reels, TikTok cutdowns, roadshows, or launch activations.
                </p>
                {canManage && (
                  <button
                    type="button"
                    onClick={() =>
                      openCreateModal(channelFilter === "on_ground" ? "on_ground" : "social")
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 transition-colors shadow-xs cursor-pointer"
                  >
                    + Create First Activity
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredEvents.map((item) => {
                  const isSocial = isSocialActivity(item);

                  if (isSocial) {
                    const platformKey = (item.postPlatform as PostPlatform) || "instagram";
                    const conf = PLATFORM_CONFIG[platformKey] || PLATFORM_CONFIG.instagram;
                    const FormatIcon = item.postFormat
                      ? FORMAT_ICONS[item.postFormat as PostFormat] || Video
                      : Video;
                    const footageCount = item.footage?.length ?? 0;
                    const hasLinkedTask = tasks.some((t) => t.relatedMarcomId === item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => openEditModal(item)}
                        className="group flex flex-col rounded-xl bg-white dark:bg-[#18191B] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-pink-500/40 dark:hover:border-pink-500/40 transition-all cursor-pointer overflow-hidden"
                      >
                        {item.mediaUrl || footageCount > 0 ? (
                          <div className="relative w-full h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            {(item.mediaUrl || item.footage?.[0]?.filePath || "").endsWith(".mp4") ? (
                              <>
                                <video
                                  src={item.mediaUrl || item.footage?.[0]?.filePath}
                                  preload="metadata"
                                  className="w-full h-full object-cover pointer-events-none"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                  <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-xs shadow-xs">
                                    <Play className="w-4 h-4 fill-white" />
                                  </span>
                                </div>
                              </>
                            ) : (
                              <img
                                src={item.mediaUrl || item.footage?.[0]?.filePath}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white">
                              <span>{conf.icon}</span>
                              <span>{conf.label}</span>
                            </div>
                            <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/60 backdrop-blur-md text-white">
                              <FormatIcon className="w-3 h-3" />
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 pb-0 flex items-center justify-between">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                conf.bg,
                                conf.text,
                                conf.border
                              )}
                            >
                              <span>{conf.icon}</span>
                              <span>{conf.label}</span>
                            </span>
                            <div className="flex items-center gap-1 text-slate-400">
                              <FormatIcon className="w-3.5 h-3.5" />
                              <span className="text-[10px] capitalize font-medium">
                                {item.postFormat || "post"}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                              {item.name}
                            </h3>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                              {item.notes || "No copy draft yet."}
                            </div>
                            {item.branchName && (
                              <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                <Building2 className="w-3 h-3" />
                                <span>{item.branchName}</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1 text-slate-500 font-medium">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatDate(item.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {footageCount > 0 && (
                                <span className="text-[10px] text-teal-600 dark:text-teal-400">
                                  {footageCount} clips
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTrackAsTask(item);
                                }}
                                className={cn(
                                  "p-1 rounded-md transition-colors cursor-pointer",
                                  hasLinkedTask
                                    ? "text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                    : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                                title={hasLinkedTask ? "Open linked task" : "Track as execution task"}
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // On-Ground Activation Card
                  const footageCount = item.footage?.length ?? 0;
                  const st = STATUS_STYLES[item.status] || STATUS_STYLES.UPCOMING;
                  const hasLinkedTask = tasks.some((t) => t.relatedMarcomId === item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => openEditModal(item)}
                      className="group flex flex-col rounded-xl bg-white dark:bg-[#18191B] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-teal-500/40 dark:hover:border-teal-500/40 transition-all cursor-pointer overflow-hidden"
                    >
                      {/* On-ground banner */}
                      <div className="p-3.5 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent dark:from-teal-950/30 dark:via-emerald-950/20 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-600 text-white shadow-2xs">
                          <span>🎪</span>
                          <span>{item.eventType || "Event"}</span>
                        </span>
                        <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold", st.badge)}>
                          {st.label}
                        </span>
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {item.name}
                          </h3>

                          {/* Location & Branch */}
                          <div className="mt-2 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                            {item.location && (
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{item.location}</span>
                              </div>
                            )}
                            {item.branchName && (
                              <div className="flex items-center gap-1.5 truncate">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{item.branchName}</span>
                              </div>
                            )}
                          </div>

                          {/* Budget and Attendance pills */}
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              <Coins className="w-3 h-3" />
                              <span>{formatIDR(item.budget || 0)}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20">
                              <Users className="w-3 h-3" />
                              <span>
                                {item.attendeeCount}/{item.targetAttendee}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1 text-slate-500 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(item.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {footageCount > 0 && (
                              <span className="text-[10px] text-teal-600 dark:text-teal-400">
                                {footageCount} clips
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrackAsTask(item);
                              }}
                              className={cn(
                                "p-1 rounded-md transition-colors cursor-pointer",
                                hasLinkedTask
                                  ? "text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                  : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}
                              title={hasLinkedTask ? "Open linked task" : "Track as execution task"}
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Table View */
        <MarcomTableShell
          data={filteredEvents}
          columns={columns}
          getRowId={(row) => row.id}
          initialSorting={[{ id: "name", desc: false }]}
          title="Campaigns & Content"
          titleIcon={Megaphone}
          entityName="activity"
          entityPlural="activities"
          isLoading={isLoading}
          error={error}
          onRefresh={fetchEvents}
          canDelete={canManage}
          deleteRequiresMessage="Delete requires admin or staff role"
          onDeleteOne={deleteOne}
          canAdd={canManage}
          onAdd={() =>
            openCreateModal(channelFilter === "on_ground" ? "on_ground" : "social")
          }
          addLabel="New Activity"
          addIcon={Plus}
          addClassName="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 transition-all shadow-xs cursor-pointer"
          kpiBar={<KpiSummaryCards items={kpiItems} />}
          searchTerm={marcomFilters["events"] || ""}
          onSearchChange={(val) => setMarcomFilter("events", val)}
          renderExpanded={(activity) => {
            const isSocial = isSocialActivity(activity);
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                      Schedule
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      {activity.date ? new Date(activity.date).toLocaleDateString() : "—"}
                      {activity.endDate ? ` → ${new Date(activity.endDate).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                      {isSocial ? "Assignee / PIC" : "PIC"}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      {activity.picName || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                      {isSocial ? "Platform & Format" : "Attendees"}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      {isSocial
                        ? `${activity.postPlatform || "Social"} · ${activity.postFormat || "Post"}`
                        : `${activity.attendeeCount} / ${activity.targetAttendee}`}
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                      {isSocial ? "Caption Draft / Notes" : "Notes"}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      {activity.notes || "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Track production tasks, permits, setup, or footage:
                  </span>
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(activity);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>Edit Activity</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackAsTask(activity);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Track as Task Progress</span>
                    </button>
                  </div>
                </div>

                {activity.footage && activity.footage.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                      Footage Clips ({activity.footage.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activity.footage.map((clip) => (
                        <div
                          key={clip.id}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                        >
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 truncate">
                            {clip.title}
                          </div>
                          {isVideo(clip.filePath) ? (
                            <video
                              controls
                              preload="metadata"
                              src={clip.filePath}
                              className="w-full rounded-md bg-black"
                            />
                          ) : (
                            <a
                              href={clip.filePath}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                            >
                              {clip.filePath}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          }}
          emptyLabel="No activities found."
        />
      )}

      {/* 1. Center Modal for Creating New Activity */}
      {isModalOpen && !editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-pink-500" />
                <span>Create New Activity</span>
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Top Channel Switcher: Social Media vs On-Ground Activation */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setModalChannel("social")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  modalChannel === "social"
                    ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Social Media Post</span>
              </button>
              <button
                type="button"
                onClick={() => setModalChannel("on_ground")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  modalChannel === "on_ground"
                    ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>On-Ground Activation</span>
              </button>
            </div>

            {renderActivityForm(false)}
          </div>
        </div>
      )}

      {/* 2. Slide-Over Right Drawer for Viewing / Editing Activity */}
      <AnimatePresence>
        {Boolean(editId) && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="relative z-10 w-full max-w-xl sm:max-w-2xl h-full bg-white dark:bg-[#18191B] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">
                    {modalChannel === "social"
                      ? postPlatform === "instagram" ? "📸"
                      : postPlatform === "tiktok" ? "🎵"
                      : postPlatform === "youtube" ? "▶️"
                      : "📱"
                      : "🎪"}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {activityName || "Activity Details"}
                    </h2>
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                      <span className="uppercase tracking-wider">
                        {modalChannel === "social" ? `${postPlatform} ${postFormat}` : `${eventType} Event`}
                      </span>
                      {activityBranchName && (
                        <>
                          <span>•</span>
                          <span>{activityBranchName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {editingEvent && (
                    <button
                      type="button"
                      onClick={() => handleTrackAsTask(editingEvent)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Link or open in operational tasks"
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      <span className="hidden sm:inline">
                        {tasks.some((t) => t.relatedMarcomId === editingEvent.id) ? "View Task" : "Link Task"}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {renderActivityForm(true)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
