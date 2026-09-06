"use client";

import { useState } from "react";
import { useWorkspaceStore, SEED_USERS } from "@/lib/store/useWorkspaceStore";
import { Priority } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Calendar, Flame, Layers } from "lucide-react";
import { toast } from "sonner";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatusId?: string;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  defaultStatusId,
}: CreateTaskModalProps) {
  const {
    activeListId,
    activeSpaceId,
    workspaces,
    activeWorkspaceId,
    createTask,
    tags,
  } = useWorkspaceStore();

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId,
  );
  const statuses = currentSpace?.statuses || [];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [statusId, setStatusId] = useState(
    defaultStatusId || statuses[0]?.id || "status-todo",
  );
  const [dueDate, setDueDate] = useState("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([
    SEED_USERS[0].id,
  ]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Task title cannot be empty");
      return;
    }

    const assignedUsers = SEED_USERS.filter((u) =>
      selectedAssigneeIds.includes(u.id),
    );

    createTask({
      listId: activeListId,
      title: title.trim(),
      description: description.trim() ? `<p>${description.trim()}</p>` : "",
      statusId: statusId || statuses[0]?.id || "status-todo",
      priority,
      assignees: assignedUsers,
      dueDate: dueDate || undefined,
      tags: tags.filter((t) => selectedTagIds.includes(t.id)),
      subtasks: [],
      orderIndex: 0,
    });

    toast.success("Task created successfully!");
    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                Create New Task
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement drag-and-drop Kanban columns"
                  className="w-full px-3.5 py-2 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-1 focus:ring-[#7B68EE] transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details, acceptance criteria, or notes..."
                  className="w-full px-3.5 py-2 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#7B68EE] transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Meta Grid (Status, Priority, Due Date) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Status */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-500" /> Status
                  </label>
                  <select
                    value={statusId}
                    onChange={(e) => setStatusId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-[#7B68EE]"
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
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" /> Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-[#7B68EE]"
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
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" /> Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-[#7B68EE]"
                  />
                </div>
              </div>

              {/* Assignees */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Assign To
                </label>
                <div className="flex flex-wrap gap-2">
                  {SEED_USERS.map((user) => {
                    const isSelected = selectedAssigneeIds.includes(user.id);
                    return (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() => {
                          setSelectedAssigneeIds((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== user.id)
                              : [...prev, user.id],
                          );
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#7B68EE]/10 text-[#7B68EE] border-[#7B68EE]/30"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${isSelected ? "bg-[#7B68EE]" : "bg-slate-400"}`}
                        />
                        {user.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        type="button"
                        key={tag.id}
                        onClick={() => {
                          setSelectedTagIds((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== tag.id)
                              : [...prev, tag.id],
                          );
                        }}
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? ""
                            : "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
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

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="px-4 py-1.5 rounded-md text-xs font-bold text-white dark:text-slate-900 bg-[#1E1F21] dark:bg-white hover:bg-[#2A2B2D] dark:hover:bg-slate-100 shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Task
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
