import { z } from 'zod/v4';
import { AiConfiguration, AiProvider } from '../../domain/ai-configuration';

export const AiConfigurationUpsertDtoSchema = z.object({
  provider: z.enum(AiProvider),
  model: z.string(),
  isEnabled: z.boolean(),
});

export type AiConfigurationUpsertDto = z.infer<
  typeof AiConfigurationUpsertDtoSchema
>;

export const AiConfigurationDtoSchema = z.object({
  id: z.string(),
  ownedByOrganizationId: z.string(),
  createdByUserId: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  provider: z.enum(AiProvider),
  model: z.string(),
  isEnabled: z.boolean(),
});

export type AiConfigurationDto = z.infer<typeof AiConfigurationDtoSchema>;

export function aiConfigurationToDto(
  aiConfiguration: AiConfiguration,
): AiConfigurationDto {
  return AiConfigurationDtoSchema.parse({
    id: aiConfiguration.id,
    ownedByOrganizationId: aiConfiguration.ownedByOrganizationId,
    createdByUserId: aiConfiguration.createdByUserId,
    createdAt: aiConfiguration.createdAt
      ? aiConfiguration.createdAt.toISOString()
      : null,
    updatedAt: aiConfiguration.updatedAt
      ? aiConfiguration.updatedAt.toISOString()
      : null,
    provider: aiConfiguration.provider,
    model: aiConfiguration.model,
    isEnabled: aiConfiguration.isEnabled,
  });
}
