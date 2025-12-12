import { z } from "zod";
import { LanguageTextDbSchema } from "../common/language-text-db-schema";
import { ReferenceDbSchema } from "../common/reference-db-schema";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";

export const MultiLanguagePropertyDbSchema = z.object({
  ...SubmodelBaseDbSchema.shape,
  extensions: ExtensionDbSchema.array().default([]),
  value: LanguageTextDbSchema.array().default([]),
  valueId: z.nullish(ReferenceDbSchema),
});
