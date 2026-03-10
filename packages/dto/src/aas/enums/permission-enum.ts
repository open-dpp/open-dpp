import { z } from 'zod'

export const Permissions = {
  Create: 'Create',
  Read: 'Read',
  Write: 'Write',
  Update: 'Update',
  Delete: 'Delete',
} as const
export const PermissionEnum = z.enum(Permissions)
export type PermissionType = z.infer<typeof PermissionEnum>
