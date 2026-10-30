"use client";

import React from "react";
import type { InventoryItem, BorrowRecord, BorrowStatus } from "@/types";
import { InventoryItemFormModal } from "./InventoryItemFormModal";
import { BorrowRequestModal } from "./BorrowRequestModal";
import { BorrowDetailModal } from "./BorrowDetailModal";
import { ReturnProcessModal } from "./ReturnProcessModal";

interface InventoryViewModalsProps {
  isItemModalOpen: boolean;
  setIsItemModalOpen: (open: boolean) => void;
  editingItem: InventoryItem | null;
  setEditingItem: (item: InventoryItem | null) => void;
  onItemSaved: (item: InventoryItem) => void;

  isBorrowModalOpen: boolean;
  setIsBorrowModalOpen: (open: boolean) => void;
  onBorrowSaved: (record: BorrowRecord) => void;

  selectedBorrow: BorrowRecord | null;
  setSelectedBorrow: (record: BorrowRecord | null) => void;
  canApprove: boolean;
  canManage: boolean;
  onStatusChange: (id: string, newStatus: BorrowStatus) => void;

  returningRecord: BorrowRecord | null;
  setReturningRecord: (record: BorrowRecord | null) => void;
  onReturned: (record: BorrowRecord) => void;
}

export function InventoryViewModals({
  isItemModalOpen,
  setIsItemModalOpen,
  editingItem,
  setEditingItem,
  onItemSaved,
  isBorrowModalOpen,
  setIsBorrowModalOpen,
  onBorrowSaved,
  selectedBorrow,
  setSelectedBorrow,
  canApprove,
  canManage,
  onStatusChange,
  returningRecord,
  setReturningRecord,
  onReturned,
}: InventoryViewModalsProps) {
  return (
    <>
      <InventoryItemFormModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSaved={onItemSaved}
      />

      <BorrowRequestModal
        isOpen={isBorrowModalOpen}
        onClose={() => setIsBorrowModalOpen(false)}
        onSaved={onBorrowSaved}
      />

      <BorrowDetailModal
        isOpen={Boolean(selectedBorrow)}
        onClose={() => setSelectedBorrow(null)}
        record={selectedBorrow}
        canApprove={canApprove}
        canManage={canManage}
        onStatusChange={onStatusChange}
        onReturn={(r) => {
          setSelectedBorrow(null);
          setReturningRecord(r);
        }}
      />

      <ReturnProcessModal
        isOpen={Boolean(returningRecord)}
        onClose={() => setReturningRecord(null)}
        record={returningRecord}
        onReturned={onReturned}
      />
    </>
  );
}
