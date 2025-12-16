import { z } from "zod";
import { AasSubmodelElementsEnum } from "../../submodel-base/aas-submodel-elements";
import { ValueTypeSchema } from "../common/basic-json-schema";
import { ReferenceJsonSchema } from "../common/reference-json-schema";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";
import { SubmodelElementSchema } from "./submodel-element-schema";

export const SubmodelElementListJsonSchema = z.lazy(() =>
  SubmodelElementListJsonSchemaImpl(),
);

export function SubmodelElementListJsonSchemaImpl() {
  return z.object({
    ...SubmodelBaseJsonSchema.shape,
    typeValueListElement: AasSubmodelElementsEnum,
    extensions: ExtensionJsonSchema.array().default([]),
    orderRelevant: z.nullish(z.boolean()),
    semanticIdListElement: z.nullish(ReferenceJsonSchema),
    valueTypeListElement: z.nullish(ValueTypeSchema),
    value: SubmodelElementSchema.array().default([]),
  });
};
