export const PermissionTarget = {
  ORGANIZATION: "ORGANIZATION",
} as const;

export type PermissionTarget_TYPE = (typeof PermissionTarget)[keyof typeof PermissionTarget];
