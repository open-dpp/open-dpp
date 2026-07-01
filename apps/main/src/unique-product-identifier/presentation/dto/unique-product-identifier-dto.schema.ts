import { z } from "zod";
import {
  CreateGs1UniqueProductIdentifierRequestSchema,
  ExternalIdentifierType,
  ExternalIdentifierTypeSchema,
  type ExternalIdentifierTypeValue,
  UniqueProductIdentifierListItemDtoSchema,
  UpdateGs1UniqueProductIdentifierRequestSchema,
} from "@open-dpp/dto";

// Re-export shared schemas from @open-dpp/dto (single source of truth).
export {
  CreateGs1UniqueProductIdentifierRequestSchema,
  ExternalIdentifierType,
  ExternalIdentifierTypeSchema,
  type ExternalIdentifierTypeValue,
  UniqueProductIdentifierListItemDtoSchema,
  UpdateGs1UniqueProductIdentifierRequestSchema,
};

export const UniqueProductIdentifierDtoSchema = z.object({
  uuid: z.string(),
  referenceId: z.uuid(),
  type: ExternalIdentifierTypeSchema.default(ExternalIdentifierType.OPEN_DPP_UUID),
  /** GS1 identity GTIN (normalized to GTIN-14); null for non-GS1 identifiers. */
  gtin: z.string().nullish(),
});

export const UniqueProductIdentifierListDtoSchema = z.array(UniqueProductIdentifierDtoSchema);

export const UniqueProductIdentifierMetadataDtoSchema = z.object({
  passportId: z.uuid(),
  organizationId: z.string(),
  templateId: z.uuid().nullish(),
});
