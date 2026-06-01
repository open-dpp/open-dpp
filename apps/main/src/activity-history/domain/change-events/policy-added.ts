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

const PolicyAddedSchema = z.object({
  type: z.literal(ChangeEventTypes.PolicyAdded),
  object: z.string(),
  userRole: UserRoleEnum,
  memberRole: MemberRoleEnum.nullable(),
  value: PermissionSchema.array(),
});

export class PolicyAdded implements IChangeEvent {
  public readonly type = ChangeEventTypes.PolicyAdded;
  private constructor(
    public readonly object: IdShortPath,
    public readonly userRole: UserRoleType,
    public readonly memberRole: MemberRoleType | null,
    public readonly value: Permission[],
  ) {}

  static create(data: {
    userRole: UserRoleType;
    memberRole?: MemberRoleType;
    object: ReferenceElement;
    value: Permission[];
  }) {
    return new PolicyAdded(
      IdShortPath.create({ path: data.object.idShort }),
      data.userRole,
      data.memberRole ?? null,
      data.value,
    );
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = PolicyAddedSchema.parse(data);
    return new PolicyAdded(
      IdShortPath.create({ path: parsed.object }),
      parsed.userRole,
      parsed.memberRole,
      parsed.value.map(Permission.fromPlain),
    );
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      object: this.object.toString(),
      userRole: this.userRole,
      memberRole: this.memberRole,
      value: this.value.map((permission) => permission.toPlain()),
    };
  }
}
