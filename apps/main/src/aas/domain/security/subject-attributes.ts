import { DataTypeDef, PropertyJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { z } from "zod/v4";
import {
  GuestRole,
  GuestRoleEnum,
  GuestRoleType,
} from "../../../identity/guest-access/domain/guest-role.enum";
import {
  MemberRole,
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

type SubjectRoles = {
  userRole: UserRoleType;
  memberRole?: MemberRoleType;
  guestRole?: GuestRoleType;
};

// Ordered from the most to the least privileged level. Subjects of the same level are equal in rank.
const roleHierarchy: SubjectRoles[][] = [
  [{ userRole: UserRole.ADMIN }], // instance admin, the organization role is not relevant
  [{ userRole: UserRole.USER, memberRole: MemberRole.OWNER }], // organization owner
  [{ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }], // organization member
  Object.values(GuestRole).map((guestRole) => ({ userRole: UserRole.USER, guestRole })), // external guests with access granted by an organization
  [{ userRole: UserRole.USER, memberRole: undefined }], // user without organization membership
  [{ userRole: UserRole.ANONYMOUS }], // anonymous user without an account
];

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

  private computeRoleHierarchyIndex(roles: SubjectRoles): number {
    return roleHierarchy.findIndex((level) =>
      level.some(
        (role) =>
          (role.userRole === roles.userRole && role.userRole === UserRole.ADMIN) ||
          (role.userRole === roles.userRole &&
            role.memberRole === roles.memberRole &&
            role.guestRole === roles.guestRole),
      ),
    );
  }

  getRoles(): SubjectRoles {
    return { userRole: this.userRole, memberRole: this.memberRole, guestRole: this.guestRole };
  }

  /*
   * Returns negative integer if subjectAttributes1 < subjectAttributes2.
   * Returns 0 if subjectAttributes1 == subjectAttributes2.
   * Returns positive integer if subjectAttributes1 > subjectAttributes2.
   */
  private compareRoles(
    subjectAttributes1: SubjectAttributes,
    subjectAttributes2: SubjectAttributes,
  ): number {
    const hierarchyIndex1 = this.computeRoleHierarchyIndex(subjectAttributes1.getRoles());
    const hierarchyIndex2 = this.computeRoleHierarchyIndex(subjectAttributes2.getRoles());
    return hierarchyIndex2 - hierarchyIndex1;
  }

  hasHigherThanOrEqualRoles(other: SubjectAttributes): boolean {
    return this.compareRoles(this, other) >= 0;
  }

  hasLowerThanOrEqualRoles(other: SubjectAttributes): boolean {
    return this.compareRoles(this, other) <= 0;
  }

  isEqual(other: SubjectAttributes): boolean {
    return (
      (this.userRole === other.userRole && this.userRole === UserRole.ADMIN) ||
      (this.userRole === other.userRole &&
        this.memberRole === other.memberRole &&
        this.guestRole === other.guestRole)
    );
  }

  getSubjectsWithSubordinatedRoles(): SubjectAttributes[] {
    const index = this.computeRoleHierarchyIndex(this.getRoles());
    return roleHierarchy
      .slice(index + 1)
      .flat()
      .map((roles) => SubjectAttributes.create(roles));
  }
}
