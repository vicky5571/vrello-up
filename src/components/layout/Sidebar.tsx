"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Plus,
  LayoutGrid,
  Folder as FolderIcon,
  ListTodo,
  Layers,
  Code2,
  Palette,
  Sparkles,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateSpaceModal } from "@/components/spaces/CreateSpaceModal";
import { CreateListModal } from "@/components/spaces/CreateListModal";

const ICON_MAP: Record<string, typeof Code2> = {
  Code2,
  Palette,
  Sparkles,
  Layers,
  LayoutGrid,
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
    toggleSidebar,
  } = useWorkspaceStore();

  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>(
    {
      "space-eng": true,
      "space-product": true,
    },
  );

  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({
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
    return (
      <aside className="w-14 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex flex-col items-center py-4 gap-4 shrink-0 transition-all">
        <button
          onClick={toggleSidebar}
          title="Open Sidebar"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-teal-600/20">
          V
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex flex-col justify-between h-screen shrink-0 select-none">
        {/* Top Header & Workspaces */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Workspace Title & Collapse */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-teal-600/20 shrink-0">
                {currentWorkspace?.avatar || "V"}
              </div>
              <div className="overflow-hidden">
                <h1 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {currentWorkspace?.name || "VrelloUp Workspace"}
                </h1>
                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                  Pro Plan • ClickUp Clone
                </p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              title="Collapse Sidebar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tree */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {/* Spaces Header */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Spaces
                </span>
                <button
                  onClick={() => setIsCreateSpaceOpen(true)}
                  title="Create new Space"
                  className="p-1 rounded-md text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Spaces List */}
              <div className="space-y-1">
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
                          "group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all",
                          isSpaceActive
                            ? "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200",
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
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: space.color }}
                          />
                          <Icon className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                          <span className="truncate">{space.name}</span>
                        </div>

                        {/* Add List Trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreateListModalState({
                              isOpen: true,
                              spaceId: space.id,
                            });
                          }}
                          title="Add list to space"
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all"
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
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden pl-4 border-l border-slate-200/80 dark:border-slate-800/80 ml-3.5 space-y-0.5 py-0.5"
                          >
                            {/* Folders */}
                            {space.folders?.map((folder) => {
                              const isFolderExpanded =
                                !!expandedFolders[folder.id];

                              return (
                                <div key={folder.id} className="space-y-0.5">
                                  <div
                                    onClick={() =>
                                      toggleFolderExpand(folder.id)
                                    }
                                    className="flex items-center justify-between px-2 py-1 rounded-md text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                      <motion.span
                                        animate={{
                                          rotate: isFolderExpanded ? 0 : -90,
                                        }}
                                        transition={{ duration: 0.15 }}
                                      >
                                        <ChevronDown className="w-2.5 h-2.5" />
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
                                        transition={{ duration: 0.15 }}
                                        className="pl-3 space-y-0.5"
                                      >
                                        {folder.lists.map((list) => {
                                          const isListActive =
                                            activeListId === list.id;
                                          const listTaskCount = tasks.filter(
                                            (t) => t.listId === list.id,
                                          ).length;

                                          return (
                                            <div
                                              key={list.id}
                                              onClick={() => {
                                                setActiveSpace(space.id);
                                                setActiveList(list.id);
                                              }}
                                              className={cn(
                                                "flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer transition-all",
                                                isListActive
                                                  ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold"
                                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200 font-normal",
                                              )}
                                            >
                                              <div className="flex items-center gap-1.5 overflow-hidden">
                                                <ListTodo className="w-3 h-3 shrink-0 opacity-70" />
                                                <span className="truncate">
                                                  {list.name}
                                                </span>
                                              </div>
                                              {listTaskCount > 0 && (
                                                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800">
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
                                (t) => t.listId === list.id,
                              ).length;

                              return (
                                <div
                                  key={list.id}
                                  onClick={() => {
                                    setActiveSpace(space.id);
                                    setActiveList(list.id);
                                  }}
                                  className={cn(
                                    "flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer transition-all",
                                    isListActive
                                      ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold"
                                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200 font-normal",
                                  )}
                                >
                                  <div className="flex items-center gap-1.5 overflow-hidden">
                                    <ListTodo className="w-3 h-3 shrink-0 opacity-70" />
                                    <span className="truncate">
                                      {list.name}
                                    </span>
                                  </div>
                                  {listTaskCount > 0 && (
                                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800">
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
            </div>
          </div>

          {/* Bottom Settings */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium">
                All systems normal
              </span>
            </div>
            <button className="p-1 rounded-md hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
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
