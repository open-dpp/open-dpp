import { AbilityBuilder } from "@casl/ability";
import { PermissionKind } from "@open-dpp/dto";
import { z } from "zod/v4";
import { ReferenceElement } from "../submodel-base/reference-element";
import { CaslAbility } from "./casl-ability";
import { Permission, PermissionSchema } from "./permission";

export const PermissionPerObjectSchema = z.object({
  object: z.string(),
  permissions: z.array(PermissionSchema),
});

export class PermissionPerObject {
  // object maybe submodel, and objectAttributes maybe IdShortPaths
  private constructor(public readonly object: ReferenceElement, public readonly permissions: Permission[]) {
  }

  static create(data: { object: ReferenceElement; permissions?: Permission[] }): PermissionPerObject {
    return new PermissionPerObject(data.object, data.permissions ?? []);
  }

  addCaslRules({ can, cannot }: AbilityBuilder<CaslAbility>) {
    const allowAction = this.permissions.filter(p => p.kindOfPermission === PermissionKind.Allow).map(p => p.permission);
    can(allowAction, "AasResource", { idShortPath: this.object.idShort });
    const denyAction = this.permissions.filter(p => p.kindOfPermission === PermissionKind.Deny).map(p => p.permission);
    cannot(denyAction, "AasResource", { idShortPath: this.object.idShort });
  }

  // static fromPlain(json: unknown): PermissionPerObject {
  //   const parsed = PermissionPerObjectSchema.parse(json);
  //   return PermissionPerObject.create({
  //     object: IdShortPath.create({ path: parsed.object }),
  //     permissions: parsed.permissions.map(Permission.fromPlain),
  //   });
  // }
}
