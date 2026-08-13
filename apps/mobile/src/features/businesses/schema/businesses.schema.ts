import { businessResponseSchema } from '@addinvoice/schemas'
import { z } from 'zod'

import { paginationMetaSchema } from '@/lib/api/types'

export const listBusinessesSchema = z.object({
	page: z.coerce.number().int().optional(),
	limit: z.coerce.number().int().max(30).optional(),
	search: z.string().optional(),
})

export const businessResponseListSchema = z.object({
	data: z.array(businessResponseSchema),
	pagination: paginationMetaSchema,
})

export type BusinessResponseList = z.infer<typeof businessResponseListSchema>
export type ListBusinessesParams = z.infer<typeof listBusinessesSchema>
