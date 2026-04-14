import { z } from "zod";

export const AssetKind = {
  Type: "Type",
  Instance: "Instance",
} as const;
export const AssetKindEnum = z.enum(AssetKind);
export type AssetKindType = z.infer<typeof AssetKindEnum>;
