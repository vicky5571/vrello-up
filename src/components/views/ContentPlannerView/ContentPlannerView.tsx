"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  Plus,
  Edit2,
  CheckSquare,
  RefreshCw,
  Video,
  Image as ImageIcon,
  Layers,
  Calendar,
  Flame,
  Trash2,
  LayoutGrid,
  TableProperties,
  Search,
  Copy,
  ExternalLink,
  Share2,
  Kanban,
  X,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { PostPlatform, PostFormat, Priority, ContentPostItem, type Task } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import {
  getWorkspaceSpacesAndLists,
  findSpaceByListId,
  getDefaultDestinationForChannel,
} from "@/lib/tasks/targetSpaceList";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";
import { KpiSummaryCards } from "@/components/views/shared/KpiSummaryCards";
import { useGoogleDrivePicker } from "@/lib/marcom/useGoogleDrivePicker";
import { GoogleDriveLinkModal } from "@/components/ui/GoogleDriveLinkModal";
import { parseGoogleDriveUrl } from "@/lib/marcom/googleDriveUtils";
import { PlatformIcon } from "@/components/ui/BrandIcons";

export type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

const PLATFORM_CONFIG: Record<
  PostPlatform,
  { label: string; badgeClass: string }
> = {
  instagram: {
    label: "Instagram",
    badgeClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  },
  tiktok: {
    label: "TikTok",
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
  youtube: {
    label: "YouTube",
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  facebook: {
    label: "Facebook",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  linkedin: {
    label: "LinkedIn",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  twitter: {
    label: "X (Twitter)",
    badgeClass: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
  },
  blog: {
    label: "Blog / SEO",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  press: {
    label: "Press Release",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
};

const DEFAULT_POST_SUBTASKS = [
  "Hook & outline scripting",
  "A-roll filming & audio capture",
  "CapCut rough cut & b-roll assembly",
  "Brand color grade & sound design",
  "Publishing caption, alt-text, & hashtags",
];

const columnHelper = createMarcomColumnHelper<ContentPostItem>();

export function ContentPlannerView() {
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
    tags,
    isCreatePostModalOpen,
    setCreatePostModalOpen,
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

  const [posts, setPosts] = useState<ContentPostItem[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state: Cards vs Table
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedPlatform, setSelectedPlatform] = useState<PostPlatform | "all">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Google Drive Picker
  const {
    openSelector,
    isModalOpen: isDriveModalOpen,
    closeModal: closeDriveModal,
    handleManualAttach,
  } = useGoogleDrivePicker();

  // Form Fields
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<PostPlatform>("instagram");
  const [format, setFormat] = useState<PostFormat>("reel");
  const [publishDate, setPublishDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<PostStatus>("SCHEDULED");
  const [priority, setPriority] = useState<Priority>("normal");
  const [branchName, setBranchName] = useState("");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [postSubtasks, setPostSubtasks] = useState<
    { id: string; title: string }[]
  >(() =>
    DEFAULT_POST_SUBTASKS.map((t, i) => ({ id: `sub-init-${i}`, title: t }))
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Target Space & List selection
  const [targetSpaceId, setTargetSpaceId] = useState<string>("");
  const [targetListId, setTargetListId] = useState<string>("");

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
    const dest = getDefaultDestinationForChannel(rawSpaces, "social", newSpaceId);
    setTargetListId(dest.listId);
  };

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resPosts, resBranches] = await Promise.all([
        fetch(`/api/marcom/content?workspaceId=${encodeURIComponent(activeWorkspaceId)}`),
        fetch("/api/marcom/branches"),
      ]);

      if (resPosts.ok) {
        const json = await resPosts.json();
        setPosts(Array.isArray(json.data) ? json.data : []);
      }
      if (resBranches.ok) {
        const jsonBranches = await resBranches.json();
        setBranches(
          Array.isArray(jsonBranches.data)
            ? jsonBranches.data.map((b: { id: string; name: string }) => ({
                id: b.id,
                name: b.name,
              }))
            : []
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load content posts");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, activeWorkspaceId]);

  const openCreateModal = useCallback(() => {
    setEditId(null);
    setTitle("");
    setPlatform("instagram");
    setFormat("reel");
    setPublishDate(new Date().toISOString().slice(0, 10));
    setStatus("SCHEDULED");
    setPriority("normal");
    setBranchName(branches[0]?.name || "");
    setCaption("");
    setMediaUrl("");
    setAssigneeIds(members[0] ? [members[0].id] : []);
    setPostSubtasks(
      DEFAULT_POST_SUBTASKS.map((t, i) => ({ id: `sub-init-${i}`, title: t }))
    );
    setNewSubtaskTitle("");

    // Resolve Target Space & List
    const dest = getDefaultDestinationForChannel(rawSpaces, "social");
    setTargetSpaceId(dest.spaceId);
    setTargetListId(dest.listId);

    setIsModalOpen(true);
  }, [branches, members, rawSpaces]);

  useEffect(() => {
    if (isCreatePostModalOpen) {
      openCreateModal();
      setCreatePostModalOpen(false);
    }
  }, [isCreatePostModalOpen, openCreateModal, setCreatePostModalOpen]);

  const openEditModal = (item: ContentPostItem) => {
    setEditId(item.id);
    setTitle(item.title);
    setPlatform(item.platform as PostPlatform);
    setFormat(item.format as PostFormat);
    setPublishDate(
      item.publishDate
        ? item.publishDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    );
    setStatus((item.status as PostStatus) || "SCHEDULED");
    setPriority("normal");
    setBranchName(item.branchName || branches[0]?.name || "");
    setCaption(item.caption || "");
    setMediaUrl(item.mediaUrl || "");
    setAssigneeIds(members[0] ? [members[0].id] : []);
    setPostSubtasks(
      Array.isArray(item.subtasks) && item.subtasks.length > 0
        ? item.subtasks.map((s, i) => ({
            id: s.id || `sub-edit-${i}`,
            title: s.title,
          }))
        : DEFAULT_POST_SUBTASKS.map((t, i) => ({
            id: `sub-edit-${i}`,
            title: t,
          }))
    );

    const existingTask = tasks.find((t) => t.relatedMarcomId === item.id);
    if (existingTask) {
      const owningSpace = findSpaceByListId(rawSpaces, existingTask.listId);
      if (owningSpace) {
        setTargetSpaceId(owningSpace.id);
        setTargetListId(existingTask.listId);
      }
    } else {
      const dest = getDefaultDestinationForChannel(rawSpaces, "social");
      setTargetSpaceId(dest.spaceId);
      setTargetListId(dest.listId);
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a post title or concept");
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = Boolean(editId);
      const url = isEditing
        ? `/api/marcom/content/${editId}`
        : "/api/marcom/content";
      const method = isEditing ? "PATCH" : "POST";

      const payload = {
        title: title.trim(),
        platform,
        format,
        publishDate: publishDate || undefined,
        status,
        caption: caption.trim(),
        mediaUrl: mediaUrl.trim(),
        branchName: branchName.trim(),
        picName: assigneeIds.length
          ? members.find((m) => m.id === assigneeIds[0])?.name || undefined
          : undefined,
        subtasks: postSubtasks,
        workspaceId: activeWorkspaceId,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed with status ${res.status}`);
      }

      const savedItem: ContentPostItem = await res.json();

      // Create linked task if newly created, or sync existing task
      if (!isEditing) {
        const chosenListId =
          targetListId || activeListId || "list-content-planner";
        const targetSpace = rawSpaces.find((s) => s.id === targetSpaceId);
        const targetStatus =
          targetSpace?.statuses[0]?.id || statuses[0]?.id || "status-todo";
        const assignedUsers = members.filter((u) => assigneeIds.includes(u.id));

        createTask({
          listId: chosenListId,
          title: `[Content] ${title.trim()}`,
          description: caption.trim()
            ? `<p>${caption.trim()}</p>`
            : "<p>Draft post copy...</p>",
          statusId: targetStatus,
          priority,
          assignees:
            assignedUsers.length > 0
              ? assignedUsers
              : members[0]
              ? [members[0]]
              : [],
          dueDate: publishDate || undefined,
          postPlatform: platform,
          postFormat: format,
          mediaUrl: mediaUrl.trim() || undefined,
          relatedMarcomId: savedItem.id,
          tags: [],
          subtasks: postSubtasks.map((s, i) => ({
            id: `sub-${Date.now()}-${i}`,
            title: s.title,
            completed: false,
            createdAt: new Date().toISOString(),
          })),
          orderIndex: 0,
        });
      } else {
        const existingTask = tasks.find((t) => t.relatedMarcomId === editId);
        if (existingTask) {
          const updates: Partial<Task> = {
            title: `[Content] ${title.trim()}`,
            description: caption.trim()
              ? `<p>${caption.trim()}</p>`
              : "<p>Draft post copy...</p>",
            dueDate: publishDate || undefined,
            postPlatform: platform,
            postFormat: format,
            mediaUrl: mediaUrl.trim() || undefined,
          };
          if (targetListId && targetListId !== existingTask.listId) {
            updates.listId = targetListId;
          }
          updateTask(existingTask.id, updates);
        }
      }

      const targetSpace = rawSpaces.find((s) => s.id === targetSpaceId);
      const targetListName =
        targetSpace?.lists.find((l) => l.id === targetListId)?.name ||
        targetSpace?.folders
          .flatMap((f) => f.lists)
          .find((l) => l.id === targetListId)?.name ||
        "List";
      const locationLabel = `${targetSpace?.name || "Space"} › ${targetListName}`;

      toast.success(
        isEditing
          ? `Postingan diperbarui & disinkronkan ke "${locationLabel}"`
          : `Postingan dibuat & tersimpan di "${locationLabel}"`,
        {
          action: {
            label: "Lihat di Board",
            onClick: () => navigateToTask(savedItem),
          },
        }
      );
      closeModal();
      await fetchPosts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save content post"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async () => {
    if (!editId) return;
    if (!confirm("Are you sure you want to delete this content post?")) return;
    try {
      const res = await fetch(`/api/marcom/content/${editId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Post deleted successfully");
        closeModal();
        await fetchPosts();
      } else {
        toast.error("Failed to delete post");
      }
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const getOrCreateLinkedTask = useCallback(
    (item: ContentPostItem) => {
      let existing = tasks.find((t) => t.relatedMarcomId === item.id);

      if (!existing) {
        const dest = getDefaultDestinationForChannel(rawSpaces, "social", targetSpaceId);
        const chosenListId = dest.listId || activeListId || "list-content-planner";
        const targetSpace = rawSpaces.find((s) => s.id === dest.spaceId) || rawSpaces[0];
        const targetStatus = targetSpace?.statuses[0]?.id || statuses[0]?.id || "status-todo";

        existing = createTask({
          listId: chosenListId,
          title: `[Content] ${item.title}`,
          description: item.caption
            ? `<p>${item.caption}</p>`
            : "<p>Draft post copy...</p>",
          statusId: targetStatus,
          priority: "normal",
          assignees: members[0] ? [members[0]] : [],
          dueDate: item.publishDate ? item.publishDate.slice(0, 10) : undefined,
          postPlatform: item.platform,
          postFormat: item.format,
          mediaUrl: item.mediaUrl || undefined,
          relatedMarcomId: item.id,
          tags: [],
          subtasks: Array.isArray(item.subtasks)
            ? item.subtasks.map((s, i) => ({
                id: `sub-post-${Date.now()}-${i}`,
                title: s.title,
                completed: Boolean(s.completed),
                createdAt: new Date().toISOString(),
              }))
            : [],
          orderIndex: 0,
        });
      }
      return existing;
    },
    [
      tasks,
      rawSpaces,
      targetSpaceId,
      activeListId,
      statuses,
      members,
      createTask,
    ]
  );

  const openTaskDrawerInPlace = useCallback(
    (item: ContentPostItem) => {
      const task = getOrCreateLinkedTask(item);
      if (task) {
        setSelectedTaskId(task.id);
      }
    },
    [getOrCreateLinkedTask, setSelectedTaskId]
  );

  const navigateToTask = useCallback(
    (item: ContentPostItem) => {
      const existing = getOrCreateLinkedTask(item);
      if (!existing) return;

      const owningSpace = findSpaceByListId(rawSpaces, existing.listId);
      if (owningSpace) {
        setActiveSpace(owningSpace.id);
        setActiveList(existing.listId);
      }
      setAppMode("tasks");
      setActiveView("board");
      setSelectedTaskId(existing.id);
      toast.info(`Beralih ke ${owningSpace?.name || "Workspace"} › Board`);
    },
    [
      getOrCreateLinkedTask,
      rawSpaces,
      setActiveSpace,
      setActiveList,
      setAppMode,
      setActiveView,
      setSelectedTaskId,
    ]
  );

  const handleTrackAsTask = (item: ContentPostItem) => {
    navigateToTask(item);
  };

  const filteredPosts = useMemo(() => {
    const q = (marcomFilters["content-planner"] || "").trim().toLowerCase();
    return posts.filter((p) => {
      if (selectedPlatform !== "all" && p.platform !== selectedPlatform) {
        return false;
      }
      if (statusFilter !== "all" && p.status !== statusFilter) {
        return false;
      }
      if (q) {
        const titleMatch = p.title.toLowerCase().includes(q);
        const captionMatch = Boolean(
          p.caption && p.caption.toLowerCase().includes(q)
        );
        const branchMatch = Boolean(
          p.branchName && p.branchName.toLowerCase().includes(q)
        );
        if (!titleMatch && !captionMatch && !branchMatch) return false;
      }
      return true;
    });
  }, [posts, selectedPlatform, statusFilter, marcomFilters]);

  // KPI calculations
  const kpiItems = useMemo(() => {
    const totalScheduled = posts.filter(
      (p) => p.status === "SCHEDULED" || p.status === "DRAFT"
    ).length;
    const publishedCount = posts.filter((p) => p.status === "PUBLISHED").length;
    const igCount = posts.filter((p) => p.platform === "instagram").length;
    const tiktokCount = posts.filter((p) => p.platform === "tiktok").length;

    return [
      {
        label: "Scheduled Posts",
        value: totalScheduled,
        helper: "Upcoming content calendar",
        icon: Sparkles,
        color: "rose" as const,
      },
      {
        label: "Published Releases",
        value: publishedCount,
        helper: "Live digital assets",
        icon: Video,
        color: "teal" as const,
      },
      {
        label: "Instagram / TikTok Ratio",
        value: `${igCount} IG • ${tiktokCount} TT`,
        helper: "Core viral channels",
        icon: Share2,
        color: "blue" as const,
      },
    ];
  }, [posts]);

  // Table Columns definition
  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Post Title / Concept",
        size: 260,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => openTaskDrawerInPlace(row.original)}
            className="flex items-center gap-2.5 text-left group/title cursor-pointer w-full"
            title="Klik untuk membuka Task Detail Drawer & Lampiran"
          >
            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
              <PlatformIcon
                platform={row.original.platform as PostPlatform}
                className="w-4 h-4"
              />
            </span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover/title:text-pink-600 dark:group-hover/title:text-pink-400 truncate block transition-colors">
                {row.original.title}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                {row.original.format} • {row.original.branchName || "National"}
              </span>
            </div>
          </button>
        ),
      }),
      columnHelper.accessor("platform", {
        header: "Platform",
        size: 110,
        cell: ({ row }) => {
          const cfg =
            PLATFORM_CONFIG[row.original.platform as PostPlatform] ||
            PLATFORM_CONFIG.instagram;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border",
                cfg.badgeClass
              )}
            >
              <PlatformIcon
                platform={row.original.platform as PostPlatform}
                className="w-3.5 h-3.5 shrink-0"
              />
              <span>{cfg.label}</span>
            </span>
          );
        },
      }),
      columnHelper.accessor("publishDate", {
        header: "Target Release",
        size: 130,
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            {row.original.publishDate
              ? formatDate(row.original.publishDate)
              : "TBD"}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        size: 110,
        cell: ({ row }) => (
          <span
            className={cn(
              "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider",
              row.original.status === "PUBLISHED"
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                : row.original.status === "SCHEDULED"
                ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            )}
          >
            {row.original.status}
          </span>
        ),
      }),
      columnHelper.display({
        id: "destination",
        header: "Lokasi Task (Workspace)",
        size: 190,
        cell: ({ row }) => {
          const linkedTask = tasks.find((t) => t.relatedMarcomId === row.original.id);
          const linkedSpace = linkedTask
            ? findSpaceByListId(rawSpaces, linkedTask.listId)
            : null;
          const linkedList =
            linkedSpace?.lists.find((l) => l.id === linkedTask?.listId) ||
            linkedSpace?.folders
              .flatMap((f) => f.lists)
              .find((l) => l.id === linkedTask?.listId);

          return (
            <button
              type="button"
              onClick={() => navigateToTask(row.original)}
              className="group/loc flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 cursor-pointer text-left transition-colors"
              title="Klik untuk melihat di Kanban Board"
            >
              <Layers className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span className="truncate font-medium">
                {linkedSpace && linkedList
                  ? `${linkedSpace.name} › ${linkedList.name}`
                  : "Workspace Task"}
              </span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover/loc:opacity-100 shrink-0 text-pink-500 transition-opacity" />
            </button>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        size: 140,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openEditModal(row.original)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Edit Post"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigateToTask(row.original)}
              className="px-2 py-1 rounded-md text-[10px] font-semibold bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/50 cursor-pointer flex items-center gap-1 transition-colors"
              title="Lihat task di Kanban Board"
            >
              <Kanban className="w-3 h-3" />
              <span>Board</span>
            </button>
          </div>
        ),
      }),
    ],
    [openEditModal, navigateToTask, openTaskDrawerInPlace, tasks, rawSpaces]
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <span>Content Planner</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Social media calendar, video formats, copywriting, and digital asset
            pipeline
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Post</span>
        </button>
      </div>

      {/* 2. KPI Cards */}
      <KpiSummaryCards items={kpiItems} />

      {/* 3. Controls Bar: Platform Pills & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Platform Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedPlatform("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
              selectedPlatform === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            All Platforms
          </button>
          {(Object.keys(PLATFORM_CONFIG) as PostPlatform[]).map((p) => {
            const isSelected = selectedPlatform === p;
            return (
              <button
                type="button"
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer",
                  isSelected
                    ? "bg-pink-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                <PlatformIcon platform={p} className="w-3.5 h-3.5" />
                <span>{PLATFORM_CONFIG[p].label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle & Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={marcomFilters["content-planner"] || ""}
              onChange={(e) =>
                setMarcomFilter("content-planner", e.target.value)
              }
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-pink-500 w-36 sm:w-48"
            />
          </div>

          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                viewMode === "cards"
                  ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-2xs"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
              title="Box / Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-2xs"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
              title="Row / Table View"
            >
              <TableProperties className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={fetchPosts}
            disabled={isLoading}
            title="Refresh posts"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "w-3.5 h-3.5",
                isLoading && "animate-spin text-pink-500"
              )}
            />
          </button>
        </div>
      </div>

      {/* 4. Content Area: Cards or Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-pink-500" />
          <p className="text-xs">Loading content planner...</p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => {
            const cfg =
              PLATFORM_CONFIG[post.platform as PostPlatform] ||
              PLATFORM_CONFIG.instagram;
            return (
              <div
                key={post.id}
                onClick={() => openTaskDrawerInPlace(post)}
                className="group relative rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800/80 hover:border-pink-500/50 dark:hover:border-pink-500/50 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                title="Klik kartu untuk membuka Task Detail Drawer & Lampiran Footage"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
                        cfg.badgeClass
                      )}
                    >
                      <PlatformIcon
                        platform={post.platform as PostPlatform}
                        className="w-3.5 h-3.5"
                      />
                      <span>{cfg.label}</span>
                      <span className="text-[10px] opacity-70 font-normal uppercase">
                        • {post.format}
                      </span>
                    </span>

                    <span
                      className={cn(
                        "px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider",
                        post.status === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
                      )}
                    >
                      {post.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    {post.title}
                  </h3>

                  {post.caption && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 italic">
                      "{post.caption}"
                    </p>
                  )}

                  {post.mediaUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 aspect-video bg-slate-100 dark:bg-slate-800 relative">
                      {(() => {
                        const parsedDrive = parseGoogleDriveUrl(post.mediaUrl);
                        if (parsedDrive.isValid && parsedDrive.embedUrl) {
                          return (
                            <iframe
                              src={parsedDrive.embedUrl}
                              title={post.title}
                              className="w-full h-full border-0"
                              allow="autoplay"
                            />
                          );
                        }
                        if (post.mediaUrl.endsWith(".mp4") || post.mediaUrl.endsWith(".mov")) {
                          return (
                            <video
                              src={post.mediaUrl}
                              controls
                              className="w-full h-full object-contain bg-slate-900"
                            />
                          );
                        }
                        return (
                          <img
                            src={post.mediaUrl}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        );
                      })()}
                    </div>
                  )}

                  {/* Destination Breadcrumb */}
                  {(() => {
                    const linkedTask = tasks.find((t) => t.relatedMarcomId === post.id);
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
                          <Layers className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                          <span className="font-semibold truncate">
                            {linkedSpace && linkedList
                              ? `${linkedSpace.name} › ${linkedList.name}`
                              : "Workspace Task"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToTask(post);
                          }}
                          className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-pink-600 dark:text-pink-400 hover:underline cursor-pointer ml-2"
                        >
                          <span>Board</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {post.publishDate
                        ? formatDate(post.publishDate)
                        : "No Date"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(post);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Edit Post"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToTask(post);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/50 cursor-pointer transition-colors"
                      title="Buka dan beralih ke Kanban Board"
                    >
                      <Kanban className="w-3 h-3" />
                      <span>Lihat di Board</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPosts.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 text-pink-500" />
              <p className="text-sm font-semibold">No content posts found</p>
              <p className="text-xs text-slate-400 mt-1">
                Schedule a new social post to start your digital pipeline.
              </p>
            </div>
          )}
        </div>
      ) : (
        <MarcomTableShell
          data={filteredPosts}
          columns={columns}
          getRowId={(row) => row.id}
          initialSorting={[{ id: "publishDate", desc: true }]}
          title="Content Planner"
          titleIcon={Sparkles}
          entityName="post"
          entityPlural="posts"
          isLoading={isLoading}
          error={error}
          onRefresh={fetchPosts}
          canDelete={can("CREATE_EVENT")}
          deleteRequiresMessage="Delete requires admin role"
          onDeleteOne={async (id) => {
            const res = await fetch(`/api/marcom/content/${id}`, { method: "DELETE" });
            if (res.ok) await fetchPosts();
            return res.ok;
          }}
          hideHeader
          noPadding
          emptyLabel="No content posts found."
        />
      )}

      {/* 5. Schedule Post Center Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span>{editId ? "Edit Social Post" : "Schedule New Post"}</span>
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-3.5">
              {/* Post Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Post Title / Concept *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Behind-the-Scenes: Outlet Solo Launch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Destination: Target Space & List */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5 text-pink-500" />
                    <span>Target Space & List (Lokasi Penyimpanan Task)</span>
                  </label>
                  <span className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">
                    Tersinkronisasi ke Board
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pilih Space dan List di Workspace tempat task postingan ini akan dibuat dan dipantau.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Pilih Space
                    </label>
                    <select
                      value={targetSpaceId}
                      onChange={(e) => handleTargetSpaceChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                    >
                      {flatSpaces.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Pilih List
                    </label>
                    <select
                      value={targetListId}
                      onChange={(e) => setTargetListId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
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
                      <span className="text-slate-400">Tujuan akhir:</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-md border border-pink-200/50 dark:border-pink-900/40">
                        <Layers className="w-3 h-3" />
                        {currentSpace?.name || "Space"} › {currentList?.name || "List"}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Platform & Format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) =>
                      setPlatform(e.target.value as PostPlatform)
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    {Object.keys(PLATFORM_CONFIG).map((p) => (
                      <option key={p} value={p}>
                        {PLATFORM_CONFIG[p as PostPlatform].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as PostFormat)}
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

              {/* Date & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Publish Date
                  </label>
                  <input
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PostStatus)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              {/* Caption & Copy */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Draft Caption & Hashtags</span>
                  {caption && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(caption);
                        toast.success("Caption copied!");
                      }}
                      className="text-[10px] text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  )}
                </label>
                <textarea
                  rows={3}
                  placeholder="Write draft caption, hashtags, and visual hooks..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500 resize-none"
                />
              </div>

              {/* Media URL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Media / Thumbnail URL (optional)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      openSelector({
                        defaultKind: "video",
                        onSelect: (atts) => {
                          if (atts[0]) {
                            setMediaUrl(atts[0].url);
                            toast.success("Tautan Google Drive berhasil disematkan ke postingan");
                          }
                        },
                      })
                    }
                    className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Pilih dari Google Drive</span>
                  </button>
                </div>
                <input
                  type="url"
                  placeholder="https://..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {editId ? (
                  <button
                    type="button"
                    onClick={handleDeletePost}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer flex items-center gap-1"
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
                    className="px-3.5 py-1.5 text-xs rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 text-xs rounded-xl font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSaving && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>{editId ? "Save Changes" : "Schedule Post"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
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
