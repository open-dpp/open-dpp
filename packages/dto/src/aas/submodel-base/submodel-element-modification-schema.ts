import { z } from 'zod'
import { SubmodelBaseModificationSchema } from './submodel-base-json-schema'

export const SubmodelElementModificationSchema = z.looseObject({ ...SubmodelBaseModificationSchema.shape })
export type SubmodelElementModificationDto = z.infer<typeof SubmodelElementModificationSchema>
