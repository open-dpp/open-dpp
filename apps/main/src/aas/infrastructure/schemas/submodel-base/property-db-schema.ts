import { z } from "zod";
import { ValueTypeDbSchema } from "../common/basic-db-schema";
import { emptyArrayAsUndefinedCodec } from "../common/empty-array-as-undefined-codec";
import { ReferenceDbSchema } from "../common/reference-db-schema";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";

export const PropertyDbSchema = z.object({
  ...SubmodelBaseDbSchema.shape,
  valueType: ValueTypeDbSchema,
  extensions: emptyArrayAsUndefinedCodec(ExtensionDbSchema),
  value: z.nullish(z.string()),
  valueId: z.nullish(ReferenceDbSchema),
});

export type PropertyDb = z.infer<typeof PropertyDbSchema>;
