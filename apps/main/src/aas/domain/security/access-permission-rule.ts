import { AbilityBuilder } from "@casl/ability";
import { ValueError } from "@open-dpp/exception";
import { z } from "zod/v4";
import { CaslAbility } from "./casl-ability";
import { PermissionPerObject, PermissionPerObjectSchema } from "./permission-per-object";
import { SubjectAttributes, SubjectAttributesSchema } from "./subject-attributes";

export const AccessPermissionRuleSchema = z.object({
  targetSubjectAttributes: SubjectAttributesSchema,
  permissionsPerObject: z.array(PermissionPerObjectSchema),
});

export class AccessPermissionRule {
  private constructor(public readonly targetSubjectAttributes: SubjectAttributes, public readonly permissionsPerObject: PermissionPerObject[]) {}

  static create(data: { targetSubjectAttributes: SubjectAttributes; permissionsPerObject?: PermissionPerObject[] }): AccessPermissionRule {
    return new AccessPermissionRule(data.targetSubjectAttributes, data.permissionsPerObject ?? []);
  }

  addPermissionPerObject(permissionPerObject: PermissionPerObject): void {
    if (this.permissionsPerObject.find(p => p.object.idShort === permissionPerObject.object.idShort)) {
      throw new ValueError(`Permission for subject { role: ${this.targetSubjectAttributes.role} } and object ${permissionPerObject.object.idShort} already exists`);
    }
    this.permissionsPerObject.push(permissionPerObject);
  }

  addCaslRules(abilityBuilder: AbilityBuilder<CaslAbility>, subject: SubjectAttributes) {
    this.permissionsPerObject.flatMap(
      permissionPerObject => permissionPerObject.addCaslRules(abilityBuilder, {
        organizationId: subject.organizationId,
      }),
    );
  }

  static fromPlain(json: unknown): AccessPermissionRule {
    const parsed = AccessPermissionRuleSchema.parse(json);
    return AccessPermissionRule.create({
      targetSubjectAttributes: SubjectAttributes.fromPlain(parsed.targetSubjectAttributes),
      permissionsPerObject: parsed.permissionsPerObject.map(PermissionPerObject.fromPlain),
    });
  }

  toPlain(): Record<string, any> {
    return {
      targetSubjectAttributes: this.targetSubjectAttributes.toPlain(),
      permissionsPerObject: this.permissionsPerObject.map(p => p.toPlain()),
    };
  }
}
