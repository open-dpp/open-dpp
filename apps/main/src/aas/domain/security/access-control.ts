import { AccessPermissionRule } from "./access-permission-rule";
import { PlainRule, SubjectAttributes } from "./security-types";

export class AccessControl {
  private constructor(public readonly accessPermissionRules: AccessPermissionRule[]) {
  }

  static create(data: { accessPermissionRules?: AccessPermissionRule[] }): AccessControl {
    return new AccessControl(data.accessPermissionRules ?? []);
  }

  addRule(rule: AccessPermissionRule): void {
    this.accessPermissionRules.push(rule);
  }

  toCaslRules(subject: SubjectAttributes): PlainRule[] {
    return this.accessPermissionRules.filter(rule => rule.targetSubjectAttributes.role === subject.role).map(rule => rule.toCaslRules()).flat();
  }
}
