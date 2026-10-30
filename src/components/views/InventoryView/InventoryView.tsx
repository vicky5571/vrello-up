"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { InventoryItem, BorrowRecord, BorrowStatus } from "@/types";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { InventoryHeaderKpis } from "./InventoryHeaderKpis";
import { InventoryItemsGrid } from "./InventoryItemsGrid";
import { InventoryTableView } from "./InventoryTableView";
import { BorrowRecordsTable } from "./BorrowRecordsTable";
import { BorrowTrackingBoard } from "./BorrowTrackingBoard";
import { InventoryViewModals } from "./InventoryViewModals";

export function InventoryView() {
  const { can } = useMarcomPermissions();
  const canManage = can("MANAGE_INVENTORY");
  const canRequest = can("REQUEST_BORROW");
  const canApprove = can("APPROVE_BORROW");

  // Tabs & Views
  const [activeTab, setActiveTab] = useState<"catalog" | "borrowing">("catalog");
  const [catalogViewMode, setCatalogViewMode] = useState<"grid" | "table">("grid");
  const [borrowViewMode, setBorrowViewMode] = useState<"board" | "table">("board");
  const [activeStatusTab, setActiveStatusTab] = useState<string>("ALL");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState<BorrowRecord | null>(null);
  const [returningRecord, setReturningRecord] = useState<BorrowRecord | null>(null);

  // Store data
  const {
    inventoryItems,
    borrowRecords,
    isInventoryLoading,
    isBorrowsLoading,
    fetchInventory,
    fetchBorrowRecords,
    addCachedInventoryItem,
    updateCachedInventoryItem,
    removeCachedInventoryItem,
    addCachedBorrowRecord,
    updateCachedBorrowRecord,
  } = useMarcomDataStore();

  useEffect(() => {
    fetchInventory();
    fetchBorrowRecords();
  }, [fetchInventory, fetchBorrowRecords]);

  // KPI calculations
  const kpis = useMemo(() => {
    const totalItems = inventoryItems.length;
    const availableUnits = inventoryItems.reduce((acc, it) => acc + (it.availableUnits || 0), 0);
    const activeBorrows = borrowRecords.filter((r) => r.status === "ACTIVE").length;
    const overdueCount = borrowRecords.filter(
      (r) => r.status === "OVERDUE" || (r.status === "ACTIVE" && new Date(r.returnDueDate) < new Date())
    ).length;
    return { totalItems, availableUnits, activeBorrows, overdueCount };
  }, [inventoryItems, borrowRecords]);

  // Filtered catalog
  const filteredCatalog = useMemo(() => {
    return inventoryItems.filter((i) => {
      const matchCat = selectedCategory === "ALL" || i.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchQ = !q || i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [inventoryItems, selectedCategory, searchQuery]);

  // Filtered borrows
  const filteredBorrows = useMemo(() => {
    if (!searchQuery) return borrowRecords;
    const q = searchQuery.toLowerCase();
    return borrowRecords.filter(
      (r) =>
        r.borrowCode.toLowerCase().includes(q) ||
        r.borrowerName.toLowerCase().includes(q) ||
        (r.eventLocation && r.eventLocation.toLowerCase().includes(q))
    );
  }, [borrowRecords, searchQuery]);

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this equipment item?")) return;
    try {
      const res = await fetch(`/api/marcom/inventory/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete item");
      removeCachedInventoryItem(id);
      toast.success("Equipment item deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleStatusChange = async (id: string, newStatus: BorrowStatus) => {
    try {
      const res = await fetch(`/api/marcom/inventory/borrow/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      updateCachedBorrowRecord(data);
      if (selectedBorrow?.id === id) setSelectedBorrow(data);
      fetchInventory(true);
      toast.success(`Borrow request marked as ${newStatus}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto">
      <InventoryHeaderKpis
        kpis={kpis}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        catalogViewMode={catalogViewMode}
        setCatalogViewMode={setCatalogViewMode}
        borrowViewMode={borrowViewMode}
        setBorrowViewMode={setBorrowViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        totalCatalog={inventoryItems.length}
        totalBorrows={borrowRecords.length}
        isLoading={isInventoryLoading || isBorrowsLoading}
        canManage={canManage}
        canRequest={canRequest}
        onRefresh={() => { fetchInventory(true); fetchBorrowRecords(true); }}
        onAddItem={() => { setEditingItem(null); setIsItemModalOpen(true); }}
        onBorrowRequest={() => setIsBorrowModalOpen(true)}
      />

      <div className="p-6 flex-1">
        {activeTab === "catalog" ? (
          catalogViewMode === "grid" ? (
            <InventoryItemsGrid
              items={filteredCatalog}
              canManage={canManage}
              onEdit={(item) => { setEditingItem(item); setIsItemModalOpen(true); }}
              onDelete={handleDeleteItem}
            />
          ) : (
            <InventoryTableView
              items={filteredCatalog}
              canManage={canManage}
              onEdit={(item) => { setEditingItem(item); setIsItemModalOpen(true); }}
              onDelete={handleDeleteItem}
            />
          )
        ) : (
          borrowViewMode === "board" ? (
            <BorrowTrackingBoard
              records={filteredBorrows}
              canApprove={canApprove}
              canManage={canManage}
              onView={(r) => setSelectedBorrow(r)}
              onApprove={(id) => handleStatusChange(id, "APPROVED")}
              onActivate={(id) => handleStatusChange(id, "ACTIVE")}
              onReturn={(r) => setReturningRecord(r)}
            />
          ) : (
            <BorrowRecordsTable
              records={filteredBorrows}
              activeStatusTab={activeStatusTab}
              onStatusTabChange={setActiveStatusTab}
              canReturn={canManage}
              onView={(r) => setSelectedBorrow(r)}
              onReturn={(r) => setReturningRecord(r)}
            />
          )
        )}
      </div>

      <InventoryViewModals
        isItemModalOpen={isItemModalOpen}
        setIsItemModalOpen={setIsItemModalOpen}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        onItemSaved={(item) => {
          if (editingItem) {
            updateCachedInventoryItem(item);
            toast.success("Equipment item updated");
          } else {
            addCachedInventoryItem(item);
            toast.success("Equipment item created");
          }
        }}
        isBorrowModalOpen={isBorrowModalOpen}
        setIsBorrowModalOpen={setIsBorrowModalOpen}
        onBorrowSaved={(record) => {
          addCachedBorrowRecord(record);
          fetchInventory(true);
          toast.success(`Borrow request ${record.borrowCode} submitted!`);
        }}
        selectedBorrow={selectedBorrow}
        setSelectedBorrow={setSelectedBorrow}
        canApprove={canApprove}
        canManage={canManage}
        onStatusChange={handleStatusChange}
        returningRecord={returningRecord}
        setReturningRecord={setReturningRecord}
        onReturned={(r) => {
          updateCachedBorrowRecord(r);
          fetchInventory(true);
          toast.success(`Equipment return recorded for ${r.borrowCode}!`);
        }}
      />
    </div>
  );
}
