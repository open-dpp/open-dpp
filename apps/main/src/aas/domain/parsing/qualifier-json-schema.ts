import { z } from "zod";
import { DataTypeDefEnum } from "../common/data-type-def";
import { QualifierKindEnum } from "../common/qualifier-kind-enum";
import { ReferenceJsonSchema } from "./reference-json-schema";

export const QualifierJsonSchema = z.object({
  type: z.string(),
  valueType: DataTypeDefEnum,
  semanticId: ReferenceJsonSchema.optional(),
  supplementalSemanticIds: z.array(ReferenceJsonSchema),
  kind: QualifierKindEnum,
  value: z.string().optional(),
  valueId: ReferenceJsonSchema.optional(),
});
