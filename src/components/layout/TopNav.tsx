"use client";

import { useState } from "react";
import { useWorkspaceStore, SEED_USERS } from "@/lib/store/useWorkspaceStore";
import { ViewSwitcher } from "./ViewSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { Plus, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export function TopNav() {
  const { workspaces, activeWorkspaceId, activeSpaceId, activeListId } =
    useWorkspaceStore();

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId,
  );

  let currentListName = "All Tasks";
  if (currentSpace) {
    const list =
      currentSpace.lists.find((l) => l.id === activeListId) ||
      currentSpace.folders
        .flatMap((f) => f.lists)
        .find((l) => l.id === activeListId);
    if (list) currentListName = list.name;
  }

  return (
    <>
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between gap-4 shrink-0 select-none">
        {/* Breadcrumb Info */}
        <div className="flex items-center gap-2 text-xs overflow-hidden">
          <span className="font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
            {currentWorkspace?.name}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
            {currentSpace && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentSpace.color }}
              />
            )}
            {currentSpace?.name || "Space"}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
            {currentListName}
          </span>
        </div>

        {/* Center View Switcher */}
        <div className="hidden md:flex items-center">
          <ViewSwitcher />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* New Task CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreateTaskOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </motion.button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-1">
            <UserAvatar user={SEED_USERS[0]} size="md" />
          </div>
        </div>
      </header>

      {/* Quick Task Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
      />
    </>
  );
}
