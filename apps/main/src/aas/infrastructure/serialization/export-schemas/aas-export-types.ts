import { z } from "zod";
import { aasExportSchemaJsonV1_0 } from "./aas-export-v1.schema";
import { aasExportSchemaJsonV2_0 } from "./aas-export-v2.schema";
import { aasExportSchemaJsonV3_0 } from "./aas-export-v3.schema";

export const AasExportSchemas = z.discriminatedUnion("version", [
  aasExportSchemaJsonV1_0,
  aasExportSchemaJsonV2_0,
  aasExportSchemaJsonV3_0,
]);

export type AasExport = z.infer<typeof AasExportSchemas>;

// Must stay in lockstep with `EXPORT_VERSION` in
// domain/exportable/aas-exportable.ts. When you add vN, update both pointers.
export const aasExportSchemaJsonLatest = aasExportSchemaJsonV3_0;
export type AasExportLatestVersion = z.infer<typeof aasExportSchemaJsonLatest>;
