"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { type Space } from "@/types";
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
  MoreHorizontal,
  Edit2,
  Trash2,
  FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateSpaceModal } from "@/components/spaces/CreateSpaceModal";
import { EditSpaceModal } from "@/components/spaces/EditSpaceModal";
import { CreateListModal } from "@/components/spaces/CreateListModal";
import { CreateFolderModal } from "@/components/spaces/CreateFolderModal";
import { RenameListModal } from "@/components/spaces/RenameListModal";
import { HelpDocsModal } from "@/components/modals/HelpDocsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { toast } from "sonner";

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
    toggleSidebar,
    isHelpDocsOpen,
    setHelpDocsOpen,
    trash,
    setTrashOpen,
    deleteSpace,
    deleteFolder,
    deleteList,
  } = useWorkspaceStore();

  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({
    "space-eng": true,
    "space-product": true,
  });

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "folder-sprint": true,
  });

  // Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
  const [editSpaceModalState, setEditSpaceModalState] = useState<{
    isOpen: boolean;
    space: Space | null;
  }>({ isOpen: false, space: null });

  const [createListModalState, setCreateListModalState] = useState<{
    isOpen: boolean;
    spaceId: string;
    folderId?: string;
  }>({ isOpen: false, spaceId: "" });

  const [folderModalState, setFolderModalState] = useState<{
    isOpen: boolean;
    spaceId: string;
    folderId?: string;
    initialName?: string;
  }>({ isOpen: false, spaceId: "" });

  const [renameListModalState, setRenameListModalState] = useState<{
    isOpen: boolean;
    spaceId: string;
    listId: string;
    folderId?: string;
    initialName?: string;
  }>({ isOpen: false, spaceId: "", listId: "" });

  // Context Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      {/* Mobile backdrop: tap outside to close slide-over */}
      <div
        onClick={toggleSidebar}
        className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
      />
      <aside className="fixed left-2 top-2 bottom-2 z-50 w-72 md:static md:z-20 md:w-60 md:h-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18191B] shadow-lg flex flex-col justify-between shrink-0 select-none overflow-hidden">
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
              const isSpaceMenuOpen = activeMenuId === `space-${space.id}`;

              return (
                <div key={space.id} className="space-y-0.5 relative">
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

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreateListModalState({
                            isOpen: true,
                            spaceId: space.id,
                          });
                        }}
                        title="Add list to space"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-opacity cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isSpaceMenuOpen ? null : `space-${space.id}`);
                        }}
                        title="Space Actions"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-opacity cursor-pointer"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Space Context Menu Popover */}
                  {isSpaceMenuOpen && (
                    <div
                      ref={menuRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-2 top-8 z-30 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 text-xs space-y-0.5"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          setCreateListModalState({ isOpen: true, spaceId: space.id });
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-teal-500" />
                        <span>Add List</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          setFolderModalState({ isOpen: true, spaceId: space.id });
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                        <span>Add Folder</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          setEditSpaceModalState({ isOpen: true, space });
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Edit Space</span>
                      </button>
                      <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          deleteSpace(space.id);
                          toast.success(`Space "${space.name}" deleted`);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Space</span>
                      </button>
                    </div>
                  )}

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
                          const isFolderMenuOpen = activeMenuId === `folder-${folder.id}`;

                          return (
                            <div key={folder.id} className="space-y-0.5 relative">
                              <div
                                onClick={() => toggleFolderExpand(folder.id)}
                                className="group flex items-center justify-between px-2 py-1 rounded-md text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
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

                                <div className="flex items-center gap-0.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCreateListModalState({
                                        isOpen: true,
                                        spaceId: space.id,
                                        folderId: folder.id,
                                      });
                                    }}
                                    title="Add list to folder"
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-opacity"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(
                                        isFolderMenuOpen ? null : `folder-${folder.id}`
                                      );
                                    }}
                                    title="Folder Actions"
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-opacity"
                                  >
                                    <MoreHorizontal className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Folder Context Menu Popover */}
                              {isFolderMenuOpen && (
                                <div
                                  ref={menuRef}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-2 top-6 z-30 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 text-xs space-y-0.5"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setCreateListModalState({
                                        isOpen: true,
                                        spaceId: space.id,
                                        folderId: folder.id,
                                      });
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-teal-500" />
                                    <span>Add List</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setFolderModalState({
                                        isOpen: true,
                                        spaceId: space.id,
                                        folderId: folder.id,
                                        initialName: folder.name,
                                      });
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Rename Folder</span>
                                  </button>
                                  <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      deleteFolder(space.id, folder.id);
                                      toast.success(`Folder "${folder.name}" deleted`);
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Folder</span>
                                  </button>
                                </div>
                              )}

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
                                      const isListMenuOpen =
                                        activeMenuId === `list-${list.id}`;

                                      return (
                                        <div
                                          key={list.id}
                                          className="relative space-y-0.5"
                                        >
                                          <div
                                            onClick={() => {
                                              setActiveSpace(space.id);
                                              setActiveList(list.id);
                                            }}
                                            className={cn(
                                              "group flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer transition-colors",
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

                                            <div className="flex items-center gap-1">
                                              {listTaskCount > 0 && (
                                                <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800">
                                                  {listTaskCount}
                                                </span>
                                              )}
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setActiveMenuId(
                                                    isListMenuOpen
                                                      ? null
                                                      : `list-${list.id}`
                                                  );
                                                }}
                                                title="List Actions"
                                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-opacity"
                                              >
                                                <MoreHorizontal className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>

                                          {/* List Context Menu Popover */}
                                          {isListMenuOpen && (
                                            <div
                                              ref={menuRef}
                                              onClick={(e) => e.stopPropagation()}
                                              className="absolute right-2 top-6 z-30 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 text-xs space-y-0.5"
                                            >
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setActiveMenuId(null);
                                                  setRenameListModalState({
                                                    isOpen: true,
                                                    spaceId: space.id,
                                                    listId: list.id,
                                                    folderId: folder.id,
                                                    initialName: list.name,
                                                  });
                                                }}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                              >
                                                <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>Rename</span>
                                              </button>
                                              <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setActiveMenuId(null);
                                                  deleteList(
                                                    space.id,
                                                    list.id,
                                                    folder.id
                                                  );
                                                  toast.success(
                                                    `List "${list.name}" deleted`
                                                  );
                                                }}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <span>Delete</span>
                                              </button>
                                            </div>
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
                          const isListMenuOpen = activeMenuId === `list-${list.id}`;

                          return (
                            <div key={list.id} className="relative space-y-0.5">
                              <div
                                onClick={() => {
                                  setActiveSpace(space.id);
                                  setActiveList(list.id);
                                }}
                                className={cn(
                                  "group flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer transition-colors",
                                  isListActive
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200"
                                )}
                              >
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <ListTodo className="w-3 h-3 shrink-0 text-slate-400" />
                                  <span className="truncate">{list.name}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  {listTaskCount > 0 && (
                                    <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800">
                                      {listTaskCount}
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(
                                        isListMenuOpen ? null : `list-${list.id}`
                                      );
                                    }}
                                    title="List Actions"
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-opacity cursor-pointer"
                                  >
                                    <MoreHorizontal className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* List Context Menu Popover */}
                              {isListMenuOpen && (
                                <div
                                  ref={menuRef}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-2 top-6 z-30 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 text-xs space-y-0.5"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setRenameListModalState({
                                        isOpen: true,
                                        spaceId: space.id,
                                        listId: list.id,
                                        initialName: list.name,
                                      });
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Rename</span>
                                  </button>
                                  <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      deleteList(space.id, list.id);
                                      toast.success(`List "${list.name}" deleted`);
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
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
              onClick={() => setHelpDocsOpen(true)}
              className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Help & Docs</span>
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTrashOpen(true)}
                title="Trash — restore deleted tasks"
                aria-label={`Trash${trash.length > 0 ? `, ${trash.length} deleted tasks` : ""}`}
                className="relative p-1 rounded hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {trash.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-0.5 rounded-full bg-slate-500 text-white text-[8px] font-bold flex items-center justify-center">
                    {trash.length > 9 ? "9+" : trash.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                title="Workspace & Account Settings"
                className="p-1 rounded hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Modals */}
      <CreateSpaceModal
        isOpen={isCreateSpaceOpen}
        onClose={() => setIsCreateSpaceOpen(false)}
      />

      <EditSpaceModal
        isOpen={editSpaceModalState.isOpen}
        space={editSpaceModalState.space}
        onClose={() => setEditSpaceModalState({ isOpen: false, space: null })}
      />

      <CreateListModal
        isOpen={createListModalState.isOpen}
        spaceId={createListModalState.spaceId}
        folderId={createListModalState.folderId}
        onClose={() => setCreateListModalState({ isOpen: false, spaceId: "" })}
      />

      <CreateFolderModal
        isOpen={folderModalState.isOpen}
        spaceId={folderModalState.spaceId}
        folderId={folderModalState.folderId}
        initialName={folderModalState.initialName}
        onClose={() => setFolderModalState({ isOpen: false, spaceId: "" })}
      />

      <RenameListModal
        isOpen={renameListModalState.isOpen}
        spaceId={renameListModalState.spaceId}
        listId={renameListModalState.listId}
        folderId={renameListModalState.folderId}
        initialName={renameListModalState.initialName}
        onClose={() =>
          setRenameListModalState({ isOpen: false, spaceId: "", listId: "" })
        }
      />

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
