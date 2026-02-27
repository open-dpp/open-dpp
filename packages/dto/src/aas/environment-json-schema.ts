import { z } from 'zod'
import { LanguageTextJsonSchema } from './common/language-text-json-schema'

export const EnvironmentJsonSchema = z.object({
  assetAdministrationShells: z.string().array(),
  submodels: z.string().array(),
  conceptDescriptions: z.string().array(),
})

export const ExtendedEnvironmentJsonSchema = z.object({
  assetAdministrationShells: z.xor([z.string(), z.object({ id: z.string(), displayName: LanguageTextJsonSchema.array() })]).array(),
  submodels: z.string().array(),
  conceptDescriptions: z.string().array(),
})
