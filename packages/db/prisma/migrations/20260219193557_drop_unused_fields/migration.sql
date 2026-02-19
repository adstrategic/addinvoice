/*
  Warnings:

  - You are about to drop the column `lastStripeSync` on the `workspaces` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionEndsAt` on the `workspaces` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "workspaces" DROP COLUMN "lastStripeSync",
DROP COLUMN "subscriptionEndsAt";
