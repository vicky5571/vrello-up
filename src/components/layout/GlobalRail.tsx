"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Home,
  CalendarDays,
  Sparkles,
  Users,
  Grid3X3,
  UserPlus,
  ChevronsLeft,
  ChevronsRight,
  Kanban,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import { TeamsModal } from "@/components/modals/TeamsModal";
import { InviteModal } from "@/components/modals/InviteModal";

import { MoreAppsMenu } from "@/components/modals/MoreAppsMenu";

export function GlobalRail() {
  const {
    appMode,
    isSidebarOpen,
    isAiDrawerOpen,
    activeView,
  } = useWorkspaceStore(
    useShallow((s) => ({
      appMode: s.appMode,
      isSidebarOpen: s.isSidebarOpen,
      isAiDrawerOpen: s.isAiDrawerOpen,
      activeView: s.activeView,
    })),
  );

  const setAppMode = useWorkspaceStore((s) => s.setAppMode);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const setAiDrawerOpen = useWorkspaceStore((s) => s.setAiDrawerOpen);
  const setActiveView = useWorkspaceStore((s) => s.setActiveView);

  const [isTeamsOpen, setIsTeamsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  const NAV_ITEMS = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      isActive: activeView === "home",
      onClick: () => setActiveView("home"),
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: CalendarDays,
      isActive: activeView === "calendar",
      onClick: () => setActiveView("calendar"),
    },
    {
      id: "ai",
      label: "AI",
      icon: Sparkles,
      isActive: isAiDrawerOpen,
      onClick: () => setAiDrawerOpen(true),
    },
    {
      id: "teams",
      label: "Teams",
      icon: Users,
      isActive: isTeamsOpen,
      onClick: () => setIsTeamsOpen(true),
    },
    {
      id: "more",
      label: "More",
      icon: Grid3X3,
      isActive: isMoreOpen,
      onClick: () => setIsMoreOpen(!isMoreOpen),
    },
  ];

  return (
    <>
      <aside className="hidden md:flex w-[52px] shrink-0 h-full bg-[#0F1115] text-slate-400 flex-col items-center py-3 justify-between rounded-2xl border border-white/10 shadow-lg select-none z-30 overflow-hidden">
        {/* Top Section: Toggle & Navigation */}
        <div className="flex flex-col items-center w-full gap-1">
          {/* Workspace Mode Switcher (only visible when sidebar is minimized) */}
          <AnimatePresence initial={false}>
            {!isSidebarOpen && (
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.85, height: 0 }}
                animate={{ opacity: 1, scale: 1, height: "auto" }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.85, height: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.18, ease: "easeInOut" }
                }
                className="flex flex-col items-center w-full overflow-hidden"
              >
                <div className="flex flex-col items-center gap-1 p-1 mb-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  {/* Projects & Tasks Mode Toggle */}
                  <motion.button
                    type="button"
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
                    onClick={() => setAppMode("tasks")}
                    title="Projects & Tasks"
                    className={cn(
                      "relative w-9 h-8 flex items-center justify-center rounded-lg cursor-pointer group transition-colors",
                      appMode === "tasks"
                        ? "text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/10",
                    )}
                  >
                    {appMode === "tasks" && (
                      <motion.div
                        layoutId="globalRailActivePill"
                        className="absolute inset-0 bg-blue-600 rounded-lg shadow-sm shadow-blue-500/30"
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 450, damping: 32 }
                        }
                      />
                    )}
                    <Kanban className="relative z-10 w-4 h-4 transition-transform group-hover:scale-105" />
                  </motion.button>

                  {/* Marketing & Ops Mode Toggle */}
                  <motion.button
                    type="button"
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
                    onClick={() => setAppMode("marcom")}
                    title="Marketing & Ops Hub"
                    className={cn(
                      "relative w-9 h-8 flex items-center justify-center rounded-lg cursor-pointer group transition-colors",
                      appMode === "marcom"
                        ? "text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/10",
                    )}
                  >
                    {appMode === "marcom" && (
                      <motion.div
                        layoutId="globalRailActivePill"
                        className="absolute inset-0 bg-pink-600 rounded-lg shadow-sm shadow-pink-500/30"
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 450, damping: 32 }
                        }
                      />
                    )}
                    <Megaphone className="relative z-10 w-4 h-4 transition-transform group-hover:scale-105" />
                  </motion.button>
                </div>

                <div className="w-6 h-px bg-white/10 my-0.5" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar Toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="w-9 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors mb-2 cursor-pointer"
          >
            {isSidebarOpen ? (
              <ChevronsLeft className="w-4 h-4" />
            ) : (
              <ChevronsRight className="w-4 h-4" />
            )}
          </button>

          {/* Navigation Items */}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={cn(
                  "w-11 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer group",
                  isActive
                    ? "text-white bg-white/10 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-105",
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-200",
                    item.id === "ai" &&
                      "text-violet-400 group-hover:text-violet-300",
                  )}
                />
                <span className="leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Section: Invite & Upgrade */}
        <div className="flex flex-col items-center w-full gap-1 pt-2 border-t border-[#202328]">
          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            title="Invite members"
            className="w-11 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span className="leading-none">Invite</span>
          </button>

        </div>
      </aside>

      {/* Interactive Modals connected to Global Rail */}
      <TeamsModal
        isOpen={isTeamsOpen}
        onClose={() => setIsTeamsOpen(false)}
        onOpenInvite={() => setIsInviteOpen(true)}
      />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />



      <MoreAppsMenu
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        onOpenTeams={() => setIsTeamsOpen(true)}
        onOpenInvite={() => setIsInviteOpen(true)}
      />
    </>
  );
}
