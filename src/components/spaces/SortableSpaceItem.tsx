"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Layers,
  FolderPlus,
  Edit2,
  Trash2,
  Folder as FolderIcon,
  ListTodo,
  ArrowUp,
  ArrowDown,
  Code2,
  Palette,
  Sparkles,
  LayoutGrid,
  Layout,
  Rocket,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Space, type Task } from "@/types";
import { toast } from "sonner";

export const SPACE_ICON_MAP: Record<string, LucideIcon> = {
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

interface SortableSpaceItemProps {
  space: Space;
  spaceIndex: number;
  totalSpaces: number;
  isSpaceActive: boolean;
  isExpanded: boolean;
  activeSpaceId: string;
  activeListId: string | null;
  activeMenuId: string | null;
  expandedFolders: Record<string, boolean>;
  tasks: Task[];
  menuRef: React.RefObject<HTMLDivElement | null>;
  onSelectSpace: (spaceId: string) => void;
  onToggleSpaceExpand: (spaceId: string) => void;
  onToggleFolderExpand: (folderId: string) => void;
  onOpenCreateListModal: (spaceId: string, folderId?: string) => void;
  onOpenFolderModal: (spaceId: string, folderId?: string, initialName?: string) => void;
  onOpenRenameListModal: (spaceId: string, listId: string, folderId?: string, initialName?: string) => void;
  onOpenEditSpaceModal: (space: Space) => void;
  onSetActiveMenuId: (id: string | null) => void;
  onDeleteSpace: (spaceId: string) => void;
  onDeleteFolder: (spaceId: string, folderId: string) => void;
  onDeleteList: (spaceId: string, listId: string, folderId?: string) => void;
  onSelectList: (spaceId: string, listId: string) => void;
  onMoveSpace: (spaceId: string, direction: "up" | "down") => void;
}

export function SortableSpaceItem({
  space,
  spaceIndex,
  totalSpaces,
  isSpaceActive,
  isExpanded,
  activeSpaceId,
  activeListId,
  activeMenuId,
  expandedFolders,
  tasks,
  menuRef,
  onSelectSpace,
  onToggleSpaceExpand,
  onToggleFolderExpand,
  onOpenCreateListModal,
  onOpenFolderModal,
  onOpenRenameListModal,
  onOpenEditSpaceModal,
  onSetActiveMenuId,
  onDeleteSpace,
  onDeleteFolder,
  onDeleteList,
  onSelectList,
  onMoveSpace,
}: SortableSpaceItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: space.id,
    data: {
      type: "Space",
      space,
    },
    transition: {
      duration: 150,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const Icon = SPACE_ICON_MAP[space.icon] || Layers;
  const isSpaceMenuOpen = activeMenuId === `space-${space.id}`;

  const isAnyMenuOpenInThisSpace = Boolean(
    activeMenuId && (
      activeMenuId === `space-${space.id}` ||
      space.lists?.some((l) => activeMenuId === `list-${l.id}`) ||
      space.folders?.some((f) =>
        activeMenuId === `folder-${f.id}` ||
        f.lists?.some((l) => activeMenuId === `list-${l.id}`)
      )
    )
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "space-y-0.5 relative rounded-md transition-shadow",
        isAnyMenuOpenInThisSpace ? "z-30" : "z-auto",
        isDragging && "opacity-40 z-50 shadow-lg ring-1 ring-blue-500/50 bg-blue-50/20 dark:bg-blue-950/20"
      )}
    >
      {/* Space Header Row */}
      <div
        onClick={() => {
          onSelectSpace(space.id);
          if (!isExpanded) onToggleSpaceExpand(space.id);
        }}
        className={cn(
          "group flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors",
          isSpaceActive
            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
        )}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          {/* Drag Handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder space"
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing p-0.5 -ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity shrink-0"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSpaceExpand(space.id);
            }}
            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
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

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCreateListModal(space.id);
            }}
            title="Add list to space"
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-opacity cursor-pointer"
          >
            <Plus className="w-3 h-3" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetActiveMenuId(isSpaceMenuOpen ? null : `space-${space.id}`);
              }}
              title="Space Actions"
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-opacity cursor-pointer"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>

            {/* Space Context Menu Popover */}
            {isSpaceMenuOpen && (
              <div
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 text-xs space-y-0.5"
              >
                <button
                  type="button"
                  onClick={() => {
                    onSetActiveMenuId(null);
                    onSelectSpace(space.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>All Tasks</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSetActiveMenuId(null);
                    onOpenCreateListModal(space.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-500" />
                  <span>Add List</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSetActiveMenuId(null);
                    onOpenFolderModal(space.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                  <span>Add Folder</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSetActiveMenuId(null);
                    onOpenEditSpaceModal(space);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Edit Space</span>
                </button>

                {/* REORDER ACTIONS */}
                <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />
                <button
                  type="button"
                  disabled={spaceIndex === 0}
                  onClick={() => {
                    onSetActiveMenuId(null);
                    onMoveSpace(space.id, "up");
                    toast.success(`Moved "${space.name}" up`);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                  <span>Move Up</span>
                </button>
                <button
                  type="button"
                  disabled={spaceIndex === totalSpaces - 1}
                  onClick={() => {
                    onSetActiveMenuId(null);
                    onMoveSpace(space.id, "down");
                    toast.success(`Moved "${space.name}" down`);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>Move Down</span>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />
                <button
                  type="button"
                  onClick={() => {
                    onSetActiveMenuId(null);
                    onDeleteSpace(space.id);
                    toast.success(`Space "${space.name}" deleted`);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Space</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accordion Lists & Folders */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transitionEnd: { overflow: "visible" },
            }}
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            transition={{ duration: 0.15 }}
            className={cn(
              "pl-3 border-l border-slate-200/70 dark:border-slate-800/80 ml-3.5 space-y-0.5 py-0.5",
              isAnyMenuOpenInThisSpace ? "overflow-visible" : "overflow-hidden"
            )}
          >
            {/* Folders */}
            {space.folders?.map((folder) => {
              const isFolderExpanded = !!expandedFolders[folder.id];
              const isFolderMenuOpen = activeMenuId === `folder-${folder.id}`;
              const isFolderOrChildMenuOpen = Boolean(
                activeMenuId && (
                  isFolderMenuOpen ||
                  folder.lists?.some((l) => activeMenuId === `list-${l.id}`)
                )
              );

              return (
                <div
                  key={folder.id}
                  className={cn("space-y-0.5 relative", isFolderOrChildMenuOpen && "z-30")}
                >
                  <div
                    onClick={() => onToggleFolderExpand(folder.id)}
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
                      <span className="truncate font-medium">{folder.name}</span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCreateListModal(space.id, folder.id);
                        }}
                        title="Add list to folder"
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-opacity cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetActiveMenuId(isFolderMenuOpen ? null : `folder-${folder.id}`);
                          }}
                          title="Folder Actions"
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-opacity cursor-pointer"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </button>

                        {/* Folder Context Menu Popover */}
                        {isFolderMenuOpen && (
                          <div
                            ref={menuRef}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 text-xs space-y-0.5"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onSetActiveMenuId(null);
                                onOpenCreateListModal(space.id, folder.id);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-teal-500" />
                              <span>Add List</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onSetActiveMenuId(null);
                                onOpenFolderModal(space.id, folder.id, folder.name);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Rename Folder</span>
                            </button>
                            <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />
                            <button
                              type="button"
                              onClick={() => {
                                onSetActiveMenuId(null);
                                onDeleteFolder(space.id, folder.id);
                                toast.success(`Folder "${folder.name}" deleted`);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Folder</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lists inside Folder */}
                  <AnimatePresence initial={false}>
                    {isFolderExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transitionEnd: { overflow: "visible" },
                        }}
                        exit={{ height: 0, opacity: 0, overflow: "hidden" }}
                        transition={{ duration: 0.12 }}
                        className={cn(
                          "pl-2.5 space-y-0.5",
                          isAnyMenuOpenInThisSpace ? "overflow-visible" : "overflow-hidden"
                        )}
                      >
                        {folder.lists.map((list) => {
                          const isListActive =
                            activeSpaceId === space.id && activeListId === list.id;
                          const listTaskCount = tasks.filter((t) => t.listId === list.id).length;
                          const isListMenuOpen = activeMenuId === `list-${list.id}`;

                          return (
                            <div
                              key={list.id}
                              className={cn(
                                "relative space-y-0.5",
                                isListMenuOpen && "z-30"
                              )}
                            >
                              <div
                                onClick={() => onSelectList(space.id, list.id)}
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
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSetActiveMenuId(isListMenuOpen ? null : `list-${list.id}`);
                                      }}
                                      title="List Actions"
                                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-opacity cursor-pointer"
                                    >
                                      <MoreHorizontal className="w-3 h-3" />
                                    </button>

                                    {/* List Context Menu Popover */}
                                    {isListMenuOpen && (
                                      <div
                                        ref={menuRef}
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute right-0 top-full mt-1 z-50 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 text-xs space-y-0.5"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onSetActiveMenuId(null);
                                            onOpenRenameListModal(space.id, list.id, folder.id, list.name);
                                          }}
                                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                        >
                                          <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                                          <span>Rename</span>
                                        </button>
                                        <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onSetActiveMenuId(null);
                                            onDeleteList(space.id, list.id, folder.id);
                                            toast.success(`List "${list.name}" deleted`);
                                          }}
                                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Direct Lists */}
            {space.lists?.map((list) => {
              const isListActive = activeSpaceId === space.id && activeListId === list.id;
              const listTaskCount = tasks.filter((t) => t.listId === list.id).length;
              const isListMenuOpen = activeMenuId === `list-${list.id}`;

              return (
                <div
                  key={list.id}
                  className={cn(
                    "relative space-y-0.5",
                    isListMenuOpen && "z-30"
                  )}
                >
                  <div
                    onClick={() => onSelectList(space.id, list.id)}
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
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetActiveMenuId(isListMenuOpen ? null : `list-${list.id}`);
                          }}
                          title="List Actions"
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-opacity cursor-pointer"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </button>

                        {/* List Context Menu Popover */}
                        {isListMenuOpen && (
                          <div
                            ref={menuRef}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 z-50 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 text-xs space-y-0.5"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onSetActiveMenuId(null);
                                onOpenRenameListModal(space.id, list.id, undefined, list.name);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Rename</span>
                            </button>
                            <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />
                            <button
                              type="button"
                              onClick={() => {
                                onSetActiveMenuId(null);
                                onDeleteList(space.id, list.id);
                                toast.success(`List "${list.name}" deleted`);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
