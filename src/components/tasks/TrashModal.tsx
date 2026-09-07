"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { RotateCcw, Trash2, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";

function deletedAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms) || ms < 0) return "just now";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

/**
 * Trash bin for soft-deleted tasks: restore within 30 days or delete
 * forever. Opened from the Sidebar footer, the command palette, or the
 * expired-Undo toast path.
 */
export function TrashModal() {
  const {
    isTrashOpen,
    setTrashOpen,
    trash,
    workspaces,
    restoreTasks,
    permanentlyDeleteTask,
    emptyTrash,
    purgeExpiredTrash,
  } = useWorkspaceStore();

  // Drop retention-expired entries whenever the bin is opened.
  useEffect(() => {
    if (isTrashOpen) purgeExpiredTrash();
  }, [isTrashOpen, purgeExpiredTrash]);

  const close = () => setTrashOpen(false);

  const listNameFor = (listId: string): string => {
    for (const w of workspaces) {
      for (const s of w.spaces) {
        const direct = s.lists.find((l) => l.id === listId);
        if (direct) return `${s.name} / ${direct.name}`;
        for (const f of s.folders) {
          const nested = f.lists.find((l) => l.id === listId);
          if (nested) return `${s.name} / ${f.name} / ${nested.name}`;
        }
      }
    }
    return "Unknown list";
  };

  const handleRestore = (id: string, title: string) => {
    const restored = restoreTasks([id]);
    if (restored > 0) {
      toast.success(`Restored "${title}"`);
    } else {
      toast.error("Could not restore task");
    }
  };

  const handleDeleteForever = (id: string, title: string) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Permanently delete "${title}"? This cannot be undone.`)
    ) {
      return;
    }
    permanentlyDeleteTask(id);
    toast.success("Task permanently deleted");
  };

  const handleEmpty = () => {
    if (trash.length === 0) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Permanently delete all ${trash.length} trashed tasks? This cannot be undone.`,
      )
    ) {
      return;
    }
    emptyTrash();
    toast.success("Trash emptied");
  };

  return (
    <Modal
      isOpen={isTrashOpen}
      onClose={close}
      label="Trash"
      showCloseButton={false}
      panelClassName="max-w-lg flex flex-col max-h-[70vh]"
    >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Trash
                <span className="ml-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {trash.length} {trash.length === 1 ? "task" : "tasks"}
                </span>
              </h2>
              <div className="flex items-center gap-1">
                {trash.length > 0 && (
                  <button
                    type="button"
                    onClick={handleEmpty}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    Empty trash
                  </button>
                )}
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close trash"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {trash.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                  <Trash2 className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                  <p className="font-medium">Trash is empty</p>
                  <p className="text-[11px] mt-0.5">
                    Deleted tasks stay here for 30 days before they&apos;re
                    removed automatically.
                  </p>
                </div>
              ) : (
                trash.map(({ task, deletedAt }) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {listNameFor(task.listId)} · deleted {deletedAgo(deletedAt)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestore(task.id, task.title)}
                      title="Restore task"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteForever(task.id, task.title)}
                      title="Delete forever"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
    </Modal>
  );
}
