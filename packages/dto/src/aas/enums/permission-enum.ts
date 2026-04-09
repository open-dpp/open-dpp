import { z } from 'zod'

export const Permissions = {
  Create: 'Create',
  Read: 'Read',
  Edit: 'Edit',
  Delete: 'Delete',
} as const

export const PermissionEnum = z.enum(Permissions)
export type PermissionType = z.infer<typeof PermissionEnum>

// if I get admin and user permissions I know that I am a admin
// addSubmodel -> addPolicy that admin can change permissions
