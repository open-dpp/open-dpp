import { IChangeEvent } from "./change-event";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import {
  MemberRoleEnum,
  MemberRoleType,
} from "../../../identity/organizations/domain/member-role.enum";
import { UserRoleEnum, UserRoleType } from "../../../identity/users/domain/user-role.enum";
import { ReferenceElement } from "../../../aas/domain/submodel-base/reference-element";
import { Permission, PermissionSchema } from "../../../aas/domain/security/permission";

const PolicyModifiedSchema = z.object({
  type: z.literal(ChangeEventTypes.PolicyModified),
  object: z.string(),
  userRole: UserRoleEnum,
  memberRole: MemberRoleEnum.nullable(),
  oldValue: PermissionSchema.array(),
  newValue: PermissionSchema.array(),
});

export class PolicyModified implements IChangeEvent {
  public readonly type = ChangeEventTypes.PolicyModified;
  private constructor(
    public readonly object: IdShortPath,
    public readonly userRole: UserRoleType,
    public readonly memberRole: MemberRoleType | null,
    public readonly oldValue: Permission[],
    public readonly newValue: Permission[],
  ) {}

  static create(data: {
    userRole: UserRoleType;
    memberRole?: MemberRoleType;
    object: ReferenceElement;
    oldValue: Permission[];
    newValue: Permission[];
  }) {
    return new PolicyModified(
      IdShortPath.create({ path: data.object.idShort }),
      data.userRole,
      data.memberRole ?? null,
      data.oldValue,
      data.newValue,
    );
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = PolicyModifiedSchema.parse(data);
    return new PolicyModified(
      IdShortPath.create({ path: parsed.object }),
      parsed.userRole,
      parsed.memberRole,
      parsed.oldValue.map(Permission.fromPlain),
      parsed.newValue.map(Permission.fromPlain),
    );
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      object: this.object.toString(),
      userRole: this.userRole,
      memberRole: this.memberRole,
      oldValue: this.oldValue.map((permission) => permission.toPlain()),
      newValue: this.newValue.map((permission) => permission.toPlain()),
    };
  }
}
