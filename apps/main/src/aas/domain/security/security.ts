import { PermissionKind, Permissions } from "@open-dpp/dto";
import { z } from "zod/v4";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { Submodel } from "../submodel-base/submodel";
import { IdShortPath } from "../submodel-base/submodel-base";
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

  toPlain(options?: { filterBySubject?: SubjectAttributes }) {
    const opts = options ?? {};
    return {
      localAccessControl: this.localAccessControl.toPlain(opts),
    };
  }

  findPoliciesBySubject(subject: SubjectAttributes) {
    const rule = this.localAccessControl.findRuleOfSubject(subject);
    return rule ? [rule] : [];
  }

  hasPolicy(subject: SubjectAttributes, object: IdShortPath, permissions: Permission[]): boolean {
    const rule = this.localAccessControl.findRuleOfSubject(subject);
    return !!rule && rule.hasPermissionForObject(PermissionPerObject.create({ object: createAasObject(object), permissions }));
  }

  addPolicy(subject: SubjectAttributes, object: IdShortPath, permissions: Permission[]): void {
    const rule = this.localAccessControl.findRuleOfSubject(subject);
    const permissionPerObject = PermissionPerObject.create({ object: createAasObject(object), permissions });
    if (rule) {
      rule.addPermissionPerObject(permissionPerObject);
    }
    else {
      this.localAccessControl.addRule(AccessPermissionRule.create({ targetSubjectAttributes: subject, permissionsPerObject: [permissionPerObject] }));
    }
  }

  addDefaultPolicyForSubmodel(submodel: Submodel): void {
    let [subject, aasObject, permissions] = [
      SubjectAttributes.create({ role: UserRole.ADMIN }),
      IdShortPath.create({ path: submodel.idShort }),
      Object.values(Permissions).map(
        p => Permission.create({ permission: p, kindOfPermission: PermissionKind.Allow }),
      ),
    ];
    if (!this.hasPolicy(subject, aasObject, permissions)) {
      this.addPolicy(subject, aasObject, permissions);
    }
    // member of the organization to which the passport belongs to should have all permissions
    [subject, aasObject, permissions] = [
      SubjectAttributes.create({ role: MemberRole.MEMBER }),
      IdShortPath.create({ path: submodel.idShort }),
      Object.values(Permissions).map(
        p => Permission.create({ permission: p, kindOfPermission: PermissionKind.Allow }),
      ),
    ];
    if (!this.hasPolicy(subject, aasObject, permissions)) {
      this.addPolicy(subject, aasObject, permissions);
    }
  }

  defineAbilityForSubject(subject: SubjectAttributes): AasAbility {
    return AasAbility.create({ rules: this.findPoliciesBySubject(subject) });
  }
}
