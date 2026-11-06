"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROJECTS_NAV_ITEMS,
  MARCOM_WORK_ITEMS,
  MARCOM_MASTER_DATA,
} from "./navConfig";
import { AppModeSegmentedControl } from "./AppModeSegmentedControl";
import { shouldRenderSidebar } from "./layoutHierarchyHelpers";
import { HelpDocsModal } from "@/components/modals/HelpDocsModal";

export function Sidebar() {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const {
    appMode,
    activeView,
    isSidebarOpen,
    isHelpDocsOpen,
  } = useWorkspaceStore(
    useShallow((s) => ({
      appMode: s.appMode,
      activeView: s.activeView,
      isSidebarOpen: s.isSidebarOpen,
      isHelpDocsOpen: s.isHelpDocsOpen,
    })),
  );

  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
  const setHelpDocsOpen = useWorkspaceStore((s) => s.setHelpDocsOpen);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);

  const handleSelectView = (viewId: string) => {
    setActiveView(viewId as any);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  if (!shouldRenderSidebar(activeView)) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {/* Mobile overlay backdrop */}
        {isSidebarOpen && isMobile && (
          <motion.div
            key="mobile-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.24, ease: [0.2, 0, 0, 1] }
            }
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-2xs"
          />
        )}

        {isSidebarOpen && (
          <motion.aside
            key="sidebar-aside"
            initial={isMobile && !shouldReduceMotion ? { x: "-100%" } : false}
            animate={{ x: 0 }}
            exit={isMobile && !shouldReduceMotion ? { x: "-100%" } : undefined}
            transition={
              shouldReduceMotion || !isMobile
                ? { duration: 0 }
                : { type: "tween", duration: 0.24, ease: [0.2, 0, 0, 1] }
            }
            className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] md:static md:z-20 md:w-60 md:h-full rounded-r-2xl md:rounded-2xl border-r md:border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18191B] shadow-2xl md:shadow-lg flex flex-col justify-between shrink-0 select-none overflow-hidden"
          >
            {/* Mode Switcher Segmented Control */}
            <AppModeSegmentedControl />

        {/* Navigation Body */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {appMode === "tasks" ? (
            <div>
              <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                Work Item Views
              </div>
              <div className="space-y-0.5">
                {PROJECTS_NAV_ITEMS.map((item) => {
                  const isItemActive = activeView === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectView(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left",
                        isItemActive
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200/50 dark:border-blue-900/40"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200",
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", item.iconColor)} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Marcom Work Items Group */}
              <div>
                <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                  Operations & Planning
                </div>
                <div className="space-y-0.5">
                  {MARCOM_WORK_ITEMS.map((item) => {
                    const isItemActive = activeView === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectView(item.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left",
                          isItemActive
                            ? "bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 font-semibold border border-pink-200/50 dark:border-pink-900/40"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200",
                        )}
                      >
                        <Icon className={cn("w-4 h-4 shrink-0", item.iconColor)} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Master Data Group */}
              <div>
                <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                  Master Data & Intelligence
                </div>
                <div className="space-y-0.5">
                  {MARCOM_MASTER_DATA.map((item) => {
                    const isItemActive = activeView === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectView(item.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left",
                          isItemActive
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200",
                        )}
                      >
                        <Icon className={cn("w-4 h-4 shrink-0", item.iconColor)} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-start text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setHelpDocsOpen(true)}
            className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>Help & Docs</span>
          </button>
        </div>
      </motion.aside>
      )}
      </AnimatePresence>

      {/* Modals */}
      <HelpDocsModal
        isOpen={isHelpDocsOpen}
        onClose={() => setHelpDocsOpen(false)}
      />
    </>
  );
}
