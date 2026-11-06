"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Database,
  Download,
  Upload,
  X,
  Grid3X3,
  FileSpreadsheet,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";

interface MoreAppsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreAppsMenu({ isOpen, onClose }: MoreAppsMenuProps) {
  const { spaces, tasks, tags } = useWorkspaceStore(
    useShallow((s) => ({
      spaces: s.spaces,
      tasks: s.tasks,
      tags: s.tags,
    })),
  );
  const openCommandPalette = useWorkspaceStore((s) => s.openCommandPalette);
  const setExportCenterOpen = useWorkspaceStore((s) => s.setExportCenterOpen);
  const importBackup = useWorkspaceStore((s) => s.importBackup);

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      spaces,
      tasks,
      tags,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vrello-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded successfully!");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (
        !window.confirm(
          `Restore backup from "${file.name}"? Spaces, tasks, and tags will be replaced.`,
        )
      ) {
        return;
      }
      if (importBackup(parsed)) {
        toast.success("Backup restored!");
        onClose();
      } else {
        toast.error("Invalid backup file — import aborted.");
      }
    } catch {
      toast.error("Could not read backup file — import aborted.");
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-start pointer-events-none pl-16">
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-auto w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-[#7B68EE]" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Quick Tools & Apps
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Main Tools */}
            <div className="py-2.5 space-y-1 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openCommandPalette();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-[#0073ea]" />
                  <span className="font-semibold">Command Palette</span>
                </div>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  ⌘K
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  setExportCenterOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold">Export Center</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  CSV / PDF
                </span>
              </button>
            </div>

            {/* Data & Storage */}
            <div className="pt-2.5 space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3 h-3 text-indigo-500" />
                <span>Backup & Data</span>
              </div>

              <button
                type="button"
                onClick={handleExportData}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Export Backup (JSON)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Import Backup (JSON)</span>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
