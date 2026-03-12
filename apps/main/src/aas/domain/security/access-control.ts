import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import { z } from "zod/v4";
import { AasAbility } from "./aas-ability";
import { AccessPermissionRule, AccessPermissionRuleSchema } from "./access-permission-rule";
import { CaslAbility } from "./casl-ability";
import { SubjectAttributes } from "./subject-attributes";

export const AccessControlSchema = z.object({
  accessPermissionRules: AccessPermissionRuleSchema.array(),
});

export class AccessControl {
  private constructor(public readonly accessPermissionRules: AccessPermissionRule[]) {
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

  toPlain(): Record<string, any> {
    return {
      accessPermissionRules: this.accessPermissionRules.map(p => p.toPlain()),
    };
  }

  findRuleOfSubject(subject: SubjectAttributes): AccessPermissionRule | undefined {
    return this.accessPermissionRules.find(
      rule => rule.targetSubjectAttributes.isEqual(subject),
    );
  }

  addRule(rule: AccessPermissionRule): void {
    this.accessPermissionRules.push(rule);
  }

  buildAbility(subject: SubjectAttributes): AasAbility {
    const abilityBuilder = new AbilityBuilder<CaslAbility>(createMongoAbility);

    this.accessPermissionRules.filter(
      rule => rule.targetSubjectAttributes.isEqual(subject),
    ).map(rule => rule.addCaslRules(abilityBuilder, subject)).flat();
    return AasAbility.create({ ability: abilityBuilder.build() });
  }
}
