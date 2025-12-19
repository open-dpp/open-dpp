import { z } from 'zod'

import { LanguageEnum } from '../enums/language-enum'

export const LanguageTextJsonSchema = z.object({
  language: LanguageEnum,
  text: z.string(),
})
