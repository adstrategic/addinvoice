/*
  Warnings:

  - The `workCompleted` column on the `advances` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `description` on the `catalog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "advances" DROP COLUMN "workCompleted",
ADD COLUMN     "workCompleted" JSONB;

-- AlterTable
ALTER TABLE "catalog" DROP COLUMN "description",
ADD COLUMN     "description" JSONB NOT NULL;
