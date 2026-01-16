import { z } from 'zod'
import { LanguageTextJsonSchema } from '../common/language-text-json-schema'

export const SubmodelBaseModificationSchema = z.object({
  displayName: LanguageTextJsonSchema.array().optional(),
  description: LanguageTextJsonSchema.array().optional(),
})
