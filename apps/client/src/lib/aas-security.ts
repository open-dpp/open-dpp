import type { AccessPermissionRuleResponseDto, MemberRoleDtoType, PermissionDto, UserRoleDtoType } from "@open-dpp/dto";
import {

  MemberRoleDtoEnum,

  UserRoleDto,
  UserRoleDtoEnum,

} from "@open-dpp/dto";

export interface Subject {
  userRole: UserRoleDtoType;
  memberRole?: MemberRoleDtoType;
}

export function findPermissionForObject(object: string, accessPermissionRules: AccessPermissionRuleResponseDto[]) {
  const permissions: {
    subject: Subject;
    permissions: PermissionDto[];
  }[] = [];
  for (const rule of accessPermissionRules) {
    for (const permissionPerObject of rule.permissionsPerObject) {
      if (permissionPerObject.object.idShort === object) {
        const userRole = makeRule(rule).userRole;
        const memberRole = makeRule(rule).memberRole;
        const subject = memberRole ? { userRole, memberRole } : { userRole };
        if (userRole) {
          permissions.push({
            subject,
            permissions: permissionPerObject.permissions,
          });
        }
      }
    }
  }
  return permissions;
}

export function makeRule(accessPermissionRule: AccessPermissionRuleResponseDto) {
  const rule: AccessPermissionRuleResponseDto = accessPermissionRule;

  const userRole = UserRoleDtoEnum.parse(
    rule.targetSubjectAttributes.subjectAttribute.find(
      p => p.idShort === "userRole",
    )?.value,
  );
  const memberRole = MemberRoleDtoEnum.optional().parse(
    rule.targetSubjectAttributes.subjectAttribute.find(
      p => p.idShort === "memberRole",
    )?.value ?? undefined,
  );

  function hasEqualSubject(subject: Subject) {
    return (
      (subject.userRole === userRole && userRole === UserRoleDto.ADMIN)
      || (subject.userRole === userRole && subject.memberRole === memberRole)
    );
  }

  return {
    ...rule,
    userRole,
    memberRole,
    hasEqualSubject,
  };
}
