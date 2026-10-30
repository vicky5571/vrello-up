"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, CheckSquare, Layers } from "lucide-react";
import type { MarcomWorkItem, ProjectsColumn } from "@/types";
import { PROJECTS_COLUMN_ORDER } from "@/lib/marcom/workItems";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

interface ProjectsBulkActionBarProps {
  selectedKeys: Set<string>;
  allItems?: MarcomWorkItem[];
  onClearSelection: () => void;
  onBulkDelete: (keys: Set<string>) => void;
  onBulkStatus: (keys: Set<string>, column: ProjectsColumn) => void;
}

export function ProjectsBulkActionBar({
  selectedKeys,
  onClearSelection,
  onBulkDelete,
  onBulkStatus,
}: ProjectsBulkActionBarProps) {
  if (selectedKeys.size === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/50 dark:border-slate-200 text-xs select-none"
      >
        {/* Count Badge */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-700 dark:border-slate-200 font-semibold">
          <CheckSquare className="w-4 h-4 text-blue-400 dark:text-blue-600" />
          <span>{selectedKeys.size} selected</span>
        </div>

        {/* Bulk Status Select */}
        <CustomDropdown
          value=""
          placeholder="Move to status..."
          onChange={(val) => {
            if (val) {
              onBulkStatus(selectedKeys, val as ProjectsColumn);
            }
          }}
          options={PROJECTS_COLUMN_ORDER.map((col) => ({
            value: col,
            label: col,
          }))}
          icon={Layers}
          ariaLabel="Move to status"
          className="w-36 text-xs text-slate-900 dark:text-slate-100"
        />

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => onBulkDelete(selectedKeys)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white font-medium transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>

        {/* Clear Selection */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 rounded-md text-slate-400 hover:text-white dark:hover:text-slate-900 transition-colors cursor-pointer"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

