-- CreateEnum
CREATE TYPE "ReferrerStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'CONVERTED');

-- CreateEnum
CREATE TYPE "ReferralCommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REVERSED');

-- CreateTable
CREATE TABLE "referrers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "ReferrerStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCouponId" TEXT NOT NULL,
    "stripePromotionCodeId" TEXT NOT NULL,
    "commissionRatePct" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "commissionMonths" INTEGER NOT NULL DEFAULT 12,
    "payoutMethod" TEXT,
    "payoutDetails" TEXT,
    "stripeConnectAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" SERIAL NOT NULL,
    "referrerId" INTEGER NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "attributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),
    "commissionEndsAt" TIMESTAMP(3),
    "commissionRatePct" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_commissions" (
    "id" SERIAL NOT NULL,
    "referrerId" INTEGER NOT NULL,
    "referralId" INTEGER NOT NULL,
    "stripeInvoiceId" TEXT,
    "stripeChargeId" TEXT,
    "baseAmountCents" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "ReferralCommissionStatus" NOT NULL DEFAULT 'PENDING',
    "availableAt" TIMESTAMP(3) NOT NULL,
    "payoutId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_payouts" (
    "id" SERIAL NOT NULL,
    "referrerId" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "method" TEXT,
    "reference" TEXT,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referrers_email_key" ON "referrers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "referrers_code_key" ON "referrers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referrers_stripePromotionCodeId_key" ON "referrers"("stripePromotionCodeId");

-- CreateIndex
CREATE INDEX "referrers_code_idx" ON "referrers"("code");

-- CreateIndex
CREATE INDEX "referrers_status_idx" ON "referrers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_workspaceId_key" ON "referrals"("workspaceId");

-- CreateIndex
CREATE INDEX "referrals_referrerId_idx" ON "referrals"("referrerId");

-- CreateIndex
CREATE INDEX "referrals_status_idx" ON "referrals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "referral_commissions_stripeInvoiceId_key" ON "referral_commissions"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "referral_commissions_referrerId_idx" ON "referral_commissions"("referrerId");

-- CreateIndex
CREATE INDEX "referral_commissions_referralId_idx" ON "referral_commissions"("referralId");

-- CreateIndex
CREATE INDEX "referral_commissions_status_idx" ON "referral_commissions"("status");

-- CreateIndex
CREATE INDEX "referral_commissions_availableAt_idx" ON "referral_commissions"("availableAt");

-- CreateIndex
CREATE INDEX "referral_commissions_stripeChargeId_idx" ON "referral_commissions"("stripeChargeId");

-- CreateIndex
CREATE INDEX "referral_payouts_referrerId_idx" ON "referral_payouts"("referrerId");

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "referral_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_payouts" ADD CONSTRAINT "referral_payouts_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "referrers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
