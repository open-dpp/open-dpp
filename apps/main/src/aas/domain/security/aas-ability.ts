import { PermissionKind, PermissionType } from "@open-dpp/dto";
import { IdShortPath } from "../submodel-base/submodel-base";
import { AccessPermissionRule } from "./access-permission-rule";
import { PermissionPerObject } from "./permission-per-object";

export class AasAbility {
  private constructor(private rules: AccessPermissionRule[]) {
  }

  static create(data: { rules: AccessPermissionRule[] }): AasAbility {
    return new AasAbility(data.rules);
  }

  private findPermissionForObject(object: IdShortPath): PermissionPerObject | undefined {
    for (const rule of this.rules) {
      for (const permissionPerObject of rule.permissionsPerObject) {
        if (permissionPerObject.object.idShort === object.toString()) {
          return permissionPerObject;
        }
      }
    }
  }

  can(action: PermissionType, object: IdShortPath): boolean {
    const permissionForObject = this.findPermissionForObject(object);
    if (permissionForObject) {
      const deny = permissionForObject.permissions.some(p => p.permission === action && p.kindOfPermission === PermissionKind.Deny);
      if (deny) {
        return false;
      }
      else {
        return permissionForObject.permissions.some(p => p.permission === action && p.kindOfPermission === PermissionKind.Allow);
      }
    }

    const parentPath = object.getParentPath();

    if (!parentPath.isEmpty()) {
      return this.can(action, parentPath);
    }
    return false;
  }
}
