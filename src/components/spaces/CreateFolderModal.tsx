"use client";

import { useState, useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { motion, AnimatePresence } from "framer-motion";
import { X, FolderPlus, Folder, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface CreateFolderModalProps {
  isOpen: boolean;
  spaceId: string;
  folderId?: string;
  initialName?: string;
  onClose: () => void;
}

export function CreateFolderModal({
  isOpen,
  spaceId,
  folderId,
  initialName = "",
  onClose,
}: CreateFolderModalProps) {
  const { createFolder, updateFolder } = useWorkspaceStore();
  const [name, setName] = useState(initialName);

  const isEditing = !!folderId;

  useEffect(() => {
    setName(initialName);
  }, [initialName, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Folder name is required");
      return;
    }

    if (isEditing && folderId) {
      updateFolder(spaceId, folderId, name.trim());
      toast.success(`Folder renamed to "${name.trim()}"`);
    } else {
      createFolder(spaceId, name.trim());
      toast.success(`Folder "${name.trim()}" created!`);
    }

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
            exit={{ opacity: 0, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {isEditing ? (
                  <Edit2 className="w-4 h-4 text-amber-500" />
                ) : (
                  <FolderPlus className="w-4 h-4 text-amber-500" />
                )}
                {isEditing ? "Rename Folder" : "Create New Folder"}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sprint 43, Q3 Deliverables"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Folder className="w-3.5 h-3.5" />
                  {isEditing ? "Save" : "Create Folder"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
