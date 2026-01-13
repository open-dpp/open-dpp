import { z } from 'zod'
import { SubmodelBaseJsonSchema } from './submodel-base-json-schema'

export const SubmodelElementSchema = z.looseObject({
  ...SubmodelBaseJsonSchema.shape,
  modelType: z.string(),
}).meta({ id: 'SubmodelElement' })
