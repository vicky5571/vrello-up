"use client";

import { useState, useEffect } from "react";
import { useDropdown } from "@/components/ui/useDropdown";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { type Space } from "@/types";
import {
  Plus,
  Settings,
  HelpCircle,
  Trash2,
  Megaphone,
  Kanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WORK_ITEM_VIEWS, MASTER_DATA_VIEWS } from "@/components/layout/ViewSwitcher";
import { CreateSpaceModal } from "@/components/spaces/CreateSpaceModal";
import { EditSpaceModal } from "@/components/spaces/EditSpaceModal";
import { CreateListModal } from "@/components/spaces/CreateListModal";
import { CreateFolderModal } from "@/components/spaces/CreateFolderModal";
import { RenameListModal } from "@/components/spaces/RenameListModal";
import { HelpDocsModal } from "@/components/modals/HelpDocsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { SortableSpaceItem } from "@/components/spaces/SortableSpaceItem";

export function Sidebar() {
  const {
    appMode,
    setAppMode,
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
    activeListId,
    activeView,
    setActiveSpace,
    setActiveList,
    setActiveView,
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
    reorderSpaces,
    moveSpace,
  } = useWorkspaceStore();

  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !currentWorkspace) return;

    const spaces = currentWorkspace.spaces;
    const oldIndex = spaces.findIndex((s) => s.id === active.id);
    const newIndex = spaces.findIndex((s) => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(spaces, oldIndex, newIndex);
      reorderSpaces(reordered.map((s) => s.id));
      toast.success("Spaces reordered");
    }
  };

  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({
    "space-product": true,
    "space-marcom": true,
  });

  useEffect(() => {
    if (activeSpaceId) {
      setExpandedSpaces((prev) =>
        prev[activeSpaceId] ? prev : { ...prev, [activeSpaceId]: true },
      );
    }
  }, [activeSpaceId]);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

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
  const menuRef = useDropdown<HTMLDivElement>({
    isOpen: Boolean(activeMenuId),
    onClose: () => setActiveMenuId(null),
  });


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
          {/* Dual-Context Segmented Mode Switcher */}
          <div className="px-2.5 pt-2.5 pb-1.5 shrink-0">
            <div className="p-0.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setAppMode("tasks")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  appMode === "tasks"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5"
                )}
              >
                <Kanban className="w-3.5 h-3.5 text-blue-500" />
                <span>Projects</span>
              </button>
              <button
                type="button"
                onClick={() => setAppMode("marcom")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  appMode === "marcom"
                    ? "bg-white dark:bg-slate-800 text-pink-600 dark:text-pink-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-white/5"
                )}
              >
                <Megaphone className="w-3.5 h-3.5 text-pink-500" />
                <span>Marcom Hub</span>
              </button>
            </div>
          </div>

          {/* Spaces Header in Tasks Mode */}
          {appMode === "tasks" && (
            <div className="px-3 pt-1 pb-1 shrink-0">
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
          )}

          {/* Main Body based on appMode */}
          {appMode === "marcom" ? (
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
              {/* Work Items Group */}
              <div>
                <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                  Work Items
                </div>
                <div className="space-y-0.5">
                  {WORK_ITEM_VIEWS.map((mv) => {
                    const isItemActive = activeView === mv.id;
                    const Icon = mv.icon;

                    return (
                      <button
                        key={mv.id}
                        type="button"
                        onClick={() => setActiveView(mv.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left",
                          isItemActive
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200",
                        )}
                      >
                        <Icon className={cn("w-4 h-4 shrink-0", mv.iconColor)} />
                        <span className="truncate">{mv.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Master Data Group */}
              <div>
                <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                  Master Data
                </div>
                <div className="space-y-0.5">
                  {MASTER_DATA_VIEWS.map((mv) => {
                    const isItemActive = activeView === mv.id;
                    const Icon = mv.icon;

                    return (
                      <button
                        key={mv.id}
                        type="button"
                        onClick={() => setActiveView(mv.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left",
                          isItemActive
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200",
                        )}
                      >
                        <Icon className={cn("w-4 h-4 shrink-0", mv.iconColor)} />
                        <span className="truncate">{mv.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-16">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={currentWorkspace?.spaces.map((s) => s.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  {currentWorkspace?.spaces.map((space, spaceIndex) => {
                    const isSpaceActive = activeSpaceId === space.id && !activeListId;
                    const isExpanded = !!expandedSpaces[space.id];

                    return (
                      <SortableSpaceItem
                        key={space.id}
                        space={space}
                        spaceIndex={spaceIndex}
                        totalSpaces={currentWorkspace.spaces.length}
                        isSpaceActive={isSpaceActive}
                        isExpanded={isExpanded}
                        activeSpaceId={activeSpaceId}
                        activeListId={activeListId}
                        activeMenuId={activeMenuId}
                        expandedFolders={expandedFolders}
                        tasks={tasks}
                        menuRef={menuRef}
                        onSelectSpace={(id) => setActiveSpace(id)}
                        onToggleSpaceExpand={toggleSpaceExpand}
                        onToggleFolderExpand={toggleFolderExpand}
                        onOpenCreateListModal={(spaceId, folderId) =>
                          setCreateListModalState({ isOpen: true, spaceId, folderId })
                        }
                        onOpenFolderModal={(spaceId, folderId, initialName) =>
                          setFolderModalState({ isOpen: true, spaceId, folderId, initialName })
                        }
                        onOpenRenameListModal={(spaceId, listId, folderId, initialName) =>
                          setRenameListModalState({ isOpen: true, spaceId, listId, folderId, initialName })
                        }
                        onOpenEditSpaceModal={(sp) =>
                          setEditSpaceModalState({ isOpen: true, space: sp })
                        }
                        onSetActiveMenuId={setActiveMenuId}
                        onDeleteSpace={deleteSpace}
                        onDeleteFolder={deleteFolder}
                        onDeleteList={deleteList}
                        onSelectList={(spaceId, listId) => {
                          setActiveSpace(spaceId);
                          setActiveList(listId);
                        }}
                        onMoveSpace={moveSpace}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            </div>
          )}

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
