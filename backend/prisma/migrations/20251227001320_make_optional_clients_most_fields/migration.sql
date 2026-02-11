/*
  Warnings:

  - Made the column `businessId` on table `invoices` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_businessId_fkey";

-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "nit" DROP NOT NULL,
ALTER COLUMN "businessName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "businessId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
