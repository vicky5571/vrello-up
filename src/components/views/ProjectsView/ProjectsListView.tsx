"use client";

import { useState } from "react";
import type { MarcomWorkItem } from "@/types";
import { useProjectsList } from "./useProjectsList";
import { ProjectsListHeader } from "./ProjectsListHeader";
import { ProjectsListTable } from "./ProjectsListTable";
import { ProjectsBulkActionBar } from "./ProjectsBulkActionBar";
import { ProjectsDetailDrawerHost } from "./ProjectsDetailDrawerHost";
import { ProjectsCreateModalHost } from "./ProjectsCreateModalHost";
import type { CreateWorkItemRequest } from "./createModalHelpers";

interface ProjectsListViewProps {
  onSelectItem?: (item: MarcomWorkItem) => void;
}

export function ProjectsListView({ onSelectItem }: ProjectsListViewProps) {
  const [internalSelectedItem, setInternalSelectedItem] =
    useState<MarcomWorkItem | null>(null);
  const [createRequest, setCreateRequest] = useState<CreateWorkItemRequest | null>(null);
  const handleSelect = onSelectItem || setInternalSelectedItem;
  const {
    isLoading,
    sortedItems,
    groupedSections,
    groupBy,
    sortField,
    sortDirection,
    collapsedGroups,
    selectedKeys,
    visibleFields,
    loadData,
    setGroupBy,
    toggleSort,
    clearSort,
    toggleGroupCollapse,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    updateTitle,
    updateStatus,
    updateDate,
    updatePic,
    handleBulkMove,
    handleBulkDelete,
    toggleVisibleField,
  } = useProjectsList();

  return (
    <div className="relative flex flex-col h-full min-h-0 p-4 space-y-3 overflow-hidden">
      {/* Header with Group By, Columns, Sort clear, Refresh, and New Item */}
      <ProjectsListHeader
        totalCount={sortedItems.length}
        groupBy={groupBy}
        onSetGroupBy={setGroupBy}
        visibleFields={visibleFields}
        onToggleVisibleField={toggleVisibleField}
        sortField={sortField}
        onClearSort={clearSort}
        isLoading={isLoading}
        onRefresh={loadData}
        onInitiateCreate={(type) => setCreateRequest({ type })}
      />

      {/* Main Table with Sortable Columns & Group Sections */}
      <ProjectsListTable
        sortedItems={sortedItems}
        groupedSections={groupedSections}
        groupBy={groupBy}
        sortField={sortField}
        sortDirection={sortDirection}
        collapsedGroups={collapsedGroups}
        selectedKeys={selectedKeys}
        visibleFields={visibleFields}
        onSelectItem={handleSelect}
        onToggleSort={toggleSort}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onToggleGroupCollapse={toggleGroupCollapse}
        onUpdateTitle={updateTitle}
        onUpdateStatus={updateStatus}
        onUpdateDate={updateDate}
        onUpdatePic={updatePic}
        onInitiateCreate={(type, ctx) =>
          setCreateRequest({
            type,
            status: ctx?.status,
          })
        }
      />

      {/* Floating Bulk Action Bar */}
      <ProjectsBulkActionBar
        selectedKeys={selectedKeys}
        allItems={sortedItems}
        onBulkStatus={handleBulkMove}
        onBulkDelete={handleBulkDelete}
        onClearSelection={clearSelection}
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
