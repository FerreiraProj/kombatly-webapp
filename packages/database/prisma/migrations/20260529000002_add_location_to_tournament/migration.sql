-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN "country" TEXT NOT NULL DEFAULT '';
ALTER TABLE "tournaments" ADD COLUMN "city"    TEXT;
ALTER TABLE "tournaments" ADD COLUMN "venue"   TEXT;
