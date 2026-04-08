import { z } from "zod";
import { ClientBase, PHONE_REGEX } from "./client.base.js";

/**
 * Schema for creating a client.
 * Single source of truth for backend and agent.
 */
export const createClientSchema = ClientBase;

export const updateClientSchema = ClientBase.partial();

export type CreateClientDTO = z.infer<typeof createClientSchema>;
export type UpdateClientDTO = z.infer<typeof updateClientSchema>;
