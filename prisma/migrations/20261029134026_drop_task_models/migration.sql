/*
  Warnings:

  - You are about to drop the `FolderItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ListItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SpaceItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskCommentItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FolderItem" DROP CONSTRAINT "FolderItem_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "ListItem" DROP CONSTRAINT "ListItem_folderId_fkey";

-- DropForeignKey
ALTER TABLE "ListItem" DROP CONSTRAINT "ListItem_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "TaskCommentItem" DROP CONSTRAINT "TaskCommentItem_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskItem" DROP CONSTRAINT "TaskItem_listId_fkey";

-- DropTable
DROP TABLE "FolderItem";

-- DropTable
DROP TABLE "ListItem";

-- DropTable
DROP TABLE "SpaceItem";

-- DropTable
DROP TABLE "TaskCommentItem";

-- DropTable
DROP TABLE "TaskItem";
