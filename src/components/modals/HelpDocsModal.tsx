"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  Keyboard,
  Sparkles,
  Search,
  Kanban,
  ListTodo,
  Calendar,
  Layers,
  Zap,
  Bot,
  HelpCircle,
} from "lucide-react";

interface HelpDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "⌘ / Ctrl + K", label: "Open Command Palette & Global Search" },
  { key: "N / C", label: "Create New Task" },
  { key: "Space", label: "Toggle Task Slide-Over Drawer" },
  { key: "1 - 5", label: "Quick Switch Views (List, Board, Calendar, Gantt, Home)" },
  { key: "Marketing tabs", label: "Open Branches, Outlets, MOUs, Placements, Events, Documents, Reports, Analytics (tab bar or ⌘/Ctrl + K search)" },
  { key: "Esc", label: "Close Active Modal / Drawer" },
  { key: "?", label: "Open Help & Documentation" },
  { key: "⌘ + Shift + F", label: "Toggle Workspace Filter Bar" },
];

const GUIDES = [
  {
    icon: ListTodo,
    title: "Interactive List & Table View",
    desc: "Group tasks by Status, Priority, or Assignee. Inline edit task titles, change priorities with single clicks, and toggle closed items.",
  },
  {
    icon: Kanban,
    title: "Kanban Drag & Drop Board",
    desc: "Organize sprint backlogs across status swimlanes. Drag cards between columns with live order index synchronization.",
  },
  {
    icon: Calendar,
    title: "Calendar View",
    desc: "Schedule milestone deliverables and visualize task due dates across monthly and weekly calendar grids.",
  },
  {
    icon: Layers,
    title: "Gantt Timeline & Dependencies",
    desc: "Track task timelines with cycle-detection-safe dependency links, start dates, and duration progress.",
  },
  {
    icon: Bot,
    title: "Brain² & Autonomous Agents",
    desc: "AI-assisted triage, blocker watchdogs, automated sprint summaries, and code security audits built right into your workspace.",
  },
  {
    icon: Zap,
    title: "Automations Engine",
    desc: "Configure event-driven recipes: auto-assign urgent tasks, notify reviewers on status changes, and synchronize subtask checklists.",
  },
];

export function HelpDocsModal({ isOpen, onClose }: HelpDocsModalProps) {
  const [activeTab, setActiveTab] = useState<"shortcuts" | "guides">("shortcuts");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredShortcuts = SHORTCUTS.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGuides = GUIDES.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Help & Documentation
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Keyboard shortcuts, feature guides, and workspace documentation
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

            {/* Search & Tabs */}
            <div className="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search shortcuts & guides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1 w-full sm:w-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("shortcuts")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "shortcuts"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Keyboard className="w-3.5 h-3.5" />
                    Shortcuts
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("guides")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "guides"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Guides
                  </span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-5 overflow-y-auto max-h-[55vh] space-y-3">
              {activeTab === "shortcuts" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredShortcuts.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium pr-2">
                        {s.label}
                      </span>
                      <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-200 shadow-2xs shrink-0">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                  {filteredShortcuts.length === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 col-span-2 py-6 text-center">
                      No shortcuts found matching &quot;{searchQuery}&quot;
                    </p>
                  )}
                </div>
              )}

              {activeTab === "guides" && (
                <div className="space-y-3">
                  {filteredGuides.map((g, idx) => {
                    const Icon = g.icon;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                            <Icon className="w-4 h-4" />
                          </div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {g.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-8">
                          {g.desc}
                        </p>
                      </div>
                    );
                  })}
                  {filteredGuides.length === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                      No guides found matching &quot;{searchQuery}&quot;
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Vrello Up v0.1.0 • Modern Workspace Engine
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
