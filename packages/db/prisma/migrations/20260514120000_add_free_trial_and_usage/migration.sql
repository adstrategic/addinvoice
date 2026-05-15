-- AlterEnum
ALTER TYPE "SubscriptionPlan" ADD VALUE 'FREE_TRIAL';

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN "hasEverPaid" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "workspace_usage" (
    "id" SERIAL NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "invoicesCreated" INTEGER NOT NULL DEFAULT 0,
    "estimatesCreated" INTEGER NOT NULL DEFAULT 0,
    "proposalsCreated" INTEGER NOT NULL DEFAULT 0,
    "expensesCreated" INTEGER NOT NULL DEFAULT 0,
    "advancesCreated" INTEGER NOT NULL DEFAULT 0,
    "catalogCreated" INTEGER NOT NULL DEFAULT 0,
    "clientsCreated" INTEGER NOT NULL DEFAULT 0,
    "paymentsCreated" INTEGER NOT NULL DEFAULT 0,
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "voiceItemsCreated" INTEGER NOT NULL DEFAULT 0,
    "voiceWindowStart" TIMESTAMP(3),
    "voiceWindowEnd" TIMESTAMP(3),

    CONSTRAINT "workspace_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_usage_workspaceId_key" ON "workspace_usage"("workspaceId");

-- AddForeignKey
ALTER TABLE "workspace_usage" ADD CONSTRAINT "workspace_usage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: any workspace that has ever had a Stripe-backed plan is permanently
-- blocked from claiming the free trial.
UPDATE "workspaces" SET "hasEverPaid" = true WHERE "subscriptionPlan" IS NOT NULL;

-- Backfill: ensure every existing workspace has a usage row (counters all zero).
INSERT INTO "workspace_usage" ("workspaceId") SELECT "id" FROM "workspaces";
