import { z } from 'zod'
import { ExtensionJsonSchema } from '../extension-json-schema'
import { SubmodelBaseJsonSchema, SubmodelBaseModificationSchema } from './submodel-base-json-schema'

export const FileJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  extensions: ExtensionJsonSchema.array().default([]),
  contentType: z.string(),
  value: z.nullish(z.string()),
})

export type FileResponseDto = z.infer<typeof FileJsonSchema>
export type FileRequestDto = z.input<typeof FileJsonSchema>

export const FileModificationSchema = z.object({
  ...SubmodelBaseModificationSchema.shape,
  value: z.nullish(z.string()),
  contentType: z.nullish(z.string()),
})

export type FileModificationDto = z.input<typeof FileModificationSchema>
