-- AlterTable
ALTER TABLE "FieldEvent" ADD COLUMN IF NOT EXISTS "mediaAttachments" JSONB NOT NULL DEFAULT '[]';

-- DropTable
DROP TABLE IF EXISTS "EventFootage";

