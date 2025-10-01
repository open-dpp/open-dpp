import { PassportTemplate } from '../../domain/passport-template';
import { z } from 'zod';
import { Sector } from '../../../data-modelling/domain/sectors';

export const PassportTemplateCreateSchema = z.object({
  version: z.string(),
  name: z.string(),
  description: z.string(),
  sectors: z.enum(Sector).array(),
  website: z.string().nullable().default(null),
  organizationName: z.string(),
  templateData: z.record(z.string(), z.unknown()),
});

export type PassportTemplateCreateDto = z.infer<
  typeof PassportTemplateCreateSchema
>;

export const PassportTemplateSchema = PassportTemplateCreateSchema.extend({
  id: z.uuid(),
  ownedByOrganizationId: z.uuid(),
  createdByUserId: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type PassportTemplateDto = z.infer<typeof PassportTemplateSchema>;

export function passportTemplateToDto(
  passportTemplate: PassportTemplate,
): PassportTemplateDto {
  return PassportTemplateSchema.parse({
    id: passportTemplate.id,
    ownedByOrganizationId: passportTemplate.ownedByOrganizationId,
    createdByUserId: passportTemplate.createdByUserId,
    version: passportTemplate.version,
    name: passportTemplate.name,
    description: passportTemplate.description,
    sectors: passportTemplate.sectors,
    website: passportTemplate.website,
    contactEmail: passportTemplate.contactEmail,
    organizationName: passportTemplate.organizationName,
    templateData: passportTemplate.templateData,
    createdAt: passportTemplate.createdAt
      ? passportTemplate.createdAt.toISOString()
      : null,
    updatedAt: passportTemplate.updatedAt
      ? passportTemplate.updatedAt.toISOString()
      : null,
  });
}
