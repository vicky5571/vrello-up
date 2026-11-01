"use client";

import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { canAccessUserManagement } from "@/lib/marcom/guards";
import { motion, AnimatePresence } from "framer-motion";

function ViewFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-blue-500 animate-spin" />
    </div>
  );
}

const ProjectsBoardView = dynamic(
  () => import("@/components/views/ProjectsView/ProjectsBoardView").then((m) => m.ProjectsBoardView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const ProjectsListView = dynamic(
  () => import("@/components/views/ProjectsView/ProjectsListView").then((m) => m.ProjectsListView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const ProjectsCalendarView = dynamic(
  () => import("@/components/views/ProjectsView/ProjectsCalendarView").then((m) => m.ProjectsCalendarView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const PipelineView = dynamic(
  () => import("@/components/views/PipelineView").then((m) => m.PipelineView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const BranchesView = dynamic(
  () => import("@/components/views/BranchesView/BranchesView").then((m) => m.BranchesView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const OutletsView = dynamic(
  () => import("@/components/views/OutletsView/OutletsView").then((m) => m.OutletsView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const PlacementsView = dynamic(
  () => import("@/components/views/PlacementsView/PlacementsView").then((m) => m.PlacementsView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const MousView = dynamic(
  () => import("@/components/views/MousView/MousView").then((m) => m.MousView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const EventsView = dynamic(
  () => import("@/components/views/EventsView/EventsView").then((m) => m.EventsView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const DocumentsView = dynamic(
  () => import("@/components/views/DocumentsView/DocumentsView").then((m) => m.DocumentsView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const ReportsView = dynamic(
  () => import("@/components/views/ReportsView/ReportsView").then((m) => m.ReportsView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const AnalyticsView = dynamic(
  () => import("@/components/views/AnalyticsView/AnalyticsView").then((m) => m.AnalyticsView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const ContentPlannerView = dynamic(
  () => import("@/components/views/ContentPlannerView/ContentPlannerView").then((m) => m.ContentPlannerView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const InventoryView = dynamic(
  () => import("@/components/views/InventoryView/InventoryView").then((m) => m.InventoryView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const UsersView = dynamic(
  () => import("@/components/views/UsersView/UsersView").then((m) => m.UsersView),
  { ssr: false, loading: () => <ViewFallback /> },
);
const ProfileView = dynamic(
  () => import("@/components/views/ProfileView/ProfileView").then((m) => m.ProfileView),
  { ssr: false, loading: () => <ViewFallback /> },
);

export function ActiveViewStage() {
  const activeView = useWorkspaceStore((s) => s.activeView);
  const { data: session } = useSession();
  const canManageUsers = canAccessUserManagement(session?.user?.role);

  const renderActiveView = () => {
    switch (activeView as string) {
      case "board":
        return <ProjectsBoardView />;
      case "list":
        return <ProjectsListView />;
      case "calendar":
        return <ProjectsCalendarView />;
      case "pipeline":
        return <PipelineView />;
      case "branches":
        return <BranchesView />;
      case "outlets":
        return <OutletsView />;
      case "placements":
        return <PlacementsView />;
      case "mous":
      case "mou":
        return <MousView />;
      case "content-planner":
      case "content":
        return <ContentPlannerView />;
      case "events":
        return <EventsView />;
      case "inventory":
        return <InventoryView />;
      case "documents":
        return <DocumentsView />;
      case "reports":
        return <ReportsView />;
      case "analytics":
        return <AnalyticsView />;
      case "users":
        return canManageUsers ? <UsersView /> : <ProjectsBoardView />;
      case "profile":
        return <ProfileView />;
      default:
        return <ProjectsBoardView />;
    }
  };

  return (
    <div className="flex-1 overflow-hidden relative bg-[#FAFBFC] dark:bg-[#121316]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.08 }}
          className="h-full w-full"
        >
          {renderActiveView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
