import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassportTemplateDoc } from './passport-template.schema';
import { PassportTemplate } from '../domain/passport-template';
import { NotFoundInDatabaseException } from '@app/exception/service.exceptions';

@Injectable()
export class PassportTemplateService {
  constructor(
    @InjectModel(PassportTemplateDoc.name)
    private passportTemplateDoc: Model<PassportTemplateDoc>,
  ) {}

  convertToDomain(passportTemplateDoc: PassportTemplateDoc): PassportTemplate {
    return PassportTemplate.loadFromDb({
      id: passportTemplateDoc._id,
      ownedByOrganizationId: passportTemplateDoc.ownedByOrganizationId,
      createdByUserId: passportTemplateDoc.createdByUserId,
      version: passportTemplateDoc.version,
      name: passportTemplateDoc.name,
      description: passportTemplateDoc.description,
      isOfficial: passportTemplateDoc.isOfficial,
      sectors: passportTemplateDoc.sectors,
      website: passportTemplateDoc.website ?? null,
      contactEmail: passportTemplateDoc.contactEmail,
      organizationName: passportTemplateDoc.organizationName,
      templateData: passportTemplateDoc.templateData,
      createdAt: passportTemplateDoc.createdAt,
      updatedAt: passportTemplateDoc.updatedAt,
    });
  }

  async save(passportTemplate: PassportTemplate) {
    const dataModelDoc = await this.passportTemplateDoc.findOneAndUpdate(
      { _id: passportTemplate.id },
      {
        version: passportTemplate.version,
        ownedByOrganizationId: passportTemplate.ownedByOrganizationId,
        createdByUserId: passportTemplate.createdByUserId,
        name: passportTemplate.name,
        description: passportTemplate.description,
        isOfficial: passportTemplate.isOfficial,
        sectors: passportTemplate.sectors,
        website: passportTemplate.website,
        contactEmail: passportTemplate.contactEmail,
        organizationName: passportTemplate.organizationName,
        templateData: passportTemplate.templateData,
        createdAt: passportTemplate.createdAt,
        updatedAt: new Date(Date.now()),
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if none found
        runValidators: true,
      },
    );

    return this.convertToDomain(dataModelDoc);
  }

  async findOneOrFail(id: string) {
    const passportTemplateDocument =
      await this.passportTemplateDoc.findById(id);
    if (!passportTemplateDocument) {
      throw new NotFoundInDatabaseException(PassportTemplate.name);
    }
    return this.convertToDomain(passportTemplateDocument);
  }

  async findAll() {
    const passportTemplateDocuments = await this.passportTemplateDoc.find();
    return passportTemplateDocuments.map((passportTemplateDocument) =>
      this.convertToDomain(passportTemplateDocument),
    );
  }
}
