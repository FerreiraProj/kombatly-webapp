-- AlterTable: add email verification and password reset fields to users
ALTER TABLE "users" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "users" ADD COLUMN "passwordResetToken" TEXT;
ALTER TABLE "users" ADD COLUMN "passwordResetExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");
