"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_COLORS = [
  "#0073ea", // Brand Blue
  "#0D9488", // Teal
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#6366F1", // Indigo
  "#EF4444", // Red
];

export function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
  const { createWorkspace } = useWorkspaceStore();
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    const trimmedName = name.trim();
    const initial = trimmedName.charAt(0).toUpperCase();
    createWorkspace(trimmedName, initial);
    toast.success(`Workspace "${trimmedName}" created!`);
    setName("");
    onClose();
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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0073ea]" />
                Create New Workspace
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp, Design Team, Client Portal"
                  autoFocus
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/30 focus:border-[#0073ea]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Workspace Color Theme
                </label>
                <div className="flex items-center gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className="w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center"
                      style={{
                        backgroundColor: c,
                        transform: selectedColor === c ? "scale(1.25)" : "scale(1)",
                        boxShadow: selectedColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0"
                  style={{ backgroundColor: selectedColor }}
                >
                  {name.trim() ? name.trim().charAt(0).toUpperCase() : "W"}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {name.trim() || "Preview Workspace"}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Includes default space, statuses, and tasks list
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0073ea] hover:bg-[#0060c4] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Create Workspace
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
