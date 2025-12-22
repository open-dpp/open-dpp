import { z } from 'zod'
import { AdministrativeInformationJsonSchema } from '../administrative-information-json-schema'
import { ModellingKindEnum } from '../enums/modelling-kind-enum'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SubmodelBaseJsonSchema } from './submodel-base-json-schema'
import { SubmodelElementSchema } from './submodel-element-schema'

export const SubmodelJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  id: z.string(),
  extensions: ExtensionJsonSchema.array().default([]),
  administration: z.nullish(AdministrativeInformationJsonSchema),
  kind: z.nullish(ModellingKindEnum),
  submodelElements: SubmodelElementSchema.array().default([]),
}).meta({ id: 'Submodel' })
