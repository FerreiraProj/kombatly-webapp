-- AlterTable
ALTER TABLE "users" ADD COLUMN "homeClubId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_homeClubId_fkey" FOREIGN KEY ("homeClubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
