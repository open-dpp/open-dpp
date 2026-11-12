import { PermissionKind, PermissionType } from "@open-dpp/dto";
import { PermissionEntry, resolvePermissionEntry } from "@open-dpp/permission";
import { IdShortPath } from "../common/id-short-path";
import { AccessPermissionRule } from "./access-permission-rule";
import { SubjectAttributes } from "./subject-attributes";

export class AasAbility {
  private constructor(
    private rules: AccessPermissionRule[],
    private readonly subject: SubjectAttributes,
    private readonly _userId: string | null,
  ) {}

  /**
   * `rules` are the rules of the subject itself and the rules of the public, which the subject falls
   * back to. How they are combined is defined in `@open-dpp/permission`.
   */
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

  private entries(): PermissionEntry[] {
    return this.rules.flatMap((rule) =>
      rule.permissionsPerObject.map((permissionPerObject) => ({
        subject: rule.targetSubjectAttributes.getRoles(),
        object: permissionPerObject.object.idShort,
        permissions: permissionPerObject.permissions
          .filter((p) => p.kindOfPermission === PermissionKind.Allow)
          .map((p) => p.permission),
      })),
    );
  }

  can(action: PermissionType, object: IdShortPath): boolean {
    const resolved = resolvePermissionEntry(
      this.entries(),
      this.subject.getRoles(),
      object.toString(),
    );
    return resolved?.permissions.includes(action) ?? false;
  }
}
