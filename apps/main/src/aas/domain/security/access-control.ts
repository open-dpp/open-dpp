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
      const rule = this.findRuleOfSubject(options.filterBySubject);
      return {
        accessPermissionRules: rule ? [rule.toPlain()] : [],
      };
    }
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
}
