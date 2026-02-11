/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `workspaces` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `workspaces` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('CORE', 'AI_PRO', 'LIFETIME');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING');

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "lastStripeSync" TIMESTAMP(3),
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionEndsAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionPlan" "SubscriptionPlan",
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus";

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_stripeCustomerId_key" ON "workspaces"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_stripeSubscriptionId_key" ON "workspaces"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "workspaces_stripeCustomerId_idx" ON "workspaces"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "workspaces_stripeSubscriptionId_idx" ON "workspaces"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "workspaces_subscriptionStatus_idx" ON "workspaces"("subscriptionStatus");
