import "dotenv/config";

import { startWorkers } from "./queue/workers";

const hasRedis =
  typeof process.env.REDIS_URL === "string" && process.env.REDIS_URL.trim() !== "" ||
  typeof process.env.REDIS_HOST === "string" && process.env.REDIS_HOST.trim() !== "";

if (!hasRedis) {
  console.error("[worker] Redis is not configured (REDIS_URL or REDIS_HOST). Exiting.");
  process.exit(1);
}

const { invoiceWorker, receiptWorker } = startWorkers();

async function shutdown(): Promise<void> {
  console.log("[worker] Shutting down...");
  await Promise.all([invoiceWorker.close(), receiptWorker.close()]);
  console.log("[worker] Workers closed.");
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown();
});
process.on("SIGINT", () => {
  void shutdown();
});
