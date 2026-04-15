/*
  Warnings:

  - A unique constraint covering the columns `[defaultPaymentMethodId]` on the table `workspaces` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PaymentMethodType" ADD VALUE 'NEQUI';

-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "selectedPaymentMethodId" INTEGER;

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "defaultPaymentMethodId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_defaultPaymentMethodId_key" ON "workspaces"("defaultPaymentMethodId");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_defaultPaymentMethodId_fkey" FOREIGN KEY ("defaultPaymentMethodId") REFERENCES "workspace_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_selectedPaymentMethodId_fkey" FOREIGN KEY ("selectedPaymentMethodId") REFERENCES "workspace_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
