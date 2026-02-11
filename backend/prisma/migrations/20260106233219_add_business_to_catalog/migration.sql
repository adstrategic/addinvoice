/*
  Warnings:

  - Added the required column `businessId` to the `catalog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "catalog" ADD COLUMN     "businessId" INTEGER NOT NULL,
ALTER COLUMN "quantityUnit" SET DEFAULT 'UNITS';

-- AddForeignKey
ALTER TABLE "catalog" ADD CONSTRAINT "catalog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
