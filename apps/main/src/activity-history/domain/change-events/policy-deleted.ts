import { IChangeEvent, IPolicyChangeEvent } from "./change-event";
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

const PolicyDeletedSchema = z.object({
  type: z.literal(ChangeEventTypes.PolicyDeleted),
  path: z.string(),
  userRole: UserRoleEnum,
  memberRole: MemberRoleEnum.nullable(),
});

export class PolicyDeleted implements IPolicyChangeEvent {
  public readonly type = ChangeEventTypes.PolicyDeleted;
  private constructor(
    public readonly path: IdShortPath,
    public readonly userRole: UserRoleType,
    public readonly memberRole: MemberRoleType | null,
  ) {}

  isNoop(): boolean {
    return false;
  }

  static create(data: {
    userRole: UserRoleType;
    memberRole?: MemberRoleType;
    object: ReferenceElement;
  }) {
    return new PolicyDeleted(
      IdShortPath.create({ path: data.object.idShort }),
      data.userRole,
      data.memberRole ?? null,
    );
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = PolicyDeletedSchema.parse(data);
    return new PolicyDeleted(
      IdShortPath.create({ path: parsed.path }),
      parsed.userRole,
      parsed.memberRole,
    );
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      path: this.path.toString(),
      userRole: this.userRole,
      memberRole: this.memberRole,
    };
  }
}
