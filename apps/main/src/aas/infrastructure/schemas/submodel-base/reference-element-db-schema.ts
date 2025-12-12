import { z } from "zod";
import { ReferenceDbSchema } from "../common/reference-db-schema";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";

export const ReferenceElementDbSchema = z.object({
  ...SubmodelBaseDbSchema.shape,
  extensions: ExtensionDbSchema.array().default([]),
  value: z.nullish(ReferenceDbSchema),
});
