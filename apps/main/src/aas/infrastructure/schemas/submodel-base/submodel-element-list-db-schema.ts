import { z } from "zod";
import { AasSubmodelElementsEnum } from "../../../domain/submodel-base/aas-submodel-elements";
import { ValueTypeDbSchema } from "../common/basic-db-schema";
import { ReferenceDbSchema } from "../common/reference-db-schema";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";
import { SubmodelBaseUnionDbSchema } from "./submodel-base-union-db-schema";

export const SubmodelElementListDbSchema = z.lazy(() =>
  SubmodelElementListDbSchemaImpl(),
);

export function SubmodelElementListDbSchemaImpl() {
  return z.object({
    ...SubmodelBaseDbSchema.shape,
    typeValueListElement: AasSubmodelElementsEnum,
    extensions: ExtensionDbSchema.array().default([]),
    orderRelevant: z.nullish(z.boolean()),
    semanticIdListElement: z.nullish(ReferenceDbSchema),
    valueTypeListElement: z.nullish(ValueTypeDbSchema),
    value: SubmodelBaseUnionDbSchema.array().default([]),
  });
};
