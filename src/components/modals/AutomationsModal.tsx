"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";

interface AutomationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  live: boolean;
}

const INITIAL_RULES: AutomationRule[] = [
  {
    id: "rule-1",
    name: "Auto-assign Urgent Tasks",
    trigger: "When Priority changes to Urgent",
    action: "Assign to Lead Architect & set Due Date to Today",
    live: false,
  },
  {
    id: "rule-2",
    name: "Completion Notification",
    trigger: "When Status changes to Complete",
    action: "Notify all assignees & log activity timestamp",
    live: false,
  },
  {
    id: "rule-3",
    name: "Subtask Progress Sync",
    trigger: "When all subtasks are marked completed",
    action: "Advance task status from In Progress to In Review",
    live: true,
  },
  {
    id: "rule-4",
    name: "Overdue Escalation",
    trigger: "When Due Date passes without completion",
    action: "Escalate priority to Urgent & post warning in feed",
    live: false,
  },
];

export function AutomationsModal({ isOpen, onClose }: AutomationsModalProps) {
  const { automationEnabled, automationRuns, setAutomationEnabled } =
    useWorkspaceStore();

  const toggleRule = (id: string) => {
    const rule = INITIAL_RULES.find((r) => r.id === id);
    const newState = !automationEnabled[id];
    setAutomationEnabled(id, newState);
    toast.success(
      `Automation "${rule?.name ?? id}" ${newState ? "activated" : "deactivated"}`,
    );
  };

  const handleAddCustom = () => {
    toast.success("Opened Automation Recipe Builder (+ New Recipe)");
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
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    ClickUp 3.0 Automations
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      Active
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Automate task status advances, assignee assignments, and alerts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#111318] dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Rules List */}
            <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {INITIAL_RULES.map((rule) => {
                const enabled = automationEnabled[rule.id] ?? false;
                const runCount = automationRuns[rule.id] ?? 0;
                return (
                <div
                  key={rule.id}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {rule.name}
                      </span>
                      {!rule.live && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          Soon
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        • Triggered {runCount} times
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleRule(rule.id)}
                      className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative ${
                        enabled
                          ? "bg-emerald-600"
                          : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          enabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                      {rule.trigger}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium">
                      {rule.action}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Automations execute synchronously inside the Zustand event dispatcher.</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg font-semibold bg-[#111318] dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
