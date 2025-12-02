import { z } from "zod";
import { AasSubmodelElementsEnum } from "../../submodel-base/aas-submodel-elements";
import { nullishToOptional, ValueTypeSchema } from "../common/basic-json-schema";
import { ReferenceJsonSchema } from "../common/reference-json-schema";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";
import { SubmodelBaseUnionSchema } from "./submodel-base-union-schema";

export const SubmodelElementListJsonSchema = z.lazy(() =>
  SubmodelElementListJsonSchemaImpl(),
);

export function SubmodelElementListJsonSchemaImpl() {
  return z.object({
    ...SubmodelBaseJsonSchema.shape,
    typeValueListElement: AasSubmodelElementsEnum,
    extensions: ExtensionJsonSchema.array().default([]),
    orderRelevant: nullishToOptional(z.boolean()),
    semanticIdListElement: nullishToOptional(ReferenceJsonSchema),
    valueTypeListElement: nullishToOptional(ValueTypeSchema),
    value: SubmodelBaseUnionSchema.array().default([]),
  });
};
