import { z } from "zod";
import { DataTypeDefEnum } from "../../../domain/common/data-type-def";
import { QualifierKindEnum } from "../../../domain/common/qualifier-kind-enum";
import { ReferenceDbSchema } from "./reference-db-schema";

export const QualifierDbSchema = z.object({
  type: z.string(),
  valueType: DataTypeDefEnum,
  semanticId: ReferenceDbSchema.optional(),
  supplementalSemanticIds: z.array(ReferenceDbSchema),
  kind: QualifierKindEnum,
  value: z.string().optional(),
  valueId: ReferenceDbSchema.optional(),
});
