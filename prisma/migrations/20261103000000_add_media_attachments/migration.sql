-- AlterTable
ALTER TABLE "ContentPost" ADD COLUMN IF NOT EXISTS "mediaAttachments" JSONB NOT NULL DEFAULT '[]';

