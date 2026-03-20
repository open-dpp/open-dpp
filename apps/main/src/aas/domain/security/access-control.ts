import { z } from "zod/v4";
import { AccessPermissionRule, AccessPermissionRuleSchema } from "./access-permission-rule";
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

  toPlain(options: { filterBySubject?: SubjectAttributes }): Record<string, any> {
    if (options.filterBySubject) {
      const rules = this.findRulesOfAllRolesAccessibleBySubject(options.filterBySubject);
      return {
        accessPermissionRules: rules.map(p => p.toPlain()),
      };
    }
    return {
      accessPermissionRules: this.accessPermissionRules.map(p => p.toPlain()),
    };
  }

  findRulesOfAllRolesAccessibleBySubject(subject: SubjectAttributes): AccessPermissionRule[] {
    const subjectsToConsider = [subject, ...subject.getSubjectsWithSubordinatedRoles()];
    return subjectsToConsider.map(s => this.findRuleOfSubject(s)).filter(
      r => !!r,
    );
  }

  findRuleOfSubject(subject: SubjectAttributes): AccessPermissionRule | undefined {
    return this.accessPermissionRules.find(
      rule => rule.targetSubjectAttributes.isEqual(subject),
    );
  }

  addRule(rule: AccessPermissionRule): void {
    this.accessPermissionRules.push(rule);
  }
}
