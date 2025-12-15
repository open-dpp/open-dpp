import { z } from "zod";
import { QualifierKindEnum } from "../../common/qualifier-kind-enum";
import { ValueTypeSchema } from "./basic-json-schema";
import { ReferenceJsonSchema } from "./reference-json-schema";

export const QualifierJsonSchema = z.object({
  type: z.string(),
  valueType: ValueTypeSchema,
  semanticId: ReferenceJsonSchema.optional(),
  supplementalSemanticIds: z.array(ReferenceJsonSchema).default([]),
  kind: QualifierKindEnum,
  value: z.string().optional(),
  valueId: ReferenceJsonSchema.optional(),
});
