import { z } from "zod";
import { EntityType } from "../../../domain/submodel-base/entity";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SpecificAssetIdDbSchema } from "../specific-asset-id-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";
import { SubmodelBaseUnionDbSchema } from "./submodel-base-union-db-schema";

export const EntityTypeDbSchema = z.lazy(() =>
  EntityTypeDbSchemaImpl(),
);

export function EntityTypeDbSchemaImpl() {
  return z.object({
    ...SubmodelBaseDbSchema.shape,
    entityType: z.enum(EntityType),
    extensions: ExtensionDbSchema.array().default([]),
    statements: SubmodelBaseUnionDbSchema.array().default([]),
    globalAssetId: z.nullish(z.string()),
    specificAssetIds: SpecificAssetIdDbSchema.array().default([]),
  },
  );
}
