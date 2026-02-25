/**
 * Railway cron: run daily job (mark OVERDUE, execute reminders, process outbox) then exit.
 * Schedule: 0 0 * * * (daily 00:00 UTC)
 * Command: node dist/run-cron.js
 */
import "dotenv/config";

import {
  executeReminders,
  markOverdueInvoices,
} from "./features/outbox/outbox.service.js";

async function main(): Promise<void> {
  const overdue = await markOverdueInvoices();
  const { failed: remindersFailed, sent } = await executeReminders();
  console.log(
    "[cron] daily: marked",
    overdue,
    "overdue; reminders: sent",
    sent,
    "failed",
    remindersFailed,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error("[cron] daily job failed:", err);
    process.exit(1);
  });
