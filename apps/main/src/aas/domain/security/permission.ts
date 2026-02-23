import { PermissionKindType, PermissionType } from "@open-dpp/dto";

export class Permission {
  private constructor(public readonly permission: PermissionType, public readonly kindOfPermission: PermissionKindType) {

  }

  static create(data: { permission: PermissionType; kindOfPermission: PermissionKindType }): Permission {
    return new Permission(data.permission, data.kindOfPermission);
  }
}
