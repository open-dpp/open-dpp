import { z } from "zod";
import { EntityType } from "../../submodel-base/entity";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SpecificAssetIdJsonSchema } from "../specific-asset-id-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";
import { SubmodelElementSchema } from "./submodel-element-schema";

export const EntityTypeJsonSchema = z.lazy(() =>
  EntityTypeJsonSchemaImpl(),
);

export function EntityTypeJsonSchemaImpl() {
  return z.object({
    ...SubmodelBaseJsonSchema.shape,
    entityType: z.enum(EntityType),
    extensions: ExtensionJsonSchema.array().default([]),
    statements: SubmodelElementSchema.array().default([]),
    globalAssetId: z.nullish(z.string()),
    specificAssetIds: SpecificAssetIdJsonSchema.array().default([]),
  },
  );
}
