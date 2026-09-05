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

export function GlobalRail() {
  const { isSidebarOpen, toggleSidebar } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<string>("home");

  const NAV_ITEMS = [
    { id: "home", label: "Home", icon: Home },
    { id: "planner", label: "Planner", icon: CalendarClock },
    { id: "ai", label: "AI", icon: Sparkles },
    { id: "teams", label: "Teams", icon: Users },
    { id: "more", label: "More", icon: Grid3X3 },
  ];

  return (
    <aside className="w-[52px] shrink-0 h-screen bg-[#0F1115] text-slate-400 flex flex-col items-center py-2.5 justify-between border-r border-[#202328] select-none z-30">
      {/* Top Section: Toggle & Navigation */}
      <div className="flex flex-col items-center w-full gap-1">
        {/* Sidebar Toggle */}
        <button
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
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-11 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer group",
                isActive
                  ? "text-white bg-white/10 shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-105",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200",
                  item.id === "ai" && "text-violet-400 group-hover:text-violet-300"
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
          onClick={() => {}}
          title="Invite members"
          className="w-11 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span className="leading-none">Invite</span>
        </button>

        <button
          onClick={() => {}}
          title="Upgrade plan"
          className="w-11 py-1.5 flex flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-colors cursor-pointer"
        >
          <Gem className="w-4 h-4 text-amber-400" />
          <span className="leading-none">Upgrade</span>
        </button>
      </div>
    </aside>
  );
}
