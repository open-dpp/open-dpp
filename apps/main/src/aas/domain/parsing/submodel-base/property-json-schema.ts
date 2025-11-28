import { z } from "zod";
import { nullishToOptional, ValueTypeSchema } from "../common/basic-json-schema";
import { ReferenceJsonSchema } from "../common/reference-json-schema";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";

export const PropertyJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  valueType: ValueTypeSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  value: nullishToOptional(z.string()),
  valueId: nullishToOptional(ReferenceJsonSchema),
});
