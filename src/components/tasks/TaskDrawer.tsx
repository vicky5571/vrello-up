"use client";

import { useWorkspaceStore, SEED_USERS } from "@/lib/store/useWorkspaceStore";
import { Task, Priority, PostPlatform, PostFormat, TaskAttachment, Folder as FolderModel, List as ListModel } from "@/types";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Layers,
  Flame,
  User,
  Trash2,
  CheckCircle,
  Clock,
  Link as LinkIcon,
  MessageSquare,
  FileText,
  Tags,
  Plus,
  Check,
  Search,
  Share2,
  Film,
  Image as ImageIcon,
  UploadCloud,
  Download,
  Upload,
  Play,
  File as FileIcon,
  Star,
  Loader2,
  Paperclip,
  Eye,
  Folder,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Flag,
} from "lucide-react";
import { TiptapEditor } from "./TiptapEditor";
import { SubtaskManager } from "./SubtaskManager";
import { TaskActivityFeed } from "./TaskActivityFeed";
import { formatDate, cn } from "@/lib/utils";
import { toastTaskDeleted } from "@/lib/tasks/deleteUndo";
import { toast } from "sonner";
import { useState, useEffect, useRef, useMemo } from "react";
import { useGoogleDrivePicker } from "@/lib/marcom/useGoogleDrivePicker";
import { GoogleDriveLinkModal } from "@/components/ui/GoogleDriveLinkModal";
import { GoogleDrivePreviewModal } from "@/components/ui/GoogleDrivePreviewModal";
import { parseGoogleDriveUrl } from "@/lib/marcom/googleDriveUtils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useDropdown } from "@/components/ui/useDropdown";
import { findSpaceByListId } from "@/lib/tasks/targetSpaceList";
import { buildShareableTaskUrl } from "@/lib/router/urlState";

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function TaskDrawer() {
  const {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addDependency,
    removeDependency,
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
    setActiveSpace,
    setActiveList,
    appMode,
    setAppMode,
    activeView,
    setActiveView,
    lastTaskView,
    tags,
    createTag,
    renameTag,
    deleteTag,
    toggleTaskTag,
    presenceByTaskId,
    currentUserId,
    navigatedFromMarcom,
    setNavigatedFromMarcom,
  } = useWorkspaceStore();

  const liveTask = tasks.find((t) => t.id === selectedTaskId);
  const [displayedTask, setDisplayedTask] = useState(liveTask);
  const [activeTab, setActiveTab] = useState<"details" | "activity">("details");

  useEffect(() => {
    if (liveTask) {
      setDisplayedTask(liveTask);
    }
  }, [liveTask]);

  const task = liveTask || displayedTask;
  const viewers = task
    ? (presenceByTaskId[task.id] || []).filter((u) => u.id !== currentUserId)
    : [];

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId,
  );
  const statuses = currentSpace?.statuses || [];
  const members = currentWorkspace?.members || SEED_USERS;

  const allSpaces = useMemo(
    () => workspaces.flatMap((w) => w.spaces || []),
    [workspaces],
  );

  const { owningSpace, owningFolder, owningList } = useMemo(() => {
    if (!task?.listId) {
      return {
        owningSpace: currentSpace,
        owningFolder: undefined,
        owningList: undefined,
      };
    }
    const space = findSpaceByListId(allSpaces, task.listId) || currentSpace;
    let folder: FolderModel | undefined;
    let list: ListModel | undefined;

    if (space) {
      list = space.lists?.find((l) => l.id === task.listId);
      if (!list && space.folders) {
        for (const f of space.folders) {
          const found = f.lists?.find((l) => l.id === task.listId);
          if (found) {
            folder = f;
            list = found;
            break;
          }
        }
      }
    }

    return { owningSpace: space, owningFolder: folder, owningList: list };
  }, [allSpaces, task?.listId, currentSpace]);

  const handleNavigateToSpace = (spaceId: string, spaceName: string) => {
    setActiveSpace(spaceId);
    setActiveList(null);
    if (appMode !== "tasks") {
      setAppMode("tasks");
    }
    if (appMode === "marcom" || activeView === "home") {
      setActiveView(lastTaskView || "board");
    }
    toast.info(`Beralih ke Space: ${spaceName} (Projects)`);
  };

  const handleNavigateToList = (
    spaceId: string,
    listId: string,
    listName: string,
  ) => {
    setActiveSpace(spaceId);
    setActiveList(listId);
    if (appMode !== "tasks") {
      setAppMode("tasks");
    }
    if (appMode === "marcom" || activeView === "home") {
      setActiveView(lastTaskView || "board");
    }
    toast.info(`Beralih ke List: ${listName} (Projects)`);
  };

  const [title, setTitle] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3B82F6");
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [isAddingDep, setIsAddingDep] = useState(false);
  const [depSearch, setDepSearch] = useState("");

  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const assigneeTriggerRef = useRef<HTMLButtonElement>(null);
  const assigneeDropdownRef = useDropdown<HTMLDivElement>({
    isOpen: isAssigneeOpen,
    onClose: () => {
      setIsAssigneeOpen(false);
      setAssigneeSearch("");
    },
    triggerRef: assigneeTriggerRef,
  });

  const filteredMembers = members.filter((m) => {
    const q = assigneeSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);
  const [drivePreviewAttachment, setDrivePreviewAttachment] = useState<TaskAttachment | null>(null);
  const {
    openSelector,
    isModalOpen: isDriveModalOpen,
    closeModal: closeDriveModal,
    handleManualAttach,
  } = useGoogleDrivePicker();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !task) return;
    setIsUploading(true);
    const newAttachments: TaskAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("kind", "tasks");
      formData.append("id", task.id);
      formData.append("file", file);

      try {
        const res = await fetch("/api/marcom/uploads", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || `Failed to upload ${file.name}`);
          continue;
        }
        const isVideo = file.type.startsWith("video/") || file.name.toLowerCase().endsWith(".mp4");
        const isImg = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
        const isDoc = file.name.toLowerCase().endsWith(".pdf");

        newAttachments.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: data.originalName || file.name,
          sizeBytes: data.sizeBytes || file.size,
          type: isVideo ? "video" : isImg ? "image" : isDoc ? "document" : "other",
          url: data.filePath,
          uploadedAt: new Date().toISOString(),
        });
      } catch {
        toast.error(`Upload failed for ${file.name}`);
      }
    }

    if (newAttachments.length > 0) {
      const currentAttachments = task.attachments || [];
      const updatedAttachments = [...currentAttachments, ...newAttachments];
      const firstVisual = newAttachments.find((a) => a.type === "video" || a.type === "image");
      const updates: Partial<Task> = { attachments: updatedAttachments };
      if (!task.mediaUrl && firstVisual) {
        updates.mediaUrl = firstVisual.url;
      }
      updateTask(task.id, updates);
      toast.success(`Uploaded ${newAttachments.length} file(s)`);
    }
    setIsUploading(false);
  };

  const handleRemoveAttachment = (attId: string) => {
    if (!task) return;
    const current = task.attachments || [];
    const removed = current.find((a) => a.id === attId);
    const updated = current.filter((a) => a.id !== attId);
    const updates: Partial<Task> = { attachments: updated };
    if (removed && task.mediaUrl === removed.url) {
      const nextVisual = updated.find((a) => a.type === "video" || a.type === "image");
      updates.mediaUrl = nextVisual?.url || undefined;
    }
    updateTask(task.id, updates);
    toast.success("Attachment removed");
  };

  const handleSetCover = (url: string) => {
    if (!task) return;
    updateTask(task.id, { mediaUrl: url });
    toast.success("Set as primary cover media");
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setIsAssigneeOpen(false);
      setAssigneeSearch("");
    }
  }, [task?.id]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedTaskId) {
        setSelectedTaskId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTaskId, setSelectedTaskId]);

  const handleTitleBlur = () => {
    if (task && title.trim() && title !== task.title) {
      updateTask(task.id, { title: title.trim() });
      toast.success("Task title updated");
    }
  };

  const handleStatusChange = (newStatusId: string) => {
    if (!task) return;
    updateTask(task.id, { statusId: newStatusId });
    toast.success("Status updated");
  };

  const handlePriorityChange = (newPriority: Priority) => {
    if (!task) return;
    updateTask(task.id, { priority: newPriority });
    toast.success("Priority updated");
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask(task.id);
    toastTaskDeleted([task.id]);
  };

  const handleCopyLink = () => {
    if (!task) return;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${buildShareableTaskUrl(task.id, window.location.search)}`
        : buildShareableTaskUrl(task.id);
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Task link copied to clipboard"))
      .catch(() => toast.error("Failed to copy link to clipboard"));
  };

  const toggleAssignee = (userId: string) => {
    if (!task) return;
    const isAssigned = task.assignees.some((u) => u.id === userId);
    const updatedAssignees = isAssigned
      ? task.assignees.filter((u) => u.id !== userId)
      : [...task.assignees, members.find((u) => u.id === userId)!].filter(
          Boolean,
        );

    updateTask(task.id, { assignees: updatedAssignees });
  };

  return (
    <AnimatePresence>
      {selectedTaskId && task && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTaskId(null)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative z-10 w-full max-w-2xl sm:max-w-3xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Return to Marcom / Field Events Banner */}
            {(navigatedFromMarcom || (task?.relatedMarcomId && task?.title?.startsWith("[Field Event]"))) && (
              <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border-b border-blue-200/80 dark:border-blue-900/60 px-4 py-2 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 min-w-0 pr-2">
                  <Flag className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-medium truncate">
                    Linked to: {navigatedFromMarcom?.label || "Field Events"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const targetView = (navigatedFromMarcom?.view as any) || "events";
                    setSelectedTaskId(null);
                    setNavigatedFromMarcom(null);
                    setAppMode("marcom");
                    setActiveView(targetView);
                    toast.info("Back to Field Events");
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] shadow-2xs transition-all cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Field Events</span>
                </button>
              </div>
            )}

            {/* Header / Actions */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 font-medium min-w-0">
                {owningSpace && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigateToSpace(owningSpace.id, owningSpace.name)
                      }
                      title={`Beralih ke Space: ${owningSpace.name} (Projects)`}
                      className="hover:text-[#7B68EE] dark:hover:text-[#9182f0] transition-colors truncate max-w-[120px] sm:max-w-[160px] cursor-pointer flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium"
                    >
                      {owningSpace.color && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: owningSpace.color }}
                        />
                      )}
                      <span className="truncate">{owningSpace.name}</span>
                    </button>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </>
                )}

                {owningFolder && (
                  <>
                    <span className="text-slate-500 dark:text-slate-400 truncate max-w-[100px] sm:max-w-[140px]">
                      {owningFolder.name}
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </>
                )}

                {owningList && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleNavigateToList(
                          owningSpace?.id || activeSpaceId,
                          owningList.id,
                          owningList.name,
                        )
                      }
                      title={`Beralih ke List: ${owningList.name} (Projects)`}
                      className="hover:text-[#7B68EE] dark:hover:text-[#9182f0] transition-colors truncate max-w-[120px] sm:max-w-[160px] cursor-pointer text-slate-600 dark:text-slate-400 font-medium"
                    >
                      {owningList.name}
                    </button>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </>
                )}

                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider text-[10px] shrink-0">
                  <Clock className="w-3 h-3 text-slate-500" />
                  TASK #{task.id.slice(-4)}
                </span>
                <span className="hidden sm:inline text-slate-400">•</span>
                <span className="hidden sm:inline text-slate-500 dark:text-slate-400">
                  Created {formatDate(task.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {viewers.length > 0 && (
                  <div
                    title={`Viewing now: ${viewers.map((v) => v.name).join(", ")}`}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      {viewers[0].name}{" "}
                      {viewers.length > 1 ? `+${viewers.length - 1}` : "viewing"}
                    </span>
                    <div className="flex -space-x-1.5 ml-0.5">
                      {viewers.slice(0, 3).map((v) => (
                        <img
                          key={v.id}
                          src={v.avatar}
                          alt={v.name}
                          className="w-3.5 h-3.5 rounded-full ring-1 ring-white dark:ring-slate-900 object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copy Task Link"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  title="Delete Task"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedTaskId(null)}
                  title="Close (ESC)"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab Navigation (Details vs Activity & Comments) */}
            <div className="px-6 pt-3 border-b border-slate-200/70 dark:border-slate-800 flex items-center gap-4 bg-slate-50/40 dark:bg-slate-900/40">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === "details"
                    ? "border-[#7B68EE] text-[#7B68EE]"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Task Details</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("activity")}
                className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === "activity"
                    ? "border-[#7B68EE] text-[#7B68EE]"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Activity & Comments</span>
                {(task.comments?.length || 0) > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#7B68EE]/20 text-[#7B68EE] font-bold">
                    {task.comments?.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === "activity" ? (
                <TaskActivityFeed task={task} />
              ) : (
                <>
                  {/* Editable Title */}
                  <div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={handleTitleBlur}
                      onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
                      placeholder="Task title..."
                      className="w-full text-lg font-bold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-[#7B68EE] text-slate-900 dark:text-slate-100 focus:outline-hidden pb-1 transition-all"
                    />
                  </div>

              {/* Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-500" /> Status
                  </label>
                  <select
                    value={task.statusId}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-[#7B68EE] cursor-pointer"
                  >
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" /> Priority
                  </label>
                  <select
                    value={task.priority}
                    onChange={(e) =>
                      handlePriorityChange(e.target.value as Priority)
                    }
                    className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-[#7B68EE] cursor-pointer"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                    <option value="none">None</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label
                    htmlFor="task-due-date"
                    className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3 h-3 text-blue-500" /> Due Date
                  </label>
                  <input
                    id="task-due-date"
                    type="date"
                    value={task.dueDate || ""}
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
                    onChange={(e) =>
                      updateTask(task.id, {
                        dueDate: e.target.value || undefined,
                      })
                    }
                    className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-[#7B68EE] cursor-pointer"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label
                    htmlFor="task-start-date"
                    className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3 h-3 text-emerald-500" /> Start Date
                  </label>
                  <input
                    id="task-start-date"
                    type="date"
                    value={task.startDate || ""}
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
                    onChange={(e) =>
                      updateTask(task.id, {
                        startDate: e.target.value || undefined,
                      })
                    }
                    className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-[#7B68EE] cursor-pointer"
                  />
                </div>
              </div>

              {/* Assignees Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Assignees</span>
                    {task.assignees.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {task.assignees.length}
                      </span>
                    )}
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Assigned Members Chips */}
                  {task.assignees.map((user) => (
                    <div
                      key={user.id}
                      className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs group"
                    >
                      <UserAvatar user={user} size="xs" />
                      <span className="max-w-[130px] truncate">{user.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleAssignee(user.id)}
                        title={`Hapus penugasan ${user.name}`}
                        className="p-0.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {task.assignees.length === 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic mr-1">
                      Belum ada yang ditugaskan
                    </span>
                  )}

                  {/* + Assign Trigger & Dropdown Popover */}
                  <div className="relative">
                    <button
                      ref={assigneeTriggerRef}
                      type="button"
                      onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#7B68EE] hover:bg-[#7B68EE]/5 text-slate-600 dark:text-slate-400 hover:text-[#7B68EE] text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign</span>
                    </button>

                    {/* Popover Dropdown */}
                    {isAssigneeOpen && (
                      <div
                        ref={assigneeDropdownRef}
                        className="absolute left-0 top-full mt-1.5 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-40 space-y-2 animate-in fade-in zoom-in-95 duration-100"
                      >
                        {/* Search Input */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            autoFocus
                            value={assigneeSearch}
                            onChange={(e) => setAssigneeSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (filteredMembers[0]) {
                                  toggleAssignee(filteredMembers[0].id);
                                }
                              }
                            }}
                            placeholder="Cari anggota tim..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#7B68EE]"
                          />
                        </div>

                        {/* Member List */}
                        <div className="max-h-52 overflow-y-auto space-y-0.5">
                          {filteredMembers.length === 0 ? (
                            <p className="p-2 text-center text-xs text-slate-400 dark:text-slate-500">
                              Tidak ada anggota tim yang cocok
                            </p>
                          ) : (
                            filteredMembers.map((member) => {
                              const isAssigned = task.assignees.some(
                                (u) => u.id === member.id,
                              );
                              return (
                                <button
                                  key={member.id}
                                  type="button"
                                  onClick={() => toggleAssignee(member.id)}
                                  className={cn(
                                    "w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-colors cursor-pointer",
                                    isAssigned
                                      ? "bg-[#7B68EE]/10 text-[#7B68EE]"
                                      : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200",
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                    <UserAvatar user={member} size="xs" />
                                    <div className="min-w-0">
                                      <div className="text-xs font-medium truncate">
                                        {member.name}
                                      </div>
                                      {member.email && (
                                        <div className="text-[10px] text-slate-400 truncate">
                                          {member.email}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {isAssigned && (
                                    <Check className="w-4 h-4 text-[#7B68EE] shrink-0" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rich-Text Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Description & Notes
                </label>
                <TiptapEditor
                  content={task.description}
                  onChange={(newHtml) =>
                    updateTask(task.id, { description: newHtml })
                  }
                />
              </div>

              {/* Interactive Subtasks & Checklists */}
              <div className="pt-2">
                <SubtaskManager
                  subtasks={task.subtasks}
                  onAddSubtask={(stTitle) => addSubtask(task.id, stTitle)}
                  onToggleSubtask={(stId) => toggleSubtask(task.id, stId)}
                  onDeleteSubtask={(stId) => deleteSubtask(task.id, stId)}
                />
              </div>

              {/* Social & Content Planning Panel (Only visible in Content Planner view) */}
              {activeView === "content-planner" && (
                <div className="p-4 rounded-xl bg-pink-50/40 dark:bg-pink-950/20 border border-pink-200/70 dark:border-pink-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-900 dark:text-pink-300 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                      Content & Social Planner
                    </span>
                    {task.postPlatform && (
                      <PlatformBadge platform={task.postPlatform} format={task.postFormat} />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Platform
                      </label>
                      <select
                        value={task.postPlatform || ""}
                        onChange={(e) =>
                          updateTask(task.id, {
                            postPlatform: (e.target.value || undefined) as PostPlatform | undefined,
                          })
                        }
                        className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-pink-500 cursor-pointer"
                      >
                        <option value="">None (Standard Task)</option>
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="youtube">YouTube</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="facebook">Facebook</option>
                        <option value="twitter">Twitter / X</option>
                        <option value="blog">Blog</option>
                        <option value="press">Press / Media PR</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Post Format
                      </label>
                      <select
                        value={task.postFormat || ""}
                        onChange={(e) =>
                          updateTask(task.id, {
                            postFormat: (e.target.value || undefined) as PostFormat | undefined,
                          })
                        }
                        className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-pink-500 cursor-pointer"
                      >
                        <option value="">Default</option>
                        <option value="reel">Reel / Short Video</option>
                        <option value="carousel">Carousel Slide</option>
                        <option value="image">Single Image / Poster</option>
                        <option value="story">Story</option>
                        <option value="article">Article / Press Release</option>
                        <option value="thread">Thread</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Footage & Attachments Section (Accessible for All Tasks) */}
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-3">
                {/* Primary Cover / Featured Preview (Only shown when a cover is set) */}
                {task.mediaUrl && (
                  <div className="space-y-2 pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        Cover / Featured Media
                      </span>
                      <button
                        type="button"
                        onClick={() => updateTask(task.id, { mediaUrl: undefined })}
                        className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        Hapus Cover
                      </button>
                    </div>

                    {(() => {
                      const parsedDriveCover = parseGoogleDriveUrl(task.mediaUrl);
                      if (task.mediaUrl.endsWith(".mp4")) {
                        return (
                          <div className="relative rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-900 flex items-center justify-center max-h-48">
                            <video
                              src={task.mediaUrl}
                              controls
                              className="w-full h-full object-contain"
                            />
                          </div>
                        );
                      }
                      if (parsedDriveCover.isValid && parsedDriveCover.embedUrl) {
                        return (
                          <div className="relative rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-900 flex items-center justify-center max-h-48">
                            <iframe
                              src={parsedDriveCover.embedUrl}
                              title="Cover preview"
                              className="w-full h-full border-0"
                              allow="autoplay"
                            />
                          </div>
                        );
                      }
                      return (
                        <div className="relative rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-900 flex items-center justify-center max-h-48">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={task.mediaUrl}
                            alt="Content preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Multi-File Footage & Attachments */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="w-3 h-3 text-teal-600" />
                      Footage & Attachments ({(task.attachments || []).length})
                    </label>
                  </div>

                  {/* Primary Action: Google Drive Attachment Button */}
                  <button
                    type="button"
                    onClick={() =>
                      openSelector({
                        onSelect: (newAtts) => {
                          const updated = [...(task.attachments || []), ...newAtts];
                          const updates: Partial<Task> = { attachments: updated };
                          if (!task.mediaUrl && newAtts.length > 0) {
                            const visual = newAtts.find((a) => a.type === "video" || a.type === "image");
                            if (visual) updates.mediaUrl = visual.url;
                          }
                          updateTask(task.id, updates);
                          toast.success(`Berhasil menambahkan ${newAtts.length} aset Google Drive`);
                        },
                      })
                    }
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm hover:shadow-md transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 87.3 78" fill="none">
                          <path
                            d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z"
                            fill="#0066DA"
                          />
                          <path
                            d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z"
                            fill="#00AC47"
                          />
                          <path
                            d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l6.85-11.85 3.8-6.65c.8-1.4 1.2-2.95 1.2-4.5h-55.2l13.75 23.8z"
                            fill="#EA4335"
                          />
                          <path
                            d="m43.65 25 13.75-23.8c-1.35-.8-2.95-1.2-4.5-1.2h-18.5c-1.55 0-3.15.4-4.5 1.2z"
                            fill="#00832D"
                          />
                          <path
                            d="m57.4 1.2-13.75 23.8 27.6 47.7c.8-1.35 1.2-2.95 1.2-4.5l-25.4-44c-.8-1.4-1.95-2.5-3.3-3.3z"
                            fill="#FFBA00"
                          />
                          <path
                            d="m73.55 76.8h-46.05l-13.75-23.8h55.2z"
                            fill="#2684FC"
                          />
                        </svg>
                      </div>
                      <span className="text-xs font-semibold leading-tight truncate">
                        Lampirkan dari Google Drive
                      </span>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 text-white group-hover:bg-white/30 transition-colors">
                      <Upload className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="video/mp4,video/*,image/*,.pdf"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />

                  {/* Secondary Action: Local Dropzone / Browse */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      handleFileUpload(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "px-3 py-2 rounded-lg border border-dashed transition-all cursor-pointer flex items-center justify-center text-center gap-1.5",
                      isDragOver
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40"
                        : "border-slate-300 dark:border-slate-700/80 hover:border-teal-400 dark:hover:border-teal-600 bg-slate-50/70 dark:bg-slate-800/40",
                      isUploading && "opacity-60 pointer-events-none"
                    )}
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-300 py-0.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengupload file lokal...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <UploadCloud className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>
                          atau upload file lokal (
                          <strong className="text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-2">
                            browse
                          </strong>
                          , maks 25MB)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Attachments List */}
                  {(task.attachments || []).length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {(task.attachments || []).map((att) => {
                        const isVideo = att.type === "video" || att.name.endsWith(".mp4");
                        const isImg = att.type === "image";
                        const isCover = task.mediaUrl === att.url;
                        const isFolder = Boolean(att.isSharedFolder);

                        return (
                          <div
                            key={att.id}
                            className="p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 text-xs group"
                          >
                            <div className="flex items-center gap-2 overflow-hidden min-w-0">
                              <span className="p-1 rounded bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shrink-0">
                                {isFolder ? (
                                  <Folder className="w-3.5 h-3.5 text-amber-500" />
                                ) : isVideo ? (
                                  <Film className="w-3.5 h-3.5" />
                                ) : isImg ? (
                                  <ImageIcon className="w-3.5 h-3.5" />
                                ) : (
                                  <FileIcon className="w-3.5 h-3.5" />
                                )}
                              </span>
                              <div className="truncate min-w-0">
                                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                                  <span className="truncate">{att.name}</span>
                                  {att.source === "gdrive" && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 shrink-0">
                                      <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 87.3 78" fill="none">
                                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA" />
                                        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00AC47" />
                                        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l6.85-11.85 3.8-6.65c.8-1.4 1.2-2.95 1.2-4.5h-55.2l13.75 23.8z" fill="#EA4335" />
                                        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.95-1.2-4.5-1.2h-18.5c-1.55 0-3.15.4-4.5 1.2z" fill="#00832D" />
                                        <path d="m57.4 1.2-13.75 23.8 27.6 47.7c.8-1.35 1.2-2.95 1.2-4.5l-25.4-44c-.8-1.4-1.95-2.5-3.3-3.3z" fill="#FFBA00" />
                                        <path d="m73.55 76.8h-46.05l-13.75-23.8h55.2z" fill="#2684FC" />
                                      </svg>
                                      Drive
                                    </span>
                                  )}
                                  {isCover && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                      Cover
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {att.sizeBytes && att.sizeBytes > 0
                                    ? `${formatBytes(att.sizeBytes)} • `
                                    : att.source === "gdrive"
                                    ? "Google Drive • "
                                    : ""}
                                  {att.uploadedAt ? formatDate(att.uploadedAt) : "Uploaded"}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Preview / Play */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (att.source === "gdrive" || att.embedUrl || att.driveFileId) {
                                    setDrivePreviewAttachment(att);
                                  } else {
                                    setPreviewAttachment(att);
                                  }
                                }}
                                title={isVideo ? "Play footage" : "Preview file"}
                                className="p-1 rounded text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                {isVideo ? <Play className="w-3.5 h-3.5 fill-current" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>

                              {/* Set as Cover (if visual and not already cover) */}
                              {(isVideo || isImg) && !isCover && (
                                <button
                                  type="button"
                                  onClick={() => handleSetCover(att.url)}
                                  title="Set as main cover"
                                  className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Download Link */}
                              <a
                                href={att.url}
                                download={att.source === "gdrive" ? undefined : att.name}
                                target={att.source === "gdrive" ? "_blank" : undefined}
                                rel={att.source === "gdrive" ? "noopener noreferrer" : undefined}
                                title={att.source === "gdrive" ? "Buka di Google Drive" : "Download file"}
                                className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                {att.source === "gdrive" ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                              </a>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(att.id)}
                                title="Delete attachment"
                                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tags className="w-3.5 h-3.5 text-slate-500" /> Tags
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsManagingTags(!isManagingTags)}
                    className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-[#7B68EE] transition-colors cursor-pointer"
                  >
                    {isManagingTags ? "Done" : "Manage"}
                  </button>
                </div>

                {isManagingTags ? (
                  <div className="space-y-1.5">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <input
                          type="text"
                          defaultValue={tag.name}
                          key={`${tag.id}-${tag.name}`}
                          onBlur={(e) => {
                            if (e.target.value.trim() && e.target.value.trim() !== tag.name) {
                              renameTag(tag.id, e.target.value);
                              toast.success("Tag renamed");
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                          className="flex-1 min-w-0 bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden border-b border-transparent focus:border-[#7B68EE]"
                        />
                        <button
                          type="button"
                          title={`Delete tag "${tag.name}"`}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete tag "${tag.name}"? It will be removed from all tasks.`,
                              )
                            ) {
                              deleteTag(tag.id);
                              toast.success("Tag deleted");
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        aria-label="Choose tag color"
                        className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newTagName.trim()) {
                            createTag(newTagName, newTagColor);
                            toast.success(`Tag "${newTagName.trim()}" created`);
                            setNewTagName("");
                          }
                        }}
                        placeholder="New tag name…"
                        className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#7B68EE]"
                      />
                      <button
                        type="button"
                        disabled={!newTagName.trim()}
                        onClick={() => {
                          createTag(newTagName, newTagColor);
                          toast.success(`Tag "${newTagName.trim()}" created`);
                          setNewTagName("");
                        }}
                        className="p-1.5 rounded-lg bg-[#7B68EE] text-white hover:bg-[#6a5ae0] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                        title="Create tag"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.length === 0 && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        No tags yet — click Manage to create one.
                      </span>
                    )}
                    {tags.map((tag) => {
                      const isSelected =
                        task?.tags.some((tt) => tt.id === tag.id) ?? false;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          disabled={!task}
                          onClick={() => task && toggleTaskTag(task.id, tag.id)}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer disabled:cursor-default",
                            !isSelected &&
                              "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-700",
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
                          {isSelected && <Check className="w-3 h-3" />}
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dependencies & Blockers Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Blocking Dependencies ({(task.dependencies || []).length})
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingDep(!isAddingDep);
                      setDepSearch("");
                    }}
                    className="text-[11px] font-semibold text-[#7B68EE] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    {isAddingDep ? "Cancel" : "Add Blocker"}
                  </button>
                </div>

                {/* Add Dependency Search Dropdown */}
                {isAddingDep && (
                  <div className="p-3 mb-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        value={depSearch}
                        onChange={(e) => setDepSearch(e.target.value)}
                        placeholder="Search tasks to add as blocker..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#7B68EE]"
                      />
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {tasks
                        .filter(
                          (t) =>
                            t.id !== task.id &&
                            !(task.dependencies || []).includes(t.id) &&
                            t.title.toLowerCase().includes(depSearch.toLowerCase())
                        )
                        .map((candidate) => (
                          <button
                            key={candidate.id}
                            type="button"
                            onClick={() => {
                              const success = addDependency(task.id, candidate.id);
                              if (success) {
                                toast.success(`Waiting on "${candidate.title}"`);
                                setIsAddingDep(false);
                                setDepSearch("");
                              } else {
                                toast.error("Cannot add dependency: circular loop detected");
                              }
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700 flex items-center justify-between text-xs transition-colors cursor-pointer"
                          >
                            <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                              {candidate.title}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                              #{candidate.id.slice(-4)}
                            </span>
                          </button>
                        ))}
                      {tasks.filter(
                        (t) =>
                          t.id !== task.id &&
                          !(task.dependencies || []).includes(t.id) &&
                          t.title.toLowerCase().includes(depSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center py-2">
                          No matching tasks found
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Existing Dependencies List */}
                {task.dependencies && task.dependencies.length > 0 ? (
                  <div className="space-y-1.5">
                    {task.dependencies.map((depId) => {
                      const blocker = tasks.find((t) => t.id === depId);
                      return (
                        <div
                          key={depId}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
                              Waiting On
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {blocker?.title || "Deleted Task"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              removeDependency(task.id, depId);
                              toast.success("Dependency removed");
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove dependency"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  !isAddingDep && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      No blocking dependencies. This task can be started immediately.
                    </p>
                  )
                )}
              </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> All changes auto-saved
              </span>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="px-4 py-1.5 rounded-md bg-[#1E1F21] dark:bg-white hover:bg-[#2A2B2D] dark:hover:bg-slate-100 font-semibold text-white dark:text-slate-900 transition-colors cursor-pointer text-xs"
              >
                Done
              </button>
            </div>
          </motion.div>

          {/* Footage & Attachment Lightbox Modal */}
          {previewAttachment && (
            <div
              className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
              onClick={() => setPreviewAttachment(null)}
            >
              <div
                className="relative max-w-3xl w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl p-4 flex flex-col gap-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
                  <div className="font-semibold text-xs truncate flex items-center gap-2">
                    {previewAttachment.type === "video" || previewAttachment.name.endsWith(".mp4") ? (
                      <Film className="w-4 h-4 text-teal-400 shrink-0" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-teal-400 shrink-0" />
                    )}
                    <span className="truncate">{previewAttachment.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewAttachment(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-lg overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
                  {previewAttachment.type === "video" || previewAttachment.name.endsWith(".mp4") ? (
                    <video
                      src={previewAttachment.url}
                      controls
                      autoPlay
                      className="w-full max-h-[70vh] object-contain"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={previewAttachment.url}
                      alt={previewAttachment.name}
                      className="w-full max-h-[70vh] object-contain"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>{formatBytes(previewAttachment.sizeBytes)}</span>
                  <div className="flex items-center gap-3">
                    {(previewAttachment.type === "video" || previewAttachment.type === "image") &&
                      task.mediaUrl !== previewAttachment.url && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSetCover(previewAttachment.url);
                            setPreviewAttachment(null);
                          }}
                          className="inline-flex items-center gap-1 text-amber-400 hover:underline cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5" /> Set as Cover
                        </button>
                      )}
                    <a
                      href={previewAttachment.url}
                      download={previewAttachment.name}
                      className="inline-flex items-center gap-1 text-teal-400 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Google Drive Link Modal */}
          <GoogleDriveLinkModal
            isOpen={isDriveModalOpen}
            onClose={closeDriveModal}
            onAttach={handleManualAttach}
          />

          {/* Google Drive Preview Modal */}
          <GoogleDrivePreviewModal
            attachment={drivePreviewAttachment}
            onClose={() => setDrivePreviewAttachment(null)}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
