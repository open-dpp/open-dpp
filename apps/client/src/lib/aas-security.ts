import type {
  AccessPermissionRuleResponseDto,
  PermissionDto,
  SubjectAttributesDto,
} from "@open-dpp/dto";
import type { SubjectRoles } from "@open-dpp/permission";
import {
  DataTypeDef,
  GuestRoleDtoEnum,
  MemberRoleDtoEnum,
  UserRoleDto,
  UserRoleDtoEnum,
} from "@open-dpp/dto";
import { isEqualSubjectRoles } from "@open-dpp/permission";

export type Subject = SubjectRoles;

export function isEqualSubject(subject1: Subject, subject2: Subject) {
  return isEqualSubjectRoles(subject1, subject2);
}

// Anonymous users and guests only read. They never create, edit or delete.
export function isReadOnlySubject(subject: Subject) {
  return subject.userRole === UserRoleDto.ANONYMOUS || subject.guestRole !== undefined;
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
  if (subject.guestRole) {
    subjectAttribute.push(createProperty("guestRole", subject.guestRole));
  }

  return {
    subjectAttribute,
  };
}

export function makeRule(data: {
  subject: Subject;
  object: string;
  permissions: PermissionDto[];
}): AccessPermissionRuleResponseDto {
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
  const guestRole = {
    ...defaultValues,
    idShort: "guestRole",
    value: data.subject.guestRole,
    valueType: DataTypeDef.String,
  };
  return {
    targetSubjectAttributes: {
      subjectAttribute: data.subject.guestRole
        ? [userRole, memberRole, guestRole]
        : [userRole, memberRole],
    },
    permissionsPerObject: [
      {
        object: { ...defaultValues, idShort: data.object },
        permissions: data.permissions,
      },
    ],
  };
}

export function ruleHelper(accessPermissionRule: AccessPermissionRuleResponseDto) {
  const rule: AccessPermissionRuleResponseDto = accessPermissionRule;

  const userRole = UserRoleDtoEnum.parse(
    rule.targetSubjectAttributes.subjectAttribute.find((p) => p.idShort === "userRole")?.value,
  );
  const memberRole = MemberRoleDtoEnum.optional().parse(
    rule.targetSubjectAttributes.subjectAttribute.find((p) => p.idShort === "memberRole")?.value ??
      undefined,
  );

  const guestRole = GuestRoleDtoEnum.optional().parse(
    rule.targetSubjectAttributes.subjectAttribute.find((p) => p.idShort === "guestRole")?.value ??
      undefined,
  );

  function getSubject(): Subject {
    return { userRole, memberRole, guestRole };
  }

  function hasEqualSubject(subject: Subject) {
    return (
      (subject.userRole === userRole && userRole === UserRoleDto.ADMIN) ||
      (subject.userRole === userRole &&
        subject.memberRole === memberRole &&
        subject.guestRole === guestRole)
    );
  }

  return {
    ...rule,
    userRole,
    memberRole,
    guestRole,
    hasEqualSubject,
    getSubject,
  };
}
