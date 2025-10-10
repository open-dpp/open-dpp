export const PermissionAction = {
  ORGANIZATION: "ORGANIZATION",
} as const;

export type PermissionType_TYPE = (typeof PermissionType)[keyof typeof PermissionType];
