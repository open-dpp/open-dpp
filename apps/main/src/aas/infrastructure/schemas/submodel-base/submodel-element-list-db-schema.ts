import { AasSubmodelElementsEnum } from "@open-dpp/dto";
import { z } from "zod";
import { ValueTypeDbSchema } from "../common/basic-db-schema";
import { ReferenceDbSchema } from "../common/reference-db-schema";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";
import { SubmodelElementDbSchema } from "./submodel-element-db-schema";

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
    valueTypeListElement: ValueTypeDbSchema.nullish(),
    value: SubmodelElementDbSchema.array().default([]),
  });
};
