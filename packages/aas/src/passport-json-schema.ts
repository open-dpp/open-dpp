import { z } from 'zod'
import { EnvironmentJsonSchema } from './environment-json-schema'

const SharedJsonSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  environment: EnvironmentJsonSchema,
})

export const PassportJsonSchema = SharedJsonSchema
export const TemplateJsonSchema = SharedJsonSchema
