"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Palette, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";

const DEFAULT_STATUS_COLOR = "#3B82F6";

interface CreateStatusModalProps {
  isOpen: boolean;
  spaceId: string;
  onClose: () => void;
}

export function CreateStatusModal({
  isOpen,
  spaceId,
  onClose,
}: CreateStatusModalProps) {
  const { addStatusToSpace } = useWorkspaceStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_STATUS_COLOR);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setColor(DEFAULT_STATUS_COLOR);
    }
  }, [isOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    addStatusToSpace(spaceId, trimmedName, color);
    toast.success(`Status "${trimmedName}" created`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close create status dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 cursor-default bg-slate-950/60 backdrop-blur-xs"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-status-title"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2
                id="create-status-title"
                className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100"
              >
                <Palette className="h-4 w-4 text-[#7B68EE]" aria-hidden="true" />
                Create New Status
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close create status dialog"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="status-name"
                  className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Status name
                </label>
                <input
                  id="status-name"
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. BLOCKED or READY FOR QA"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#7B68EE] dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="status-color"
                  className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Status color
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80">
                  <input
                    id="status-color"
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    aria-label="Choose status color"
                    className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="font-mono text-xs uppercase text-slate-500 dark:text-slate-400">
                    {color}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#1E1F21] dark:bg-white px-5 py-2 text-xs font-bold text-white dark:text-[#1E1F21] shadow-md hover:bg-black dark:hover:bg-slate-200 transition-colors"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create Status
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
