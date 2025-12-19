import { EntityType } from "@open-dpp/dto";
import { z } from "zod";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SpecificAssetIdDbSchema } from "../specific-asset-id-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";
import { SubmodelElementDbSchema } from "./submodel-element-db-schema";

export const EntityTypeDbSchema = z.lazy(() =>
  EntityTypeDbSchemaImpl(),
);

export function EntityTypeDbSchemaImpl() {
  return z.object({
    ...SubmodelBaseDbSchema.shape,
    entityType: z.enum(EntityType),
    extensions: ExtensionDbSchema.array().default([]),
    statements: SubmodelElementDbSchema.array().default([]),
    globalAssetId: z.nullish(z.string()),
    specificAssetIds: SpecificAssetIdDbSchema.array().default([]),
  },
  );
}
