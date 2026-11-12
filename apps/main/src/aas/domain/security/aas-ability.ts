import { PermissionKind, PermissionType } from "@open-dpp/dto";
import { IdShortPath } from "../common/id-short-path";
import { AccessPermissionRule } from "./access-permission-rule";
import { PermissionPerObject } from "./permission-per-object";
import { SubjectAttributes } from "./subject-attributes";

export class AasAbility {
  private constructor(
    private rules: AccessPermissionRule[],
    private fallbackRules: AccessPermissionRule[],
    private readonly subject: SubjectAttributes,
    private readonly _userId: string | null,
  ) {}

  /**
   * `rules` are the rules of the subject itself. `fallbackRules` only apply to an object when the
   * own rules have no entry for it, nor for any of its parents.
   */
  static create(data: {
    rules: AccessPermissionRule[];
    fallbackRules?: AccessPermissionRule[];
    subject: SubjectAttributes;
    userId?: string;
  }): AasAbility {
    return new AasAbility(data.rules, data.fallbackRules ?? [], data.subject, data.userId ?? null);
  }

  get userId(): string | null {
    return this._userId;
  }

  getSubject(): SubjectAttributes {
    return this.subject;
  }

  private findPermissionForObject(
    rules: AccessPermissionRule[],
    object: IdShortPath,
  ): PermissionPerObject | undefined {
    for (const rule of rules) {
      for (const permissionPerObject of rule.permissionsPerObject) {
        if (permissionPerObject.object.idShort === object.toString()) {
          return permissionPerObject;
        }
      }
    }
  }

  // The entry closest to the object decides, whatever it allows: an entry on the object itself
  // is not completed by the entry of a parent.
  private findPermissionOnPath(
    rules: AccessPermissionRule[],
    object: IdShortPath,
  ): PermissionPerObject | undefined {
    const found = this.findPermissionForObject(rules, object);
    if (found) {
      return found;
    }
    const parentPath = object.getParentPath();
    return parentPath.isEmpty() ? undefined : this.findPermissionOnPath(rules, parentPath);
  }

  /**
   * The own rules decide first, on the object and on its parents. Only if they have no entry on
   * that whole path the fallback rules decide, so a rule of the public on a child never takes
   * away what the subject is allowed by its own rule on the parent.
   */
  can(action: PermissionType, object: IdShortPath): boolean {
    const permissionForObject =
      this.findPermissionOnPath(this.rules, object) ??
      this.findPermissionOnPath(this.fallbackRules, object);
    return (
      !!permissionForObject &&
      permissionForObject.permissions.some(
        (p) => p.permission === action && p.kindOfPermission === PermissionKind.Allow,
      )
    );
  }
}
