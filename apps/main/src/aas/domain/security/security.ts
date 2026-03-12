import { randomUUID } from "node:crypto";
import { z } from "zod/v4";
import { IPersistable } from "../persistable";
import { ReferenceElement } from "../submodel-base/reference-element";
import { AasAbility } from "./aas-ability";
import { AccessControl, AccessControlSchema } from "./access-control";
import { AccessPermissionRule } from "./access-permission-rule";
import { Permission } from "./permission";
import { PermissionPerObject } from "./permission-per-object";
import { SubjectAttributes } from "./subject-attributes";

export const SecuritySchema = z.object({
  id: z.uuid(),
  localAccessControl: AccessControlSchema,
});

export class Security implements IPersistable {
  private constructor(public readonly id: string, public readonly localAccessControl: AccessControl) {
  }

  static create(data: { id?: string; localAccessControl?: AccessControl }): Security {
    return new Security(data.id ?? randomUUID(), data.localAccessControl ?? AccessControl.create({}));
  }

  static fromPlain(json: unknown): Security {
    const parsed = SecuritySchema.parse(json);
    return new Security(
      parsed.id,
      AccessControl.fromPlain(parsed.localAccessControl),
    );
  }

  toPlain() {
    return {
      id: this.id,
      localAccessControl: this.localAccessControl.toPlain(),
    };
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
