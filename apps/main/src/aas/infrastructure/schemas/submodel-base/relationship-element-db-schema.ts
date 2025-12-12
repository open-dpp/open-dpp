import { z } from "zod";
import { ReferenceDbSchema } from "../common/reference-db-schema";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";

export const RelationshipElementDbSchema = z.object({
  ...SubmodelBaseDbSchema.shape,
  first: ReferenceDbSchema,
  second: ReferenceDbSchema,
  extensions: ExtensionDbSchema.array().default([]),
});
