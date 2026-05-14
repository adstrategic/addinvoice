-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('SENT', 'ACCEPTED', 'REJECTED', 'INVOICED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstimateStatus" ADD VALUE 'VIEWED';
ALTER TYPE "EstimateStatus" ADD VALUE 'PROPOSAL';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "estimates" ADD COLUMN     "exclusions" JSONB;

-- CreateTable
CREATE TABLE "proposals" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "businessId" INTEGER NOT NULL,
    "estimateId" INTEGER NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT,
    "clientAddress" TEXT,
    "proposalNumber" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "purchaseOrder" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'SENT',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "total" DECIMAL(10,2) NOT NULL,
    "notes" JSONB,
    "terms" JSONB,
    "exclusions" JSONB,
    "summary" JSONB,
    "timelineStartDate" DATE,
    "timelineEndDate" DATE,
    "rejectionReason" TEXT,
    "requireSignature" BOOLEAN NOT NULL DEFAULT true,
    "signingToken" TEXT,
    "signingTokenExpiresAt" TIMESTAMP(3),
    "signatureData" JSONB,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "acceptedBy" "AcceptedBy",
    "convertedToInvoiceId" INTEGER,
    "selectedPaymentMethodId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_descriptive_items" (
    "id" SERIAL NOT NULL,
    "proposalId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_descriptive_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proposals_estimateId_key" ON "proposals"("estimateId");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_signingToken_key" ON "proposals"("signingToken");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_convertedToInvoiceId_key" ON "proposals"("convertedToInvoiceId");

-- CreateIndex
CREATE INDEX "proposals_workspaceId_idx" ON "proposals"("workspaceId");

-- CreateIndex
CREATE INDEX "proposals_clientId_idx" ON "proposals"("clientId");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE INDEX "proposals_estimateId_idx" ON "proposals"("estimateId");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_workspaceId_sequence_key" ON "proposals"("workspaceId", "sequence");

-- CreateIndex
CREATE INDEX "proposal_descriptive_items_proposalId_idx" ON "proposal_descriptive_items"("proposalId");

-- CreateIndex
CREATE INDEX "proposal_descriptive_items_proposalId_sortOrder_idx" ON "proposal_descriptive_items"("proposalId", "sortOrder");

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "estimates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_convertedToInvoiceId_fkey" FOREIGN KEY ("convertedToInvoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_selectedPaymentMethodId_fkey" FOREIGN KEY ("selectedPaymentMethodId") REFERENCES "workspace_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_descriptive_items" ADD CONSTRAINT "proposal_descriptive_items_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
