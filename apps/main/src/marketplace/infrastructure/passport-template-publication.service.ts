import type { Model } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { PassportTemplatePublication } from "../domain/passport-template-publication";
import { PassportTemplatePublicationDoc } from "./passport-template-publication.schema";

@Injectable()
export class PassportTemplatePublicationService {
  constructor(
    @InjectModel(PassportTemplatePublicationDoc.name)
    private passportTemplatePublicationDoc: Model<PassportTemplatePublicationDoc>,
  ) {}

  convertToDomain(
    passportTemplatePublicationDoc: PassportTemplatePublicationDoc,
  ): PassportTemplatePublication {
    return PassportTemplatePublication.loadFromDb({
      id: passportTemplatePublicationDoc._id,
      ownedByOrganizationId:
            passportTemplatePublicationDoc.ownedByOrganizationId,
      createdByUserId: passportTemplatePublicationDoc.createdByUserId,
      version: passportTemplatePublicationDoc.version,
      name: passportTemplatePublicationDoc.name,
      description: passportTemplatePublicationDoc.description,
      isOfficial: passportTemplatePublicationDoc.isOfficial,
      sectors: passportTemplatePublicationDoc.sectors,
      website: passportTemplatePublicationDoc.website ?? null,
      contactEmail: passportTemplatePublicationDoc.contactEmail,
      organizationName: passportTemplatePublicationDoc.organizationName,
      templateData: passportTemplatePublicationDoc.templateData,
      createdAt: passportTemplatePublicationDoc.createdAt,
      updatedAt: passportTemplatePublicationDoc.updatedAt,
    });
  }

  async save(passportTemplate: PassportTemplatePublication) {
    const dataModelDoc
      = await this.passportTemplatePublicationDoc.findOneAndUpdate(
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
    const passportTemplateDocument
      = await this.passportTemplatePublicationDoc.findById(id);
    if (!passportTemplateDocument) {
      throw new NotFoundInDatabaseException(PassportTemplatePublication.name);
    }
    return this.convertToDomain(passportTemplateDocument);
  }

  async findAll() {
    const passportTemplateDocuments
      = await this.passportTemplatePublicationDoc.find();
    return passportTemplateDocuments.map(passportTemplateDocument =>
      this.convertToDomain(passportTemplateDocument),
    );
  }
}
