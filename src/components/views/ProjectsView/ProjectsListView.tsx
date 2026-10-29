"use client";

import type { MarcomWorkItem } from "@/types";
import { useProjectsList } from "./useProjectsList";
import { ProjectsListHeader } from "./ProjectsListHeader";
import { ProjectsListTable } from "./ProjectsListTable";
import { ProjectsBulkActionBar } from "./ProjectsBulkActionBar";

interface ProjectsListViewProps {
  onSelectItem?: (item: MarcomWorkItem) => void;
}

export function ProjectsListView({ onSelectItem }: ProjectsListViewProps) {
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
    handleQuickAddInGroup,
    toggleVisibleField,
  } = useProjectsList();

  return (
    <div className="relative flex flex-col h-[calc(100vh-3.5rem)] p-4 space-y-3">
      {/* Header with Group By, Columns, Sort clear, Refresh */}
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
        onSelectItem={onSelectItem}
        onToggleSort={toggleSort}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onToggleGroupCollapse={toggleGroupCollapse}
        onUpdateTitle={updateTitle}
        onUpdateStatus={updateStatus}
        onUpdateDate={updateDate}
        onUpdatePic={updatePic}
        onQuickAddInGroup={handleQuickAddInGroup}
      />

      {/* Floating Bulk Action Bar */}
      <ProjectsBulkActionBar
        selectedKeys={selectedKeys}
        allItems={sortedItems}
        onBulkStatus={handleBulkMove}
        onBulkDelete={handleBulkDelete}
        onClearSelection={clearSelection}
      />
    </div>
  );
}
