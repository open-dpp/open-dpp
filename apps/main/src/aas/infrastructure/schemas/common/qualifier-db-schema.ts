import { z } from "zod";
import { QualifierKindEnum } from "../../../domain/common/qualifier-kind-enum";
import { ValueTypeDbSchema } from "./basic-db-schema";
import { ReferenceDbSchema } from "./reference-db-schema";

export const QualifierDbSchema = z.object({
  type: z.string(),
  valueType: ValueTypeDbSchema,
  semanticId: ReferenceDbSchema.optional(),
  supplementalSemanticIds: z.array(ReferenceDbSchema),
  kind: QualifierKindEnum,
  value: z.string().optional(),
  valueId: ReferenceDbSchema.optional(),
});
