import type { PassportTemplatePublication } from "../../domain/passport-template-publication";
import { z } from "zod";
import { Sector } from "../../../data-modelling/domain/sectors";

export const PassportTemplatePublicationSchema = z.object({
  id: z.uuid(),
  version: z.string(),
  name: z.string(),
  description: z.string(),
  sectors: z.enum(Sector).array(),
  website: z.string().nullable().default(null),
  organizationName: z.string(),
  templateData: z.record(z.string(), z.unknown()),
  ownedByOrganizationId: z.uuid(),
  createdByUserId: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type PassportTemplatePublicationDto = z.infer<
    typeof PassportTemplatePublicationSchema
>;

export function passportTemplatePublicationToDto(
  passportTemplatePublication: PassportTemplatePublication,
): PassportTemplatePublicationDto {
  return PassportTemplatePublicationSchema.parse({
    id: passportTemplatePublication.id,
    ownedByOrganizationId: passportTemplatePublication.ownedByOrganizationId,
    createdByUserId: passportTemplatePublication.createdByUserId,
    version: passportTemplatePublication.version,
    name: passportTemplatePublication.name,
    description: passportTemplatePublication.description,
    sectors: passportTemplatePublication.sectors,
    website: passportTemplatePublication.website,
    contactEmail: passportTemplatePublication.contactEmail,
    organizationName: passportTemplatePublication.organizationName,
    templateData: passportTemplatePublication.templateData,
    createdAt: passportTemplatePublication.createdAt
      ? passportTemplatePublication.createdAt.toISOString()
      : null,
    updatedAt: passportTemplatePublication.updatedAt
      ? passportTemplatePublication.updatedAt.toISOString()
      : null,
  });
}
