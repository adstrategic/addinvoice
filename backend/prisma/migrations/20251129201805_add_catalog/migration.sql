/*
  Warnings:

  - You are about to drop the column `provider` on the `payments` table. All the data in the column will be lost.
  - Added the required column `name` to the `invoice_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TaxMode" AS ENUM ('BY_PRODUCT', 'BY_TOTAL', 'NONE');

-- CreateEnum
CREATE TYPE "QuantityUnit" AS ENUM ('DAYS', 'HOURS', 'UNITS');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED', 'NONE');

-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "catalogId" INTEGER,
ADD COLUMN     "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "quantityUnit" "QuantityUnit" NOT NULL DEFAULT 'UNITS',
ADD COLUMN     "vatEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "customHeader" TEXT,
ADD COLUMN     "purchaseOrder" TEXT,
ADD COLUMN     "taxMode" "TaxMode" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "taxName" TEXT,
ADD COLUMN     "taxPercentage" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "provider",
ADD COLUMN     "details" TEXT,
ADD COLUMN     "paymentMethod" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "catalog" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "quantityUnit" "QuantityUnit" NOT NULL DEFAULT 'DAYS',
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "catalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_workspaceId_idx" ON "catalog"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_workspaceId_sequence_key" ON "catalog"("workspaceId", "sequence");

-- CreateIndex
CREATE INDEX "invoice_items_catalogId_idx" ON "invoice_items"("catalogId");

-- AddForeignKey
ALTER TABLE "catalog" ADD CONSTRAINT "catalog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
