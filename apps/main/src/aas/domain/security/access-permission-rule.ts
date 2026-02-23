import { PermissionPerObject } from "./permission-per-object";
import { PlainRule, SubjectAttributes } from "./security-types";

export class AccessPermissionRule {
  private constructor(public readonly targetSubjectAttributes: SubjectAttributes, public readonly permissionsPerObject: PermissionPerObject[]) {}

  static create(data: { targetSubjectAttributes: SubjectAttributes; permissionsPerObject?: PermissionPerObject[] }): AccessPermissionRule {
    return new AccessPermissionRule(data.targetSubjectAttributes, data.permissionsPerObject ?? []);
  }

  toCaslRules(): PlainRule[] {
    return this.permissionsPerObject.map(p => p.toCaslRules()).flat();
  }
}
