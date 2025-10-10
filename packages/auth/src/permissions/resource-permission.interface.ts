export const PermissionType = {
  ORGANIZATION: "ORGANIZATION",
} as const;

export type PermissionType_TYPE = (typeof PermissionType)[keyof typeof PermissionType];

export interface BaseResourcePermission {
  type: PermissionType_TYPE;
}

export interface ResourcePermission extends BaseResourcePermission {
  type: PermissionType.ORGANIZATION;
  resource: string;
  scopes?: PermissionType_TYPE[];
}
