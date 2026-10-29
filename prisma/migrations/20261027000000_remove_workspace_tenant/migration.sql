-- CreateEnum
CREATE TYPE "OutletStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Brand" AS ENUM ('IM3', 'TRI');

-- AlterEnum
BEGIN;
CREATE TYPE "MouStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'DONE', 'REJECTED', 'APPROVED');
ALTER TABLE "public"."Mou" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Mou" ALTER COLUMN "status" TYPE "MouStatus_new" USING ("status"::text::"MouStatus_new");
ALTER TYPE "MouStatus" RENAME TO "MouStatus_old";
ALTER TYPE "MouStatus_new" RENAME TO "MouStatus";
DROP TYPE "public"."MouStatus_old";
ALTER TABLE "Mou" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "EventFootage" DROP CONSTRAINT "EventFootage_eventId_fkey";

-- AlterTable
ALTER TABLE "DocumentItem" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "requiresMou" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Mou" ADD COLUMN     "outletId" TEXT,
ADD COLUMN     "picPhone" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Outlet" DROP COLUMN "tier",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "brand" "Brand" NOT NULL DEFAULT 'IM3',
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "photoUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "rejectionReason" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "status" "OutletStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "submittedBy" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Placement" ADD COLUMN     "brand" "Brand" NOT NULL DEFAULT 'IM3',
ADD COLUMN     "campaignTheme" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isLocationValid" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationDeviation" DOUBLE PRECISION,
ADD COLUMN     "locationNotes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "mouId" TEXT,
ADD COLUMN     "quarter" TEXT NOT NULL DEFAULT 'Q3 2026',
ADD COLUMN     "shareLocationUrl" TEXT NOT NULL DEFAULT '';

-- DropTable
DROP TABLE "MarcomEvent";

-- DropTable
DROP TABLE "WorkspaceMember";

-- DropEnum
DROP TYPE "MarcomRole";

-- DropEnum
DROP TYPE "OutletTier";

-- CreateTable
CREATE TABLE "ContentPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "publishDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "caption" TEXT NOT NULL DEFAULT '',
    "mediaUrl" TEXT NOT NULL DEFAULT '',
    "branchName" TEXT NOT NULL DEFAULT '',
    "picName" TEXT NOT NULL DEFAULT '',
    "revisionNotes" TEXT NOT NULL DEFAULT '',
    "subtasks" JSONB NOT NULL DEFAULT '[]',
    "outletId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "location" TEXT NOT NULL DEFAULT '',
    "branchName" TEXT NOT NULL DEFAULT '',
    "picName" TEXT NOT NULL DEFAULT '',
    "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING',
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetAttendee" INTEGER NOT NULL DEFAULT 0,
    "attendeeCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "outletId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'folder',
    "color" TEXT NOT NULL DEFAULT '#64748B',
    "statuses" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpaceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FolderItem" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FolderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListItem" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "folderId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#64748B',
    "icon" TEXT NOT NULL DEFAULT 'list',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskItem" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "statusId" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "dueDate" TEXT,
    "startDate" TEXT,
    "estimatedHours" DOUBLE PRECISION,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "relatedMarcomId" TEXT,
    "relatedMarcomType" TEXT,
    "postPlatform" TEXT,
    "postFormat" TEXT,
    "mediaUrl" TEXT,
    "progress" DOUBLE PRECISION,
    "assignees" JSONB NOT NULL DEFAULT '[]',
    "tags" JSONB NOT NULL DEFAULT '[]',
    "subtasks" JSONB NOT NULL DEFAULT '[]',
    "dependencies" JSONB NOT NULL DEFAULT '[]',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCommentItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "user" JSONB NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskCommentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentPost_platform_idx" ON "ContentPost"("platform");

-- CreateIndex
CREATE INDEX "ContentPost_status_idx" ON "ContentPost"("status");

-- CreateIndex
CREATE INDEX "ContentPost_publishDate_idx" ON "ContentPost"("publishDate");

-- CreateIndex
CREATE INDEX "ContentPost_outletId_idx" ON "ContentPost"("outletId");

-- CreateIndex
CREATE INDEX "FieldEvent_status_idx" ON "FieldEvent"("status");

-- CreateIndex
CREATE INDEX "FieldEvent_startDate_idx" ON "FieldEvent"("startDate");

-- CreateIndex
CREATE INDEX "FieldEvent_branchName_idx" ON "FieldEvent"("branchName");

-- CreateIndex
CREATE INDEX "FieldEvent_outletId_idx" ON "FieldEvent"("outletId");

-- CreateIndex
CREATE INDEX "FolderItem_spaceId_idx" ON "FolderItem"("spaceId");

-- CreateIndex
CREATE INDEX "ListItem_spaceId_idx" ON "ListItem"("spaceId");

-- CreateIndex
CREATE INDEX "ListItem_folderId_idx" ON "ListItem"("folderId");

-- CreateIndex
CREATE INDEX "TaskItem_listId_idx" ON "TaskItem"("listId");

-- CreateIndex
CREATE INDEX "TaskItem_statusId_idx" ON "TaskItem"("statusId");

-- CreateIndex
CREATE INDEX "TaskItem_listId_statusId_idx" ON "TaskItem"("listId", "statusId");

-- CreateIndex
CREATE INDEX "TaskItem_listId_orderIndex_idx" ON "TaskItem"("listId", "orderIndex");

-- CreateIndex
CREATE INDEX "TaskItem_relatedMarcomId_idx" ON "TaskItem"("relatedMarcomId");

-- CreateIndex
CREATE INDEX "TaskItem_relatedMarcomType_idx" ON "TaskItem"("relatedMarcomType");

-- CreateIndex
CREATE INDEX "TaskItem_dueDate_idx" ON "TaskItem"("dueDate");

-- CreateIndex
CREATE INDEX "TaskItem_tags_idx" ON "TaskItem" USING GIN ("tags" jsonb_ops);

-- CreateIndex
CREATE INDEX "TaskItem_assignees_idx" ON "TaskItem" USING GIN ("assignees" jsonb_ops);

-- CreateIndex
CREATE INDEX "TaskCommentItem_taskId_idx" ON "TaskCommentItem"("taskId");

-- CreateIndex
CREATE INDEX "TaskCommentItem_userId_idx" ON "TaskCommentItem"("userId");

-- CreateIndex
CREATE INDEX "TaskCommentItem_createdAt_idx" ON "TaskCommentItem"("createdAt");

-- CreateIndex
CREATE INDEX "Mou_outletId_idx" ON "Mou"("outletId");

-- CreateIndex
CREATE INDEX "Mou_branchId_idx" ON "Mou"("branchId");

-- CreateIndex
CREATE INDEX "Outlet_status_idx" ON "Outlet"("status");

-- CreateIndex
CREATE INDEX "Outlet_branchId_idx" ON "Outlet"("branchId");

-- CreateIndex
CREATE INDEX "Placement_mouId_idx" ON "Placement"("mouId");

-- CreateIndex
CREATE INDEX "Placement_outletId_idx" ON "Placement"("outletId");

-- CreateIndex
CREATE INDEX "Placement_materialId_idx" ON "Placement"("materialId");

-- CreateIndex
CREATE INDEX "Placement_quarter_idx" ON "Placement"("quarter");

-- CreateIndex
CREATE INDEX "Placement_campaignTheme_idx" ON "Placement"("campaignTheme");

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_mouId_fkey" FOREIGN KEY ("mouId") REFERENCES "Mou"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mou" ADD CONSTRAINT "Mou_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPost" ADD CONSTRAINT "ContentPost_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldEvent" ADD CONSTRAINT "FieldEvent_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFootage" ADD CONSTRAINT "EventFootage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "FieldEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FolderItem" ADD CONSTRAINT "FolderItem_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "SpaceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "SpaceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "FolderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskItem" ADD CONSTRAINT "TaskItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ListItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCommentItem" ADD CONSTRAINT "TaskCommentItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

