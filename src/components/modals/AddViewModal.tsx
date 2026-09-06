"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { ViewMode } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  List as ListIcon,
  Kanban,
  TableProperties,
  CalendarDays,
  Milestone,
  Hash,
  Sparkles,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface AddViewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_VIEWS = [
  {
    id: "list" as ViewMode,
    label: "List View",
    icon: ListIcon,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    desc: "Organize tasks with flexible grouping by status, priority, or assignee.",
  },
  {
    id: "board" as ViewMode,
    label: "Board (Kanban)",
    icon: Kanban,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    desc: "Visualize workflow stages across status columns with fluid drag-and-drop.",
  },
  {
    id: "table" as ViewMode,
    label: "Table View",
    icon: TableProperties,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    desc: "Dense spreadsheet view with inline editing, custom fields, and fast sorting.",
  },
  {
    id: "calendar" as ViewMode,
    label: "Calendar Planner",
    icon: CalendarDays,
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    desc: "Schedule milestone deliverables and visualize task deadlines by month.",
  },
  {
    id: "gantt" as ViewMode,
    label: "Gantt Timeline",
    icon: Milestone,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    desc: "Track timelines, durations, and cycle-detection-safe task dependencies.",
  },
  {
    id: "channel" as ViewMode,
    label: "Channel View",
    icon: Hash,
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    desc: "Real-time list discussion stream with instant AI assistant (@ai) integration.",
  },
  {
    id: "home" as ViewMode,
    label: "Executive Home",
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    desc: "Personalized mission control with task queues, recents, and workspace stats.",
  },
];

export function AddViewModal({ isOpen, onClose }: AddViewModalProps) {
  const { activeView, setActiveView } = useWorkspaceStore();

  const handleSelectView = (viewId: ViewMode, viewLabel: string) => {
    setActiveView(viewId);
    toast.success(`Switched to ${viewLabel}`);
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
            className="relative z-10 w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Add or Configure View
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select a view layout to add to this workspace list
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 max-h-[60vh] overflow-y-auto">
              {AVAILABLE_VIEWS.map((v) => {
                const Icon = v.icon;
                const isActive = activeView === v.id;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectView(v.id, v.label)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-500/50 shadow-2xs ring-1 ring-indigo-500/30"
                        : "border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${v.bg} ${v.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {v.label}
                        </span>
                      </div>
                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded-md">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {v.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
