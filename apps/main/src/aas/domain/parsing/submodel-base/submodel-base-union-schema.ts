import { z } from "zod";
import { KeyTypes } from "../../common/key-types-enum";
import { EntityTypeJsonSchemaImpl } from "./entity-type-json-schema";
import { PropertyJsonSchema } from "./property-json-schema";

export const SubmodelBaseUnionSchema: z.ZodTypeAny = z.lazy(() =>
  SubmodelBaseUnionSchemaImpl(),
);

export function SubmodelBaseUnionSchemaImpl() {
  return z.discriminatedUnion("modelType", [
    z.object({
      modelType: z.literal(KeyTypes.Property),
      ...PropertyJsonSchema.shape,
    }),
    EntityTypeJsonSchemaImpl().extend({
      modelType: z.literal(KeyTypes.Entity),
    }),
  ]);
}
