"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  Calendar,
  Milestone,
  TableProperties,
  List as ListIcon,
  Kanban,
  Home,
  Plus,
  Users,
  UserPlus,
  Moon,
  Sun,
  X,
  Grid3X3,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useTheme } from "next-themes";
import { ViewMode } from "@/types";

interface MoreAppsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTeams: () => void;
  onOpenInvite: () => void;
}

export function MoreAppsMenu({
  isOpen,
  onClose,
  onOpenTeams,
  onOpenInvite,
}: MoreAppsMenuProps) {
  const {
    openCommandPalette,
    setAiDrawerOpen,
    setActiveView,
    setCreateTaskModalOpen,
  } = useWorkspaceStore();
  const { theme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleLaunchView = (view: ViewMode) => {
    setActiveView(view);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-start pointer-events-none pl-16">
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-auto w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-[#7B68EE]" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Quick Tools & Apps
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Main Tools */}
            <div className="py-2.5 space-y-1 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openCommandPalette();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-[#0073ea]" />
                  <span className="font-semibold">Command Palette</span>
                </div>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  ⌘K
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  setAiDrawerOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="font-semibold">Brain² AI Assistant</span>
                </div>
                <span className="text-[10px] font-bold text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded">
                  AI
                </span>
              </button>
            </div>

            {/* Quick View Switchers */}
            <div className="py-2.5 space-y-1 border-b border-slate-100 dark:border-slate-800">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Workspaces Views
              </div>
              <div className="grid grid-cols-2 gap-1 px-1">
                <button
                  type="button"
                  onClick={() => handleLaunchView("home")}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-left"
                >
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>Home</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchView("list")}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-left"
                >
                  <ListIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchView("board")}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-left"
                >
                  <Kanban className="w-3.5 h-3.5 text-orange-500" />
                  <span>Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchView("calendar")}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-left"
                >
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  <span>Planner</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchView("gantt")}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-left"
                >
                  <Milestone className="w-3.5 h-3.5 text-purple-500" />
                  <span>Gantt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchView("table")}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-left"
                >
                  <TableProperties className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Table</span>
                </button>
              </div>
            </div>

            {/* Quick Actions & Modals */}
            <div className="pt-2 space-y-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTeams();
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Team Directory</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInvite();
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                  <span>Invite Teammate</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  setCreateTaskModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span>New Task</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>Toggle {theme === "dark" ? "Light" : "Dark"} Mode</span>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
