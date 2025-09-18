import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model as MongooseModel } from 'mongoose';
import {
  AasConnectionDoc,
  AasConnectionDocSchemaVersion,
} from './aas-connection.schema';
import { AasConnection, AasFieldAssignment } from '../domain/aas-connection';
import { NotFoundInDatabaseException } from '@app/exception/service.exceptions';

@Injectable()
export class AasConnectionService {
  constructor(
    @InjectModel(AasConnectionDoc.name)
    private aasConnectionDoc: MongooseModel<AasConnectionDoc>,
  ) {}

  convertToDomain(aasConnectionDoc: AasConnectionDoc) {
    return AasConnection.loadFromDb({
      id: aasConnectionDoc._id,
      dataModelId: aasConnectionDoc.dataModelId,
      aasType: aasConnectionDoc.aasType,
      modelId: aasConnectionDoc.modelId,
      organizationId: aasConnectionDoc.ownedByOrganizationId,
      userId: aasConnectionDoc.createdByUserId,
      name: aasConnectionDoc.name,
      fieldAssignments: aasConnectionDoc.fieldAssignments.map((fieldMapping) =>
        AasFieldAssignment.create({
          sectionId: fieldMapping.sectionId,
          dataFieldId: fieldMapping.dataFieldId,
          idShortParent: fieldMapping.idShortParent,
          idShort: fieldMapping.idShort,
        }),
      ),
    });
  }

  async save(aasConnection: AasConnection) {
    const aasMappingDoc = await this.aasConnectionDoc.findOneAndUpdate(
      { _id: aasConnection.id },
      {
        _schemaVersion: AasConnectionDocSchemaVersion.v1_0_0,
        name: aasConnection.name,
        dataModelId: aasConnection.dataModelId,
        aasType: aasConnection.aasType,
        modelId: aasConnection.modelId,
        ownedByOrganizationId: aasConnection.ownedByOrganizationId,
        createdByUserId: aasConnection.createdByUserId,
        fieldAssignments: aasConnection.fieldAssignments.map(
          (fieldMapping) => ({
            dataFieldId: fieldMapping.dataFieldId,
            sectionId: fieldMapping.sectionId,
            idShortParent: fieldMapping.idShortParent,
            idShort: fieldMapping.idShort,
          }),
        ),
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if none found
        runValidators: true,
      },
    );

    return this.convertToDomain(aasMappingDoc);
  }

  async findById(id: string) {
    const aasMappingDoc = await this.aasConnectionDoc.findById(id);
    if (!aasMappingDoc) {
      throw new NotFoundInDatabaseException(AasConnection.name);
    }
    return this.convertToDomain(aasMappingDoc);
  }

  async findAllByOrganization(organizationId: string) {
    const aasConnectionDocs = await this.aasConnectionDoc
      .find({
        ownedByOrganizationId: organizationId,
      })
      .sort({ name: 1 })
      .exec();
    return aasConnectionDocs.map((aasConnectionDoc) =>
      this.convertToDomain(aasConnectionDoc),
    );
  }
}
