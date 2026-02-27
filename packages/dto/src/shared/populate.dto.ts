import { z } from 'zod'

export const Populates = {
  assetAdministrationShells: 'environment.assetAdministrationShells',
} as const

export const AllowedPopulates = [
  Populates.assetAdministrationShells,
] as const

export const PopulateSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform(val => (val ? (Array.isArray(val) ? val : [val]) : []))
  .refine(
    paths => paths.every(p => AllowedPopulates.includes(p as any)),
    { message: `Invalid populate path. Allowed paths: ${AllowedPopulates.join(', ')}.` },
  )
