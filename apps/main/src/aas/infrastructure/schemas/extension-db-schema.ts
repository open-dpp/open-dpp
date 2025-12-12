import { z } from "zod";
import { ValueTypeDbSchema } from "./common/basic-db-schema";
import { ReferenceDbSchema } from "./common/reference-db-schema";

export const ExtensionDbSchema = z.object({
  name: z.string(),
  semanticId: z.nullish(ReferenceDbSchema),
  supplementalSemanticIds: z.array(ReferenceDbSchema).default([]),
  valueType: z.nullish(ValueTypeDbSchema),
  value: z.nullish(z.string()),
  refersTo: z.array(ReferenceDbSchema).default([]),
});
