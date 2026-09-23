"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { WorkspaceMenuDropdown } from "./WorkspaceMenuDropdown";
import { MARCOM_VIEW_LABELS } from "./topNavConstants";
import type { Workspace, ViewMode } from "@/types";
import {
  ChevronDown,
  Folder as FolderIcon,
  List as ListIcon,
  Star,
  Check,
  Megaphone,
  ArrowLeft,
  X,
  Menu,
} from "lucide-react";
import { toast } from "sonner";

export interface TopNavBreadcrumbsProps {
  variant?: "full" | "workspace-only" | "space-list";
  onOpenCreateWorkspace: () => void;
  onOpenEditWorkspace: (ws: Workspace) => void;
}

export function TopNavBreadcrumbs({
  variant = "full",
  onOpenCreateWorkspace,
  onOpenEditWorkspace,
}: TopNavBreadcrumbsProps) {
  const appMode = useWorkspaceStore((s) => s.appMode);
  const activeView = useWorkspaceStore((s) => s.activeView);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activeSpaceId = useWorkspaceStore((s) => s.activeSpaceId);
  const activeListId = useWorkspaceStore((s) => s.activeListId);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const setActiveList = useWorkspaceStore((s) => s.setActiveList);
  const setActiveView = useWorkspaceStore((s) => s.setActiveView);
  const setAppMode = useWorkspaceStore((s) => s.setAppMode);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const navigatedFromMarcom = useWorkspaceStore((s) => s.navigatedFromMarcom);
  const setNavigatedFromMarcom = useWorkspaceStore((s) => s.setNavigatedFromMarcom);

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const currentSpace = currentWorkspace?.spaces.find((s) => s.id === activeSpaceId);

  const [isWsMenuOpen, setIsWsMenuOpen] = useState(false);
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const wsMenuRef = useRef<HTMLDivElement>(null);
  const listMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (wsMenuRef.current && !wsMenuRef.current.contains(target)) {
        setIsWsMenuOpen(false);
      }
      if (listMenuRef.current && !listMenuRef.current.contains(target)) {
        setIsListMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsWsMenuOpen(false);
        setIsListMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const allListsInSpace = currentSpace
    ? [
        ...currentSpace.lists,
        ...currentSpace.folders.flatMap((f) => f.lists),
      ]
    : [];

  let currentListName = "All Tasks";
  if (currentSpace) {
    if (!activeListId) {
      currentListName = "All Tasks";
    } else {
      const list =
        currentSpace.lists.find((l) => l.id === activeListId) ||
        currentSpace.folders
          .flatMap((f) => f.lists)
          .find((l) => l.id === activeListId);
      if (list) currentListName = list.name;
    }
  }

  const toggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    toast.success(
      next
        ? `Added "${currentListName}" to Favorites`
        : `Removed "${currentListName}" from Favorites`,
    );
  };

  const renderWorkspaceAnchor = () => (
    <div className="flex items-center gap-2 text-xs shrink-0">
      <button
        type="button"
        onClick={toggleSidebar}
        title="Open navigation"
        className="md:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] shadow-2xs shrink-0">
        {currentWorkspace?.avatar || "V"}
      </div>

      <div ref={wsMenuRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setIsWsMenuOpen(!isWsMenuOpen)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <span className="truncate max-w-[160px] sm:max-w-[200px]">
            {currentWorkspace?.name || "Acme Workspace"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {isWsMenuOpen && (
          <WorkspaceMenuDropdown
            workspaces={workspaces}
            currentWorkspaceId={currentWorkspace?.id}
            onSelectWorkspace={(id) => {
              setActiveWorkspace(id);
              setIsWsMenuOpen(false);
            }}
            onClose={() => setIsWsMenuOpen(false)}
            onOpenEditWorkspace={(ws) => {
              setIsWsMenuOpen(false);
              onOpenEditWorkspace(ws);
            }}
            onOpenCreateWorkspace={() => {
              setIsWsMenuOpen(false);
              onOpenCreateWorkspace();
            }}
          />
        )}
      </div>
    </div>
  );

  const renderSpaceListBreadcrumb = () => (
    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 min-w-0 shrink-0">
      <div className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 shrink-0">
        <FolderIcon className="w-3.5 h-3.5 fill-blue-500/20" />
        <span className="truncate max-w-[130px] sm:max-w-[180px]">
          {currentSpace?.name || "Team Space"}
        </span>
      </div>

      <span className="text-slate-400 shrink-0">/</span>

      <div ref={listMenuRef} className="relative flex items-center shrink-0">
        <button
          type="button"
          onClick={() => setIsListMenuOpen(!isListMenuOpen)}
          className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-100 hover:text-[#0073ea] transition-colors cursor-pointer"
        >
          <ListIcon className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate max-w-[130px] sm:max-w-[180px]">
            {currentListName}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isListMenuOpen && allListsInSpace.length > 0 && (
          <div className="absolute left-0 top-full mt-1.5 w-56 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Lists in {currentSpace?.name}
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveList(null);
                setIsListMenuOpen(false);
                toast.success(`Switched to all tasks in "${currentSpace?.name}"`);
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ListIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                  All Tasks
                </span>
              </div>
              {!activeListId && (
                <Check className="w-3.5 h-3.5 text-[#0073ea] shrink-0" />
              )}
            </button>
            <div className="my-1 border-t border-slate-200/60 dark:border-slate-800/60" />
            {allListsInSpace.map((l) => {
              const isSelected = l.id === activeListId;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setActiveList(l.id);
                    setIsListMenuOpen(false);
                    toast.success(`Switched to list "${l.name}"`);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ListIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                      {l.name}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#0073ea] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={toggleFavorite}
        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        className="text-slate-300 hover:text-amber-400 transition-colors ml-1 cursor-pointer p-0.5 rounded shrink-0"
      >
        <Star
          className={`w-3.5 h-3.5 transition-all ${
            isFavorite ? "fill-amber-400 text-amber-400 scale-110" : ""
          }`}
        />
      </button>

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
      <span className="font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-1 shrink-0">
        <Megaphone className="w-3.5 h-3.5" />
        <span className="truncate max-w-[130px] sm:max-w-[180px]">
          {currentSpace?.name || "Marketing Hub"}
        </span>
      </span>

      <span className="text-slate-300 dark:text-slate-700 shrink-0">/</span>

      <span className="font-medium text-slate-800 dark:text-slate-200 shrink-0 truncate">
        {MARCOM_VIEW_LABELS[activeView] || "Overview"}
      </span>
    </div>
  );

  if (variant === "workspace-only") {
    return renderWorkspaceAnchor();
  }

  if (variant === "space-list") {
    return renderSpaceListBreadcrumb();
  }

  // variant === "full"
  return (
    <div className="flex items-center gap-2 text-xs min-w-0">
      {renderWorkspaceAnchor()}
      <span className="text-slate-300 dark:text-slate-700 shrink-0">/</span>
      {appMode === "marcom" ? renderMarcomTrail() : renderSpaceListBreadcrumb()}
    </div>
  );
}
