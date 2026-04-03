import { PermissionKind, Permissions } from "@open-dpp/dto";
import { z } from "zod/v4";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../common/id-short-path";
import { ConvertToPlainOptions } from "../convertable-to-plain";
import { Submodel } from "../submodel-base/submodel";
import { AasAbility } from "./aas-ability";
import { createAasObject } from "./aas-object";
import { AccessControl, AccessControlSchema } from "./access-control";
import { AccessPermissionRule } from "./access-permission-rule";
import { Permission } from "./permission";
import { PermissionPerObject } from "./permission-per-object";
import { SubjectAttributes } from "./subject-attributes";

export const SecuritySchema = z.object({
  localAccessControl: AccessControlSchema,
});

export class Security {
  private constructor(public readonly localAccessControl: AccessControl) {
  }

  static create(data: { localAccessControl?: AccessControl }): Security {
    return new Security(data.localAccessControl ?? AccessControl.create({}));
  }

  static fromPlain(json: unknown): Security {
    const parsed = SecuritySchema.parse(json);
    return new Security(
      AccessControl.fromPlain(parsed.localAccessControl),
    );
  }

  withAdministrator(newAdministrator: SubjectAttributes): Security {
    this.localAccessControl.withAdministrator(newAdministrator);
    return this;
  }

  toPlain(options?: ConvertToPlainOptions) {
    return {
      localAccessControl: this.localAccessControl.toPlain(options),
    };
  }

  findPoliciesBySubject(subject: SubjectAttributes): AccessPermissionRule[] {
    const rule = this.localAccessControl.findRuleOfSubject(subject);
    return rule ? [rule] : [];
  }

  private hasPoliciesForObject(object: IdShortPath): boolean {
    return this.localAccessControl.accessPermissionRules.some(
      rule => rule.permissionsPerObject.some(
        p => p.object.idShort === object.toString(),
      ),
    );
  }

  hasPolicy(subject: SubjectAttributes, object: IdShortPath, permissions: Permission[]): boolean {
    const rule = this.localAccessControl.findRuleOfSubject(subject);
    return !!rule && rule.hasPermissionForObject(PermissionPerObject.create({ object: createAasObject(object), permissions }));
  }

  addPolicy(subject: SubjectAttributes, object: IdShortPath, permissions: Permission[]): void {
    this.localAccessControl.addPolicy(subject, object, permissions);
  }

  deletePoliciesByObject(object: IdShortPath): void {
    this.localAccessControl.deletePoliciesByObject(object);
  }

  modifyPolicy(subject: SubjectAttributes, object: IdShortPath, permissions: Permission[]): void {
    this.localAccessControl.modifyPolicy(subject, object, permissions);
  }

  applyModifiedRules(modifications: AccessPermissionRule[]): void {
    for (const modification of modifications) {
      for (const permissionsPerObject of modification.permissionsPerObject) {
        const policy = { subject: modification.targetSubjectAttributes, object: IdShortPath.create({ path: permissionsPerObject.object.idShort }), permissions: permissionsPerObject.permissions };
        if (this.hasPolicy(policy.subject, policy.object, policy.permissions)) {
          this.modifyPolicy(policy.subject, policy.object, policy.permissions);
        }
        else {
          this.addPolicy(policy.subject, policy.object, policy.permissions);
        }
      }
    }
  }

  addDefaultPolicyForObjectIfNoExists(object: IdShortPath): void {
    if (!this.hasPoliciesForObject(object)) {
      const subjectsWithAllPermissions = [
        SubjectAttributes.create({ userRole: UserRole.ADMIN }),
        SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.OWNER }),
        SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
      ];

      for (const subject of subjectsWithAllPermissions) {
        const permissions = Object.values(Permissions).map(
          p => Permission.create({ permission: p, kindOfPermission: PermissionKind.Allow }),
        );

        if (!this.hasPolicy(subject, object, permissions)) {
          this.addPolicy(subject, object, permissions);
        }
      }

      const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
      const permissions = [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })];

      if (!this.hasPolicy(anonymous, object, permissions)) {
        this.addPolicy(anonymous, object, permissions);
      }
    }
  }

  addDefaultPolicyForSubmodelIfNoExists(submodel: Submodel): void {
    this.addDefaultPolicyForObjectIfNoExists(IdShortPath.create({ path: submodel.idShort }));
  }

  defineAbilityForSubject(subject: SubjectAttributes): AasAbility {
    return AasAbility.create({ rules: this.findPoliciesBySubject(subject), subject });
  }
}
