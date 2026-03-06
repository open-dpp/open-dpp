import type { UniqueProductIdentifier } from "../../domain/unique.product.identifier";
import { z } from "zod";
import { GranularityLevel } from "../../../data-modelling/domain/granularity-level";

export const UniqueProductIdentifierDtoSchema = z.object({
  uuid: z.string(),
  referenceId: z.uuid(),
});

export const UniqueProductIdentifierListDtoSchema = z.array(UniqueProductIdentifierDtoSchema);
export const UniqueProductIdentifierReferenceDtoSchema = z.object({
  id: z.uuid(),
  organizationId: z.string(),
  modelId: z.uuid().optional(),
  granularityLevel: z.enum(GranularityLevel),
});

export const UniqueProductIdentifierMetadataOldDtoSchema = z.object({
  passportId: z.uuid(),
  organizationId: z.string(),
  templateId: z.uuid(),
  modelId: z.uuid(),
});

export const UniqueProductIdentifierMetadataDtoSchema = z.object({
  passportId: z.uuid(),
  organizationId: z.string(),
  templateId: z.uuid().nullish(),
});

export function uniqueProductIdentifierToDto(
  uniqueProductIdentifier: UniqueProductIdentifier,
) {
  return UniqueProductIdentifierDtoSchema.parse({
    uuid: uniqueProductIdentifier.uuid,
    referenceId: uniqueProductIdentifier.referenceId,
  });
}
