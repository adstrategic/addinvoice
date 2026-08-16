/**
 * Create a referrer: the Stripe coupon + promotion code and the matching DB row.
 *
 * Usage:
 *   pnpm --filter @addinvoice/backend run referrals:create-referrer \
 *     --name "Juan Perez" --email juan@example.com --code JUAN20
 *
 * Optional: --rate 15 --months 12
 *
 * Creating the Stripe objects and the DB row in one place is the point — it is
 * what stops a code existing in one system but not the other.
 */
import { prisma } from "@addinvoice/db";

import { PLAN_PRODUCT_IDS, stripe } from "../core/stripe.js";
import {
  DEFAULT_COMMISSION_MONTHS,
  DEFAULT_COMMISSION_RATE_PCT,
  REFERRAL_DISCOUNT_PCT,
} from "../features/referrals/referrals.policy.js";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(`--${flag}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

/**
 * One coupon is shared by every referrer; the promotion codes are what differ.
 * The product restriction is a second, Stripe-side guard that LIFETIME can
 * never be discounted, independent of the backend's own check.
 */
async function findOrCreateReferralCoupon(): Promise<string> {
  const existingId = process.env.STRIPE_REFERRAL_COUPON_ID;

  if (existingId) {
    const coupon = await stripe.coupons.retrieve(existingId);
    console.log(`Using existing coupon ${coupon.id}`);
    return coupon.id;
  }

  const coupon = await stripe.coupons.create({
    applies_to: {
      products: [PLAN_PRODUCT_IDS.MINIMUM, PLAN_PRODUCT_IDS.ESSENTIAL],
    },
    // "once" — the discount hits the customer's first invoice only.
    duration: "once",
    name: `Referral ${String(REFERRAL_DISCOUNT_PCT)}% off first invoice`,
    percent_off: REFERRAL_DISCOUNT_PCT,
  });

  console.log(
    `Created coupon ${coupon.id}. Set STRIPE_REFERRAL_COUPON_ID=${coupon.id} so future referrers reuse it.`,
  );

  return coupon.id;
}

async function main() {
  const name = getArg("name");
  const email = getArg("email");
  const rawCode = getArg("code");

  if (!name || !email || !rawCode) {
    console.error(
      "Usage: --name <name> --email <email> --code <CODE> [--rate 15] [--months 12]",
    );
    process.exit(1);
  }

  const code = rawCode.trim().toUpperCase();
  const commissionRatePct = Number(
    getArg("rate") ?? DEFAULT_COMMISSION_RATE_PCT,
  );
  const commissionMonths = Number(
    getArg("months") ?? DEFAULT_COMMISSION_MONTHS,
  );

  if (!/^[A-Z0-9]{3,32}$/.test(code)) {
    console.error("Code must be 3-32 letters and numbers only.");
    process.exit(1);
  }

  const existing = await prisma.referrer.findFirst({
    where: { OR: [{ code }, { email }] },
  });

  if (existing) {
    console.error(
      `A referrer already exists with that code or email (id ${String(existing.id)}).`,
    );
    process.exit(1);
  }

  const couponId = await findOrCreateReferralCoupon();

  // Created before the promotion code so metadata.referrerId can point at a row
  // that actually exists. The promotion code id is filled in immediately after.
  const referrer = await prisma.referrer.create({
    data: {
      code,
      commissionMonths,
      commissionRatePct,
      email,
      name,
      stripeCouponId: couponId,
      // Placeholder, replaced below. Unique, so concurrent runs cannot collide.
      stripePromotionCodeId: `pending_${code}_${String(Date.now())}`,
    },
  });

  const promotionCode = await stripe.promotionCodes.create({
    code,
    coupon: couponId,
    metadata: {
      referrerId: referrer.id.toString(),
    },
    restrictions: {
      // Referral discounts are for new customers only.
      first_time_transaction: true,
    },
  });

  await prisma.referrer.update({
    data: { stripePromotionCodeId: promotionCode.id },
    where: { id: referrer.id },
  });

  console.log(`
Referrer created.
  id:             ${String(referrer.id)}
  name:           ${name}
  code:           ${code}
  commission:     ${String(commissionRatePct)}% for ${String(commissionMonths)} months
  promotion code: ${promotionCode.id}
  link:           ${process.env.FRONTEND_URL ?? "http://localhost:3000"}/r/${code}
`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
