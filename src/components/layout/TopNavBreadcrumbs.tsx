"use client";

import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { MARCOM_VIEW_LABELS, PROJECTS_VIEW_LABELS } from "./topNavConstants";
import {
  getGlobalBreadcrumbInfo,
  resolveWorkspaceReturnTarget,
  type GlobalBreadcrumbInfo,
} from "./layoutHierarchyHelpers";
import type { ViewMode } from "@/types";
import {
  Folder as FolderIcon,
  Megaphone,
  ArrowLeft,
  X,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export interface TopNavBreadcrumbsProps {
  variant?: "full" | "workspace-only" | "space-list";
}

export function TopNavBreadcrumbs({
  variant = "full",
}: TopNavBreadcrumbsProps) {
  const appMode = useWorkspaceStore((s) => s.appMode);
  const activeView = useWorkspaceStore((s) => s.activeView);
  const lastTaskView = useWorkspaceStore((s) => s.lastTaskView);
  const lastMarcomView = useWorkspaceStore((s) => s.lastMarcomView);
  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
  const setAppMode = useWorkspaceStore((s) => s.setAppMode);
  const navigatedFromMarcom = useWorkspaceStore((s) => s.navigatedFromMarcom);
  const setNavigatedFromMarcom = useWorkspaceStore((s) => s.setNavigatedFromMarcom);

  const renderBrandAnchor = () => (
    <div className="hidden sm:flex items-center gap-2 text-xs shrink-0">
      <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] shadow-2xs shrink-0">
        V
      </div>

      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[160px] sm:max-w-[200px]">
        Vrello
      </span>
    </div>
  );

  const renderProjectsTrail = () => (
    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 min-w-0 shrink-0">
      <div className="hidden sm:flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 shrink-0">
        <FolderIcon className="w-3.5 h-3.5 fill-blue-500/20" />
        <span className="truncate max-w-[130px] sm:max-w-[180px]">
          Projects
        </span>
      </div>

      <span className="hidden sm:inline text-slate-400 shrink-0">/</span>

      <span className="font-semibold sm:font-medium text-slate-800 dark:text-slate-100 shrink-0 truncate max-w-[140px] sm:max-w-[200px]">
        {PROJECTS_VIEW_LABELS[activeView] || activeView}
      </span>

      {navigatedFromMarcom && (
        <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => {
              const targetView = (navigatedFromMarcom.view as ViewMode) || "events";
              setNavigatedFromMarcom(null);
              setAppMode("marcom");
              setActiveView(targetView);
              toast.info(`Back to ${navigatedFromMarcom.label}`);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
            title={`Back to ${navigatedFromMarcom.label}`}
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to {navigatedFromMarcom.label}</span>
          </button>
          <button
            type="button"
            onClick={() => setNavigatedFromMarcom(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer rounded"
            title="Dismiss return shortcut"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );

  const renderMarcomTrail = () => (
    <div className="flex items-center gap-2 text-xs min-w-0 shrink-0">
      <span className="hidden sm:flex font-semibold text-pink-600 dark:text-pink-400 items-center gap-1 shrink-0">
        <Megaphone className="w-3.5 h-3.5" />
        <span className="truncate max-w-[130px] sm:max-w-[180px]">
          Marketing Hub
        </span>
      </span>

      <span className="hidden sm:inline text-slate-300 dark:text-slate-700 shrink-0">/</span>

      <span className="font-semibold sm:font-medium text-slate-800 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[200px]">
        {MARCOM_VIEW_LABELS[activeView] || "Overview"}
      </span>
    </div>
  );

  const renderGlobalTrail = (info: GlobalBreadcrumbInfo) => {
    const { targetView, targetMode, label } = resolveWorkspaceReturnTarget({
      appMode,
      lastTaskView,
      lastMarcomView,
    });

    return (
      <div className="flex items-center gap-2 text-xs min-w-0 shrink-0">
        <div className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
          {info.iconName === "user" ? (
            <User className="w-3.5 h-3.5" />
          ) : info.iconName === "users" ? (
            <Users className="w-3.5 h-3.5" />
          ) : null}
          <span className="truncate max-w-[160px] sm:max-w-[220px]">
            {info.label}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => {
              setAppMode(targetMode);
              setActiveView(targetView);
              toast.info(`Kembali ke ${label}`);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
            title={`Kembali ke ${label}`}
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Kembali ke {label}</span>
          </button>
        </div>
      </div>
    );
  };

  const globalInfo = getGlobalBreadcrumbInfo(activeView);

  if (variant === "workspace-only") {
    return renderBrandAnchor();
  }

  if (variant === "space-list") {
    return globalInfo ? renderGlobalTrail(globalInfo) : renderProjectsTrail();
  }

  // variant === "full"
  return (
    <div className="flex items-center gap-2 text-xs min-w-0">
      {renderBrandAnchor()}
      <span className="hidden sm:inline text-slate-300 dark:text-slate-700 shrink-0">/</span>
      {globalInfo
        ? renderGlobalTrail(globalInfo)
        : appMode === "marcom"
        ? renderMarcomTrail()
        : renderProjectsTrail()}
    </div>
  );
}
