"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { PostPlatform, PostFormat, Priority } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { formatIDR } from "@/lib/utils";
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
  // Unified Content Planner fields — same table, same API
  postPlatform?: PostPlatform | null;
  postFormat?: PostFormat | null;
  mediaUrl?: string | null;
  footage: EventFootage[];
}

const columnHelper = createMarcomColumnHelper<MarcomEvent>();

const STATUS_STYLES: Record<EventStatus, string> = {
  UPCOMING: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ON_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

function isVideo(path: string) {
  return path.toLowerCase().endsWith(".mp4");
}

interface BranchOption {
  id: string;
  name: string;
}

// — Content Planner config moved from ContentPlannerView —
const PLATFORM_CONFIG: Record<PostPlatform, { label: string; bg: string; text: string; border: string; icon: string }> = {
  instagram: { label: "Instagram", bg: "bg-pink-500/10 dark:bg-pink-500/20", text: "text-pink-600 dark:text-pink-400", border: "border-pink-500/30", icon: "📸" },
  tiktok: { label: "TikTok", bg: "bg-cyan-500/10 dark:bg-cyan-500/20", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500/30", icon: "🎵" },
  youtube: { label: "YouTube", bg: "bg-red-500/10 dark:bg-red-500/20", text: "text-red-600 dark:text-red-400", border: "border-red-500/30", icon: "▶️" },
  linkedin: { label: "LinkedIn", bg: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/30", icon: "💼" },
  facebook: { label: "Facebook", bg: "bg-indigo-500/10 dark:bg-indigo-500/20", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/30", icon: "👥" },
  twitter: { label: "Twitter / X", bg: "bg-slate-500/10 dark:bg-slate-500/20", text: "text-slate-700 dark:text-slate-300", border: "border-slate-500/30", icon: "𝕏" },
  blog: { label: "Blog", bg: "bg-amber-500/10 dark:bg-amber-500/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30", icon: "✍️" },
  press: { label: "Press Release", bg: "bg-emerald-500/10 dark:bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30", icon: "📰" },
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

export function EventsView({ initialTab = "events" }: { initialTab?: "events" | "content" } = {}) {
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
  } = useWorkspaceStore();

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const members = currentWorkspace?.members || [];
  const currentSpace = currentWorkspace?.spaces.find((s) => s.id === activeSpaceId);
  const statuses = currentSpace?.statuses || [];

  const [events, setEvents] = useState<MarcomEvent[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalEvent, setModalEvent] = useState<Partial<MarcomEvent> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Content Planner state moved here
  const [activeTab, setActiveTab] = useState<"events" | "content">(initialTab);
  const [selectedPlatform, setSelectedPlatform] = useState<PostPlatform | "all">("all");
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postPlatform, setPostPlatform] = useState<PostPlatform>("instagram");
  const [postFormat, setPostFormat] = useState<PostFormat>("reel");
  const [postScheduledDate, setPostScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [postMediaUrl, setPostMediaUrl] = useState("");
  const [postAssigneeIds, setPostAssigneeIds] = useState<string[]>([]);
  const [postPriority, setPostPriority] = useState<Priority>("normal");
  const [postStatusId, setPostStatusId] = useState<string>("");
  const [postTagIds, setPostTagIds] = useState<string[]>([]);
  const [postSubtasks, setPostSubtasks] = useState<{ id: string; title: string }[]>(() =>
    DEFAULT_POST_SUBTASKS.map((title, i) => ({ id: `sub-init-${i}`, title }))
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

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

  const canManage = can("CREATE_EVENT");

  const handleTrackAsTask = (event: MarcomEvent) => {
    const existing = tasks.find((t) => t.relatedMarcomId === event.id);
    if (existing) {
      setSelectedTaskId(existing.id);
      toast.info("Opened existing event execution task");
      return;
    }
    const firstFootage = event.footage?.[0]?.filePath;
    const statusId = event.status === "COMPLETED" ? "status-done" : "status-in-progress";
    const task = createTask({
      listId: "list-field-ops",
      title: `[Event] ${event.name} (${event.branchName})`,
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
        { id: `st-ev-${Date.now()}-1`, title: `Venue booking & local permits (${event.location || "Venue"})`, completed: false, createdAt: new Date().toISOString() },
        { id: `st-ev-${Date.now()}-2`, title: "Stage, sound, & branding production setup", completed: false, createdAt: new Date().toISOString() },
        { id: `st-ev-${Date.now()}-3`, title: "Capture 4K video footage & b-roll clips", completed: Boolean(event.footage?.length), createdAt: new Date().toISOString() },
        { id: `st-ev-${Date.now()}-4`, title: "Compile attendee counts & post event summary", completed: false, createdAt: new Date().toISOString() },
      ],
      orderIndex: Math.max(-1, ...tasks.filter((t) => t.statusId === statusId).map((t) => t.orderIndex)) + 1,
    });
    toast.success("Event execution task created in Field Operations!");
    setSelectedTaskId(task.id);
  };

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resEvents, resBranches] = await Promise.all([fetch("/api/marcom/events"), fetch("/api/marcom/branches")]);
      if (!resEvents.ok) throw new Error(`Request failed (${resEvents.status})`);
      const jsonEvents = await resEvents.json();
      setEvents(Array.isArray(jsonEvents.data) ? jsonEvents.data : []);
      if (resBranches.ok) {
        const jsonBranches = await resBranches.json();
        setBranches(Array.isArray(jsonBranches.data) ? jsonBranches.data : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEvent) return;
    const { id, name, eventType, branchName, date, endDate, location, picName, budget, attendeeCount, targetAttendee, status, notes } = modalEvent;
    if (!name?.trim() || !eventType?.trim()) {
      toast.error("Event Name and Type are required");
      return;
    }
    setIsSaving(true);
    try {
      const isEditing = Boolean(id);
      const url = isEditing ? `/api/marcom/events/${id}` : "/api/marcom/events";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name!.trim(),
          eventType: eventType!.trim(),
          branchName: branchName?.trim() || undefined,
          date: date?.trim() || undefined,
          endDate: endDate?.trim() || undefined,
          location: location?.trim() || undefined,
          picName: picName?.trim() || undefined,
          budget: Number(budget) || 0,
          attendeeCount: Number(attendeeCount) || 0,
          targetAttendee: Number(targetAttendee) || 0,
          status: status || "UPCOMING",
          notes: notes?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed with status ${res.status}`);
      }
      toast.success(isEditing ? "Event updated successfully" : "Event created successfully");
      setModalEvent(null);
      await fetchEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setIsSaving(false);
    }
  };

  // Content Planner — now same table/architecture as Events (MarcomEvent)
  const contentPosts = useMemo(() => {
    return events.filter((e) => {
      if (!e.postPlatform) return false;
      if (selectedPlatform !== "all" && e.postPlatform !== selectedPlatform) return false;
      return true;
    });
  }, [events, selectedPlatform]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) {
      toast.error("Please enter a post title");
      return;
    }
    setIsSaving(true);
    try {
      // 1) Create the canonical MarcomEvent (so it appears in Events table)
      const res = await fetch("/api/marcom/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: postTitle.trim(),
          eventType: "Content",
          date: postScheduledDate,
          notes: postDescription.trim(),
          postPlatform,
          postFormat,
          mediaUrl: postMediaUrl.trim() || undefined,
          status: "UPCOMING",
          branchName: branches[0]?.name || "",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to create post (${res.status})`);
      }
      const createdEvent: MarcomEvent = await res.json();
      // 2) Also create the linked Task so it appears in Board/List (single source, two projections)
      const targetListId = activeListId || "list-content-planner";
      const targetStatus = postStatusId || statuses[0]?.id || "status-todo";
      const assignedUsers = members.filter((u) => postAssigneeIds.includes(u.id));
      const selectedTags = (tags || []).filter((t) => postTagIds.includes(t.id));

      const task = createTask({
        listId: targetListId,
        title: postTitle.trim(),
        description: postDescription.trim() ? `<p>${postDescription.trim()}</p>` : "<p>Draft post copy...</p>",
        statusId: targetStatus,
        priority: postPriority,
        assignees: assignedUsers.length > 0 ? assignedUsers : (members[0] ? [members[0]] : []),
        dueDate: postScheduledDate,
        postPlatform,
        postFormat,
        mediaUrl: postMediaUrl.trim() || undefined,
        relatedMarcomId: createdEvent.id,
        tags: selectedTags,
        subtasks: postSubtasks
          .filter((s) => s.title.trim().length > 0)
          .map((s, idx) => ({
            id: `sub-${Date.now()}-${idx}`,
            title: s.title.trim(),
            completed: false,
            createdAt: new Date().toISOString(),
          })),
        orderIndex: Math.max(-1, ...tasks.filter((t) => t.postPlatform != null).map((t) => t.orderIndex)) + 1,
      });
      toast.success("Content post added to schedule!");
      setPostTitle("");
      setPostDescription("");
      setPostMediaUrl("");
      setPostAssigneeIds(members[0] ? [members[0].id] : []);
      setPostPriority("normal");
      setPostStatusId(statuses[0]?.id || "status-todo");
      setPostTagIds([]);
      setPostSubtasks(DEFAULT_POST_SUBTASKS.map((title, i) => ({ id: `sub-init-${i}`, title })));
      setNewSubtaskTitle("");
      setCreatePostModalOpen(false);
      await fetchEvents();
      setSelectedTaskId(task.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <input type="checkbox" aria-label="Select all events" checked={table.getIsAllRowsSelected()} ref={(el) => { if (el) el.indeterminate = table.getIsSomeRowsSelected(); }} onChange={table.getToggleAllRowsSelectedHandler()} className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600" />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" aria-label={`Select event ${row.original.name}`} checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600" />
            </div>
          ),
          size: 36, minSize: 36, maxSize: 36, enableSorting: false,
        }),
        columnHelper.display({
          id: "name",
          header: "Event",
          size: 220, minSize: 140,
          cell: ({ row }) => <span className="truncate font-semibold text-slate-900 dark:text-slate-100">{row.original.name}</span>,
        }),
        columnHelper.accessor("eventType", { id: "type", header: "Type", size: 160, minSize: 120 }),
        columnHelper.accessor("location", { id: "location", header: "Location", size: 180, minSize: 120 }),
        columnHelper.accessor("status", {
          id: "status",
          header: "Status",
          size: 130, minSize: 110,
          cell: ({ row }) => <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${STATUS_STYLES[row.original.status] ?? STATUS_STYLES.UPCOMING}`}>{row.original.status.replaceAll("_", " ")}</span>,
        }),
        columnHelper.display({
          id: "footage",
          header: "Footage",
          size: 90, minSize: 70, enableSorting: false,
          cell: ({ row }) => <span className="text-slate-500 dark:text-slate-400">{row.original.footage?.length ?? 0}</span>,
        }),
        columnHelper.display({
          id: "expander",
          header: () => null,
          size: 40, minSize: 40, maxSize: 40, enableSorting: false,
          cell: () => <div className="flex justify-end"><span className="w-4 h-4 text-slate-400 flex items-center justify-center">›</span></div>,
        }),
      ]),
    [],
  );

  const deleteOne = useCallback(async (id: string) => {
    const res = await fetch(`/api/marcom/events/${id}`, { method: "DELETE" });
    return res.ok;
  }, []);

  const kpiItems = useMemo(() => {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingCount = events.filter((e) => {
      if (e.status === "CANCELLED") return false;
      if (!e.date) return e.status === "UPCOMING";
      const d = new Date(e.date);
      return d >= now && d <= in30Days;
    }).length;

    const totalBudget = events
      .filter((e) => e.status !== "CANCELLED")
      .reduce((acc, e) => acc + (e.budget || 0), 0);

    const expectedReach = events
      .filter((e) => e.status !== "CANCELLED")
      .reduce((acc, e) => acc + (e.targetAttendee || e.attendeeCount || 0), 0);

    return [
      {
        label: "Upcoming (Next 30 Days)",
        value: upcomingCount,
        helper: "Scheduled campaign events",
        icon: Calendar,
        color: "teal" as const,
      },
      {
        label: "Total Budget Committed",
        value: formatIDR(totalBudget),
        helper: "Active event allocations",
        icon: Coins,
        color: "amber" as const,
      },
      {
        label: "Expected Reach",
        value: `${expectedReach.toLocaleString()} attendees`,
        helper: "Targeted audience total",
        icon: Users,
        color: "violet" as const,
      },
    ];
  }, [events]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAFBFC] dark:bg-[#121316]">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 mx-6 mt-3 bg-slate-100 dark:bg-slate-800/80 rounded-lg w-fit text-xs">
        <button type="button" onClick={() => setActiveTab("events")} className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${activeTab === "events" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>Events</button>
        <button type="button" onClick={() => setActiveTab("content")} className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${activeTab === "content" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>
          <Sparkles className="w-3.5 h-3.5 text-pink-500" /> Content Planner
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">{contentPosts.length}</span>
        </button>
      </div>

      {activeTab === "events" ? (
        <MarcomTableShell
          data={events}
          columns={columns}
          getRowId={(row) => row.id}
          initialSorting={[{ id: "name", desc: false }]}
          title="Events"
          titleIcon={Flag}
          entityName="event"
          entityPlural="events"
          isLoading={isLoading}
          error={error}
          onRefresh={fetchEvents}
          canDelete={canManage}
          deleteRequiresMessage="Delete requires admin or staff role"
          onDeleteOne={deleteOne}
          canAdd={canManage}
          onAdd={() => setModalEvent({ name: "", eventType: "Launch", branchName: branches[0]?.name || "", status: "UPCOMING", budget: 0, targetAttendee: 100, attendeeCount: 0 })}
          addLabel="Add Event"
          addIcon={Plus}
          addClassName="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
          kpiBar={<KpiSummaryCards items={kpiItems} />}
          renderExpanded={(event) => (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Date</div>
                  <div className="text-slate-700 dark:text-slate-300">{event.date ? new Date(event.date).toLocaleDateString() : "—"} {" → "} {event.endDate ? new Date(event.endDate).toLocaleDateString() : "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">PIC</div>
                  <div className="text-slate-700 dark:text-slate-300">{event.picName || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Attendees</div>
                  <div className="text-slate-700 dark:text-slate-300">{event.attendeeCount}/{event.targetAttendee}</div>
                </div>
                <div className="sm:col-span-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Notes</div>
                  <div className="text-slate-700 dark:text-slate-300">{event.notes || "—"}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Track event permits, logistics, setup, and social coverage:</span>
                <div className="flex items-center gap-2">
                  {canManage && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setModalEvent(event); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Edit Event</span>
                    </button>
                  )}
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleTrackAsTask(event); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Track as Task Progress</span>
                  </button>
                </div>
              </div>
              {event.footage && event.footage.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Footage ({event.footage.length})</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {event.footage.map((clip) => (
                      <div key={clip.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 truncate">{clip.title}</div>
                        {isVideo(clip.filePath) ? <video controls preload="metadata" src={clip.filePath} className="w-full rounded-md bg-black" /> : <a href={clip.filePath} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all">{clip.filePath}</a>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          emptyLabel="No events found."
        />
      ) : (
        <>
          {/* Content Planner — now inside Events */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-[#18191B]/60 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Content & Post Planner
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{contentPosts.length} posts</span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Schedule social campaigns, track footage-linked posts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs">
                <button type="button" onClick={() => setSelectedPlatform("all")} className={cn("px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer", selectedPlatform === "all" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300")}>All</button>
                {(Object.keys(PLATFORM_CONFIG) as PostPlatform[]).map((p) => {
                  const conf = PLATFORM_CONFIG[p];
                  return (
                    <button key={p} type="button" onClick={() => setSelectedPlatform(p)} className={cn("px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1", selectedPlatform === p ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300")}>
                      <span>{conf.icon}</span>
                      <span className="hidden sm:inline">{conf.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {contentPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8">
                <span className="p-3 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-500 mb-3">
                  <Sparkles className="w-6 h-6" />
                </span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No content posts scheduled</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">Plan Instagram reels, TikTok cutdowns, and press announcements — they’ll appear alongside your Events footage.</p>
                <button type="button" onClick={() => setCreatePostModalOpen(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 transition-colors shadow-xs cursor-pointer">Create First Post</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {contentPosts.map((post) => {
                  const platformKey = (post.postPlatform as PostPlatform) || "instagram";
                  const conf = PLATFORM_CONFIG[platformKey] || PLATFORM_CONFIG.instagram;
                  const FormatIcon = post.postFormat ? FORMAT_ICONS[post.postFormat as PostFormat] || Video : Video;
                  const footageCount = post.footage?.length ?? 0;
                  return (
                    <div key={post.id} onClick={() => setModalEvent(post)} className="group flex flex-col rounded-xl bg-white dark:bg-[#18191B] border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-pink-500/40 dark:hover:border-pink-500/40 transition-all cursor-pointer overflow-hidden">
                      {post.mediaUrl || footageCount > 0 ? (
                        <div className="relative w-full h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          {(post.mediaUrl || post.footage?.[0]?.filePath || "").endsWith(".mp4") ? (
                            <>
                              <video src={post.mediaUrl || post.footage?.[0]?.filePath} preload="metadata" className="w-full h-full object-cover pointer-events-none" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-xs shadow-xs">
                                  <Play className="w-4 h-4 fill-white" />
                                </span>
                              </div>
                            </>
                          ) : (
                            <img src={post.mediaUrl || post.footage?.[0]?.filePath} alt={post.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", conf.bg, conf.text, conf.border)}>
                            <span>{conf.icon}</span>
                            <span>{conf.label}</span>
                          </span>
                          <div className="flex items-center gap-1 text-slate-400">
                            <FormatIcon className="w-3.5 h-3.5" />
                            <span className="text-[10px] capitalize font-medium">{post.postFormat || "post"}</span>
                          </div>
                        </div>
                      )}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{post.name}</h3>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{post.notes || "No copy draft yet."}</div>
                          {post.branchName && <div className="mt-1 text-[10px] text-slate-400">{post.branchName}</div>}
                        </div>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1 text-slate-500 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(post.date)}</span>
                          </div>
                          {footageCount > 0 && <span className="text-[10px] text-teal-600 dark:text-teal-400">{footageCount} clips</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {modalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Flag className="w-4 h-4 text-teal-600" />
                <span>{modalEvent.id ? "Edit Event" : "Create New Event"}</span>
              </h3>
              <button type="button" onClick={() => setModalEvent(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">✕</button>
            </div>
            <form onSubmit={handleSaveEvent} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Event Name *</label>
                <input type="text" required placeholder="e.g., Grand Opening & Product Showcase" value={modalEvent.name || ""} onChange={(e) => setModalEvent({ ...modalEvent, name: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Event Type *</label>
                  <input type="text" required placeholder="Launch, Workshop, Exhibition..." value={modalEvent.eventType || "Launch"} onChange={(e) => setModalEvent({ ...modalEvent, eventType: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Branch</label>
                  <select value={modalEvent.branchName || branches[0]?.name || ""} onChange={(e) => setModalEvent({ ...modalEvent, branchName: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                    <option value="">No branch</option>
                    {branches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
                  <input type="date" value={modalEvent.date ? modalEvent.date.slice(0, 10) : ""} onChange={(e) => setModalEvent({ ...modalEvent, date: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Date</label>
                  <input type="date" value={modalEvent.endDate ? modalEvent.endDate.slice(0, 10) : ""} onChange={(e) => setModalEvent({ ...modalEvent, endDate: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location</label>
                  <input type="text" placeholder="e.g., Main Atrium or Branch Plaza" value={modalEvent.location || ""} onChange={(e) => setModalEvent({ ...modalEvent, location: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">PIC / Contact Person</label>
                  <input type="text" placeholder="e.g., Sarah Jenkins" value={modalEvent.picName || ""} onChange={(e) => setModalEvent({ ...modalEvent, picName: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <select value={modalEvent.status || "UPCOMING"} onChange={(e) => setModalEvent({ ...modalEvent, status: e.target.value as EventStatus })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="ON_PROGRESS">ON_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Attendees</label>
                  <input type="number" min="0" value={modalEvent.targetAttendee ?? 100} onChange={(e) => setModalEvent({ ...modalEvent, targetAttendee: e.target.value ? Number(e.target.value) : 0 })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Actual Attendees</label>
                  <input type="number" min="0" value={modalEvent.attendeeCount ?? 0} onChange={(e) => setModalEvent({ ...modalEvent, attendeeCount: e.target.value ? Number(e.target.value) : 0 })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Budget (IDR)</label>
                <input type="number" min="0" value={modalEvent.budget ?? 0} onChange={(e) => setModalEvent({ ...modalEvent, budget: e.target.value ? Number(e.target.value) : 0 })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes</label>
                <textarea rows={2} placeholder="Special instructions, vendor info, permit notes..." value={modalEvent.notes || ""} onChange={(e) => setModalEvent({ ...modalEvent, notes: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setModalEvent(null)} disabled={isSaving} className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalEvent.id ? "Save Changes" : "Create Event"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreatePostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                Schedule New Content Post
              </h2>
              <button
                type="button"
                onClick={() => setCreatePostModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Post Title / Concept *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Behind-the-Scenes: Field Officer Solo Roadshow"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Status, Priority, Publish Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-500" /> Status
                  </label>
                  <select
                    value={postStatusId || statuses[0]?.id || "status-todo"}
                    onChange={(e) => setPostStatusId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" /> Publish Date
                  </label>
                  <input
                    type="date"
                    value={postScheduledDate}
                    onChange={(e) => setPostScheduledDate(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Platform and Format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Platform</label>
                  <select
                    value={postPlatform}
                    onChange={(e) => setPostPlatform(e.target.value as PostPlatform)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">Twitter / X</option>
                    <option value="blog">Blog</option>
                    <option value="press">Press Release</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Format</label>
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

              {/* Assignees Selection */}
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
                            className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-pink-500" : "bg-slate-400")}
                          />
                          {user.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags Multi-select */}
              {tags && tags.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => {
                      const isSelected = postTagIds.includes(tag.id);
                      return (
                        <button
                          type="button"
                          key={tag.id}
                          onClick={() => {
                            setPostTagIds((prev) =>
                              isSelected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                            );
                          }}
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer",
                            isSelected
                              ? ""
                              : "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                          )}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: `${tag.color}15`,
                                  color: tag.color,
                                  borderColor: `${tag.color}60`,
                                }
                              : undefined
                          }
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Draft Copy */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Draft Copy / Hashtags
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter draft caption, hook, and campaign hashtags..."
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Production Checklist / Subtasks */}
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
                    <span className="text-[10px] text-slate-400">
                      Editable checklist
                    </span>
                  )}
                </div>

                {/* Subtask list */}
                {postSubtasks.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                    {postSubtasks.map((sub, idx) => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 group focus-within:ring-1 focus-within:ring-pink-500 focus-within:border-pink-500"
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
                          title="Remove subtask"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new subtask input */}
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

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreatePostModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Add to Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
