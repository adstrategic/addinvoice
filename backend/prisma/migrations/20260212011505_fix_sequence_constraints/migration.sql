/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,sequence]` on the table `catalog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspaceId,sequence]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "catalog_workspaceId_businessId_sequence_key";

-- DropIndex
DROP INDEX "invoices_workspaceId_businessId_sequence_key";

-- CreateIndex
CREATE UNIQUE INDEX "catalog_workspaceId_sequence_key" ON "catalog"("workspaceId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_workspaceId_sequence_key" ON "invoices"("workspaceId", "sequence");
