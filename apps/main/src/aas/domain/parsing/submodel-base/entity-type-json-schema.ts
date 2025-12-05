import { z } from "zod";
import { EntityType } from "../../submodel-base/entity";
import { nullishToOptional } from "../common/basic-json-schema";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SpecificAssetIdJsonSchema } from "../specific-asset-id-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";
import { SubmodelBaseUnionSchema } from "./submodel-base-union-schema";

export const EntityTypeJsonSchema = z.lazy(() =>
  EntityTypeJsonSchemaImpl(),
);

export function EntityTypeJsonSchemaImpl() {
  return z.object({
    ...SubmodelBaseJsonSchema.shape,
    entityType: z.enum(EntityType),
    extensions: ExtensionJsonSchema.array().default([]),
    statements: SubmodelBaseUnionSchema.array().default([]),
    globalAssetId: nullishToOptional(z.string()),
    specificAssetIds: SpecificAssetIdJsonSchema.array().default([]),
  },
  );
}
