/*
  Warnings:

  - The `defaultTaxMode` column on the `businesses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[workspaceId,businessId,sequence]` on the table `catalog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspaceId,businessId,estimateNumber]` on the table `estimates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspaceId,businessId,sequence]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspaceId,businessId,invoiceNumber]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessId` to the `estimates` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "catalog_workspaceId_sequence_key";

-- DropIndex
DROP INDEX "estimates_workspaceId_estimateNumber_key";

-- DropIndex
DROP INDEX "invoices_workspaceId_invoiceNumber_key";

-- DropIndex
DROP INDEX "invoices_workspaceId_sequence_key";

-- AlterTable
ALTER TABLE "businesses" DROP COLUMN "defaultTaxMode",
ADD COLUMN     "defaultTaxMode" "TaxMode";

-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "businessId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "catalog_workspaceId_businessId_sequence_key" ON "catalog"("workspaceId", "businessId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_workspaceId_businessId_estimateNumber_key" ON "estimates"("workspaceId", "businessId", "estimateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_workspaceId_businessId_sequence_key" ON "invoices"("workspaceId", "businessId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_workspaceId_businessId_invoiceNumber_key" ON "invoices"("workspaceId", "businessId", "invoiceNumber");
