import { PermissionKind } from "@open-dpp/dto";
import { IdShortPath } from "../submodel-base/submodel-base";
import { Permission } from "./permission";
import { PlainRule } from "./security-types";

export class PermissionPerObject {
  // object maybe submodel, and objectAttributes maybe IdShortPaths
  private constructor(public readonly object: IdShortPath, public readonly permissions: Permission[]) {
  }

  static create(data: { object: IdShortPath; permissions?: Permission[] }): PermissionPerObject {
    return new PermissionPerObject(data.object, data.permissions ?? []);
  }

  toCaslRules(): PlainRule[] {
    return [{
      subject: "Submodel",
      fields: [this.object.toString()],
      action: this.permissions.filter(p => p.kindOfPermission === PermissionKind.Allow).map(p => p.permission),
    }, {
      subject: "Submodel",
      fields: [this.object.toString()],
      action: this.permissions.filter(p => p.kindOfPermission === PermissionKind.Deny).map(p => p.permission),
      inverted: true,
    }];
  }
}
