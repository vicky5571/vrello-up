"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  closestCenter,
  type CollisionDetection,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { RefreshCw, Kanban } from "lucide-react";
import type { MarcomWorkItem } from "@/types";
import {
  PROJECTS_COLUMN_ORDER,
  PROJECTS_COLUMN_ORDER_WITH_ARCHIVED,
  mapColumnToStatus,
} from "@/lib/marcom/workItems";
import { ProjectsBoardColumn } from "./ProjectsBoardColumn";
import { ProjectsWorkItemCard } from "./ProjectsWorkItemCard";
import { ProjectsBulkActionBar } from "./ProjectsBulkActionBar";
import { ProjectsDetailDrawerHost } from "./ProjectsDetailDrawerHost";
import { ProjectsCreateModalHost } from "./ProjectsCreateModalHost";
import type { CreateWorkItemRequest } from "./createModalHelpers";
import { useProjectsBoard } from "./useProjectsBoard";
import { cn } from "@/lib/utils";

interface ProjectsBoardViewProps {
  onSelectItem?: (item: MarcomWorkItem) => void;
}

export function ProjectsBoardView({ onSelectItem }: ProjectsBoardViewProps) {
  const [internalSelectedItem, setInternalSelectedItem] =
    useState<MarcomWorkItem | null>(null);
  const [createRequest, setCreateRequest] = useState<CreateWorkItemRequest | null>(null);
  const handleSelect = onSelectItem || setInternalSelectedItem;
  const {
    isLoading,
    allWorkItems,
    itemsByColumn,
    activeItem,
    dropIndicator,
    selectedKeys,
    announcement,
    showArchived,
    setShowArchived,
    density,
    sensors,
    loadData,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    moveToColumn,
    handleToggleSelect,
    handleToggleSelectAll,
    handleClearSelection,
    handleBulkMove,
    handleBulkDelete,
  } = useProjectsBoard();

  const collisionDetectionStrategy: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCenter(args);
  }, []);

  const dropAnimationConfig = useMemo(
    () => ({
      duration: 200,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      sideEffects: defaultDropAnimationSideEffects({
        styles: {
          active: {
            opacity: "0",
          },
        },
      }),
    }),
    [],
  );

  return (
    <div className="relative flex flex-col h-full min-h-0 p-4 space-y-3 overflow-hidden">
      {/* Screen-reader live announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Kanban className="w-5 h-5 text-blue-500" />
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Kanban Board
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
            {allWorkItems.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer",
              showArchived
                ? "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-medium"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200",
            )}
            title={showArchived ? "Hide archived items" : "Show archived items"}
          >
            {showArchived ? "Sembunyikan Arsip" : "Tampilkan Arsip"}
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-50"
            title="Refresh items"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-blue-500")} />
          </button>
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
          <div className="flex gap-3 h-full min-w-max">
            {(showArchived ? PROJECTS_COLUMN_ORDER_WITH_ARCHIVED : PROJECTS_COLUMN_ORDER).map((column) => (
              <ProjectsBoardColumn
                key={column}
                column={column}
                className={column === "Archived" ? "opacity-60" : undefined}
                items={itemsByColumn.get(column) || []}
                onSelect={handleSelect}
                dropIndicator={dropIndicator?.column === column ? dropIndicator : null}
                selectedKeys={selectedKeys}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleToggleSelectAll}
                onMoveToColumn={moveToColumn}
                onInitiateCreate={(type, col) =>
                  setCreateRequest({
                    type,
                    status: mapColumnToStatus(type, col) || undefined,
                  })
                }
                density={density}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeItem && (
            <div className="w-72 sm:w-80 pointer-events-none">
              <ProjectsWorkItemCard item={activeItem} isOverlay />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Floating Bulk Action Bar */}
      <ProjectsBulkActionBar
        selectedKeys={selectedKeys}
        allItems={allWorkItems}
        onBulkStatus={handleBulkMove}
        onBulkDelete={handleBulkDelete}
        onClearSelection={handleClearSelection}
      />

      {/* Domain Detail Drawer Host */}
      {!onSelectItem && (
        <ProjectsDetailDrawerHost
          selectedItem={internalSelectedItem}
          onClose={() => setInternalSelectedItem(null)}
          onRefresh={loadData}
        />
      )}

      {/* Domain Create Modal Host */}
      <ProjectsCreateModalHost
        createRequest={createRequest}
        onClose={() => setCreateRequest(null)}
        onRefresh={loadData}
      />
    </div>
  );
}
