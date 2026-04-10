import { z } from "zod";
import { AasExportVersion } from "./aas-export-shared";
import {
  aasExportSchemaJsonV1_0,
  AssetAdministrationShellV1_0,
  PropertySchemaV1_0,
  ReferenceElementSchemaV1_0,
} from "./aas-export-v1.schema";

const Permissions = {
  Create: "Create",
  Read: "Read",
  Edit: "Edit",
  Delete: "Delete",
} as const;

export const PermissionEnumV2_0 = z.enum(Permissions);

export const PermissionKind = {
  Allow: "Allow",
} as const;
export const PermissionKindEnumV2_0 = z.enum(PermissionKind);

export const PermissionSchemaV2_0 = z.object({
  permission: PermissionEnumV2_0,
  kindOfPermission: PermissionKindEnumV2_0,
});

export const SubjectAttributesSchemaV2_0 = z.object({
  subjectAttribute: PropertySchemaV1_0.array(),
});

export const PermissionPerObjectSchemaV2_0 = z.object({
  object: ReferenceElementSchemaV1_0,
  permissions: z.array(PermissionSchemaV2_0),
});

export const AccessPermissionRuleSchemaV2_0 = z.object({
  targetSubjectAttributes: SubjectAttributesSchemaV2_0,
  permissionsPerObject: z.array(PermissionPerObjectSchemaV2_0),
});

export const AccessControlSchemaV2_0 = z.object({
  accessPermissionRules: AccessPermissionRuleSchemaV2_0.array(),
});

export const SecuritySchemaV2_0 = z.object({
  localAccessControl: AccessControlSchemaV2_0,
});

export const AssetAdministrationShellV2_0 = AssetAdministrationShellV1_0.safeExtend({
  security: SecuritySchemaV2_0,
});

export const aasExportSchemaJsonV2_0 = z.object({
  ...aasExportSchemaJsonV1_0.shape,
  environment: z.object({
    ...aasExportSchemaJsonV1_0.shape.environment.shape,
    assetAdministrationShells: AssetAdministrationShellV2_0.array(),
  }),
  version: z.literal(AasExportVersion.v2_0),
});
