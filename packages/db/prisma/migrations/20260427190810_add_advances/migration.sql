-- CreateEnum
CREATE TYPE "AdvanceStatus" AS ENUM ('DRAFT', 'ISSUED', 'INVOICED');

-- CreateTable
CREATE TABLE "advances" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "businessId" INTEGER,
    "invoiceId" INTEGER,
    "sequence" INTEGER NOT NULL,
    "projectName" TEXT NOT NULL,
    "advanceDate" DATE NOT NULL,
    "location" TEXT,
    "workCompleted" TEXT,
    "status" "AdvanceStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advance_attachments" (
    "id" SERIAL NOT NULL,
    "advanceId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advance_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "advances_workspaceId_clientId_idx" ON "advances"("workspaceId", "clientId");

-- CreateIndex
CREATE INDEX "advances_workspaceId_invoiceId_idx" ON "advances"("workspaceId", "invoiceId");

-- CreateIndex
CREATE INDEX "advances_workspaceId_status_createdAt_idx" ON "advances"("workspaceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "advances_clientId_createdAt_idx" ON "advances"("clientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "advances_workspaceId_sequence_key" ON "advances"("workspaceId", "sequence");

-- CreateIndex
CREATE INDEX "advance_attachments_advanceId_idx" ON "advance_attachments"("advanceId");

-- AddForeignKey
ALTER TABLE "advances" ADD CONSTRAINT "advances_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advances" ADD CONSTRAINT "advances_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advances" ADD CONSTRAINT "advances_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advances" ADD CONSTRAINT "advances_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advance_attachments" ADD CONSTRAINT "advance_attachments_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "advances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
