import { z } from "zod";
import { ReferenceJsonSchema } from "../common/reference-json-schema";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";
import { SubmodelBaseUnionSchema } from "./submodel-base-union-schema";

export const AnnotatedRelationshipElementJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  first: ReferenceJsonSchema,
  second: ReferenceJsonSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  annotations: SubmodelBaseUnionSchema.array().default([]),
});
