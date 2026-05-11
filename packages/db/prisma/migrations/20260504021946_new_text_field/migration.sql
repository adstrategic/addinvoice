/*
  Warnings:

  - The `defaultNotes` column on the `businesses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `defaultTerms` column on the `businesses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `notes` column on the `estimates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `terms` column on the `estimates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `summary` column on the `estimates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `notes` column on the `invoices` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `terms` column on the `invoices` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `description` on the `estimate_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `description` on the `invoice_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "businesses" DROP COLUMN "defaultNotes",
ADD COLUMN     "defaultNotes" JSONB,
DROP COLUMN "defaultTerms",
ADD COLUMN     "defaultTerms" JSONB;

-- AlterTable
ALTER TABLE "estimate_items" DROP COLUMN "description",
ADD COLUMN     "description" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "estimates" DROP COLUMN "notes",
ADD COLUMN     "notes" JSONB,
DROP COLUMN "terms",
ADD COLUMN     "terms" JSONB,
DROP COLUMN "summary",
ADD COLUMN     "summary" JSONB;

-- AlterTable
ALTER TABLE "invoice_items" DROP COLUMN "description",
ADD COLUMN     "description" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "notes",
ADD COLUMN     "notes" JSONB,
DROP COLUMN "terms",
ADD COLUMN     "terms" JSONB;
