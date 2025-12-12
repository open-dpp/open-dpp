import { z } from "zod";
import { ReferenceJsonSchema } from "../common/reference-json-schema";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";

export const ReferenceElementJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  extensions: ExtensionJsonSchema.array().default([]),
  value: z.nullish(ReferenceJsonSchema),
});
