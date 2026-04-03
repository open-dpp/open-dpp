import { Permissions } from "@open-dpp/dto";
import { ForbiddenError, ValueError } from "@open-dpp/exception";
import { z } from "zod/v4";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../common/id-short-path";
import { ConvertToPlainOptions } from "../convertable-to-plain";
import { createAasObject } from "./aas-object";
import { AccessPermissionRule, AccessPermissionRuleSchema } from "./access-permission-rule";
import { Permission } from "./permission";
import { PermissionPerObject } from "./permission-per-object";
import { SubjectAttributes } from "./subject-attributes";

export const AccessControlSchema = z.object({
  accessPermissionRules: AccessPermissionRuleSchema.array(),
});

export class AccessControl {
  private administrator = SubjectAttributes.create({ userRole: UserRole.ADMIN });

  private constructor(private _accessPermissionRules: AccessPermissionRule[]) {
  }

  get accessPermissionRules(): AccessPermissionRule[] {
    return this._accessPermissionRules;
  }

  withAdministrator(newAdministrator: SubjectAttributes) {
    this.administrator = newAdministrator;
    return this;
  }

  static create(data: { accessPermissionRules?: AccessPermissionRule[] }): AccessControl {
    return new AccessControl(data.accessPermissionRules ?? []);
  }

  static fromPlain(json: unknown): AccessControl {
    const parsed = AccessControlSchema.parse(json);
    return new AccessControl(
      parsed.accessPermissionRules.map(AccessPermissionRule.fromPlain),
    );
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    if (options?.ability) {
      const rules = this.findRulesOfAllVisibleRolesOfSubject(options.ability.getSubject());
      return {
        accessPermissionRules: rules.map(p => p.toPlain()),
      };
    }
    return {
      accessPermissionRules: this.accessPermissionRules.map(p => p.toPlain()),
    };
  }

  findRulesOfAllVisibleRolesOfSubject(subject: SubjectAttributes): AccessPermissionRule[] {
    const subjectsToConsider = [subject, ...subject.getSubjectsWithSubordinatedRoles()];
    return subjectsToConsider.map(s => this.findRuleOfSubject(s)).filter(
      r => !!r,
    );
  }

  modifyPolicy(subject: SubjectAttributes, object: IdShortPath, permissions: Permission[]): void {
    this.administratePolicyGuard(subject);

    this.allowedCombinationOfPermissionsOrFail(permissions);
    const rule = this.findRuleOfSubject(subject);
    if (!rule) {
      throw new ForbiddenError(`Policy for subject { userRole: ${subject.userRole}, memberRole: ${subject.memberRole} } and object ${object.toString()} does not exist.`);
    }
    const aasObject = createAasObject(object);
    rule.modifyPermissionForObject(aasObject, permissions);
  }

  deletePoliciesByObject(object: IdShortPath): void {
    const keepRules = [];
    for (const rule of this.accessPermissionRules) {
      this.administratePolicyGuard(rule.targetSubjectAttributes);
      rule.deletePermissionPerObject(object);
      if (rule.permissionsPerObject.length > 0) {
        keepRules.push(rule);
      }
    }
    this._accessPermissionRules = keepRules;
  }

  findRuleOfSubject(subject: SubjectAttributes): AccessPermissionRule | undefined {
    return this.accessPermissionRules.find(
      rule => rule.targetSubjectAttributes.isEqual(subject),
    );
  }

  addRule(rule: AccessPermissionRule): void {
    this.accessPermissionRules.push(rule);
  }

  private allowedCombinationOfPermissionsOrFail(permissions: Permission[]) {
    const readPermission = permissions.find(p => p.permission === Permissions.Read);
    for (const permission of permissions) {
      if (permission.permission !== Permissions.Read) {
        if (!readPermission) {
          throw new ValueError(`Permission ${permission.permission} is not allowed without Read permission.`);
        }
      }
    }
  }

  addPolicy(subject: SubjectAttributes, object: IdShortPath, permissions: Permission[]): void {
    this.administratePolicyGuard(subject);
    this.allowedCombinationOfPermissionsOrFail(permissions);
    const rule = this.findRuleOfSubject(subject);
    const permissionPerObject = PermissionPerObject.create({ object: createAasObject(object), permissions });
    if (rule) {
      rule.addPermissionPerObject(permissionPerObject);
    }
    else {
      this.addRule(AccessPermissionRule.create({ targetSubjectAttributes: subject, permissionsPerObject: [permissionPerObject] }));
    }
  }

  private administratePolicyGuard(subject: SubjectAttributes) {
    if (this.administrator.userRole !== UserRole.ADMIN && this.administrator.hasLowerThanOrEqualRoles(subject)) {
      throw new ForbiddenError(`Administrator has no permission to add/ modify/ delete policy.`);
    }
  }
}
