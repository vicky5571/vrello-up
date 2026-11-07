"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import { motion, LayoutGroup, useReducedMotion } from "framer-motion";
import { Layers, Store, MapPin, CalendarDays, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/types";

interface BottomTabItem {
  id: string;
  label: string;
  icon: typeof Layers;
  activeColor: string;
  isActive: (activeView: ViewMode, isSidebarOpen: boolean) => boolean;
  onClick: (helpers: {
    setActiveView: (view: ViewMode) => void;
    setAppMode: (mode: "tasks" | "marcom") => void;
    toggleSidebar: () => void;
  }) => void;
}

const BOTTOM_TABS: BottomTabItem[] = [
  {
    id: "pipeline",
    label: "Pipeline",
    icon: Layers,
    activeColor: "text-indigo-500 dark:text-indigo-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "pipeline",
    onClick: ({ setActiveView, setAppMode }) => { setAppMode("marcom"); setActiveView("pipeline"); },
  },
  {
    id: "outlets",
    label: "Outlets",
    icon: Store,
    activeColor: "text-violet-500 dark:text-violet-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "outlets",
    onClick: ({ setActiveView, setAppMode }) => { setAppMode("marcom"); setActiveView("outlets"); },
  },
  {
    id: "placements",
    label: "Placements",
    icon: MapPin,
    activeColor: "text-emerald-500 dark:text-emerald-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "placements",
    onClick: ({ setActiveView, setAppMode }) => { setAppMode("marcom"); setActiveView("placements"); },
  },
  {
    id: "events",
    label: "Events",
    icon: CalendarDays,
    activeColor: "text-blue-500 dark:text-blue-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "events",
    onClick: ({ setActiveView, setAppMode }) => { setAppMode("marcom"); setActiveView("events"); },
  },
  {
    id: "menu",
    label: "Menu",
    icon: Menu,
    activeColor: "text-amber-500 dark:text-amber-400",
    isActive: (_view, isSidebarOpen) => isSidebarOpen,
    onClick: ({ toggleSidebar }) => toggleSidebar(),
  },
];

export function MobileBottomNav() {
  const { activeView, isSidebarOpen } = useWorkspaceStore(
    useShallow((s) => ({
      activeView: s.activeView,
      isSidebarOpen: s.isSidebarOpen,
    })),
  );

  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
  const setAppMode = useWorkspaceStore((s) => s.setAppMode);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const shouldReduceMotion = useReducedMotion();

  const helpers = { setActiveView, setAppMode, toggleSidebar };

  return (
    <nav
      data-testid="mobile-bottom-nav"
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden h-14 bg-white/95 dark:bg-[#0F1115]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 shadow-lg select-none pb-[env(safe-area-inset-bottom)] flex items-center justify-around px-1"
    >
      <LayoutGroup id="mobile-bottom-nav">
        {BOTTOM_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive(activeView, isSidebarOpen);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => tab.onClick(helpers)}
              className={cn(
                "relative flex-1 h-full py-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-xl cursor-pointer group transition-colors",
                active
                  ? "text-slate-900 dark:text-white font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
              )}
            >
              {active && (
                <motion.div
                  layoutId="activeMobileBottomTab"
                  className="absolute inset-y-1 inset-x-0.5 bg-slate-100/90 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 shadow-2xs rounded-xl"
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 30 }
                  }
                />
              )}
              <motion.div
                whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
                className="relative z-10 flex flex-col items-center justify-center gap-0.5"
              >
                <div className="flex items-center justify-center">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-transform group-hover:scale-105",
                      active ? tab.activeColor : "text-slate-400 dark:text-slate-400",
                    )}
                  />
                </div>
                <span className="text-[10.5px] font-medium leading-none mt-0.5">{tab.label}</span>
              </motion.div>
            </button>
          );
        })}
      </LayoutGroup>
    </nav>
  );
}
