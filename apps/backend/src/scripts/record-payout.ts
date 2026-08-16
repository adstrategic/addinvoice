/**
 * Record a manual payout to a referrer and mark the commissions it settles.
 *
 * Usage:
 *   pnpm --filter @addinvoice/backend run referrals:record-payout \
 *     --referrer 1 --currency USD [--method bank_transfer] [--reference TX123]
 *
 * Pays out everything currently APPROVED in that currency. Run with --dry-run
 * first to see the amount without writing anything.
 */
import { prisma } from "@addinvoice/db";

import { approveMaturedCommissions } from "../features/referrals/referrals.service.js";

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(`--${flag}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const referrerId = Number(getArg("referrer"));
  const currency = (getArg("currency") ?? "USD").toUpperCase();
  const method = getArg("method");
  const reference = getArg("reference");
  const note = getArg("note");
  const isDryRun = process.argv.includes("--dry-run");

  if (!referrerId) {
    console.error(
      "Usage: --referrer <id> --currency <USD> [--method x] [--reference x] [--dry-run]",
    );
    process.exit(1);
  }

  const referrer = await prisma.referrer.findUnique({
    where: { id: referrerId },
  });

  if (!referrer) {
    console.error(`No referrer with id ${String(referrerId)}`);
    process.exit(1);
  }

  // Roll anything past its hold window into APPROVED first, so the payout
  // reflects everything actually due today.
  await approveMaturedCommissions();

  const due = await prisma.referralCommission.findMany({
    where: { currency, referrerId, status: "APPROVED" },
  });

  const amountCents = due.reduce(
    (sum, commission) => sum + commission.amountCents,
    0,
  );

  if (amountCents <= 0) {
    console.log(`Nothing due to ${referrer.name} in ${currency}.`);
    return;
  }

  console.log(
    `${referrer.name}: ${(amountCents / 100).toFixed(2)} ${currency} across ${String(due.length)} commissions.`,
  );

  if (isDryRun) {
    console.log("Dry run — nothing written.");
    return;
  }

  // Payout row and commission updates land together, so a failure can never
  // leave commissions marked PAID against a payout that does not exist.
  await prisma.$transaction(async (tx) => {
    const payout = await tx.referralPayout.create({
      data: {
        amountCents,
        currency,
        method,
        note,
        reference,
        referrerId,
      },
    });

    await tx.referralCommission.updateMany({
      data: { payoutId: payout.id, status: "PAID" },
      where: { id: { in: due.map((commission) => commission.id) } },
    });

    console.log(`Recorded payout ${String(payout.id)}.`);
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
