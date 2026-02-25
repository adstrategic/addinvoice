import { Queue } from "bullmq";

import { getProducerConnectionOptions } from "./connection.js";

const connection = getProducerConnectionOptions();

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    delay: 5000,
    type: "exponential",
  },
  removeOnComplete: { count: 100 },
};

export const sendInvoiceQueue = new Queue("email-invoice", {
  connection,
  defaultJobOptions,
});

export const sendReceiptQueue = new Queue("email-receipt", {
  connection,
  defaultJobOptions,
});

export interface SendInvoiceJobData {
  email: string;
  invoiceId: number;
  message: string;
  sequence: number;
  subject: string;
  workspaceId: number;
}

export interface SendReceiptJobData {
  email: string;
  invoiceId: number;
  message: string;
  paymentId: number;
  subject: string;
  workspaceId: number;
}
