import {
  PermissionEnum,
  PermissionKindEnum,
  PermissionKindType,
  PermissionType,
} from "@open-dpp/dto";
import { z } from "zod/v4";

export const PermissionSchema = z.object({
  permission: PermissionEnum,
  kindOfPermission: PermissionKindEnum,
});

export class Permission {
  private constructor(
    public readonly permission: PermissionType,
    public readonly kindOfPermission: PermissionKindType,
  ) {}

  static create(data: {
    permission: PermissionType;
    kindOfPermission: PermissionKindType;
  }): Permission {
    return new Permission(data.permission, data.kindOfPermission);
  }

  static fromPlain(json: unknown): Permission {
    const parsed = PermissionSchema.parse(json);
    return new Permission(parsed.permission, parsed.kindOfPermission);
  }

  copy(): Permission {
    return Permission.fromPlain(this.toPlain());
  }

  equals(other: Permission): boolean {
    return this.permission === other.permission && this.kindOfPermission === other.kindOfPermission;
  }

  toPlain(): Record<string, any> {
    return {
      permission: this.permission,
      kindOfPermission: this.kindOfPermission,
    };
  }
}
