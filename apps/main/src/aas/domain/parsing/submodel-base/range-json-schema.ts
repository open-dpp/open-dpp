import { z } from "zod";
import { nullishToOptional, ValueTypeSchema } from "../common/basic-json-schema";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";

export const RangeJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  valueType: ValueTypeSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  min: nullishToOptional(z.string()),
  max: nullishToOptional(z.string()),
});
