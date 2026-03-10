import { PermissionEnum, PermissionKindEnum, PermissionKindType, PermissionType } from "@open-dpp/dto";
import { z } from "zod/v4";

export const PermissionSchema = z.object({
  permission: PermissionEnum,
  kindOfPermission: PermissionKindEnum,
});

export class Permission {
  private constructor(public readonly permission: PermissionType, public readonly kindOfPermission: PermissionKindType) {

  }

  static create(data: { permission: PermissionType; kindOfPermission: PermissionKindType }): Permission {
    return new Permission(data.permission, data.kindOfPermission);
  }

  static fromPlain(json: unknown): Permission {
    const parsed = PermissionSchema.parse(json);
    return Permission.create({
      permission: parsed.permission,
      kindOfPermission: parsed.kindOfPermission,
    });
  }
}
