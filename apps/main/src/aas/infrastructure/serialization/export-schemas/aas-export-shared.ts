import { z } from "zod/v4";

export const AasExportFormat = {
  "open-dpp:json": "open-dpp:json",
} as const;
export const AasExportVersion = {
  v1_0: "1.0",
  v2_0: "2.0",
} as const;

export const AasExportVersionEnum = z.enum(AasExportVersion);
export type AasExportVersionType = z.infer<typeof AasExportVersionEnum>;
