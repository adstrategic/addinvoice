/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,sequence]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sequence` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "sequence" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "invoices_workspaceId_sequence_key" ON "invoices"("workspaceId", "sequence");
