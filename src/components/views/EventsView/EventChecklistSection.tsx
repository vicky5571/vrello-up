"use client";

import React, { useState } from "react";
import { ListTodo, RotateCcw, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { getEventChecklistTemplate } from "@/lib/tasks/eventTaskSync";

export interface EventSubtaskItem {
  id: string;
  title: string;
  completed?: boolean;
}

export interface EventChecklistSectionProps {
  eventType: string;
  eventSubtasks: EventSubtaskItem[];
  setEventSubtasks: React.Dispatch<React.SetStateAction<EventSubtaskItem[]>>;
}

export function EventChecklistSection({
  eventType,
  eventSubtasks,
  setEventSubtasks,
}: EventChecklistSectionProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setEventSubtasks((prev) => [
      ...prev,
      {
        id: `sub-${Date.now()}-${prev.length}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle("");
  };

  const handleResetTemplate = () => {
    const template = getEventChecklistTemplate(eventType);
    setEventSubtasks(
      template.map((t, i) => ({
        id: `sub-${Date.now()}-${i}`,
        title: t,
        completed: false,
      }))
    );
    toast.info(`Checklist reset to ${eventType} template`);
  };

  const handleToggleSubtask = (idx: number, checked: boolean) => {
    setEventSubtasks((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, completed: checked } : item
      )
    );
  };

  const handleRemoveSubtask = (idx: number) => {
    setEventSubtasks((prev) => prev.filter((_, i) => i !== idx));
  };

  const completedCount = eventSubtasks.filter((s) => s.completed).length;

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
          <ListTodo className="w-4 h-4 text-blue-500" />
          <span>Event Preparation Checklist (Task Subtasks)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">
            {completedCount}/{eventSubtasks.length} completed
          </span>
          <button
            type="button"
            onClick={handleResetTemplate}
            className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            title="Reload checklist template for this event type"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Template {eventType}</span>
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Field logistics and operational checklist. Items automatically sync as subtasks on the Kanban Board.
      </p>

      {eventSubtasks.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {eventSubtasks.map((s, idx) => (
            <div
              key={s.id || idx}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(s.completed)}
                  onChange={(e) => handleToggleSubtask(idx, e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span
                  className={
                    s.completed
                      ? "truncate text-slate-400 dark:text-slate-500 line-through"
                      : "truncate text-slate-800 dark:text-slate-200"
                  }
                >
                  {s.title}
                </span>
              </label>
              <button
                type="button"
                onClick={() => handleRemoveSubtask(idx)}
                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                title="Remove checklist item"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add subtask item */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          placeholder="Add new checklist item... (e.g. Rent 10kVA generator)"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddSubtask();
            }
          }}
          className="flex-1 px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-hidden"
        />
        <button
          type="button"
          onClick={handleAddSubtask}
          className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}

