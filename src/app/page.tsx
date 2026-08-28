"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { FilterBar } from "@/components/layout/FilterBar";
import { BoardView } from "@/components/views/BoardView/BoardView";
import { TableView } from "@/components/views/TableView/TableView";
import { CalendarView } from "@/components/views/CalendarView/CalendarView";
import { TaskDrawer } from "@/components/tasks/TaskDrawer";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkspacePage() {
  const { activeView } = useWorkspaceStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100">
      {/* Hierarchical Sidebar */}
      <Sidebar />

      {/* Main Workspace Stage */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navigation */}
        <TopNav />

        {/* Global Filter Bar */}
        <FilterBar />

        {/* View Transition Area */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
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
          </AnimatePresence>
        </div>
      </main>

      {/* Slide-over Task Detail Drawer */}
      <TaskDrawer />
    </div>
  );
}
