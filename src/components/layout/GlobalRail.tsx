"use client";

import { useState } from "react";
import {
  Home,
  CalendarClock,
  Sparkles,
  Users,
  Grid3X3,
  UserPlus,
  Gem,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { TeamsModal } from "@/components/modals/TeamsModal";
import { InviteModal } from "@/components/modals/InviteModal";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { MoreAppsMenu } from "@/components/modals/MoreAppsMenu";

export function GlobalRail() {
  const {
    isSidebarOpen,
    toggleSidebar,
    isAiDrawerOpen,
    setAiDrawerOpen,
    activeView,
    setActiveView,
  } = useWorkspaceStore();

  const [isTeamsOpen, setIsTeamsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const NAV_ITEMS = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      isActive: activeView === "home",
      onClick: () => setActiveView("home"),
    },
    {
      id: "planner",
      label: "Planner",
      icon: CalendarClock,
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

          <button
            type="button"
            onClick={() => setIsUpgradeOpen(true)}
            title="Upgrade plan"
            className="w-11 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-colors cursor-pointer"
          >
            <Gem className="w-4 h-4 text-amber-400" />
            <span className="leading-none">Upgrade</span>
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

      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
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
