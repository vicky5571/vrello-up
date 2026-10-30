# Plan: Field Event Inventory & Equipment Borrowing System

**Plan ID:** `2026-10-30-inventory-system`  
**Status:** Implemented  
**Date:** 2026-10-30  
**Spec:** `2026-10-30-inventory-system-design.md`  
**Detailed Plan:** [docs/inventory-system/plan.md](file:///Users/mac/Web%20Development/vrello-up/docs/inventory-system/plan.md)  

---

## Phases & Execution Tracking

- [x] **Phase 1: Prisma Schema & Migration**
  - Added enums `EquipmentStatus`, `BorrowStatus`, `EquipmentCondition`
  - Added models `InventoryItem`, `BorrowRecord`, `BorrowItem`
  - Added relation `borrowRecords` to `FieldEvent`
  - Created and applied migration `20261030192500_add_inventory_system`
  - Generated Prisma client

- [x] **Phase 2: SSOT Types**
  - Updated `ViewMode` union in `src/types/index.ts` with `"inventory"`
  - Exported interfaces and enums for inventory and borrowing

- [x] **Phase 3: API Routes**
  - `src/app/api/marcom/inventory/route.ts` (GET, POST)
  - `src/app/api/marcom/inventory/[id]/route.ts` (GET, PUT, DELETE)
  - `src/app/api/marcom/inventory/[id]/availability/route.ts` (GET)
  - `src/app/api/marcom/inventory/borrow/route.ts` (GET, POST)
  - `src/app/api/marcom/inventory/borrow/[id]/route.ts` (GET, PUT)
  - `src/app/api/marcom/inventory/borrow/[id]/return/route.ts` (POST)

- [x] **Phase 4: State Management**
  - Extended `useMarcomDataStore` with `inventoryItems`, `borrowRecords`, and SWR cache actions
  - Unit tests added to `marcomDataStore.test.ts` (18 passed)

- [x] **Phase 5: Navigation Wiring**
  - Added `inventory` to `MARCOM_MASTER_DATA` in `src/components/layout/navConfig.ts` with Package icon
  - Added dynamic import & switch case in `src/components/views/ActiveViewStage.tsx`

- [x] **Phase 6: UI Components**
  - `src/components/views/InventoryView/inventoryConstants.ts`
  - `src/components/views/InventoryView/InventoryHeaderKpis.tsx`
  - `src/components/views/InventoryView/InventoryItemsGrid.tsx`
  - `src/components/views/InventoryView/InventoryTableView.tsx`
  - `src/components/views/InventoryView/BorrowTrackingBoard.tsx`
  - `src/components/views/InventoryView/BorrowRecordsTable.tsx`
  - `src/components/views/InventoryView/InventoryItemFormModal.tsx`
  - `src/components/views/InventoryView/BorrowRequestModal.tsx`
  - `src/components/views/InventoryView/BorrowDetailModal.tsx`
  - `src/components/views/InventoryView/ReturnProcessModal.tsx`
  - `src/components/views/InventoryView/InventoryViewModals.tsx`
  - `src/components/views/InventoryView/InventoryView.tsx` (223 LOC ≤ 250 LOC)

- [x] **Phase 7: Event Integration**
  - Added `EventBorrowedEquipmentSection.tsx` in `src/components/views/EventsView/`
  - Integrated into `EventFormModal.tsx` for edit mode

- [x] **Phase 8: Seed & Permissions**
  - Added 13 equipment items to `prisma/seed.ts`
  - Added permissions in `src/lib/marcom/guards.ts`
  - Created test suite `src/lib/marcom/inventoryLogic.test.ts`
  - Created integration test suite `src/app/api/marcom/inventory/inventoryApi.test.ts`

---

## Verification

- `npm run drift:check`
- `npm run build:check`
- `npm test`
