"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCheck, Trash2, X } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import type { Priority, Status, User } from "@/types";

interface BulkActionBarProps {
  selectedIds: string[];
  statuses: Status[];
  members: User[];
}

/**
 * Floating batch-action bar for multi-selected tasks (Board + List).
 * Each control applies immediately to the whole selection: status,
 * assignee, due date, and priority — plus bulk delete and clear.
 */
export function BulkActionBar({ selectedIds, statuses, members }: BulkActionBarProps) {
  const { bulkUpdateTasks, clearTaskSelection, deleteTask } = useWorkspaceStore();
  const [isDeleting, setIsDeleting] = useState(false);

  if (selectedIds.length === 0) return null;
  const count = selectedIds.length;

  const apply = (label: string, updates: Parameters<typeof bulkUpdateTasks>[1]) => {
    bulkUpdateTasks(selectedIds, updates);
    toast.success(`${label} applied to ${count} ${count === 1 ? "task" : "tasks"}`);
  };

  const handleBulkDelete = () => {
    if (isDeleting) return;
    const confirmed =
      typeof window === "undefined"
        ? false
        : window.confirm(`Delete ${count} selected ${count === 1 ? "task" : "tasks"}? This cannot be undone.`);
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      selectedIds.forEach((id) => deleteTask(id));
      clearTaskSelection();
      toast.success(`${count} ${count === 1 ? "task" : "tasks"} deleted`);
    } finally {
      setIsDeleting(false);
    }
  };

  const selectClass =
    "max-w-32 cursor-pointer rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#18191B]/95 backdrop-blur px-4 py-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-[calc(100vw-2rem)]">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
        <CheckCheck className="w-4 h-4 text-indigo-500" />
        {count} selected
      </span>

      <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />

      <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        Status
        <select
          aria-label="Bulk change status"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) apply("Status", { statusId: e.target.value });
            e.target.value = "";
          }}
          className={selectClass}
        >
          <option value="">Set…</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        Assignee
        <select
          aria-label="Bulk change assignee"
          defaultValue=""
          onChange={(e) => {
            const member = members.find((m) => m.id === e.target.value);
            apply("Assignee", { assignees: member ? [member] : [] });
            e.target.value = "";
          }}
          className={selectClass}
        >
          <option value="">Set…</option>
          <option value="__none">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        Due
        <input
          type="date"
          aria-label="Bulk change due date"
          onChange={(e) => {
            apply("Due date", { dueDate: e.target.value || undefined });
            e.target.value = "";
          }}
          className="cursor-pointer rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1 text-[11px] text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />
      </label>

      <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        Priority
        <select
          aria-label="Bulk change priority"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) apply("Priority", { priority: e.target.value as Priority });
            e.target.value = "";
          }}
          className={selectClass}
        >
          <option value="">Set…</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
          <option value="none">None</option>
        </select>
      </label>

      <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />

      <button
        type="button"
        onClick={handleBulkDelete}
        disabled={isDeleting}
        title="Delete selected tasks"
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>

      <button
        type="button"
        onClick={clearTaskSelection}
        title="Clear selection"
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
