"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { GlobalRail } from "@/components/layout/GlobalRail";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { ActiveViewStage } from "@/components/views/ActiveViewStage";
import { useWorkspaceHotkeys } from "@/lib/hooks/useWorkspaceHotkeys";
import { useUrlStateSync } from "@/lib/router/useUrlStateSync";
import { MotionConfig } from "framer-motion";

const BranchDetailDrawer = dynamic(
  () => import("@/components/branches/BranchDetailDrawer").then((m) => m.BranchDetailDrawer),
  { ssr: false },
);
const CommandPalette = dynamic(
  () => import("@/components/layout/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);
const ExportCenter = dynamic(
  () => import("@/components/layout/ExportCenter").then((m) => m.ExportCenter),
  { ssr: false },
);

export default function WorkspacePage() {
  const [isMounted, setIsMounted] = useState(false);

  useWorkspaceHotkeys();
  useUrlStateSync();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-dvh w-full overflow-hidden bg-[#F0F1F4] dark:bg-[#0C0D0F] text-slate-900 dark:text-slate-100 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-[#7B68EE] animate-spin" />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh w-full overflow-hidden bg-[#F0F1F4] dark:bg-[#0C0D0F] p-2 gap-2 text-slate-900 dark:text-slate-100">
        {/* Skip link for accessibility */}
        <a
          href="#workspace-main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-indigo-600 focus:px-3 focus:py-2 focus:text-xs focus:font-bold focus:text-white"
        >
          Skip to main content
        </a>

        {/* Global Rail */}
        <GlobalRail />

        {/* Hierarchical Sidebar */}
        <Sidebar />

        {/* Main Workspace Stage */}
        <main
          id="workspace-main"
          tabIndex={-1}
          className="flex-1 flex flex-col min-w-0 h-full rounded-2xl bg-white dark:bg-[#18191B] border border-slate-200/80 dark:border-white/10 shadow-lg overflow-hidden focus:outline-hidden"
        >
          <TopNav />
          <ActiveViewStage />
        </main>

        {/* Global Drawers & Modals */}
        <BranchDetailDrawer />
        <CommandPalette />
        <ExportCenter />
      </div>
    </MotionConfig>
  );
}
