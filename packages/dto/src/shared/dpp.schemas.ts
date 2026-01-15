import { z } from 'zod'
import { EnvironmentJsonSchema } from '../aas/environment-json-schema'

export const DateTimeSchema = z.union(
  [z.iso.datetime(), z.date()],
)

export const SharedDppDtoSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  environment: EnvironmentJsonSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
})

export type SharedDppDto = z.infer<typeof SharedDppDtoSchema>
