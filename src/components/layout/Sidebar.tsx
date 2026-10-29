"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import {
  Settings,
  HelpCircle,
  FolderKanban,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROJECTS_NAV_ITEMS,
  MARCOM_WORK_ITEMS,
  MARCOM_MASTER_DATA,
} from "./navConfig";
import { HelpDocsModal } from "@/components/modals/HelpDocsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";

export function Sidebar() {
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
  const setAppMode = useWorkspaceStore((s) => s.setAppMode);
  const setHelpDocsOpen = useWorkspaceStore((s) => s.setHelpDocsOpen);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-2xs transition-opacity"
        />
      )}

      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 flex flex-col w-64 bg-white dark:bg-[#141721] border-r border-slate-200/80 dark:border-slate-800 transition-transform duration-200 ease-in-out select-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Workspace Brand / Header */}
        <div className="h-11 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              V
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
              Vrello
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              v2.0
            </span>
          </div>
        </div>

        {/* Mode Switcher Segmented Control */}
        <div className="p-2 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setAppMode("tasks");
                if (!["board", "list", "calendar"].includes(activeView)) {
                  setActiveView("board");
                }
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                appMode === "tasks"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Projects</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAppMode("marcom");
                if (["board", "list", "calendar"].includes(activeView)) {
                  setActiveView("pipeline");
                }
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                appMode === "marcom"
                  ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              )}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Marcom</span>
            </button>
          </div>
        </div>

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
                      onClick={() => setActiveView(item.id)}
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
                        onClick={() => setActiveView(item.id)}
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
                        onClick={() => setActiveView(item.id)}
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
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setHelpDocsOpen(true)}
            className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>Help & Docs</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Modals */}
      <HelpDocsModal
        isOpen={isHelpDocsOpen}
        onClose={() => setHelpDocsOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
