-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'BORROWED', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "BorrowStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'RETURNED', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "EquipmentCondition" AS ENUM ('GOOD', 'MINOR_DAMAGE', 'MAJOR_DAMAGE', 'LOST');

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "totalUnits" INTEGER NOT NULL DEFAULT 1,
    "availableUnits" INTEGER NOT NULL DEFAULT 1,
    "photoUrl" TEXT NOT NULL DEFAULT '',
    "storageLocation" TEXT NOT NULL DEFAULT '',
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BorrowRecord" (
    "id" TEXT NOT NULL,
    "borrowCode" TEXT NOT NULL,
    "borrowerName" TEXT NOT NULL,
    "borrowerPhone" TEXT NOT NULL DEFAULT '',
    "borrowerDivision" TEXT NOT NULL DEFAULT '',
    "picName" TEXT NOT NULL DEFAULT '',
    "eventId" TEXT,
    "eventLocation" TEXT NOT NULL DEFAULT '',
    "borrowDate" TIMESTAMP(3) NOT NULL,
    "returnDueDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "status" "BorrowStatus" NOT NULL DEFAULT 'PENDING',
    "purpose" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "approvedBy" TEXT NOT NULL DEFAULT '',
    "approvedAt" TIMESTAMP(3),
    "returnNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BorrowRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BorrowItem" (
    "id" TEXT NOT NULL,
    "borrowRecordId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "conditionOut" "EquipmentCondition" NOT NULL DEFAULT 'GOOD',
    "conditionIn" "EquipmentCondition",
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "BorrowItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_code_key" ON "InventoryItem"("code");

-- CreateIndex
CREATE INDEX "InventoryItem_status_idx" ON "InventoryItem"("status");

-- CreateIndex
CREATE INDEX "InventoryItem_category_idx" ON "InventoryItem"("category");

-- CreateIndex
CREATE UNIQUE INDEX "BorrowRecord_borrowCode_key" ON "BorrowRecord"("borrowCode");

-- CreateIndex
CREATE INDEX "BorrowRecord_status_idx" ON "BorrowRecord"("status");

-- CreateIndex
CREATE INDEX "BorrowRecord_borrowDate_idx" ON "BorrowRecord"("borrowDate");

-- CreateIndex
CREATE INDEX "BorrowRecord_returnDueDate_idx" ON "BorrowRecord"("returnDueDate");

-- CreateIndex
CREATE INDEX "BorrowRecord_borrowerName_idx" ON "BorrowRecord"("borrowerName");

-- CreateIndex
CREATE INDEX "BorrowRecord_eventId_idx" ON "BorrowRecord"("eventId");

-- CreateIndex
CREATE INDEX "BorrowItem_borrowRecordId_idx" ON "BorrowItem"("borrowRecordId");

-- CreateIndex
CREATE INDEX "BorrowItem_inventoryItemId_idx" ON "BorrowItem"("inventoryItemId");

-- AddForeignKey
ALTER TABLE "BorrowRecord" ADD CONSTRAINT "BorrowRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "FieldEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowItem" ADD CONSTRAINT "BorrowItem_borrowRecordId_fkey" FOREIGN KEY ("borrowRecordId") REFERENCES "BorrowRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BorrowItem" ADD CONSTRAINT "BorrowItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
