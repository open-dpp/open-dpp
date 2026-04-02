import { ValueError } from "@open-dpp/exception";
import { z } from "zod/v4";
import { IdShortPath } from "../common/id-short-path";
import { ReferenceElement } from "../submodel-base/reference-element";
import { Permission } from "./permission";
import { PermissionPerObject, PermissionPerObjectSchema } from "./permission-per-object";
import { SubjectAttributes, SubjectAttributesSchema } from "./subject-attributes";

export const AccessPermissionRuleSchema = z.object({
  targetSubjectAttributes: SubjectAttributesSchema,
  permissionsPerObject: z.array(PermissionPerObjectSchema),
});

export class AccessPermissionRule {
  private constructor(public readonly targetSubjectAttributes: SubjectAttributes, private _permissionsPerObject: PermissionPerObject[]) {}

  static create(data: { targetSubjectAttributes: SubjectAttributes; permissionsPerObject?: PermissionPerObject[] }): AccessPermissionRule {
    return new AccessPermissionRule(data.targetSubjectAttributes, data.permissionsPerObject ?? []);
  }

  get permissionsPerObject(): PermissionPerObject[] {
    return this._permissionsPerObject;
  }

  deletePermissionPerObject(object: IdShortPath): void {
    const keepPermissions = [];
    for (const permissionsPerObject of this.permissionsPerObject) {
      if (!IdShortPath.create({ path: permissionsPerObject.object.idShort }).isChildOf(object)) {
        keepPermissions.push(permissionsPerObject);
      }
    }

    this._permissionsPerObject = keepPermissions;
  }

  hasPermissionForObject(permissionPerObject: PermissionPerObject): boolean {
    return this.permissionsPerObject.some(p => p.object.idShort === permissionPerObject.object.idShort);
  }

  addPermissionPerObject(permissionPerObject: PermissionPerObject): void {
    if (this.hasPermissionForObject(permissionPerObject)) {
      throw new ValueError(`Permission for subject { userRole: ${this.targetSubjectAttributes.userRole}, memberRole: ${this.targetSubjectAttributes.memberRole} } and object ${permissionPerObject.object.idShort} already exists`);
    }
    this.permissionsPerObject.push(permissionPerObject);
  }

  modifyPermissionForObject(object: ReferenceElement, permissions: Permission[]): void {
    const permissionsPerObject = this.permissionsPerObject.find(p => p.object.idShort === object.idShort);
    if (!permissionsPerObject) {
      throw new ValueError(`Permission for subject { userRole: ${this.targetSubjectAttributes.userRole}, memberRole: ${this.targetSubjectAttributes.memberRole} } and object ${object.idShort} does not exist`);
    }
    permissionsPerObject.permissions = permissions;
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
