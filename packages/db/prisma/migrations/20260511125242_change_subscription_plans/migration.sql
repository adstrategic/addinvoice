/*
  Warnings:

  - The values [CORE,AI_PRO] on the enum `SubscriptionPlan` are remapped:
      CORE   -> MINIMUM
      AI_PRO -> ESSENTIAL
      LIFETIME stays unchanged

*/
-- AlterEnum
BEGIN;

-- Temporarily widen the column to TEXT so we can remap legacy enum values
-- before the enum type itself is replaced.
ALTER TABLE "workspaces" ALTER COLUMN "subscriptionPlan" TYPE TEXT;

-- Remap legacy plan names to their new equivalents.
UPDATE "workspaces" SET "subscriptionPlan" = 'MINIMUM'   WHERE "subscriptionPlan" = 'CORE';
UPDATE "workspaces" SET "subscriptionPlan" = 'ESSENTIAL' WHERE "subscriptionPlan" = 'AI_PRO';

-- Replace the enum type with the new set of plan values.
CREATE TYPE "SubscriptionPlan_new" AS ENUM ('MINIMUM', 'ESSENTIAL', 'LIFETIME');
ALTER TABLE "workspaces"
    ALTER COLUMN "subscriptionPlan" TYPE "SubscriptionPlan_new"
    USING ("subscriptionPlan"::"SubscriptionPlan_new");
ALTER TYPE "SubscriptionPlan" RENAME TO "SubscriptionPlan_old";
ALTER TYPE "SubscriptionPlan_new" RENAME TO "SubscriptionPlan";
DROP TYPE "public"."SubscriptionPlan_old";

COMMIT;
