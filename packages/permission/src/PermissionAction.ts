export const PermissionAction = {
  CREATE: "CREATE",
  READ: "READ",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;

export type PermissionAction_TYPE = (typeof PermissionAction)[keyof typeof PermissionAction];
