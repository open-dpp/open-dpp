import { PermissionKind, PermissionType } from "@open-dpp/dto";
import { IdShortPath } from "../common/id-short-path";
import { AccessPermissionRule } from "./access-permission-rule";
import { PermissionPerObject } from "./permission-per-object";
import { SubjectAttributes } from "./subject-attributes";

export class AasAbility {
  private constructor(
    private rules: AccessPermissionRule[],
    private readonly subject: SubjectAttributes,
    private readonly _userId: string | null,
  ) {}

  static create(data: {
    rules: AccessPermissionRule[];
    subject: SubjectAttributes;
    userId?: string;
  }): AasAbility {
    return new AasAbility(data.rules, data.subject, data.userId ?? null);
  }

  get userId(): string | null {
    return this._userId;
  }

  getSubject(): SubjectAttributes {
    return this.subject;
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
      return permissionForObject.permissions.some(
        (p) => p.permission === action && p.kindOfPermission === PermissionKind.Allow,
      );
    }

    const parentPath = object.getParentPath();

    if (!parentPath.isEmpty()) {
      return this.can(action, parentPath);
    }
    return false;
  }
}
