"use client";

import { useWorkspaceStore, SEED_USERS } from "@/lib/store/useWorkspaceStore";
import { Priority } from "@/types";
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
} from "lucide-react";
import { TiptapEditor } from "./TiptapEditor";
import { SubtaskManager } from "./SubtaskManager";
import { TaskActivityFeed } from "./TaskActivityFeed";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";

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
    tags,
    createTag,
    renameTag,
    deleteTag,
    toggleTaskTag,
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

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId,
  );
  const statuses = currentSpace?.statuses || [];

  const [title, setTitle] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3B82F6");
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [isAddingDep, setIsAddingDep] = useState(false);
  const [depSearch, setDepSearch] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
    }
  }, [task]);

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
    toast.success("Task deleted");
  };

  const toggleAssignee = (userId: string) => {
    if (!task) return;
    const isAssigned = task.assignees.some((u) => u.id === userId);
    const updatedAssignees = isAssigned
      ? task.assignees.filter((u) => u.id !== userId)
      : [...task.assignees, SEED_USERS.find((u) => u.id === userId)!].filter(
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
            {/* Header / Actions */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                  <Clock className="w-3 h-3 text-slate-500" />
                  TASK #{task.id.slice(-4)}
                </span>
                <span>•</span>
                <span>Created {formatDate(task.createdAt)}</span>
              </div>

              <div className="flex items-center gap-1.5">
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
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" /> Due Date
                  </label>
                  <input
                    type="date"
                    value={task.dueDate || ""}
                    onChange={(e) =>
                      updateTask(task.id, {
                        dueDate: e.target.value || undefined,
                      })
                    }
                    className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-[#7B68EE]"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-500" /> Start Date
                  </label>
                  <input
                    type="date"
                    value={task.startDate || ""}
                    onChange={(e) =>
                      updateTask(task.id, {
                        startDate: e.target.value || undefined,
                      })
                    }
                    className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-[#7B68EE]"
                  />
                </div>
              </div>

              {/* Assignees Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />{" "}
                  Assignees
                </label>
                <div className="flex flex-wrap gap-2">
                  {SEED_USERS.map((user) => {
                    const isAssigned = task.assignees.some(
                      (u) => u.id === user.id,
                    );
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleAssignee(user.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isAssigned
                            ? "bg-[#7B68EE]/10 text-[#7B68EE] border-[#7B68EE]/30 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAssigned ? "bg-[#7B68EE]" : "bg-slate-400"
                          }`}
                        />
                        {user.name}
                      </button>
                    );
                  })}
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
                    className="text-[11px] font-semibold text-slate-400 hover:text-[#7B68EE] transition-colors cursor-pointer"
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
                      <span className="text-[11px] text-slate-400">
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
                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">
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
                        <p className="text-[11px] text-slate-400 text-center py-2">
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
                    <p className="text-[11px] text-slate-400">
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
        </div>
      )}
    </AnimatePresence>
  );
}
