/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `businesses` table. All the data in the column will be lost.
  - You are about to alter the column `defaultTaxPercentage` on the `businesses` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the column `deletedAt` on the `catalog` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `catalog` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the column `deletedAt` on the `clients` table. All the data in the column will be lost.
  - You are about to alter the column `unitPrice` on the `estimate_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `tax` on the `estimate_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `estimate_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the column `deletedAt` on the `estimates` table. All the data in the column will be lost.
  - You are about to alter the column `subtotal` on the `estimates` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `totalTax` on the `estimates` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `discount` on the `estimates` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `estimates` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `unitPrice` on the `invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `tax` on the `invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `discount` on the `invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the column `deletedAt` on the `invoices` table. All the data in the column will be lost.
  - You are about to alter the column `subtotal` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `totalTax` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `discount` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `taxPercentage` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `balance` on the `invoices` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the column `deletedAt` on the `payments` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the column `deletedAt` on the `workspaces` table. All the data in the column will be lost.
  - You are about to alter the column `defaultTaxRate` on the `workspaces` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.

*/
-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('PAYPAL', 'VENMO', 'ZELLE');

-- DropIndex
DROP INDEX "payments_transactionId_idx";

-- DropIndex
DROP INDEX "payments_transactionId_key";

-- AlterTable
ALTER TABLE "businesses" DROP COLUMN "deletedAt",
ALTER COLUMN "defaultTaxPercentage" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "catalog" DROP COLUMN "deletedAt",
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "estimate_items" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "tax" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "estimates" DROP COLUMN "deletedAt",
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "totalTax" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "invoice_items" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "tax" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "deletedAt",
ADD COLUMN     "selectedPaymentMethodId" INTEGER,
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "totalTax" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "taxPercentage" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "balance" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "deletedAt",
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "workspaces" DROP COLUMN "deletedAt",
ALTER COLUMN "defaultTaxRate" SET DATA TYPE DECIMAL(10,2);

-- CreateTable
CREATE TABLE "workspace_payment_methods" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "handle" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspace_payment_methods_workspaceId_idx" ON "workspace_payment_methods"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_payment_methods_workspaceId_type_key" ON "workspace_payment_methods"("workspaceId", "type");

-- AddForeignKey
ALTER TABLE "workspace_payment_methods" ADD CONSTRAINT "workspace_payment_methods_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_selectedPaymentMethodId_fkey" FOREIGN KEY ("selectedPaymentMethodId") REFERENCES "workspace_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
