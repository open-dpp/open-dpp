import { DataTypeDef, PropertyJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import {
  compareSubjects,
  isEqualSubjectRoles,
  subjectsBelow,
  type SubjectRoles,
} from "@open-dpp/permission";
import { z } from "zod/v4";
import {
  GuestRoleEnum,
  GuestRoleType,
} from "../../../identity/guest-access/domain/guest-role.enum";
import {
  MemberRoleEnum,
  MemberRoleType,
} from "../../../identity/organizations/domain/member-role.enum";
import {
  UserRole,
  UserRoleEnum,
  UserRoleType,
} from "../../../identity/users/domain/user-role.enum";
import { Property } from "../submodel-base/property";

export const SubjectAttributesSchema = z.object({
  subjectAttribute: PropertyJsonSchema.array(),
});

export class SubjectAttributes {
  private _subjectAttribute: Property[];
  public static UserRoleKey = "userRole";
  public static MemberRoleKey = "memberRole";
  public static GuestRoleKey = "guestRole";
  private constructor(subjectAttribute: Property[]) {
    this.subjectAttribute = subjectAttribute;
  }

  set subjectAttribute(subjectAttribute: Property[]) {
    const userRole = subjectAttribute.find((p) => p.idShort === SubjectAttributes.UserRoleKey);
    if (
      !userRole ||
      userRole.valueType !== DataTypeDef.String ||
      typeof userRole.value !== "string"
    ) {
      throw new ValueError("subjectAttribute.userRole must be a string Property");
    }
    this._subjectAttribute = subjectAttribute;
  }

  get subjectAttribute(): Property[] {
    return this._subjectAttribute;
  }

  static create(data: SubjectRoles): SubjectAttributes {
    if (data.guestRole && (data.userRole !== UserRole.USER || data.memberRole)) {
      throw new ValueError("A guest role is only allowed for a user without a member role");
    }
    return new SubjectAttributes([
      Property.create({
        idShort: SubjectAttributes.UserRoleKey,
        valueType: DataTypeDef.String,
        value: data.userRole,
      }),
      ...(data.memberRole
        ? [
            Property.create({
              idShort: SubjectAttributes.MemberRoleKey,
              valueType: DataTypeDef.String,
              value: data.memberRole,
            }),
          ]
        : []),
      ...(data.guestRole
        ? [
            Property.create({
              idShort: SubjectAttributes.GuestRoleKey,
              valueType: DataTypeDef.String,
              value: data.guestRole,
            }),
          ]
        : []),
    ]);
  }

  static fromPlain(json: unknown): SubjectAttributes {
    const parsed = SubjectAttributesSchema.parse(json);
    return new SubjectAttributes(parsed.subjectAttribute.map(Property.fromPlain) as Property[]);
  }

  copy(): SubjectAttributes {
    return SubjectAttributes.fromPlain(this.toPlain());
  }

  toPlain(): Record<string, any> {
    return {
      subjectAttribute: this.subjectAttribute.map((p) => p.toPlain()),
    };
  }

  get userRole(): UserRoleType {
    return UserRoleEnum.parse(
      this.subjectAttribute.find((p) => p.idShort === SubjectAttributes.UserRoleKey)!.value,
    );
  }

  get memberRole(): MemberRoleType | undefined {
    return MemberRoleEnum.optional().parse(
      this.subjectAttribute.find((p) => p.idShort === SubjectAttributes.MemberRoleKey)?.value ??
        undefined,
    );
  }

  get guestRole(): GuestRoleType | undefined {
    return GuestRoleEnum.optional().parse(
      this.subjectAttribute.find((p) => p.idShort === SubjectAttributes.GuestRoleKey)?.value ??
        undefined,
    );
  }

  getRoles(): SubjectRoles {
    return { userRole: this.userRole, memberRole: this.memberRole, guestRole: this.guestRole };
  }

  hasHigherThanOrEqualRoles(other: SubjectAttributes): boolean {
    return compareSubjects(this.getRoles(), other.getRoles()) >= 0;
  }

  hasLowerThanOrEqualRoles(other: SubjectAttributes): boolean {
    return compareSubjects(this.getRoles(), other.getRoles()) <= 0;
  }

  isEqual(other: SubjectAttributes): boolean {
    return isEqualSubjectRoles(this.getRoles(), other.getRoles());
  }

  getSubjectsWithSubordinatedRoles(): SubjectAttributes[] {
    return subjectsBelow(this.getRoles()).map((roles) => SubjectAttributes.create(roles));
  }
}
