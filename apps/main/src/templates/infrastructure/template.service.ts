import { Injectable } from '@nestjs/common';
import { Template } from '../domain/template';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TemplateDoc } from './template.schema';
import {
  deserializeTemplate,
  serializeTemplate,
} from '../domain/serialization';
import { NotFoundInDatabaseException } from '@app/exception/service.exceptions';

@Injectable()
export class TemplateService {
  constructor(
    @InjectModel(TemplateDoc.name)
    private templateDoc: Model<TemplateDoc>,
  ) {}

  convertToDomain(templateDoc: TemplateDoc): Template {
    const plain = templateDoc.toObject();
    return deserializeTemplate(plain);
  }

  async save(template: Template) {
    const { _id, ...rest } = serializeTemplate(template);
    const dataModelDoc = await this.templateDoc.findOneAndUpdate(
      { _id },
      rest,
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if none found
        runValidators: true,
      },
    );

    return this.convertToDomain(dataModelDoc);
  }

  async findByName(name: string) {
    const foundDataModelDocs = await this.templateDoc
      .find({ name: name }, '_id name version')
      .sort({ name: 1 })
      .exec();
    return foundDataModelDocs.map((dm) => ({
      id: dm._id,
      name: dm.name,
      version: dm.version,
    }));
  }

  async findByMarketplaceResource(
    organizationId: string,
    marketplaceResourceId: string,
  ) {
    const foundDataModelDoc = await this.templateDoc
      .findOne({
        ownedByOrganizationId: organizationId,
        marketplaceResourceId,
      })
      .exec();
    if (!foundDataModelDoc) {
      return undefined;
    }
    return this.convertToDomain(foundDataModelDoc);
  }

  async findAllByOrganization(organizationId: string) {
    const foundDataModelDocs = await this.templateDoc
      .find(
        {
          $or: [{ ownedByOrganizationId: organizationId }],
        },
        '_id name version description sectors',
      )
      .sort({ name: 1 })
      .exec();
    return foundDataModelDocs.map((dm) => ({
      id: dm._id,
      name: dm.name,
      version: dm.version,
      description: dm.description,
      sectors: dm.sectors,
    }));
  }

  async findOneOrFail(id: string) {
    const productEntity = await this.templateDoc.findById(id);
    if (!productEntity) {
      throw new NotFoundInDatabaseException(Template.name);
    }
    return this.convertToDomain(productEntity);
  }
}
