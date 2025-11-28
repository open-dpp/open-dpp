import { z } from "zod";
import { AdministrativeInformationJsonSchema } from "./administrative-information-json-schema";
import { AssetInformationJsonSchema } from "./asset-information-json-schema";
import { nullishToOptional } from "./common/basic-json-schema";
import { LanguageTextJsonSchema } from "./common/language-text-json-schema";
import { ReferenceJsonSchema } from "./common/reference-json-schema";
import { EmbeddedDataSpecificationJsonSchema } from "./embedded-data-specification-json-schema";
import { ExtensionJsonSchema } from "./extension-json-schema";
import { ResourceJsonSchema } from "./resource-json-schema";

export const AssetAdministrationShellJsonSchema = z.object({
  id: z.string(),
  assetInformation: AssetInformationJsonSchema,
  extensions: ExtensionJsonSchema.array().default([]),
  category: nullishToOptional(z.string()),
  idShort: nullishToOptional(z.string()),
  displayName: LanguageTextJsonSchema.array().default([]),
  description: LanguageTextJsonSchema.array().default([]),
  administration: nullishToOptional(AdministrativeInformationJsonSchema),
  embeddedDataSpecifications: EmbeddedDataSpecificationJsonSchema.array().default([]),
  derivedFrom: nullishToOptional(ResourceJsonSchema),
  submodels: ReferenceJsonSchema.array().default([]),
});
