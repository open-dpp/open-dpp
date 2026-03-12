import { AbilityBuilder } from "@casl/ability";
import { PermissionKind, ReferenceElementJsonSchema } from "@open-dpp/dto";
import { z } from "zod/v4";
import { ReferenceElement } from "../submodel-base/reference-element";
import { AasResourceKey, CaslAbility } from "./casl-ability";
import { Permission, PermissionSchema } from "./permission";

export const PermissionPerObjectSchema = z.object({
  object: ReferenceElementJsonSchema,
  permissions: z.array(PermissionSchema),
});

export class PermissionPerObject {
  // object maybe submodel, and objectAttributes maybe IdShortPaths
  private constructor(public readonly object: ReferenceElement, public readonly permissions: Permission[]) {
  }

  static create(data: { object: ReferenceElement; permissions?: Permission[] }): PermissionPerObject {
    return new PermissionPerObject(data.object, data.permissions ?? []);
  }

  addCaslRules({ can, cannot }: AbilityBuilder<CaslAbility>, { organizationId }: { organizationId?: string }) {
    const allowActions = this.permissions.filter(p => p.kindOfPermission === PermissionKind.Allow).map(p => p.permission);
    if (allowActions.length > 0) {
      can(allowActions, AasResourceKey, { idShortPath: this.object.idShort, organizationId });
    }
    const denyActions = this.permissions.filter(p => p.kindOfPermission === PermissionKind.Deny).map(p => p.permission);
    if (denyActions.length > 0) {
      cannot(denyActions, AasResourceKey, { idShortPath: this.object.idShort, organizationId });
    }
  }

  static fromPlain(json: unknown): PermissionPerObject {
    const parsed = PermissionPerObjectSchema.parse(json);
    return new PermissionPerObject(
      ReferenceElement.fromPlain(parsed.object) as ReferenceElement,
      parsed.permissions.map(Permission.fromPlain),
    );
  }

  toPlain(): Record<string, any> {
    return {
      object: this.object.toPlain(),
      permissions: this.permissions.map(p => p.toPlain()),
    };
  }
}
