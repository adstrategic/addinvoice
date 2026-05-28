/*
  Warnings:

  - A unique constraint covering the columns `[publicSlug]` on the table `advances` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "AdvanceStatus" ADD VALUE 'VOIDED';

-- AlterEnum
ALTER TYPE "EstimateStatus" ADD VALUE 'VOIDED';

-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'VOIDED';

-- AlterEnum
ALTER TYPE "ProposalStatus" ADD VALUE 'VOIDED';

-- AlterTable
ALTER TABLE "advances" ADD COLUMN     "publicSlug" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "advances_publicSlug_key" ON "advances"("publicSlug");

-- CreateIndex
CREATE INDEX "advances_publicSlug_idx" ON "advances"("publicSlug");
