-- CreateEnum
CREATE TYPE "MarcomRole" AS ENUM ('admin', 'staff', 'viewer');

-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('DONE', 'ON_PROGRESS', 'PENDING');

-- CreateEnum
CREATE TYPE "MouStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ON_PROGRESS', 'DONE', 'REJECTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('NOT_STARTED', 'ON_PROGRESS', 'DONE', 'ISSUE');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'ON_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OutletType" AS ENUM ('TRADITIONAL', 'MODERN_RETAIL', 'EXCLUSIVE', 'CAMPUS_OUTLET');

-- CreateEnum
CREATE TYPE "OutletTier" AS ENUM ('TIER_1', 'TIER_2', 'TIER_3');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('POSTER', 'SHOPBLIND', 'BANNER', 'BRANDING_SIGNBOARD', 'OTHER_MATERIALS');

-- CreateEnum
CREATE TYPE "DocFileType" AS ENUM ('PDF', 'XLSX', 'DOCX', 'ZIP', 'CSV', 'MP4', 'PNG', 'JPG');

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MarcomRole" NOT NULL DEFAULT 'viewer',

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("workspaceId","email")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "status" "BranchStatus" NOT NULL DEFAULT 'PENDING',
    "picName" TEXT NOT NULL DEFAULT '',
    "picPhone" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outlet" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OutletType" NOT NULL,
    "tier" "OutletTier" NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "picName" TEXT NOT NULL DEFAULT '',
    "picPhone" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "Outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Placement" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "status" "PlacementStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "date" TIMESTAMP(3),
    "picName" TEXT NOT NULL DEFAULT '',
    "photoUrl" TEXT NOT NULL DEFAULT '',
    "dimensions" TEXT NOT NULL DEFAULT '',
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mou" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "outletName" TEXT NOT NULL DEFAULT '',
    "partnerName" TEXT NOT NULL,
    "mouType" TEXT NOT NULL,
    "submissionDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "MouStatus" NOT NULL DEFAULT 'DRAFT',
    "picName" TEXT NOT NULL DEFAULT '',
    "docPath" TEXT NOT NULL DEFAULT '',
    "compensationValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Mou_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarcomEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "location" TEXT NOT NULL DEFAULT '',
    "branchName" TEXT NOT NULL DEFAULT '',
    "picName" TEXT NOT NULL DEFAULT '',
    "eventType" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING',
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attendeeCount" INTEGER NOT NULL DEFAULT 0,
    "targetAttendee" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "MarcomEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFootage" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "duration" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "EventFootage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT '',
    "branchName" TEXT NOT NULL DEFAULT '',
    "ownerPic" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "fileType" "DocFileType" NOT NULL,
    "fileSizeMb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "filePath" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "DocumentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "summary" JSONB NOT NULL DEFAULT '{}',
    "activities" JSONB NOT NULL DEFAULT '[]',
    "achievements" JSONB NOT NULL DEFAULT '[]',
    "keyIssues" JSONB NOT NULL DEFAULT '[]',
    "actionPlans" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "MonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Outlet_code_key" ON "Outlet"("code");

-- AddForeignKey
ALTER TABLE "Outlet" ADD CONSTRAINT "Outlet_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mou" ADD CONSTRAINT "Mou_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFootage" ADD CONSTRAINT "EventFootage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "MarcomEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
