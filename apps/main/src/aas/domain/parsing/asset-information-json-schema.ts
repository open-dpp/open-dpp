import { z } from "zod";
import { AssetKindEnum } from "../asset-kind-enum";
import { ResourceJsonSchema } from "./resource-json-schema";
import { SpecificAssetIdJsonSchema } from "./specific-asset-id-json-schema";

export const AssetInformationJsonSchema = z.object({
  assetKind: AssetKindEnum,
  globalAssetId: z.nullish(z.string()),
  specificAssetIds: SpecificAssetIdJsonSchema.array().default([]),
  assetType: z.nullish(z.string()),
  defaultThumbnail: z.nullish(ResourceJsonSchema),
});
