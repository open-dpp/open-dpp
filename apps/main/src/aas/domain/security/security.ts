import { createMongoAbility } from "@casl/ability";
import { PermissionType } from "@open-dpp/dto";
import { AccessControl } from "./access-control";
import { AccessPermissionRule } from "./access-permission-rule";
import { SubjectAttributes } from "./security-types";

export class Security {
  private constructor(public localAccessControl: AccessControl) {
  }

  static create(data: { localAccessControl?: AccessControl }): Security {
    return new Security(data.localAccessControl ?? AccessControl.create({}));
  }

  addRule(rule: AccessPermissionRule): void {
    this.localAccessControl.addRule(rule);
  }

  defineAbilityForSubject(subject: SubjectAttributes) {
    const rules = this.localAccessControl.toCaslRules(subject);
    return createMongoAbility<[PermissionType, string]>(rules);
  }
}
