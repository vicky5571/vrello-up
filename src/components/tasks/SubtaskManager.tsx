"use client";

import { useState } from "react";
import { Subtask } from "@/types";
import { CheckSquare, Square, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SubtaskManagerProps {
  subtasks: Subtask[];
  onAddSubtask: (title: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
}

export function SubtaskManager({
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: SubtaskManagerProps) {
  const [newTitle, setNewTitle] = useState("");

  const completedCount = subtasks.filter((st) => st.completed).length;
  const progressPercent =
    subtasks.length > 0
      ? Math.round((completedCount / subtasks.length) * 100)
      : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddSubtask(newTitle.trim());
    setNewTitle("");
  };

  return (
    <div className="space-y-3">
      {/* Subtasks Header & Progress Bar */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Subtasks & Checklists</span>
          <span className="text-slate-600 dark:text-slate-400 text-[11px] font-bold">
            ({completedCount}/{subtasks.length})
          </span>
        </div>
        <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
          {progressPercent}%
        </span>
      </div>

      {/* Animated Progress Bar */}
      {subtasks.length > 0 && (
        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full bg-teal-500 rounded-full"
          />
        </div>
      )}

      {/* Subtask Items */}
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {subtasks.map((subtask) => (
            <motion.div
              key={subtask.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="group flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-teal-500/30 transition-all text-xs"
            >
              <button
                type="button"
                onClick={() => onToggleSubtask(subtask.id)}
                className="flex items-center gap-2.5 flex-1 text-left cursor-pointer"
              >
                {subtask.completed ? (
                  <CheckSquare className="w-4 h-4 text-teal-500 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span
                  className={cn(
                    "transition-all",
                    subtask.completed
                      ? "line-through text-slate-400 dark:text-slate-500"
                      : "text-slate-800 dark:text-slate-200",
                  )}
                >
                  {subtask.title}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onDeleteSubtask(subtask.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                title="Delete subtask"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Subtask Form */}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="+ Add a subtask..."
          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
        />
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </form>
    </div>
  );
}
