import type {
  AccessPermissionRuleResponseDto,
  MemberRoleDtoType,
  PermissionDto,
  SubjectAttributesDto,
  UserRoleDtoType,
} from "@open-dpp/dto";
import {

  DataTypeDef,

  MemberRoleDtoEnum,

  UserRoleDto,
  UserRoleDtoEnum,

} from "@open-dpp/dto";

export interface Subject {
  userRole: UserRoleDtoType;
  memberRole?: MemberRoleDtoType;
}

export function isEqualSubject(subject1: Subject, subject2: Subject) {
  return (
    (subject1.userRole === UserRoleDto.ADMIN
      && subject1.userRole === subject2.userRole)
    || JSON.stringify(subject1) === JSON.stringify(subject2)
  );
}

export function makeSubjectAttributes(subject: Subject): SubjectAttributesDto {
  const createProperty = (idShort: string, value: string) => ({
    value,
    valueType: DataTypeDef.String,
    idShort,
    extensions: [],
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
  });

  const subjectAttribute = [createProperty("userRole", subject.userRole)];
  if (subject.memberRole) {
    subjectAttribute.push(createProperty("memberRole", subject.memberRole));
  }

  return {
    subjectAttribute,
  };
}

export function makeRule(data: { subject: Subject; object: string; permissions: PermissionDto[] }): AccessPermissionRuleResponseDto {
  const defaultValues = {
    extensions: [],
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
  };
  const userRole = {
    ...defaultValues,
    idShort: "userRole",
    value: data.subject.userRole,
    valueType: DataTypeDef.String,
  };
  const memberRole = {
    ...defaultValues,
    idShort: "memberRole",
    value: data.subject.memberRole,
    valueType: DataTypeDef.String,
  };
  return {
    targetSubjectAttributes: {
      subjectAttribute: [userRole, memberRole],
    },
    permissionsPerObject: [{
      object: { ...defaultValues, idShort: data.object },
      permissions: data.permissions,
    }],
  };
}

export function ruleHelper(accessPermissionRule: AccessPermissionRuleResponseDto) {
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

  function getSubject(): Subject {
    return { userRole, memberRole };
  }

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
    getSubject,
  };
}
