import { z } from "zod";
import { AasExportVersion } from "./aas-export-shared";
import { aasExportSchemaJsonV3_0 } from "./aas-export-v3.schema";

export const aasExportSchemaJsonV4_0 = z.object({
  ...aasExportSchemaJsonV3_0.shape,
  version: z.literal(AasExportVersion.v4_0),
});
