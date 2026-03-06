import { z } from 'zod'
import { DataTypeDef, DataTypeDefEnum } from '../enums/data-type-def'
import { LanguageTextJsonSchema } from './language-text-json-schema'

export const ValueTypeSchema = z.string().overwrite(
  (value) => {
    // turn "positiveInteger" → "PositiveInteger"
    let key = value
    if (value.startsWith('xs:')) {
      const raw = value.replace(/^xs:/, '')
      key = raw.charAt(0).toUpperCase() + raw.slice(1)
    }

    // validate against enum
    if (!(key in DataTypeDef)) {
      throw new Error(`Unknown number type: ${value}`)
    }
    return key
  },
).pipe(DataTypeDefEnum)

export const NameAndDescriptionModificationSchema = z.object({
  displayName: LanguageTextJsonSchema.array().optional(),
  description: LanguageTextJsonSchema.array().optional(),
})

export type NameAndDescriptionModificationDto = z.infer<typeof NameAndDescriptionModificationSchema>
