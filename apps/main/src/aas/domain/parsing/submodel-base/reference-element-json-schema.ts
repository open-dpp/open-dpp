import { z } from "zod";
import { nullishToOptional } from "../common/basic-json-schema";
import { ReferenceJsonSchema } from "../common/reference-json-schema";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";

export const ReferenceElementJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  extensions: ExtensionJsonSchema.array().default([]),
  value: nullishToOptional(ReferenceJsonSchema),
});
