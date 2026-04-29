import z from "zod";

import { businessResponseSchema } from "../businesses/business.response.js";
import { clientResponseSchema } from "../clients/client.response.js";
import { fixedDateFromPrisma } from "../shared/date.js";
import {
  advanceAttachmentSchema,
  AdvanceStatusEnum,
  baseAdvanceSchema,
} from "./advance.base.js";

export const advanceAttachmentResponseSchema = advanceAttachmentSchema.extend({
  advanceId: z.number().int().positive(),
  createdAt: z.coerce.date(),
  id: z.number().int().positive(),
});

export const advanceResponseSchema = baseAdvanceSchema.extend({
  advanceDate: z
    .string()
    .transform((val) => fixedDateFromPrisma(new Date(val))),
  attachments: z.array(advanceAttachmentResponseSchema),
  business: businessResponseSchema.nullable().optional(),
  client: clientResponseSchema,
  createdAt: z.coerce.date(),
  id: z.number().int().positive(),
  invoiceId: z.number().int().positive().nullable(),
  sentAt: z.coerce.date().nullable(),
  sequence: z.number().int().positive(),
  status: AdvanceStatusEnum,
  updatedAt: z.coerce.date(),
  workspaceId: z.number().int().positive(),
});

export const advanceListItemResponseSchema = advanceResponseSchema.omit({
  attachments: true,
});

export const listAdvancesResponseSchema = z.object({
  data: z.array(advanceListItemResponseSchema),
  pagination: z.object({
    limit: z.number().int().positive(),
    page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export const pendingAdvanceForInvoiceResponseSchema =
  advanceListItemResponseSchema.extend({
    invoiceId: z.null(),
  });

export const syncAdvanceAttachmentsFailureSchema = z.object({
  error: z.string(),
  fileName: z.string(),
});

export const syncAdvanceAttachmentsResponseSchema = z.object({
  data: z.object({
    attachments: z.array(advanceAttachmentResponseSchema),
    deletedCount: z.number().int().nonnegative(),
    failedUploads: z.array(syncAdvanceAttachmentsFailureSchema),
    uploadedCount: z.number().int().nonnegative(),
  }),
});

export type AdvanceAttachmentResponse = z.infer<
  typeof advanceAttachmentResponseSchema
>;
export type AdvanceListItemResponse = z.infer<
  typeof advanceListItemResponseSchema
>;
export type AdvanceResponse = z.infer<typeof advanceResponseSchema>;
export type ListAdvancesResponse = z.infer<typeof listAdvancesResponseSchema>;
export type PendingAdvanceForInvoiceResponse = z.infer<
  typeof pendingAdvanceForInvoiceResponseSchema
>;
export type SyncAdvanceAttachmentsResponse = z.infer<
  typeof syncAdvanceAttachmentsResponseSchema
>;
