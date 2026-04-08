import z from "zod";

import {
  baseEstimateItemSchema,
  baseEstimateSchema,
  TaxModeEnum,
} from "./estimate.base.js";
import { createClientSchema } from "../clients/client.request.js";

export const createEstimateSchema = baseEstimateSchema
  .extend({
    createClient: z.boolean().optional(),
    clientData: createClientSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.taxMode === "BY_TOTAL") {
        return (
          data.taxName != null &&
          data.taxName.trim().length > 0 &&
          data.taxPercentage != null &&
          data.taxPercentage > 0
        );
      }
      return true;
    },
    {
      message:
        "Tax name and tax percentage are required when tax mode is BY_TOTAL",
      path: ["taxName", "taxPercentage"],
    },
  )
  .refine(
    (data) => {
      if (data.discountType !== "NONE") {
        return data.discount > 0;
      }
      return true;
    },
    {
      message: "Discount must be greater than 0 when discount type is set",
      path: ["discount"],
    },
  )
  .refine(
    (data) => {
      if (data.taxMode !== "BY_TOTAL") {
        return data.taxName == null && data.taxPercentage == null;
      }
      return true;
    },
    {
      message:
        "Tax name and tax percentage should not be set when tax mode is not BY_TOTAL",
      path: ["taxMode"],
    },
  )
  .refine(
    (data) => {
      if (data.createClient) return !!data.clientData;
      return true;
    },
    {
      message: "Client data is required when creating a new client",
      path: ["clientData"],
    },
  )
  .refine(
    (data) => {
      if (!data.createClient) return data.clientId > 0;
      return true;
    },
    { message: "Client must be selected", path: ["clientId"] },
  );

/**
 * Schema for updating an estimate
 */
export const updateEstimateSchema = baseEstimateSchema
  .extend({
    createClient: z.boolean().optional(),
    clientData: createClientSchema.optional(),
  })
  .partial()
  .extend({
    items: z.array(baseEstimateItemSchema).optional(),
  });

export const createEstimateItemSchema = baseEstimateItemSchema.extend({
  taxMode: TaxModeEnum.optional(),
  taxName: z.string().trim().max(100).nullish(),
  taxPercentage: z.coerce
    .number()
    .min(0, "Tax percentage must be between 0 and 100")
    .max(100, "Tax percentage must be between 0 and 100")
    .nullish(),
});

/**
 * Schema for updating an estimate item
 */
export const updateEstimateItemSchema = baseEstimateItemSchema
  .extend({
    taxMode: TaxModeEnum.optional(),
    taxName: z.string().trim().max(100).nullish(),
    taxPercentage: z.coerce
      .number()
      .min(0, "Tax percentage must be between 0 and 100")
      .max(100, "Tax percentage must be between 0 and 100")
      .nullish(),
  })
  .partial();

export type CreateEstimateDTO = z.infer<typeof createEstimateSchema>;
export type CreateEstimateItemDTO = z.infer<typeof createEstimateItemSchema>;

export type UpdateEstimateDTO = z.infer<typeof updateEstimateSchema>;
export type UpdateEstimateItemDTO = z.infer<typeof updateEstimateItemSchema>;
