import type {
  AccessPermissionRuleResponseDto,
  PermissionPerObjectDtoSchema,
  ReferenceJsonSchema,
} from '@open-dpp/dto'
import type { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { PermissionKind, Permissions } from '@open-dpp/dto'
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

export const permissionPerObjectPlainFactory = Factory.define<z.infer<typeof PermissionPerObjectDtoSchema>> (
  () => ({
    object: permissionObjectPlainFactory.build({ idShort: 'section1' }),
    permissions: [{ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }],
  }),
)

interface AccessPermissionRulePlainFactoryParams {
  role: string
  organizationId: string
}

export const accessPermissionRulePlainFactory
  = Factory.define<AccessPermissionRuleResponseDto, AccessPermissionRulePlainFactoryParams> (({ transientParams }) => ({
    targetSubjectAttributes: {
      subjectAttribute: [
        propertyOutputPlainFactory.build({ idShort: 'role', value: transientParams.role }),
        propertyOutputPlainFactory.build({ idShort: 'organizationId', value: transientParams.organizationId }),
      ],
    },
    permissionsPerObject: [permissionPerObjectPlainFactory.build()],
  }))
