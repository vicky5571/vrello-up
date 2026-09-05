"use client";

import { useState, useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { GlobalRail } from "@/components/layout/GlobalRail";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { FilterBar } from "@/components/layout/FilterBar";
import { ListView } from "@/components/views/ListView/ListView";
import { BoardView } from "@/components/views/BoardView/BoardView";
import { TableView } from "@/components/views/TableView/TableView";
import { CalendarView } from "@/components/views/CalendarView/CalendarView";
import { GanttView } from "@/components/views/GanttView/GanttView";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkspacePage() {
  const [isMounted, setIsMounted] = useState(false);
  const { activeView } = useWorkspaceStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#0F1115] text-slate-900 dark:text-slate-100 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-[#7B68EE] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#060709] dark:bg-[#060709] p-2 gap-2 text-slate-900 dark:text-slate-100 select-none">
      {/* ClickUp Floating Dark Left Dock (Global Rail: Home, Planner, AI, Teams, More) */}
      <GlobalRail />

      {/* Floating Hierarchical Sidebar */}
      <Sidebar />

      {/* Floating Main Workspace Stage */}
      <main className="flex-1 flex flex-col min-w-0 h-full rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200/80 dark:border-white/10 shadow-lg overflow-hidden">
        {/* Top Navigation */}
        <TopNav />

        {/* Global Filter Bar */}
        <FilterBar />

        {/* View Transition Area */}
        <div className="flex-1 overflow-hidden relative bg-[#FAFBFC] dark:bg-[#121316]">
          <AnimatePresence mode="wait">
            {activeView === "list" && (
              <motion.div
                key="list-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <ListView />
              </motion.div>
            )}

            {activeView === "board" && (
              <motion.div
                key="board-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <BoardView />
              </motion.div>
            )}

            {activeView === "table" && (
              <motion.div
                key="table-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <TableView />
              </motion.div>
            )}

            {activeView === "calendar" && (
              <motion.div
                key="calendar-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <CalendarView />
              </motion.div>
            )}

            {activeView === "gantt" && (
              <motion.div
                key="gantt-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <GanttView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Slide-over Task Detail Drawer */}
      <TaskDrawer />
    </div>
  );
}
