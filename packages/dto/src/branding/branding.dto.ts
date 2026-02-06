import { z } from 'zod'

export const BrandingDtoSchema = z.object({
  logo: z.string().nullish(),
})

export type BrandingDto = z.infer<typeof BrandingDtoSchema>
