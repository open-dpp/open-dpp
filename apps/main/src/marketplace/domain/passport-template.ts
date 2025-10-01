import { randomUUID } from 'crypto';
import { Sector } from '../../data-modelling/domain/sectors';

type JsonObject = Record<string, unknown>;

type PassportTemplateCreationProps = {
  ownedByOrganizationId: string;
  createdByUserId: string;
  version: string;
  name: string;
  description: string;
  isOfficial: boolean;
  sectors: Sector[];
  website: string | null;
  contactEmail: string;
  organizationName: string;
  templateData: JsonObject;
};
export type PassportTemplateProps = PassportTemplateCreationProps & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export class PassportTemplate {
  private constructor(
    public readonly id: string,
    public readonly ownedByOrganizationId: string,
    public readonly createdByUserId: string,
    public readonly version: string,
    public readonly name: string,
    public readonly description: string,
    public readonly isOfficial: boolean,
    public readonly sectors: Sector[],
    public readonly website: string | null,
    public readonly contactEmail: string,
    public readonly organizationName: string,
    public readonly templateData: JsonObject,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static create(data: PassportTemplateCreationProps): PassportTemplate {
    const now = new Date(Date.now());
    return new PassportTemplate(
      randomUUID(),
      data.ownedByOrganizationId,
      data.createdByUserId,
      data.version,
      data.name,
      data.description,
      data.isOfficial,
      data.sectors,
      data.website,
      data.contactEmail,
      data.organizationName,
      data.templateData,
      now,
      now,
    );
  }

  static loadFromDb(data: PassportTemplateProps): PassportTemplate {
    return new PassportTemplate(
      data.id,
      data.ownedByOrganizationId,
      data.createdByUserId,
      data.version,
      data.name,
      data.description,
      data.isOfficial,
      data.sectors,
      data.website,
      data.contactEmail,
      data.organizationName,
      data.templateData,
      data.createdAt,
      data.updatedAt,
    );
  }
}
