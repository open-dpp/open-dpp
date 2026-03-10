import { ReferenceElement } from "../submodel-base/reference-element";
import { AasAbility } from "./aas-ability";
import { AccessControl } from "./access-control";
import { AccessPermissionRule } from "./access-permission-rule";
import { Permission } from "./permission";
import { PermissionPerObject } from "./permission-per-object";
import { SubjectAttributes } from "./subject-attributes";

export class Security {
  private constructor(public localAccessControl: AccessControl) {
  }

  static create(data: { localAccessControl?: AccessControl }): Security {
    return new Security(data.localAccessControl ?? AccessControl.create({}));
  }

  addPolicy(subject: SubjectAttributes, object: ReferenceElement, permissions: Permission[]): void {
    const rule = this.localAccessControl.findRuleOfSubject(subject);
    const permissionPerObject = PermissionPerObject.create({ object, permissions });
    if (rule) {
      rule.addPermissionPerObject(permissionPerObject);
    }
    else {
      this.localAccessControl.addRule(AccessPermissionRule.create({ targetSubjectAttributes: subject, permissionsPerObject: [permissionPerObject] }));
    }
  }

  defineAbilityForSubject(subject: SubjectAttributes): AasAbility {
    return this.localAccessControl.buildAbility(subject);
  }
}
