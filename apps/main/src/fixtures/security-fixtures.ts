import { Factory } from "fishery";
import { SubjectAttributes } from "../aas/domain/security/subject-attributes";
import { UserRole } from "../identity/users/domain/user-role.enum";
import { MemberRole } from "../identity/organizations/domain/member-role.enum";
import { allPermissionsPlainAllow } from "@open-dpp/testing";
import { Permission } from "../aas/domain/security/permission";

export const memberFactory = Factory.define<SubjectAttributes>(() => {
  return SubjectAttributes.create({
    userRole: UserRole.USER,
    memberRole: MemberRole.MEMBER,
  });
});

export const allPermissionsAllowFactory = Factory.define<Permission[]>(() => {
  return allPermissionsPlainAllow.map((p) => Permission.fromPlain(p));
});
