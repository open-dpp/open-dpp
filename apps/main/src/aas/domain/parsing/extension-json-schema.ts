import { z } from "zod";
import { DataTypeDef } from "../common/data-type-def";
import { ReferenceJsonSchema } from "./common/reference-json-schema";

export const ExtensionJsonSchema = z.object({
  name: z.string(),
  semanticId: ReferenceJsonSchema.optional(),
  supplementalSemanticIds: z.array(ReferenceJsonSchema),
  valueType: z.enum(DataTypeDef).optional(),
  value: z.string().optional(),
  refersTo: z.array(ReferenceJsonSchema),
});
