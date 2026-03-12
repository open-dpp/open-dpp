import { z } from 'zod'

export const PermissionKind = {
  Allow: 'Allow',
  Deny: 'Deny',
} as const
export const PermissionKindEnum = z.enum(PermissionKind)
export type PermissionKindType = z.infer<typeof PermissionKindEnum>
