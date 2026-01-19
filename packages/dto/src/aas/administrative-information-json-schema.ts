import { z } from 'zod'

export const AdministrativeInformationJsonSchema = z.object({
  version: z.string(),
  revision: z.string(),
})
