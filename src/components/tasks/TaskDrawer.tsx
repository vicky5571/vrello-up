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
} from "lucide-react";
import { TiptapEditor } from "./TiptapEditor";
import { SubtaskManager } from "./SubtaskManager";
import { formatDate } from "@/lib/utils";
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
    removeDependency,
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
  } = useWorkspaceStore();

  const liveTask = tasks.find((t) => t.id === selectedTaskId);
  const [displayedTask, setDisplayedTask] = useState(liveTask);

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
            className="relative z-10 w-full max-w-2xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Header / Actions */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                  <Clock className="w-3 h-3 text-teal-500" />
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

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Editable Title */}
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
                  placeholder="Task title..."
                  className="w-full text-lg font-bold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-teal-500 text-slate-900 dark:text-slate-100 focus:outline-hidden pb-1 transition-all"
                />
              </div>

              {/* Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                {/* Status */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-teal-500" /> Status
                  </label>
                  <select
                    value={task.statusId}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-teal-500 cursor-pointer"
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
                    className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-teal-500 cursor-pointer"
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
                    className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-teal-500"
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
                    className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Assignees Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />{" "}
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
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          isAssigned
                            ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/40 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAssigned ? "bg-teal-500" : "bg-slate-400"
                          }`}
                        />
                        {user.name}
                      </button>
                    );
                  })}
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

              {/* Dependencies & Blockers Section */}
              {task.dependencies && task.dependencies.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>
                      Blocking Dependencies ({task.dependencies.length})
                    </span>
                  </label>
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
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> All changes auto-saved
              </span>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
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
