import { z } from 'zod';
import {
  SectionBaseDtoSchema,
  sectionToDto,
} from '../../../data-modelling/presentation/dto/section-base.dto';
import { TemplateDraft } from '../../domain/template-draft';
import { Sector } from '@open-dpp/api-client';

const PublicationDtoSchema = z.object({
  id: z.string(),
  version: z.string(),
});

const TemplateDraftDtoSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  description: z.string(),
  sectors: z.enum(Sector).array(),
  version: z.string().min(1),
  publications: PublicationDtoSchema.array(),
  sections: SectionBaseDtoSchema.array(),
  createdByUserId: z.uuid(),
  ownedByOrganizationId: z.uuid(),
});

export type TemplateDraftDto = z.infer<typeof TemplateDraftDtoSchema>;

export function templateDraftToDto(
  templateDraft: TemplateDraft,
): TemplateDraftDto {
  return TemplateDraftDtoSchema.parse({
    id: templateDraft.id,
    name: templateDraft.name,
    description: templateDraft.description,
    sectors: templateDraft.sectors,
    version: templateDraft.version,
    publications: templateDraft.publications.map((publication) =>
      PublicationDtoSchema.parse({
        id: publication.id,
        version: publication.version,
      }),
    ),
    sections: templateDraft.sections.map((section) => sectionToDto(section)),
    createdByUserId: templateDraft.createdByUserId,
    ownedByOrganizationId: templateDraft.ownedByOrganizationId,
  });
}
