import { z } from "zod";
import { ValueTypeDbSchema } from "../common/basic-db-schema";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";

export const RangeDbSchema = z.object({
  ...SubmodelBaseDbSchema.shape,
  valueType: ValueTypeDbSchema,
  extensions: ExtensionDbSchema.array().default([]),
  min: z.nullish(z.string()),
  max: z.nullish(z.string()),
});
