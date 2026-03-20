import type {
  AccessPermissionRuleResponseDto,
  MemberRoleDtoType,
  PermissionKindType,
  PermissionType,
  ReferenceJsonSchema,
  SecurityResponseDto,
  UserRoleDtoType,
} from '@open-dpp/dto'
import type { z } from 'zod'

import { randomUUID } from 'node:crypto'
import {
  PermissionKind,
  Permissions,
} from '@open-dpp/dto'
import { Factory } from 'fishery'
import { propertyOutputPlainFactory } from './submodel-element.factory'

const permissionObjectPlainFactory
  = Factory.define<z.infer<typeof ReferenceJsonSchema>> (({ params }) => ({
    idShort: params.idShort ?? randomUUID(),
    extensions: [],
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value: null,
  }))

export interface SecurityPlainTransientParams {
  policies: {
    subject: { userRole: UserRoleDtoType, memberRole?: MemberRoleDtoType }
    object: { idShortPath: string }
    permissions: { permission: PermissionType, kindOfPermission: PermissionKindType }[]
  }[]
}

export const allPermissionsAllow = Object.values(Permissions).map(permission => ({ permission, kindOfPermission: PermissionKind.Allow }))

export const securityPlainFactory
  = Factory.define<SecurityResponseDto, SecurityPlainTransientParams>(({ transientParams }) => {
    const { policies } = transientParams
    const accessPermissionRules: AccessPermissionRuleResponseDto[] = []
    if (policies) {
      for (const policy of policies) {
        const rule = accessPermissionRules.find(rule =>
          rule.targetSubjectAttributes.subjectAttribute.some(attr => attr.idShort === 'userRole' && attr.value === policy.subject.userRole)
          && rule.targetSubjectAttributes.subjectAttribute.some(attr => attr.idShort === 'memberRole' && attr.value === policy.subject.memberRole),
        )
        const permissionPerObject = { object: permissionObjectPlainFactory.build({ idShort: policy.object.idShortPath }), permissions: policy.permissions }
        if (rule) {
          rule.permissionsPerObject.push({
            ...permissionPerObject,
          })
        }
        else {
          accessPermissionRules.push({
            targetSubjectAttributes: {
              subjectAttribute: [
                propertyOutputPlainFactory.build({ idShort: 'userRole', value: policy.subject.userRole }),
                ...policy.subject.memberRole ? [propertyOutputPlainFactory.build({ idShort: 'memberRole', value: policy.subject.memberRole })] : [],
              ],
            },
            permissionsPerObject: [permissionPerObject],
          })
        }
      }
    }
    return {
      localAccessControl: {
        accessPermissionRules,
      },
    }
  })
