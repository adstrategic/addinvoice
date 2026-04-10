-- AlterEnum
ALTER TYPE "PaymentMethodType" ADD VALUE 'STRIPE';

-- AlterTable
ALTER TABLE "workspace_payment_methods" ADD COLUMN     "stripeSecretKey" TEXT,
ADD COLUMN     "stripeWebhookId" TEXT,
ADD COLUMN     "stripeWebhookSecret" TEXT;
