import { listClientsResponseSchema } from '@addinvoice/schemas'
import { z } from 'zod'

/**
 * Unlike businesses, the shared package already describes the whole clients
 * list envelope — `{ data, pagination, stats }` — so there is nothing to
 * assemble locally. Mirrors the web's `features/clients/schema/clients.schema.ts`.
 */
export const clientResponseListSchema = listClientsResponseSchema

export type ClientResponseList = z.infer<typeof clientResponseListSchema>

export const listClientsSchema = z.object({
	page: z.coerce.number().int().optional(),
	// The backend caps this at 30 (`listClientsSchema` in clients.schemas.ts).
	limit: z.coerce.number().int().max(30).optional(),
	search: z.string().optional(),
})

export type ListClientsParams = z.infer<typeof listClientsSchema>
