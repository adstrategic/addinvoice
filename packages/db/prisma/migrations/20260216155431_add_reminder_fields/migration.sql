-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "reminderAfterDueIntervalDays" INTEGER,
ADD COLUMN     "reminderBeforeDueIntervalDays" INTEGER;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "lastReminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "catalog_workspaceId_businessId_idx" ON "catalog"("workspaceId", "businessId");
