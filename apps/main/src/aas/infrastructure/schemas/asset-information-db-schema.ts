import { z } from "zod";
import { AssetKindEnum } from "../../domain/asset-kind-enum";
import { ResourceDbSchema } from "./resource-db-schema";
import { SpecificAssetIdDbSchema } from "./specific-asset-id-db-schema";

export const AssetInformationDbSchema = z.object({
  assetKind: AssetKindEnum,
  globalAssetId: z.nullish(z.string()),
  specificAssetIds: SpecificAssetIdDbSchema.array().default([]),
  assetType: z.nullish(z.string()),
  defaultThumbnail: z.nullish(ResourceDbSchema),
});
