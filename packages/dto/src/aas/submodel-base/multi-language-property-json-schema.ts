import { z } from "zod";
import { LanguageTextJsonSchema } from "../common/language-text-json-schema";
import { ReferenceJsonSchema } from "../common/reference-json-schema";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";

export const MultiLanguagePropertyJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  extensions: ExtensionJsonSchema.array().default([]),
  value: LanguageTextJsonSchema.array().default([]),
  valueId: z.nullish(ReferenceJsonSchema),
});
