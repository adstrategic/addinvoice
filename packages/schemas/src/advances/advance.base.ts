import z from "zod";

import { createClientSchema } from "../clients/client.request.js";
import { nullableOptional } from "../shared/nullable.js";

export const AdvanceStatus = {
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  INVOICED: "INVOICED",
} as const;
export type AdvanceStatus = (typeof AdvanceStatus)[keyof typeof AdvanceStatus];

export const AgentLanguage = {
  es: "es",
  en: "en",
  fr: "fr",
  pt: "pt",
  de: "de",
} as const;
export type AgentLanguage = (typeof AgentLanguage)[keyof typeof AgentLanguage];

export const AdvanceStatusEnum = z.nativeEnum(AdvanceStatus);
export const AgentLanguageEnum = z.nativeEnum(AgentLanguage);

export const advanceAttachmentSchema = z.object({
  fileName: z.string().trim().max(255).nullish(),
  mimeType: z.string().trim().max(128).nullish(),
  sequence: z.coerce.number().int().positive().optional(),
  url: z
    .string()
    .trim()
    .url("Attachment URL must be a valid URL")
    .max(2000, "Attachment URL is too long"),
});

export const advanceClientInputSchema = z.object({
  clientData: createClientSchema.optional(),
  clientId: z.coerce.number().int(),
  createClient: z.boolean().optional(),
});

export const baseAdvanceSchema = z.object({
  businessId: nullableOptional(z.coerce.number().int().positive()),
  clientId: z.coerce.number().int().positive(),
  advanceDate: z.coerce.date({ required_error: "Advance date is required" }),
  attachments: z.array(advanceAttachmentSchema).default([]).optional(),
  location: z.string().trim().max(255).nullish(),
  projectName: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(255, "Project name is too long"),
  workCompleted: z.string().trim().max(10000).nullish(),
});

export const advanceFiltersSchema = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  invoiceId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(255).optional(),
  status: AdvanceStatusEnum.optional(),
});

export type AdvanceAttachment = z.infer<typeof advanceAttachmentSchema>;
export type AdvanceBase = z.infer<typeof baseAdvanceSchema>;
export type AdvanceClientInput = z.infer<typeof advanceClientInputSchema>;
