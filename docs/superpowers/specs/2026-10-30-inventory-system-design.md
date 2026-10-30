# Spec: Field Event Inventory & Equipment Borrowing System

**Spec ID:** `2026-10-30-inventory-system`  
**Status:** Implemented  
**Date:** 2026-10-30  
**ADR:** [ADR 05](file:///Users/mac/Web%20Development/vrello-up/docs/inventory-system/adr.md)  
**Detailed Spec:** [docs/inventory-system/spec.md](file:///Users/mac/Web%20Development/vrello-up/docs/inventory-system/spec.md)  
**Detailed Plan:** [docs/inventory-system/plan.md](file:///Users/mac/Web%20Development/vrello-up/docs/inventory-system/plan.md)  

---

## 1. Executive Summary

Introduces a dedicated equipment inventory catalog and formal borrowing lifecycle system under Marcom Master Data (`/api/marcom/inventory` and `InventoryView`).
Tracks physical event equipment (tents, tables, speakers, display TV, branding kits) across field activations with an auditable PENDING → APPROVED → ACTIVE → RETURNED workflow, automated unit availability decrements and restorations, condition logs, and overdue tracking.

---

## 2. SSOT Types (`src/types/index.ts`)

- `ViewMode` union extended with `"inventory"`
- Added: `EquipmentStatus`, `BorrowStatus`, `EquipmentCondition`
- Added: `InventoryItem`, `BorrowItem`, `BorrowRecord`

---

## 3. Prisma Schema & Models

- Enums: `EquipmentStatus`, `BorrowStatus`, `EquipmentCondition`
- Models: `InventoryItem`, `BorrowRecord`, `BorrowItem`
- `FieldEvent` back-relation: `borrowRecords BorrowRecord[]`
- Migration: `20261030192500_add_inventory_system`

---

## 4. API Endpoints

- `GET /api/marcom/inventory` — List equipment catalog with filters
- `POST /api/marcom/inventory` — Create equipment item (enforces unique code)
- `GET /api/marcom/inventory/[id]` — Single item details
- `PUT /api/marcom/inventory/[id]` — Update item details (prevents totalUnits < availableUnits)
- `DELETE /api/marcom/inventory/[id]` — Delete item (guards against active borrows)
- `GET /api/marcom/inventory/[id]/availability` — Snapshot of available units & active borrows
- `GET /api/marcom/inventory/borrow` — List borrow records
- `POST /api/marcom/inventory/borrow` — Submit borrow request (generates `BRW-YYYYMMDD-NNN`)
- `GET /api/marcom/inventory/borrow/[id]` — Single record with items & event link
- `PUT /api/marcom/inventory/borrow/[id]` — State machine transition (APPROVED -> ACTIVE decrements stock)
- `POST /api/marcom/inventory/borrow/[id]/return` — Return processing, condition check, stock restore

---

## 5. UI Views & Integration

- `InventoryView` coordinator component (≤ 250 LOC) with 4 KPI cards
- Subviews: `InventoryItemsGrid`, `InventoryTableView`, `BorrowTrackingBoard`, `BorrowRecordsTable`
- Modals: `InventoryItemFormModal`, `BorrowRequestModal`, `BorrowDetailModal`, `ReturnProcessModal`
- Integration: `EventBorrowedEquipmentSection` in `EventFormModal`
- Permissions: `VIEW_INVENTORY`, `MANAGE_INVENTORY`, `REQUEST_BORROW`, `APPROVE_BORROW`, `PROCESS_RETURN` in `guards.ts`

---

## 6. Verification Checklist

- [x] `npm run drift:check` passes
- [x] `npm run build:check` (tsc) passes with 0 errors
- [x] `npm test` passes with 0 failures
- [x] Seed data (13 equipment items) executes cleanly
