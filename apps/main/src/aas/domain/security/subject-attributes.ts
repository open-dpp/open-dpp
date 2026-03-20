import { DataTypeDef, PropertyJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { z } from "zod/v4";
import { MemberRole, MemberRoleEnum, MemberRoleType } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole, UserRoleEnum, UserRoleType } from "../../../identity/users/domain/user-role.enum";
import { Property } from "../submodel-base/property";

export const SubjectAttributesSchema = z.object({
  subjectAttribute: PropertyJsonSchema.array(),
});

const roleHierarchy: { userRole: UserRoleType; memberRole?: MemberRoleType }[] = [
  { userRole: UserRole.ADMIN }, // instance admin, the organization role is not relevant
  { userRole: UserRole.USER, memberRole: MemberRole.OWNER }, // organization owner
  { userRole: UserRole.USER, memberRole: MemberRole.MEMBER }, // organization member
  { userRole: UserRole.USER, memberRole: undefined }, // user without organization membership
  { userRole: UserRole.ANONYMOUS }, // anonymous user without an account
] as const;

export class SubjectAttributes {
  private _subjectAttribute: Property[];
  private static UserRoleKey = "userRole";
  private static MemberRoleKey = "memberRole";
  private constructor(subjectAttribute: Property[]) {
    this.subjectAttribute = subjectAttribute;
  }

  set subjectAttribute(subjectAttribute: Property[]) {
    const userRole = subjectAttribute.find(p => p.idShort === SubjectAttributes.UserRoleKey);
    if (!userRole || userRole.valueType !== DataTypeDef.String || typeof userRole.value !== "string") {
      throw new ValueError("subjectAttribute.userRole must be a string Property");
    }
    this._subjectAttribute = subjectAttribute;
  }

  get subjectAttribute(): Property[] {
    return this._subjectAttribute;
  }

  static create(data: { userRole: UserRoleType; memberRole?: MemberRoleType }): SubjectAttributes {
    return new SubjectAttributes([
      Property.create({ idShort: SubjectAttributes.UserRoleKey, valueType: DataTypeDef.String, value: data.userRole }),
      ...(data.memberRole ? [Property.create({ idShort: SubjectAttributes.MemberRoleKey, valueType: DataTypeDef.String, value: data.memberRole })] : []),
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
      subjectAttribute: this.subjectAttribute.map(p => p.toPlain()),
    };
  }

  get userRole(): UserRoleType {
    return UserRoleEnum.parse(this.subjectAttribute.find(p => p.idShort === SubjectAttributes.UserRoleKey)!.value);
  }

  get memberRole(): MemberRoleType | undefined {
    return MemberRoleEnum.optional().parse(this.subjectAttribute.find(p => p.idShort === SubjectAttributes.MemberRoleKey)?.value ?? undefined);
  }

  private computeRoleHierarchyIndex(roles: { userRole: UserRoleType; memberRole?: MemberRoleType }): number {
    return roleHierarchy.findIndex(role =>
      (role.userRole === roles.userRole && role.userRole === UserRole.ADMIN) || (role.userRole === roles.userRole && role.memberRole === roles.memberRole),
    );
  }

  getRoles() {
    return { userRole: this.userRole, memberRole: this.memberRole };
  }

  /*
   * Returns negative integer if subjectAttributes1 < subjectAttributes2.
   * Returns 0 if subjectAttributes1 == subjectAttributes2.
   * Returns positive integer if subjectAttributes1 > subjectAttributes2.
  */
  private compareRoles(subjectAttributes1: SubjectAttributes, subjectAttributes2: SubjectAttributes): number {
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
    return (this.userRole === other.userRole && this.userRole === UserRole.ADMIN) || (this.userRole === other.userRole && this.memberRole === other.memberRole);
  }

  getSubjectsWithSubordinatedRoles(): SubjectAttributes[] {
    const index = this.computeRoleHierarchyIndex(this.getRoles());
    return roleHierarchy.slice(index + 1).map(roles => SubjectAttributes.create(roles));
  }
}
