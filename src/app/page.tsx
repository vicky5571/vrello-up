"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { GlobalRail } from "@/components/layout/GlobalRail";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { FilterBar } from "@/components/layout/FilterBar";
import { ListView } from "@/components/views/ListView/ListView";
import { HomeView } from "@/components/views/HomeView/HomeView";
import { ChannelView } from "@/components/views/ChannelView/ChannelView";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { useWorkspaceHotkeys } from "@/lib/hooks/useWorkspaceHotkeys";
import { startAutomationScheduler } from "@/lib/automations/scheduler";
import { motion, AnimatePresence } from "framer-motion";

function ViewFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-[#7B68EE] animate-spin" />
    </div>
  );
}

const BoardView = dynamic(
  () =>
    import("@/components/views/BoardView/BoardView").then((m) => m.BoardView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const TableView = dynamic(
  () =>
    import("@/components/views/TableView/TableView").then((m) => m.TableView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const CalendarView = dynamic(
  () =>
    import("@/components/views/CalendarView/CalendarView").then(
      (m) => m.CalendarView,
    ),
  { ssr: false, loading: () => <ViewFallback /> },
);
const GanttView = dynamic(
  () =>
    import("@/components/views/GanttView/GanttView").then((m) => m.GanttView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const BranchesView = dynamic(
  () =>
    import("@/components/views/BranchesView/BranchesView").then(
      (m) => m.BranchesView,
    ),
  { ssr: false, loading: () => <ViewFallback /> },
);
const OutletsView = dynamic(
  () =>
    import("@/components/views/OutletsView/OutletsView").then(
      (m) => m.OutletsView,
    ),
  { ssr: false, loading: () => <ViewFallback /> },
);
const PlacementsView = dynamic(
  () =>
    import("@/components/views/PlacementsView/PlacementsView").then(
      (m) => m.PlacementsView,
    ),
  { ssr: false, loading: () => <ViewFallback /> },
);
const MousView = dynamic(
  () =>
    import("@/components/views/MousView/MousView").then((m) => m.MousView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const EventsView = dynamic(
  () =>
    import("@/components/views/EventsView/EventsView").then(
      (m) => m.EventsView,
    ),
  { ssr: false, loading: () => <ViewFallback /> },
);
const DocumentsView = dynamic(
  () =>
    import("@/components/views/DocumentsView/DocumentsView").then(
      (m) => m.DocumentsView,
    ),
  { ssr: false, loading: () => <ViewFallback /> },
);
const ReportsView = dynamic(
  () =>
    import("@/components/views/ReportsView/ReportsView").then(
      (m) => m.ReportsView,
    ),
  { ssr: false, loading: () => <ViewFallback /> },
);
const AnalyticsView = dynamic(
  () =>
    import("@/components/views/AnalyticsView/AnalyticsView").then(
      (m) => m.AnalyticsView,
    ),
  { ssr: false, loading: () => <ViewFallback /> },
);
const TaskDrawer = dynamic(
  () => import("@/components/tasks/TaskDrawer").then((m) => m.TaskDrawer),
  { ssr: false },
);
const AiDrawer = dynamic(
  () => import("@/components/ai/AiDrawer").then((m) => m.AiDrawer),
  { ssr: false },
);
const CommandPalette = dynamic(
  () =>
    import("@/components/layout/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);

export default function WorkspacePage() {
  const [isMounted, setIsMounted] = useState(false);
  const {
    activeView,
    isCreateTaskModalOpen,
    setCreateTaskModalOpen,
    isFilterBarOpen,
  } = useWorkspaceStore();

  useWorkspaceHotkeys();

  useEffect(() => {
    setIsMounted(true);
    return startAutomationScheduler();
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-[#F0F1F4] dark:bg-[#0C0D0F] text-slate-900 dark:text-slate-100 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-[#7B68EE] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F0F1F4] dark:bg-[#0C0D0F] p-2 gap-2 text-slate-900 dark:text-slate-100 select-none">
      {/* ClickUp Floating Dark Left Dock (Global Rail: Home, Planner, AI, Teams, More) */}
      <GlobalRail />

      {/* Floating Hierarchical Sidebar */}
      <Sidebar />

      {/* Floating Main Workspace Stage */}
      <main className="flex-1 flex flex-col min-w-0 h-full rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200/80 dark:border-white/10 shadow-lg overflow-hidden">
        {/* Top Navigation */}
        <TopNav />

        {/* Global Filter Bar (workspace views only) */}
        {activeView !== "home" && isFilterBarOpen && <FilterBar />}

        {/* View Transition Area */}
        <div className="flex-1 overflow-hidden relative bg-[#FAFBFC] dark:bg-[#121316]">
          <AnimatePresence mode="wait">
            {activeView === "home" && (
              <motion.div
                key="home-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <HomeView />
              </motion.div>
            )}
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

            {activeView === "channel" && (
              <motion.div
                key="channel-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <ChannelView />
              </motion.div>
            )}

            {activeView === "branches" && (
              <motion.div
                key="branches-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <BranchesView />
              </motion.div>
            )}

            {activeView === "outlets" && (
              <motion.div
                key="outlets-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <OutletsView />
              </motion.div>
            )}

            {activeView === "placements" && (
              <motion.div
                key="placements-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <PlacementsView />
              </motion.div>
            )}

            {activeView === "mous" && (
              <motion.div
                key="mous-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <MousView />
              </motion.div>
            )}

            {activeView === "events" && (
              <motion.div
                key="events-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <EventsView />
              </motion.div>
            )}

            {activeView === "documents" && (
              <motion.div
                key="documents-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <DocumentsView />
              </motion.div>
            )}

            {activeView === "reports" && (
              <motion.div
                key="reports-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <ReportsView />
              </motion.div>
            )}

            {activeView === "analytics" && (
              <motion.div
                key="analytics-view"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                <AnalyticsView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Slide-over Task Detail Drawer */}
      <TaskDrawer />

      {/* AI Assistant Drawer (Brain²) */}
      <AiDrawer />

      {/* Global Command Palette (⌘K Quick Switcher) */}
      <CommandPalette />

      {/* Global Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setCreateTaskModalOpen(false)}
      />
    </div>
  );
}
