/*
  Warnings:

  - Added the required column `clientEmail` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "clientAddress" TEXT,
ADD COLUMN     "clientEmail" TEXT NOT NULL,
ADD COLUMN     "clientPhone" TEXT;
