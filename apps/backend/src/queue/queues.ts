import { Queue } from "bullmq";
import { getProducerConnectionOptions } from "./connection";

const connection = getProducerConnectionOptions();

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,
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

export type SendInvoiceJobData = {
  sequence: number;
  invoiceId: number;
  workspaceId: number;
  email: string;
  subject: string;
  message: string;
};

export type SendReceiptJobData = {
  paymentId: number;
  invoiceId: number;
  workspaceId: number;
  email: string;
  subject: string;
  message: string;
};
