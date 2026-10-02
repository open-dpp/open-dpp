import { z } from "zod";
import { aasExportSchemaJsonV1_0 } from "./aas-export-v1.schema";
import { aasExportSchemaJsonV2_0 } from "./aas-export-v2.schema";
import { aasExportSchemaJsonV3_0 } from "./aas-export-v3.schema";
import { aasExportSchemaJsonV4_0 } from "./aas-export-v4.schema";
import { aasExportSchemaJsonV5_0 } from "./aas-export-v5.schema";
import {
  aasExportSchemaJsonPassportV6_0,
  aasExportSchemaJsonTemplateV6_0,
} from "./aas-export-v6.schema";
import { DigitalProductDocumentTypes, DigitalProductDocumentTypesType } from "@open-dpp/dto";

export const AasExportSchemas = z.discriminatedUnion("version", [
  aasExportSchemaJsonV1_0,
  aasExportSchemaJsonV2_0,
  aasExportSchemaJsonV3_0,
  aasExportSchemaJsonV4_0,
  aasExportSchemaJsonV5_0,
]);

export const TemplateExportSchemas = z.discriminatedUnion("version", [
  ...AasExportSchemas.options,
  aasExportSchemaJsonTemplateV6_0,
]);

export const PassportExportSchemas = z.discriminatedUnion("version", [
  ...AasExportSchemas.options,
  aasExportSchemaJsonPassportV6_0,
]);

export const TemplateExportLatestVersionSchema = aasExportSchemaJsonTemplateV6_0;
export const PassportExportLatestVersionSchema = aasExportSchemaJsonPassportV6_0;

export type TemplateExportLatestVersion = z.infer<typeof TemplateExportLatestVersionSchema>;
export type PassportExportLatestVersion = z.infer<typeof PassportExportLatestVersionSchema>;
export type AasExportLatestVersion = TemplateExportLatestVersion | PassportExportLatestVersion;

export function exportSchemas(referenceType: DigitalProductDocumentTypesType) {
  if (referenceType === DigitalProductDocumentTypes.Template) {
    return { schemas: TemplateExportSchemas, latestSchema: aasExportSchemaJsonTemplateV6_0 };
  } else {
    return { schemas: PassportExportSchemas, latestSchema: aasExportSchemaJsonPassportV6_0 };
  }
}
