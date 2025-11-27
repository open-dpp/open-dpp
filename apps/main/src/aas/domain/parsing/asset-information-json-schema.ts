import { z } from "zod";
import { AssetKindEnum } from "../asset-kind-enum";
import { ResourceJsonSchema, SpecificAssetIdJsonSchema } from "./aas-json-schemas";
import { nullishToOptional } from "./basic-json-schema";

export const AssetInformationJsonSchema = z.object({
  assetKind: AssetKindEnum,
  globalAssetId: nullishToOptional(z.string()),
  specificAssetIds: SpecificAssetIdJsonSchema.array().default([]),
  assetType: nullishToOptional(z.string()),
  defaultThumbnail: nullishToOptional(ResourceJsonSchema),
});
