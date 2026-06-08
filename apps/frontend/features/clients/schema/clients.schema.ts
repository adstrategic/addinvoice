import { listClientsResponseSchema } from "@addinvoice/schemas";

export const clientResponseListSchema = listClientsResponseSchema;

export type ClientResponseList = ReturnType<
  typeof clientResponseListSchema.parse
>;

export type ListClientsParams = {
  page?: number;
  limit?: number;
  search?: string;
};
