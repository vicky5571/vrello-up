"use client";

import { useState, useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { type Workspace } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Trash2, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

interface EditWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
}

export function EditWorkspaceModal({
  isOpen,
  onClose,
  workspace,
}: EditWorkspaceModalProps) {
  const { workspaces, updateWorkspace, deleteWorkspace } = useWorkspaceStore();
  const [name, setName] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setIsConfirmingDelete(false);
    }
  }, [workspace]);

  if (!workspace) return null;

  const isOnlyWorkspace = workspaces.length <= 1;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    const trimmed = name.trim();
    updateWorkspace(workspace.id, {
      name: trimmed,
      avatar: trimmed.charAt(0).toUpperCase(),
    });
    toast.success(`Workspace renamed to "${trimmed}"`);
    onClose();
  };

  const handleDelete = () => {
    if (isOnlyWorkspace) {
      toast.error("Cannot delete the only remaining workspace");
      return;
    }

    const success = deleteWorkspace(workspace.id);
    if (success) {
      toast.success(`Workspace "${workspace.name}" deleted`);
      onClose();
    } else {
      toast.error("Failed to delete workspace");
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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0073ea]" />
                Workspace Settings
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Workspace Name"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0073ea]/30 focus:border-[#0073ea]"
                />
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
                  disabled={!name.trim() || name === workspace.name}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0073ea] hover:bg-[#0060c4] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
                Danger Zone
              </div>

              {!isConfirmingDelete ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Delete Workspace
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isOnlyWorkspace
                        ? "You cannot delete the only remaining workspace."
                        : "Permanently delete this workspace and all its tasks."}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isOnlyWorkspace}
                    onClick={() => setIsConfirmingDelete(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-red-800 dark:text-red-300">
                      Are you sure? This will remove <strong>{workspace.name}</strong> and all associated spaces and tasks permanently.
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      Keep Workspace
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Confirm Delete
                    </button>
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
