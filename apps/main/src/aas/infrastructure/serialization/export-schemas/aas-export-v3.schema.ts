import { PresentationConfigurationExportSchema } from "@open-dpp/dto";
import { z } from "zod";
import { AasExportVersion } from "./aas-export-shared";
import { aasExportSchemaJsonV2_0 } from "./aas-export-v2.schema";

export const aasExportSchemaJsonV3_0 = z.object({
  ...aasExportSchemaJsonV2_0.shape,
  version: z.literal(AasExportVersion.v3_0),
  presentationConfiguration: PresentationConfigurationExportSchema.optional(),
});
