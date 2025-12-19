import { ModellingKindEnum } from "@open-dpp/dto";
import { z } from "zod";
import { AdministrativeInformationDbSchema } from "../administrative-information-db-schema";
import { ExtensionDbSchema } from "../extension-db-schema";
import { SubmodelBaseDbSchema } from "./submodel-base-db-schema";
import { SubmodelElementDbSchema } from "./submodel-element-db-schema";

export const SubmodelDbSchema = z.object({
  ...SubmodelBaseDbSchema.shape,
  id: z.string(),
  extensions: ExtensionDbSchema.array().default([]),
  administration: z.nullish(AdministrativeInformationDbSchema),
  kind: ModellingKindEnum.nullish(),
  submodelElements: SubmodelElementDbSchema.array().default([]),
});
