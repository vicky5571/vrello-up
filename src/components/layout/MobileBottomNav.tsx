"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import { motion, useReducedMotion } from "framer-motion";
import {
  Home,
  Store,
  MapPin,
  CalendarDays,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/types";

interface BottomTabItem {
  id: string;
  label: string;
  icon: typeof Home;
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
    id: "home",
    label: "Home",
    icon: Home,
    activeColor: "text-blue-500 dark:text-blue-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "home",
    onClick: ({ setActiveView }) => setActiveView("home"),
  },
  {
    id: "outlets",
    label: "Outlets",
    icon: Store,
    activeColor: "text-violet-500 dark:text-violet-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "outlets",
    onClick: ({ setActiveView, setAppMode }) => {
      setAppMode("marcom");
      setActiveView("outlets");
    },
  },
  {
    id: "placements",
    label: "Placements",
    icon: MapPin,
    activeColor: "text-emerald-500 dark:text-emerald-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "placements",
    onClick: ({ setActiveView, setAppMode }) => {
      setAppMode("marcom");
      setActiveView("placements");
    },
  },
  {
    id: "events",
    label: "Events",
    icon: CalendarDays,
    activeColor: "text-blue-500 dark:text-blue-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "events",
    onClick: ({ setActiveView, setAppMode }) => {
      setAppMode("marcom");
      setActiveView("events");
    },
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
      {BOTTOM_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive(activeView, isSidebarOpen);

        return (
          <motion.button
            key={tab.id}
            type="button"
            whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
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
                className="absolute inset-y-1 inset-x-0.5 bg-slate-100/80 dark:bg-white/10 rounded-xl"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 450, damping: 32 }
                }
              />
            )}
            <div className="relative z-10 flex items-center justify-center">
              <Icon
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-105",
                  active ? tab.activeColor : "text-slate-400 dark:text-slate-400",
                )}
              />
            </div>
            <span className="relative z-10 text-[10.5px] font-medium leading-none mt-0.5">{tab.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
