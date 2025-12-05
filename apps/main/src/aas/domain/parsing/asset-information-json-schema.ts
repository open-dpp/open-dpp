import { z } from "zod";
import { AssetKindEnum } from "../asset-kind-enum";
import { nullishToOptional } from "./common/basic-json-schema";
import { ResourceJsonSchema } from "./resource-json-schema";
import { SpecificAssetIdJsonSchema } from "./specific-asset-id-json-schema";

export const AssetInformationJsonSchema = z.object({
  assetKind: AssetKindEnum,
  globalAssetId: nullishToOptional(z.string()),
  specificAssetIds: SpecificAssetIdJsonSchema.array().default([]),
  assetType: nullishToOptional(z.string()),
  defaultThumbnail: nullishToOptional(ResourceJsonSchema),
});
