-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PROMOTER', 'CLUB', 'ATHLETE', 'REFEREE');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'PRIVATE', 'PUBLIC', 'ONGOING', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DrawType" AS ENUM ('RANDOM', 'RANKING');

-- CreateEnum
CREATE TYPE "AthletesVisible" AS ENUM ('NONE', 'REGISTERED', 'ALL');

-- CreateEnum
CREATE TYPE "CombatStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "RoundType" AS ENUM ('ROUND_OF_64', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL', 'REPECHAGE', 'BRONZE');

-- CreateEnum
CREATE TYPE "PointType" AS ENUM ('PUNCH_BODY', 'KICK_BODY', 'KICK_HEAD', 'SPIN_KICK_BODY', 'SPIN_KICK_HEAD', 'PENALTY');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'MBWAY', 'OTHER');

-- CreateEnum
CREATE TYPE "PlatformPaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "RefereeRole" AS ENUM ('MAIN', 'JUDGE_1', 'JUDGE_2', 'AREA_JUDGE');

-- CreateEnum
CREATE TYPE "ProtestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "countryCode" TEXT DEFAULT 'PT',
    "language" TEXT NOT NULL DEFAULT 'en',
    "role" "UserRole" NOT NULL DEFAULT 'PROMOTER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sigla" TEXT,
    "logoUrl" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT DEFAULT 'Portugal',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "platformName" TEXT NOT NULL DEFAULT 'Taekwombats',
    "logoUrl" TEXT,
    "costPerAthlete" DECIMAL(10,2) NOT NULL DEFAULT 2.50,
    "referralPointsPerReferral" INTEGER NOT NULL DEFAULT 10,
    "referralPointsMinAthletes" INTEGER NOT NULL DEFAULT 200,
    "referralDiscountPct" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "pointsOnRegistration" INTEGER NOT NULL DEFAULT 5,
    "platformEmail" TEXT NOT NULL DEFAULT 'admin@taekwombats.com',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "namePt" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFr" TEXT,
    "nameEs" TEXT,
    "nameDe" TEXT,
    "nameIt" TEXT,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "avgCombatDuration" INTEGER NOT NULL DEFAULT 6,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genders" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "namePt" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFr" TEXT,
    "nameEs" TEXT,
    "nameDe" TEXT,
    "nameIt" TEXT,

    CONSTRAINT "genders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_categories" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "genderId" TEXT NOT NULL,
    "symbol" TEXT,
    "weightValue" DECIMAL(5,2) NOT NULL,
    "strWeight" TEXT NOT NULL,
    "displayNamePt" TEXT NOT NULL,
    "displayNameEn" TEXT NOT NULL,
    "displayNameFr" TEXT,
    "displayNameEs" TEXT,
    "displayNameDe" TEXT,
    "displayNameIt" TEXT,
    "vestType" INTEGER NOT NULL,
    "isOfficial" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "weight_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endDate" DATE,
    "registrationDeadline" DATE NOT NULL,
    "registrationDeadlineTime" TIME NOT NULL DEFAULT '23:59:00',
    "numAreas" INTEGER NOT NULL DEFAULT 1,
    "drawType" "DrawType" NOT NULL DEFAULT 'RANDOM',
    "numRounds" INTEGER NOT NULL DEFAULT 3,
    "hasVestLimitation" BOOLEAN NOT NULL DEFAULT false,
    "vestQtyType1" INTEGER,
    "vestQtyType2" INTEGER,
    "vestQtyType3" INTEGER,
    "vestQtyType4" INTEGER,
    "athletesVisible" "AthletesVisible" NOT NULL DEFAULT 'NONE',
    "drawVisible" BOOLEAN NOT NULL DEFAULT false,
    "areasVisible" BOOLEAN NOT NULL DEFAULT false,
    "flyerUrl" TEXT,
    "sponsorLogos" JSONB,
    "status" "TournamentStatus" NOT NULL DEFAULT 'PRIVATE',
    "bracketsGenerated" BOOLEAN NOT NULL DEFAULT false,
    "platformPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_categories" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "gradeId" TEXT,
    "genderId" TEXT,
    "weightCategoryId" TEXT,
    "vestType" INTEGER NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "customName" TEXT,
    "minWeight" DECIMAL(5,2),
    "maxWeight" DECIMAL(5,2),
    "avgCombatDuration" INTEGER NOT NULL DEFAULT 6,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_registrations" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "clubId" TEXT,
    "categoryId" TEXT NOT NULL,
    "ranking" INTEGER NOT NULL DEFAULT 0,
    "weight" DECIMAL(5,2),
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "invoiceNoteId" TEXT,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "weighInVerified" BOOLEAN NOT NULL DEFAULT false,
    "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "includedInBrackets" BOOLEAN NOT NULL DEFAULT false,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_areas" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vestTypes" JSONB NOT NULL DEFAULT '[]',
    "currentCombatId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "competition_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combats" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "areaId" TEXT,
    "combatNumber" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "roundType" "RoundType" NOT NULL,
    "bracketPosition" INTEGER,
    "redAthleteId" TEXT,
    "blueAthleteId" TEXT,
    "winnerId" TEXT,
    "nextCombatId" TEXT,
    "isRepechage" BOOLEAN NOT NULL DEFAULT false,
    "scheduledTime" TIMESTAMP(3),
    "actualStartTime" TIMESTAMP(3),
    "actualEndTime" TIMESTAMP(3),
    "status" "CombatStatus" NOT NULL DEFAULT 'SCHEDULED',
    "redScore" INTEGER NOT NULL DEFAULT 0,
    "blueScore" INTEGER NOT NULL DEFAULT 0,
    "refereeId" TEXT,
    "protestFiled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combat_referees" (
    "id" TEXT NOT NULL,
    "combatId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "role" "RefereeRole" NOT NULL DEFAULT 'MAIN',
    "canEditResults" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combat_referees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combat_points" (
    "id" TEXT NOT NULL,
    "combatId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "pointType" "PointType" NOT NULL,
    "pointValue" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "timestamp" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combat_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athlete_checkins" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInBy" TEXT NOT NULL,
    "actualWeight" DECIMAL(5,2),
    "weightVerified" BOOLEAN NOT NULL DEFAULT false,
    "weightVerifiedBy" TEXT,
    "weightVerifiedAt" TIMESTAMP(3),
    "documentsChecked" BOOLEAN NOT NULL DEFAULT false,
    "documentsVerifiedBy" TEXT,
    "documentsVerifiedAt" TIMESTAMP(3),
    "athleteCardNumber" TEXT,
    "medicalCertificate" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "athlete_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protests" (
    "id" TEXT NOT NULL,
    "combatId" TEXT NOT NULL,
    "filedBy" TEXT NOT NULL,
    "filedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "status" "ProtestStatus" NOT NULL DEFAULT 'PENDING',
    "juryMembers" JSONB,
    "decision" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedBy" TEXT,

    CONSTRAINT "protests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_notes" (
    "id" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "numAthletes" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod",
    "notes" TEXT,

    CONSTRAINT "invoice_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_payments" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "promoterId" TEXT NOT NULL,
    "numAthletes" INTEGER NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "discountPct" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "discountReason" TEXT,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "status" "PlatformPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "includesUnpaidRegistrations" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_points" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referrerId" TEXT,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "usedForDiscount" BOOLEAN NOT NULL DEFAULT false,
    "discountAppliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscription" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "clubs_userId_key" ON "clubs"("userId");

-- CreateIndex
CREATE INDEX "clubs_userId_idx" ON "clubs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "genders_code_key" ON "genders"("code");

-- CreateIndex
CREATE INDEX "weight_categories_gradeId_genderId_idx" ON "weight_categories"("gradeId", "genderId");

-- CreateIndex
CREATE UNIQUE INDEX "regulations_name_language_key" ON "regulations"("name", "language");

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_slug_key" ON "tournaments"("slug");

-- CreateIndex
CREATE INDEX "tournaments_promoterId_idx" ON "tournaments"("promoterId");

-- CreateIndex
CREATE INDEX "tournaments_slug_idx" ON "tournaments"("slug");

-- CreateIndex
CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");

-- CreateIndex
CREATE INDEX "tournaments_registrationDeadline_idx" ON "tournaments"("registrationDeadline");

-- CreateIndex
CREATE INDEX "tournament_categories_tournamentId_idx" ON "tournament_categories"("tournamentId");

-- CreateIndex
CREATE INDEX "tournament_registrations_tournamentId_categoryId_idx" ON "tournament_registrations"("tournamentId", "categoryId");

-- CreateIndex
CREATE INDEX "tournament_registrations_athleteId_idx" ON "tournament_registrations"("athleteId");

-- CreateIndex
CREATE INDEX "competition_areas_tournamentId_idx" ON "competition_areas"("tournamentId");

-- CreateIndex
CREATE INDEX "combats_tournamentId_status_idx" ON "combats"("tournamentId", "status");

-- CreateIndex
CREATE INDEX "combats_scheduledTime_idx" ON "combats"("scheduledTime");

-- CreateIndex
CREATE UNIQUE INDEX "combat_referees_combatId_refereeId_key" ON "combat_referees"("combatId", "refereeId");

-- CreateIndex
CREATE INDEX "combat_points_combatId_idx" ON "combat_points"("combatId");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_checkins_registrationId_key" ON "athlete_checkins"("registrationId");

-- CreateIndex
CREATE INDEX "athlete_checkins_tournamentId_idx" ON "athlete_checkins"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "protests_combatId_key" ON "protests"("combatId");

-- CreateIndex
CREATE INDEX "invoice_notes_tournamentId_idx" ON "invoice_notes"("tournamentId");

-- CreateIndex
CREATE INDEX "invoice_notes_issuerId_idx" ON "invoice_notes"("issuerId");

-- CreateIndex
CREATE UNIQUE INDEX "platform_payments_tournamentId_key" ON "platform_payments"("tournamentId");

-- CreateIndex
CREATE INDEX "referral_points_userId_idx" ON "referral_points"("userId");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_categories" ADD CONSTRAINT "weight_categories_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_categories" ADD CONSTRAINT "weight_categories_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "genders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_categories" ADD CONSTRAINT "tournament_categories_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_categories" ADD CONSTRAINT "tournament_categories_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_categories" ADD CONSTRAINT "tournament_categories_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "genders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_categories" ADD CONSTRAINT "tournament_categories_weightCategoryId_fkey" FOREIGN KEY ("weightCategoryId") REFERENCES "weight_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "tournament_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_invoiceNoteId_fkey" FOREIGN KEY ("invoiceNoteId") REFERENCES "invoice_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_areas" ADD CONSTRAINT "competition_areas_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combats" ADD CONSTRAINT "combats_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combats" ADD CONSTRAINT "combats_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "tournament_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combats" ADD CONSTRAINT "combats_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "competition_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combats" ADD CONSTRAINT "combats_redAthleteId_fkey" FOREIGN KEY ("redAthleteId") REFERENCES "tournament_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combats" ADD CONSTRAINT "combats_blueAthleteId_fkey" FOREIGN KEY ("blueAthleteId") REFERENCES "tournament_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combats" ADD CONSTRAINT "combats_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "tournament_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combats" ADD CONSTRAINT "combats_nextCombatId_fkey" FOREIGN KEY ("nextCombatId") REFERENCES "combats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_referees" ADD CONSTRAINT "combat_referees_combatId_fkey" FOREIGN KEY ("combatId") REFERENCES "combats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_referees" ADD CONSTRAINT "combat_referees_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_points" ADD CONSTRAINT "combat_points_combatId_fkey" FOREIGN KEY ("combatId") REFERENCES "combats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_points" ADD CONSTRAINT "combat_points_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "tournament_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_points" ADD CONSTRAINT "combat_points_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_checkins" ADD CONSTRAINT "athlete_checkins_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_checkins" ADD CONSTRAINT "athlete_checkins_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "tournament_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_checkins" ADD CONSTRAINT "athlete_checkins_checkedInBy_fkey" FOREIGN KEY ("checkedInBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_checkins" ADD CONSTRAINT "athlete_checkins_weightVerifiedBy_fkey" FOREIGN KEY ("weightVerifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "athlete_checkins" ADD CONSTRAINT "athlete_checkins_documentsVerifiedBy_fkey" FOREIGN KEY ("documentsVerifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protests" ADD CONSTRAINT "protests_combatId_fkey" FOREIGN KEY ("combatId") REFERENCES "combats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protests" ADD CONSTRAINT "protests_filedBy_fkey" FOREIGN KEY ("filedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protests" ADD CONSTRAINT "protests_decidedBy_fkey" FOREIGN KEY ("decidedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_notes" ADD CONSTRAINT "invoice_notes_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_notes" ADD CONSTRAINT "invoice_notes_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_notes" ADD CONSTRAINT "invoice_notes_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_payments" ADD CONSTRAINT "platform_payments_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_payments" ADD CONSTRAINT "platform_payments_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_points" ADD CONSTRAINT "referral_points_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_points" ADD CONSTRAINT "referral_points_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
