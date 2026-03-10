import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import { AasAbility } from "./aas-ability";
import { AccessPermissionRule } from "./access-permission-rule";
import { CaslAbility } from "./casl-ability";
import { SubjectAttributes } from "./subject-attributes";

export class AccessControl {
  private constructor(public readonly accessPermissionRules: AccessPermissionRule[]) {
  }

  static create(data: { accessPermissionRules?: AccessPermissionRule[] }): AccessControl {
    return new AccessControl(data.accessPermissionRules ?? []);
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
    ).map(rule => rule.addCaslRules(abilityBuilder)).flat();
    return AasAbility.create({ ability: abilityBuilder.build() });
  }
}
