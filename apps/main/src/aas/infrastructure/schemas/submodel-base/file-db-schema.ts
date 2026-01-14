import { z } from "zod";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";

export const FileDbSchema = z.object({
  ...SubmodelBaseDbSchema.shape,
  extensions: ExtensionDbSchema.array().default([]),
  contentType: z.string(),
  value: z.nullish(z.string()),
});
