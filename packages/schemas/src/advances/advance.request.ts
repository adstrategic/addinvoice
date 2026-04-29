import z from "zod";

import {
  advanceClientInputSchema,
  advanceFiltersSchema,
  AdvanceStatusEnum,
  baseAdvanceSchema,
} from "./advance.base.js";

export const createAdvanceSchema = baseAdvanceSchema
  .extend({
    ...advanceClientInputSchema.shape,
    invoiceId: z.coerce.number().int().positive().optional().nullable(),
    status: AdvanceStatusEnum.default("DRAFT"),
  })
  .refine(
    (data) => {
      const hasNotes = (data.workCompleted ?? "").trim().length > 0;
      const hasAttachments = (data.attachments?.length ?? 0) > 0;
      return hasNotes || hasAttachments;
    },
    {
      message: "Either progress notes or an attachment is required",
      path: ["workCompleted"],
    },
  )
  .refine(
    (data) => {
      if (data.createClient) {
        return data.clientData != null;
      }
      return data.clientId > 0;
    },
    {
      message: "Client must be selected or created",
      path: ["clientId"],
    },
  )
  .refine(
    (data) => {
      if (data.status === "ISSUED") {
        return data.clientId > 0;
      }
      return true;
    },
    {
      message: "Client is required when sending an advance",
      path: ["clientId"],
    },
  );

export const updateAdvanceSchema = baseAdvanceSchema.partial().extend({
  businessId: z.coerce.number().int().positive().optional().nullable(),
  invoiceId: z.coerce.number().int().positive().optional().nullable(),
  status: AdvanceStatusEnum.optional(),
});

export const listAdvancesQuerySchema = advanceFiltersSchema.extend({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const getAdvanceByIdSchema = z.object({
  advanceId: z.coerce.number().int().positive("Advance ID must be positive"),
});

export const listPendingAdvancesByClientSchema = z.object({
  clientId: z.coerce.number().int().positive("Client ID must be positive"),
});

export const linkAdvanceToInvoiceBodySchema = z.object({
  invoiceId: z.coerce.number().int().positive("Invoice ID must be positive"),
});

export const unlinkAdvanceFromInvoiceBodySchema = z.object({
  keepStatus: AdvanceStatusEnum.optional().default("ISSUED"),
});

export const sendAdvanceBodySchema = z.object({
  email: z.string().trim().email("A valid recipient email is required"),
  message: z.string().trim().max(5000).optional(),
  subject: z.string().trim().min(1, "Subject is required").max(255),
});

export const generateAdvanceReportBodySchema = z.object({
  workCompleted: z.string().trim().max(10000).optional(),
});

export const bulkLinkAdvancesToInvoiceBodySchema = z.object({
  advanceIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "At least one advance is required"),
});

export const syncAdvanceAttachmentsMetaSchema = z.object({
  keptAttachmentIds: z.array(z.coerce.number().int().positive()).default([]),
  orderTokens: z.array(z.string().trim().min(1)).optional(),
});

export type BulkLinkAdvancesToInvoiceDTO = z.infer<
  typeof bulkLinkAdvancesToInvoiceBodySchema
>;
export type CreateAdvanceDTO = z.infer<typeof createAdvanceSchema>;
export type GenerateAdvanceReportDTO = z.infer<
  typeof generateAdvanceReportBodySchema
>;
export type GetAdvanceByIdParams = z.infer<typeof getAdvanceByIdSchema>;
export type LinkAdvanceToInvoiceDTO = z.infer<
  typeof linkAdvanceToInvoiceBodySchema
>;
export type ListAdvancesQuery = z.infer<typeof listAdvancesQuerySchema>;
export type ListPendingAdvancesByClientParams = z.infer<
  typeof listPendingAdvancesByClientSchema
>;
export type SendAdvanceDTO = z.infer<typeof sendAdvanceBodySchema>;
export type SyncAdvanceAttachmentsMetaDTO = z.infer<
  typeof syncAdvanceAttachmentsMetaSchema
>;
export type UnlinkAdvanceFromInvoiceDTO = z.infer<
  typeof unlinkAdvanceFromInvoiceBodySchema
>;
export type UpdateAdvanceDTO = z.infer<typeof updateAdvanceSchema>;
