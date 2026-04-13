import type {
  AccessPermissionRuleResponseDto,
  MemberRoleDtoType,
  PermissionKindType,
  PermissionType,
  ReferenceElementJsonSchema,
  SecurityResponseDto,
  SubjectAttributesDto,
  UserRoleDtoType,
} from "@open-dpp/dto";

import type { z } from "zod";

import { randomUUID } from "node:crypto";

import { PermissionKind, Permissions } from "@open-dpp/dto";
import { Factory } from "fishery";
import { propertyOutputPlainFactory } from "./submodel-element.factory";

export const permissionObjectPlainFactory = Factory.define<
  z.infer<typeof ReferenceElementJsonSchema>
>(({ params }) => ({
  idShort: params.idShort ?? randomUUID(),
  extensions: [],
  displayName: [],
  description: [],
  supplementalSemanticIds: [],
  qualifiers: [],
  embeddedDataSpecifications: [],
  value: null,
}));

export interface SecurityPlainTransientParams {
  policies: {
    subject: { userRole: UserRoleDtoType; memberRole?: MemberRoleDtoType };
    object: { idShortPath: string };
    permissions: { permission: PermissionType; kindOfPermission: PermissionKindType }[];
  }[];
}

export interface SubjectPlainParams {
  userRole: UserRoleDtoType;
  memberRole?: MemberRoleDtoType;
}

export const subjectPlainFactory = Factory.define<SubjectAttributesDto, SubjectPlainParams>(
  ({ transientParams }) => ({
    subjectAttribute: [
      propertyOutputPlainFactory.build({ idShort: "userRole", value: transientParams.userRole }),
      ...(transientParams.memberRole
        ? [
            propertyOutputPlainFactory.build({
              idShort: "memberRole",
              value: transientParams.memberRole,
            }),
          ]
        : []),
    ],
  }),
);

export const allPermissionsAllow = Object.values(Permissions).map((permission) => ({
  permission,
  kindOfPermission: PermissionKind.Allow,
}));

export const securityPlainFactory = Factory.define<
  SecurityResponseDto,
  SecurityPlainTransientParams
>(({ transientParams }) => {
  const { policies } = transientParams;
  const accessPermissionRules: AccessPermissionRuleResponseDto[] = [];
  if (policies) {
    for (const policy of policies) {
      const rule = accessPermissionRules.find(
        (rule) =>
          rule.targetSubjectAttributes.subjectAttribute.some(
            (attr) => attr.idShort === "userRole" && attr.value === policy.subject.userRole,
          ) &&
          rule.targetSubjectAttributes.subjectAttribute.some(
            (attr) => attr.idShort === "memberRole" && attr.value === policy.subject.memberRole,
          ),
      );
      const permissionPerObject = {
        object: permissionObjectPlainFactory.build({ idShort: policy.object.idShortPath }),
        permissions: policy.permissions,
      };
      if (rule) {
        rule.permissionsPerObject.push({
          ...permissionPerObject,
        });
      } else {
        accessPermissionRules.push({
          targetSubjectAttributes: subjectPlainFactory.build(undefined, {
            transient: { userRole: policy.subject.userRole, memberRole: policy.subject.memberRole },
          }),
          permissionsPerObject: [permissionPerObject],
        });
      }
    }
  }
  return {
    localAccessControl: {
      accessPermissionRules,
    },
  };
});
