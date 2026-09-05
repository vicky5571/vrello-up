"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Plus,
  LayoutGrid,
  Layout,
  Folder as FolderIcon,
  ListTodo,
  Layers,
  Code2,
  Palette,
  Sparkles,
  Rocket,
  Target,
  Zap,
  Settings,
  LucideIcon,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateSpaceModal } from "@/components/spaces/CreateSpaceModal";
import { CreateListModal } from "@/components/spaces/CreateListModal";

const ICON_MAP: Record<string, LucideIcon> = {
  Code2,
  Palette,
  Sparkles,
  Layers,
  LayoutGrid,
  Layout,
  Folder: FolderIcon,
  Rocket,
  Target,
  Zap,
};

export function Sidebar() {
  const {
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
    activeListId,
    setActiveSpace,
    setActiveList,
    tasks,
    isSidebarOpen,
  } = useWorkspaceStore();

  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({
    "space-eng": true,
    "space-product": true,
  });

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "folder-sprint": true,
  });

  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
  const [createListModalState, setCreateListModalState] = useState<{
    isOpen: boolean;
    spaceId: string;
    folderId?: string;
  }>({ isOpen: false, spaceId: "" });

  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const toggleSpaceExpand = (spaceId: string) => {
    setExpandedSpaces((prev) => ({ ...prev, [spaceId]: !prev[spaceId] }));
  };

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <>
      <aside className="w-60 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#18191B] flex flex-col justify-between h-screen shrink-0 select-none z-20">
        {/* Navigation Tree */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Spaces Section Header */}
          <div className="px-3 pt-3.5 pb-2">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Spaces
              </span>
              <button
                onClick={() => setIsCreateSpaceOpen(true)}
                title="Create new Space"
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Spaces List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {currentWorkspace?.spaces.map((space) => {
              const isSpaceActive = activeSpaceId === space.id;
              const isExpanded = !!expandedSpaces[space.id];
              const Icon = ICON_MAP[space.icon] || Layers;

              return (
                <div key={space.id} className="space-y-0.5">
                  {/* Space Item */}
                  <div
                    onClick={() => {
                      setActiveSpace(space.id);
                      if (!isExpanded) toggleSpaceExpand(space.id);
                    }}
                    className={cn(
                      "group flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors",
                      isSpaceActive
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSpaceExpand(space.id);
                        }}
                        className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <motion.span
                          animate={{ rotate: isExpanded ? 0 : -90 }}
                          transition={{ duration: 0.15 }}
                          className="inline-block"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </motion.span>
                      </button>

                      <div
                        className="w-4 h-4 rounded flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: space.color }}
                      >
                        <Icon className="w-2.5 h-2.5" />
                      </div>

                      <span className="truncate">{space.name}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCreateListModalState({
                          isOpen: true,
                          spaceId: space.id,
                        });
                      }}
                      title="Add list to space"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Accordion Lists & Folders */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden pl-3 border-l border-slate-200/70 dark:border-slate-800/80 ml-3.5 space-y-0.5 py-0.5"
                      >
                        {/* Folders */}
                        {space.folders?.map((folder) => {
                          const isFolderExpanded = !!expandedFolders[folder.id];

                          return (
                            <div key={folder.id} className="space-y-0.5">
                              <div
                                onClick={() => toggleFolderExpand(folder.id)}
                                className="flex items-center justify-between px-2 py-1 rounded-md text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <motion.span
                                    animate={{ rotate: isFolderExpanded ? 0 : -90 }}
                                    transition={{ duration: 0.12 }}
                                    className="inline-block"
                                  >
                                    <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                                  </motion.span>
                                  <FolderIcon className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span className="truncate font-medium">
                                    {folder.name}
                                  </span>
                                </div>
                              </div>

                              {/* Lists inside Folder */}
                              <AnimatePresence initial={false}>
                                {isFolderExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.12 }}
                                    className="pl-2.5 space-y-0.5"
                                  >
                                    {folder.lists.map((list) => {
                                      const isListActive = activeListId === list.id;
                                      const listTaskCount = tasks.filter(
                                        (t) => t.listId === list.id
                                      ).length;

                                      return (
                                        <div
                                          key={list.id}
                                          onClick={() => {
                                            setActiveSpace(space.id);
                                            setActiveList(list.id);
                                          }}
                                          className={cn(
                                            "flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer transition-colors",
                                            isListActive
                                              ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                                          )}
                                        >
                                          <div className="flex items-center gap-1.5 overflow-hidden">
                                            <ListTodo className="w-3 h-3 shrink-0 text-slate-400" />
                                            <span className="truncate">
                                              {list.name}
                                            </span>
                                          </div>
                                          {listTaskCount > 0 && (
                                            <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800">
                                              {listTaskCount}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}

                        {/* Direct Lists inside Space */}
                        {space.lists.map((list) => {
                          const isListActive = activeListId === list.id;
                          const listTaskCount = tasks.filter(
                            (t) => t.listId === list.id
                          ).length;

                          return (
                            <div
                              key={list.id}
                              onClick={() => {
                                setActiveSpace(space.id);
                                setActiveList(list.id);
                              }}
                              className={cn(
                                "flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer transition-colors",
                                isListActive
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                              )}
                            >
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <ListTodo className="w-3 h-3 shrink-0 text-slate-400" />
                                <span className="truncate">{list.name}</span>
                              </div>
                              {listTaskCount > 0 && (
                                <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800">
                                  {listTaskCount}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Bottom Settings / Help */}
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help & Docs</span>
            </button>
            <button
              type="button"
              className="p-1 rounded hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Modals */}
      <CreateSpaceModal
        isOpen={isCreateSpaceOpen}
        onClose={() => setIsCreateSpaceOpen(false)}
      />

      <CreateListModal
        isOpen={createListModalState.isOpen}
        spaceId={createListModalState.spaceId}
        folderId={createListModalState.folderId}
        onClose={() => setCreateListModalState({ isOpen: false, spaceId: "" })}
      />
    </>
  );
}
