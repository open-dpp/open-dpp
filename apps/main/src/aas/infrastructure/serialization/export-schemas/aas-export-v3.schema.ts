import { z } from "zod";
import { AasExportVersion } from "./aas-export-shared";
import { aasExportSchemaJsonV2_0 } from "./aas-export-v2.schema";

const DigitalProductDocumentStatusV3_0 = {
  Draft: "Draft",
  Published: "Published",
  Archived: "Archived",
} as const;

const DigitalProductDocumentStatusEnumV3_0 = z.enum(DigitalProductDocumentStatusV3_0);

export const DigitalProductDocumentStatusChangeSchemaV3_0 = z.object({
  previousStatus: DigitalProductDocumentStatusEnumV3_0.nullish(),
  currentStatus: DigitalProductDocumentStatusEnumV3_0,
});

export const aasExportSchemaJsonV3_0 = z.object({
  ...aasExportSchemaJsonV2_0.shape,
  lastStatusChange: DigitalProductDocumentStatusChangeSchemaV3_0,
  version: z.literal(AasExportVersion.v3_0),
});
