import { z } from 'zod'

export const Language = {
  en: 'en',
  de: 'de',
} as const
export const LanguageEnum = z.enum(Language)
export type LanguageType = z.infer<typeof LanguageEnum>
