import { ReferenceElementJsonSchema } from "@open-dpp/dto";
import { z } from "zod/v4";
import { ReferenceElement } from "../submodel-base/reference-element";
import { Permission, PermissionSchema } from "./permission";

export const PermissionPerObjectSchema = z.object({
  object: ReferenceElementJsonSchema,
  permissions: z.array(PermissionSchema),
});

export class PermissionPerObject {
  // object maybe submodel, and objectAttributes maybe IdShortPaths
  private constructor(public readonly object: ReferenceElement, public permissions: Permission[]) {
  }

  static create(data: { object: ReferenceElement; permissions?: Permission[] }): PermissionPerObject {
    return new PermissionPerObject(data.object, data.permissions ?? []);
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
