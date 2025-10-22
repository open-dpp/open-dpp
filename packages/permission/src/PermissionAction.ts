export const PermissionAction = {
  MANAGE: "MANAGE", // all actions
  CREATE: "CREATE",
  READ: "READ",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;

export type PermissionAction_TYPE = (typeof PermissionAction)[keyof typeof PermissionAction];
