import { z } from "zod";
import { ReferenceJsonSchema } from "../common/reference-json-schema";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";

export const RelationshipElementJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  first: ReferenceJsonSchema,
  second: ReferenceJsonSchema,
  extensions: ExtensionJsonSchema.array().default([]),
});
