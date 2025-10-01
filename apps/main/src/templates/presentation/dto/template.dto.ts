import { z } from 'zod';
import {
  SectionBaseDtoSchema,
  sectionToDto,
} from '../../../data-modelling/presentation/dto/section-base.dto';
import { Template } from '../../domain/template';

import { Sector } from '../../../data-modelling/domain/sectors';

const TemplateDtoSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  description: z.string(),
  sectors: z.enum(Sector).array(),
  version: z.string().min(1),
  sections: SectionBaseDtoSchema.array(),
  createdByUserId: z.uuid(),
  ownedByOrganizationId: z.uuid(),
  marketplaceResourceId: z.string().nullable(),
});

export type TemplateDto = z.infer<typeof TemplateDtoSchema>;

export function templateToDto(template: Template): TemplateDto {
  return TemplateDtoSchema.parse({
    id: template.id,
    name: template.name,
    description: template.description,
    sectors: template.sectors,
    version: template.version,
    sections: template.sections.map((section) => sectionToDto(section)),
    createdByUserId: template.createdByUserId,
    ownedByOrganizationId: template.ownedByOrganizationId,
    marketplaceResourceId: template.marketplaceResourceId,
  });
}

export const templateParamDocumentation = {
  name: 'templateId',
  description: 'The id of the template.',
  required: true,
  type: 'string',
  format: 'uuid',
};
