import { z } from "zod";
import { ModellingKindEnum } from "../../../domain/common/has-kind";
import { AdministrativeInformationDbSchema } from "../administrative-information-db-schema";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";
import { SubmodelBaseUnionDbSchema } from "./submodel-base-union-db-schema";

export const SubmodelDbSchema = z.object({
  ...SubmodelBaseDbSchema.shape,
  id: z.string(),
  extensions: ExtensionDbSchema.array().default([]),
  administration: z.nullish(AdministrativeInformationDbSchema),
  kind: z.nullish(ModellingKindEnum),
  submodelElements: SubmodelBaseUnionDbSchema.array().default([]),
});
