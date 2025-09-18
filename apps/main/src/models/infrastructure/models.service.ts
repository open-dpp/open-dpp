import { Injectable } from '@nestjs/common';
import { UniqueProductIdentifier } from '../../unique-product-identifier/domain/unique.product.identifier';
import { InjectModel } from '@nestjs/mongoose';
import { ModelDoc, ModelDocSchemaVersion } from './model.schema';
import { Model as MongooseModel } from 'mongoose';
import { Model } from '../domain/model';
import { UniqueProductIdentifierService } from '../../unique-product-identifier/infrastructure/unique-product-identifier.service';
import { migrateModelDoc } from './migrations';
import { NotFoundInDatabaseException } from '@app/exception/service.exceptions';

@Injectable()
export class ModelsService {
  constructor(
    @InjectModel(ModelDoc.name)
    private modelDoc: MongooseModel<ModelDoc>,
    private uniqueProductIdentifierService: UniqueProductIdentifierService,
  ) {}

  convertToDomain(
    modelDoc: ModelDoc,
    uniqueProductIdentifiers: UniqueProductIdentifier[],
  ) {
    migrateModelDoc(modelDoc);
    return Model.loadFromDb({
      id: modelDoc._id,
      name: modelDoc.name,
      organizationId: modelDoc.ownedByOrganizationId,
      userId: modelDoc.createdByUserId,
      uniqueProductIdentifiers,
      templateId: modelDoc.templateId,
      dataValues: modelDoc.dataValues
        ? modelDoc.dataValues.map((dv) => ({
            value: dv.value ?? undefined,
            dataSectionId: dv.dataSectionId,
            dataFieldId: dv.dataFieldId,
            row: dv.row,
          }))
        : [],
      description: modelDoc.description ?? undefined,
    });
  }

  async save(model: Model) {
    const dataModelDoc = await this.modelDoc.findOneAndUpdate(
      { _id: model.id },
      {
        $set: {
          _schemaVersion: ModelDocSchemaVersion.v1_0_1,
          name: model.name,
          description: model.description,
          templateId: model.templateId,
          dataValues: model.dataValues.map((d) => ({
            value: d.value,
            dataSectionId: d.dataSectionId,
            dataFieldId: d.dataFieldId,
            row: d.row,
          })),
          createdByUserId: model.createdByUserId,
          ownedByOrganizationId: model.ownedByOrganizationId,
        },
        $unset: {
          productDataModelId: 1,
        },
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if none found
        runValidators: true,
      },
    );

    for (const uniqueProductIdentifier of model.uniqueProductIdentifiers) {
      await this.uniqueProductIdentifierService.save(uniqueProductIdentifier);
    }
    return this.convertToDomain(dataModelDoc, model.uniqueProductIdentifiers);
  }

  async findAllByOrganization(organizationId: string) {
    const modelDocs = await this.modelDoc
      .find({ ownedByOrganizationId: organizationId })
      .sort({ name: 1 })
      .exec();
    return await Promise.all(
      modelDocs.map(async (modelDoc: ModelDoc) => {
        return this.convertToDomain(
          modelDoc,
          await this.uniqueProductIdentifierService.findAllByReferencedId(
            modelDoc._id,
          ),
        );
      }),
    );
  }

  async findOneOrFail(id: string): Promise<Model> {
    const model = await this.findOne(id);
    if (!model) {
      throw new NotFoundInDatabaseException(Model.name);
    }
    return model;
  }

  async findOne(id: string): Promise<Model | undefined> {
    const modelDoc = await this.modelDoc.findById(id);
    if (!modelDoc) {
      return undefined;
    }
    return this.convertToDomain(
      modelDoc,
      await this.uniqueProductIdentifierService.findAllByReferencedId(
        modelDoc._id,
      ),
    );
  }
}
