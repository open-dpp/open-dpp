import { PermissionPerObject } from "./permission-per-object";
import { PlainRule, SubjectAttributes } from "./security-types";

export class AccessPermissionRule {
  private constructor(public readonly targetSubjectAttributes: SubjectAttributes, public readonly permissionsPerObject: PermissionPerObject[]) {}

  static create(data: { targetSubjectAttributes: SubjectAttributes; permissionsPerObject?: PermissionPerObject[] }): AccessPermissionRule {
    return new AccessPermissionRule(data.targetSubjectAttributes, data.permissionsPerObject ?? []);
  }

  toCaslRules(): PlainRule[] {
    return this.permissionsPerObject.flatMap(permissionPerObject => permissionPerObject.toCaslRules());
    // const idShortPermissionObjectMap = new Map<string, PermissionPerObject>();
    // for (const permissionPerObject of this.permissionsPerObject) {
    //   idShortPermissionObjectMap.set(permissionPerObject.object.toString(), permissionPerObject);
    // }
    // const rules: PlainRule[] = [];
    // for (const [idShort, permissionPerObject] of idShortPermissionObjectMap.entries()) {
    //   const fields = [idShort];
    //
    //   const submodelElement = submodel.findSubmodelElementOrFail(IdShortPath.create({ path: idShort }));
    //
    //   for (const childs of submodelElement.getSubmodelElements()) {
    //     const childPath = `${idShort}.${childs.idShort}`;
    //     if (!idShortPermissionObjectMap.get(childPath)) {
    //       fields.push(childPath);
    //     }
    //   }
    //   rules.push({
    //     subject: "Submodel",
    //     fields,
    //     action: permissionPerObject.permissions.filter(p => p.kindOfPermission === PermissionKind.Allow).map(p => p.permission),
    //   });
    // }
    // return rules;
  }
}
