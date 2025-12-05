import { z } from "zod";
import { ModellingKindEnum } from "../../common/has-kind";
import { AdministrativeInformationJsonSchema } from "../administrative-information-json-schema";
import { nullishToOptional } from "../common/basic-json-schema";
import { ExtensionJsonSchema } from "../extension-json-schema";
import { SubmodelBaseJsonSchema } from "./submodel-base-json-schema";
import { SubmodelBaseUnionSchema } from "./submodel-base-union-schema";

export const SubmodelJsonSchema = z.object({
  ...SubmodelBaseJsonSchema.shape,
  id: z.string(),
  extensions: ExtensionJsonSchema.array().default([]),
  administration: nullishToOptional(AdministrativeInformationJsonSchema),
  kind: nullishToOptional(ModellingKindEnum),
  submodelElements: SubmodelBaseUnionSchema.array().default([]),
});
