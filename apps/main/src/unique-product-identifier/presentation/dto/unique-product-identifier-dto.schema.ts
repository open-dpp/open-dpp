import { z } from 'zod';
import { UniqueProductIdentifier } from '../../domain/unique.product.identifier';
import { GranularityLevel } from '../../../data-modelling/domain/granularity-level';

export const UniqueProductIdentifierDtoSchema = z.object({
  uuid: z.string(),
  referenceId: z.uuid(),
});

export const UniqueProductIdentifierReferenceDtoSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  modelId: z.uuid().optional(),
  granularityLevel: z.enum(GranularityLevel),
});

export const UniqueProductIdentifierMetadataDtoSchema = z.object({
  organizationId: z.string(),
});

export function uniqueProductIdentifierToDto(
  uniqueProductIdentifier: UniqueProductIdentifier,
) {
  return UniqueProductIdentifierDtoSchema.parse({
    uuid: uniqueProductIdentifier.uuid,
    referenceId: uniqueProductIdentifier.referenceId,
  });
}
