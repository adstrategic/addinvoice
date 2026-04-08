/*
  Warnings:

  - The values [EXPIRED] on the enum `EstimateStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `expirationDate` on the `estimates` table. All the data in the column will be lost.
  - You are about to drop the column `issueDate` on the `estimates` table. All the data in the column will be lost.
  - The `discountType` column on the `estimates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[signingToken]` on the table `estimates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[convertedToInvoiceId]` on the table `estimates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspaceId,sequence]` on the table `estimates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `estimate_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientEmail` to the `estimates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sequence` to the `estimates` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AcceptedBy" AS ENUM ('CLIENT', 'END_CUSTOMER');

-- CreateEnum
CREATE TYPE "EstimateAttachmentFileType" AS ENUM ('IMAGE', 'PDF');

-- AlterEnum
BEGIN;
CREATE TYPE "EstimateStatus_new" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'INVOICED');
ALTER TABLE "public"."estimates" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "estimates" ALTER COLUMN "status" TYPE "EstimateStatus_new" USING ("status"::text::"EstimateStatus_new");
ALTER TYPE "EstimateStatus" RENAME TO "EstimateStatus_old";
ALTER TYPE "EstimateStatus_new" RENAME TO "EstimateStatus";
DROP TYPE "public"."EstimateStatus_old";
ALTER TABLE "estimates" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "estimate_items" ADD COLUMN     "catalogId" INTEGER,
ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "quantityUnit" "QuantityUnit" NOT NULL DEFAULT 'UNITS',
ADD COLUMN     "vatEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "estimates" DROP COLUMN "expirationDate",
DROP COLUMN "issueDate",
ADD COLUMN     "acceptedBy" "AcceptedBy",
ADD COLUMN     "clientAddress" TEXT,
ADD COLUMN     "clientEmail" TEXT NOT NULL,
ADD COLUMN     "clientPhone" TEXT,
ADD COLUMN     "convertedToInvoiceId" INTEGER,
ADD COLUMN     "purchaseOrder" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "requireSignature" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sequence" INTEGER NOT NULL,
ADD COLUMN     "signatureData" JSONB,
ADD COLUMN     "signingToken" TEXT,
ADD COLUMN     "signingTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "taxMode" "TaxMode" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "taxName" TEXT,
ADD COLUMN     "taxPercentage" DECIMAL(10,2),
ADD COLUMN     "timelineEndDate" TIMESTAMP(3),
ADD COLUMN     "timelineStartDate" TIMESTAMP(3),
DROP COLUMN "discountType",
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "estimate_attachments" (
    "id" SERIAL NOT NULL,
    "estimateId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" "EstimateAttachmentFileType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimate_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "estimate_attachments_estimateId_idx" ON "estimate_attachments"("estimateId");

-- CreateIndex
CREATE INDEX "estimate_items_catalogId_idx" ON "estimate_items"("catalogId");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_signingToken_key" ON "estimates"("signingToken");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_convertedToInvoiceId_key" ON "estimates"("convertedToInvoiceId");

-- CreateIndex
CREATE INDEX "estimates_signingToken_idx" ON "estimates"("signingToken");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_workspaceId_sequence_key" ON "estimates"("workspaceId", "sequence");

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_convertedToInvoiceId_fkey" FOREIGN KEY ("convertedToInvoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_attachments" ADD CONSTRAINT "estimate_attachments_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
