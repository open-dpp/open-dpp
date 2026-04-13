import { z } from 'zod'
import { PermissionEnum } from '../enums/permission-enum'
import { PermissionKindEnum } from '../enums/permission-kind-enum'
import { PropertyJsonSchema } from '../submodel-base/property-json-schema'
import { ReferenceElementJsonSchema } from '../submodel-base/reference-element-json-schema'

export const SubjectAttributesDtoSchema = z.object({
  subjectAttribute: PropertyJsonSchema.array(),
})

export type SubjectAttributesDto = z.infer<typeof SubjectAttributesDtoSchema>

export const PermissionDtoSchema = z.object({
  permission: PermissionEnum,
  kindOfPermission: PermissionKindEnum,
})

export type PermissionDto = z.infer<typeof PermissionDtoSchema>

export const PermissionPerObjectDtoSchema = z.object({
  object: ReferenceElementJsonSchema,
  permissions: z.array(PermissionDtoSchema),
})

export const AccessPermissionRuleDtoSchema = z.object({
  targetSubjectAttributes: SubjectAttributesDtoSchema,
  permissionsPerObject: z.array(PermissionPerObjectDtoSchema),
})

export type AccessPermissionRuleResponseDto = z.infer<typeof AccessPermissionRuleDtoSchema>
