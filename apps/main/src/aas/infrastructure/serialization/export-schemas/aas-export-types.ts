import { z } from "zod";
import { aasExportSchemaJsonV1_0 } from "./aas-export-v1.schema";
import { aasExportSchemaJsonV2_0 } from "./aas-export-v2.schema";

export const AasExportSchemas = z.discriminatedUnion("version", [aasExportSchemaJsonV1_0, aasExportSchemaJsonV2_0]);

export type AasExport = z.infer<typeof AasExportSchemas>;

export const aasExportSchemaJsonLatest = aasExportSchemaJsonV2_0;
export type AasExportLatestVersion = z.infer<typeof aasExportSchemaJsonLatest>;
