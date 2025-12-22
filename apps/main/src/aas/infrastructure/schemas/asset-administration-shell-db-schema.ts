import { z } from "zod";
import { AdministrativeInformationDbSchema } from "./administrative-information-db-schema";
import { AssetInformationDbSchema } from "./asset-information-db-schema";
import { LanguageTextDbSchema } from "./common/language-text-db-schema";
import { ReferenceDbSchema } from "./common/reference-db-schema";
import { EmbeddedDataSpecificationDbSchema } from "./embedded-data-specification-db-schema";
import { ExtensionDbSchema } from "./extension-db-schema";
import { ResourceDbSchema } from "./resource-db-schema";

export const AssetAdministrationShellDbSchema = z.object({
  id: z.string().meta({ description: "Id of the AAS" }),
  assetInformation: AssetInformationDbSchema,
  extensions: ExtensionDbSchema.array().default([]),
  category: z.nullish(z.string()),
  idShort: z.nullish(z.string()),
  displayName: LanguageTextDbSchema.array().default([]),
  description: LanguageTextDbSchema.array().default([]),
  administration: z.nullish(AdministrativeInformationDbSchema),
  embeddedDataSpecifications: EmbeddedDataSpecificationDbSchema.array().default([]),
  derivedFrom: z.nullish(ResourceDbSchema),
  submodels: ReferenceDbSchema.array().default([]),
});
