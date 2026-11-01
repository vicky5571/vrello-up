"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Home,
  CalendarDays,
  Sparkles,
  Users,
  Grid3X3,
  ChevronsLeft,
  ChevronsRight,
  Kanban,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import { MoreAppsMenu } from "@/components/modals/MoreAppsMenu";
import { usePendingUsers } from "@/lib/marcom/usePendingUsers";
import { formatPendingBadgeCount } from "@/lib/marcom/pendingUsersHelpers";
import { canAccessUserManagement } from "@/lib/marcom/guards";

export function GlobalRail() {
  const { data: session } = useSession();

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

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const canManageUsers = canAccessUserManagement(session?.user?.role);
  const { pendingUsersCount } = usePendingUsers({ isAdmin: canManageUsers });

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
    ...(canManageUsers
      ? [
          {
            id: "users",
            label: "Users",
            icon: Users,
            isActive: activeView === "users",
            badge: pendingUsersCount,
            onClick: () => setActiveView("users"),
          },
        ]
      : []),
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
          {/* App Mode Switcher (only visible when sidebar is minimized) */}
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

                  {/* Marcom Hub Mode Toggle */}
                  <motion.button
                    type="button"
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
                    onClick={() => setAppMode("marcom")}
                    title="Marcom Hub"
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
            const badgeText = "badge" in item && typeof item.badge === "number" ? formatPendingBadgeCount(item.badge) : null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={cn(
                  "relative w-11 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer group",
                  isActive
                    ? "text-white bg-white/10 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5",
                )}
              >
                <div className="relative flex items-center justify-center">
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
                  {badgeText && (
                    <span
                      data-testid="users-pending-badge"
                      className="absolute -top-1.5 -right-2.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-rose-500 text-white text-[9px] leading-none font-bold flex items-center justify-center ring-2 ring-[#0F1115] shadow-xs"
                    >
                      {badgeText}
                    </span>
                  )}
                </div>
                <span className="leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <MoreAppsMenu
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
      />
    </>
  );
}
