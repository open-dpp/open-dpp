import { QualifierKindEnum } from "@open-dpp/aas";
import { z } from "zod";
import { ValueTypeDbSchema } from "./basic-db-schema";
import { ReferenceDbSchema } from "./reference-db-schema";

export const QualifierDbSchema = z.object({
  type: z.string(),
  valueType: ValueTypeDbSchema,
  semanticId: ReferenceDbSchema.nullish(),
  supplementalSemanticIds: z.array(ReferenceDbSchema),
  kind: QualifierKindEnum,
  value: z.string().nullish(),
  valueId: ReferenceDbSchema.nullish(),
});
