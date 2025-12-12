import { z } from "zod";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";
import { SubmodelBaseUnionDbSchema } from "./submodel-base-union-db-schema";

export const SubmodelElementCollectionDbSchema = z.lazy(() =>
  SubmodelElementCollectionDbSchemaImpl(),
);

export function SubmodelElementCollectionDbSchemaImpl() {
  return z.object({
    ...SubmodelBaseDbSchema.shape,
    extensions: ExtensionDbSchema.array().default([]),
    value: SubmodelBaseUnionDbSchema.array().default([]),
  });
};
