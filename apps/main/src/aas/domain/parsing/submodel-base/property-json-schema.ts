import { z } from "zod";
import { ValueTypeSchema } from "../common/basic-json-schema";
import { ReferenceJsonSchema } from "../common/reference-json-schema";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";

export const PropertyJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  valueType: ValueTypeSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  value: z.nullish(z.string()),
  valueId: z.nullish(ReferenceJsonSchema),
});
