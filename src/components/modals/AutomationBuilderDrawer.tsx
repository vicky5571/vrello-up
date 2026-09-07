"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Zap,
  ArrowRight,
  FileCheck2,
  CalendarClock,
  Flame,
  CheckCircle2,
  ListChecks,
  AlertTriangle,
  Briefcase,
  Bell,
  UserCheck,
  ArrowRightCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import type { AutomationTrigger, AutomationAction } from "@/types";

interface AutomationBuilderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TriggerOption {
  id: AutomationTrigger;
  domain: "marcom" | "task";
  title: string;
  subtitle: string;
  icon: typeof FileCheck2;
  badge: string;
  badgeClass: string;
}

interface ActionOption {
  id: AutomationAction;
  title: string;
  subtitle: string;
  icon: typeof Briefcase;
}

const TRIGGER_OPTIONS: TriggerOption[] = [
  {
    id: "mou:approved",
    domain: "marcom",
    title: "When MOU status changes to Approved",
    subtitle: "Triggers as soon as an executive or manager approves a partnership MOU",
    icon: FileCheck2,
    badge: "Marcom",
    badgeClass: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  {
    id: "event:in_3_days",
    domain: "marcom",
    title: "When Event date is in 3 days",
    subtitle: "Triggers 72 hours prior to a scheduled promotional campaign or event",
    icon: CalendarClock,
    badge: "Marcom",
    badgeClass: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  },
  {
    id: "task:priority_urgent",
    domain: "task",
    title: "When Task Priority changes to Urgent",
    subtitle: "Triggers whenever any card is prioritized or escalated to Urgent",
    icon: Flame,
    badge: "Task",
    badgeClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  {
    id: "task:status_done",
    domain: "task",
    title: "When Task Status changes to Complete",
    subtitle: "Triggers when a task transitions into Done or Completed category",
    icon: CheckCircle2,
    badge: "Task",
    badgeClass: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  {
    id: "task:subtasks_completed",
    domain: "task",
    title: "When all subtasks are finished",
    subtitle: "Triggers when 100% of checklist items on a task are checked off",
    icon: ListChecks,
    badge: "Task",
    badgeClass: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  },
  {
    id: "task:overdue",
    domain: "task",
    title: "When Due Date passes without completion",
    subtitle: "Triggers when an open task is overdue beyond its deadline",
    icon: AlertTriangle,
    badge: "Task",
    badgeClass: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  },
];

const ACTION_OPTIONS: ActionOption[] = [
  {
    id: "create_field_ops_task",
    title: "Automatically create setup task in Field Operations assigned to branch PIC",
    subtitle: "Generates execution card with standard outreach & equipment verification checklist",
    icon: Briefcase,
  },
  {
    id: "notify_marcom_lead_high",
    title: "Notify Marcom Lead & flag priority to High",
    subtitle: "Escalates priority level and logs urgent activity notification in the audit stream",
    icon: Bell,
  },
  {
    id: "assign_lead_architect_today",
    title: "Assign to Lead Architect & set missing Due Date to Today",
    subtitle: "Instantly assigns project owner and enforces today as deadline",
    icon: UserCheck,
  },
  {
    id: "advance_status_review",
    title: "Advance task status from In Progress to In Review",
    subtitle: "Moves card across Kanban board into review/QA status automatically",
    icon: ArrowRightCircle,
  },
];

export function AutomationBuilderDrawer({
  isOpen,
  onClose,
}: AutomationBuilderDrawerProps) {
  const { addCustomAutomation } = useWorkspaceStore();

  const [selectedTrigger, setSelectedTrigger] = useState<AutomationTrigger>("mou:approved");
  const [selectedAction, setSelectedAction] = useState<AutomationAction>("create_field_ops_task");
  const [customName, setCustomName] = useState("");
  const [domainFilter, setDomainFilter] = useState<"all" | "marcom" | "task">("all");

  const activeTrigger = TRIGGER_OPTIONS.find((t) => t.id === selectedTrigger)!;
  const activeAction = ACTION_OPTIONS.find((a) => a.id === selectedAction)!;

  const filteredTriggers = TRIGGER_OPTIONS.filter((t) => {
    if (domainFilter === "all") return true;
    return t.domain === domainFilter;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultName =
      selectedTrigger === "mou:approved" && selectedAction === "create_field_ops_task"
        ? "Auto-create Field Ops Setup on Approved MOU"
        : selectedTrigger === "event:in_3_days"
          ? "3-Day Event Warning & Lead Escalation"
          : `${activeTrigger.title.replace("When ", "")} → ${activeAction.title.slice(0, 30)}...`;

    const ruleName = customName.trim() || defaultName;

    addCustomAutomation({
      name: ruleName,
      trigger: selectedTrigger,
      action: selectedAction,
      enabled: true,
    });

    toast.success(`Created automation: "${ruleName}"`);
    setCustomName("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative z-10 w-full max-w-2xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    IFTTT Automation Builder
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      Recipe
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Connect triggers and actions across Marcom operations and task boards
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Step 1: TRIGGER (IF) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                      1
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                      IF (When this trigger fires...)
                    </h3>
                  </div>

                  {/* Domain Filter Pills */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                    {(["all", "marcom", "task"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDomainFilter(d)}
                        className={`px-2.5 py-0.5 rounded-md font-semibold capitalize transition-all cursor-pointer ${
                          domainFilter === d
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        {d === "all" ? "All Domains" : d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {filteredTriggers.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedTrigger === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedTrigger(option.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {option.title}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${option.badgeClass}`}
                            >
                              {option.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {option.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visual Flow Indicator */}
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-bold">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                  <span>THEN AUTOMATICALLY</span>
                </div>
              </div>

              {/* Step 2: ACTION (THEN) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                    2
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    THEN (Execute this action...)
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {ACTION_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedAction === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedAction(option.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block mb-0.5">
                            {option.title}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {option.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Recipe Preview & Name */}
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Recipe Flow Preview</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                  <div className="flex-1 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200">
                    <span className="text-[10px] font-bold text-blue-500 block uppercase">IF Trigger</span>
                    {activeTrigger.title}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 mx-auto hidden sm:block shrink-0" />
                  <div className="flex-1 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200">
                    <span className="text-[10px] font-bold text-emerald-500 block uppercase">THEN Action</span>
                    {activeAction.title}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Recipe Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Auto Setup on Approved MOU"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Submit / Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Create Automation Recipe</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
