"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X,
  Settings,
  Database,
  Sun,
  Moon,
  Download,
  Upload,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { spaces, tasks, tags } = useWorkspaceStore(
    useShallow((s) => ({
      spaces: s.spaces,
      tasks: s.tasks,
      tags: s.tags,
    })),
  );

  const importBackup = useWorkspaceStore((s) => s.importBackup);
  const { theme, setTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const pillTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 450, damping: 35 };

  const [activeTab, setActiveTab] = useState<"data" | "appearance">("data");
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
      } else {
        toast.error("Invalid backup file — import aborted.");
      }
    } catch {
      toast.error("Could not read backup file — import aborted.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-xl flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Settings & Preferences
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage backup & data, and theme appearance
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div
              role="tablist"
              aria-label="Settings Tabs"
              className="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5"
            >
              <motion.button
                type="button"
                role="tab"
                aria-selected={activeTab === "data"}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                onClick={() => setActiveTab("data")}
                className={cn(
                  "relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                  activeTab === "data"
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {activeTab === "data" && (
                  <motion.div
                    layoutId="activeSettingsTabPill"
                    className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-2xs border border-slate-200/50 dark:border-slate-700/50"
                    transition={pillTransition}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>Backup & Data</span>
                </span>
              </motion.button>
              <motion.button
                type="button"
                role="tab"
                aria-selected={activeTab === "appearance"}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                onClick={() => setActiveTab("appearance")}
                className={cn(
                  "relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer",
                  activeTab === "appearance"
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {activeTab === "appearance" && (
                  <motion.div
                    layoutId="activeSettingsTabPill"
                    className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-2xs border border-slate-200/50 dark:border-slate-700/50"
                    transition={pillTransition}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5" />
                  <span>Appearance</span>
                </span>
              </motion.button>
            </div>

            {/* Tab Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {activeTab === "data" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Export Backup
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Download all spaces, lists, tasks, and tags in JSON format
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportData}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export JSON
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Import Backup
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Restore spaces, lists, tasks, and tags from a JSON backup
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Import JSON
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json,.json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Theme Mode
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          theme === "light"
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <Sun className="w-5 h-5" />
                        <span className="text-xs">Light Mode</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          theme === "dark"
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <Moon className="w-5 h-5" />
                        <span className="text-xs">Dark Mode</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
