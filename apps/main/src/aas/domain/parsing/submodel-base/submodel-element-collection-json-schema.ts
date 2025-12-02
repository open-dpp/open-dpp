import { z } from "zod";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";
import { SubmodelBaseUnionSchema } from "./submodel-base-union-schema";

export const SubmodelElementCollectionJsonSchema = z.lazy(() =>
  SubmodelElementCollectionJsonSchemaImpl(),
);

export function SubmodelElementCollectionJsonSchemaImpl() {
  return z.object({
    ...SubmodelBaseJsonSchema.shape,
    extensions: ExtensionJsonSchema.array().default([]),
    value: SubmodelBaseUnionSchema.array().default([]),
  });
};
