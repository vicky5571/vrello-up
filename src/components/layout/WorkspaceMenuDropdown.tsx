"use client";

import React from "react";
import { Building2, Check, Settings, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Workspace } from "@/types";

export interface WorkspaceMenuDropdownProps {
  workspaces: Workspace[];
  currentWorkspaceId?: string;
  onSelectWorkspace: (id: string) => void;
  onClose: () => void;
  onOpenEditWorkspace: (ws: Workspace) => void;
  onOpenCreateWorkspace: () => void;
}

export function WorkspaceMenuDropdown({
  workspaces,
  currentWorkspaceId,
  onSelectWorkspace,
  onClose,
  onOpenEditWorkspace,
  onOpenCreateWorkspace,
}: WorkspaceMenuDropdownProps) {
  return (
    <div className="absolute left-0 top-full mt-1 w-64 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
      <div className="px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        Workspaces
      </div>
      <div className="max-h-60 overflow-y-auto space-y-0.5">
        {workspaces.map((ws) => {
          const isSelected = ws.id === currentWorkspaceId;
          return (
            <div
              key={ws.id}
              className="group flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <button
                type="button"
                onClick={() => {
                  onSelectWorkspace(ws.id);
                  onClose();
                  toast.success(`Switched to workspace "${ws.name}"`);
                }}
                className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                  {ws.name}
                </span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#0073ea] dark:text-emerald-500 shrink-0 ml-1" />
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  onOpenEditWorkspace(ws);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-opacity text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Workspace settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 px-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenCreateWorkspace();
          }}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-[#0073ea] dark:text-sky-400 hover:bg-[#0073ea]/10 dark:hover:bg-sky-400/10 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Workspace</span>
        </button>
      </div>
    </div>
  );
}

