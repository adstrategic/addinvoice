import { listAdvancesResponseSchema } from '@addinvoice/schemas'

export const advanceResponseListSchema = listAdvancesResponseSchema

export type AdvanceResponseList = ReturnType<
	typeof advanceResponseListSchema.parse
>
