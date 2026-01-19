import { z } from "zod";
import { ValueTypeDbSchema } from "../common/basic-db-schema";
import { ReferenceDbSchema } from "../common/reference-db-schema";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";

export const PropertyDbSchema = z.object({
  ...SubmodelBaseDbSchema.shape,
  valueType: ValueTypeDbSchema,
  extensions: ExtensionDbSchema.array().default([]),
  value: z.nullish(z.string()),
  valueId: z.nullish(ReferenceDbSchema),
});
