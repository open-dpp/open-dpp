import type { Model } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { NotFoundInDatabaseException } from '@open-dpp/exception'
import { AiConfiguration } from '../domain/ai-configuration'
import { AiConfigurationDoc } from './ai-configuration.schema'

@Injectable()
export class AiConfigurationService {
  private aiConfigurationDoc: Model<AiConfigurationDoc>

  constructor(
    @InjectModel(AiConfigurationDoc.name)
    aiConfigurationDoc: Model<AiConfigurationDoc>,
  ) {
    this.aiConfigurationDoc = aiConfigurationDoc
  }

  convertToDomain(aiConfigurationDoc: AiConfigurationDoc): AiConfiguration {
    return AiConfiguration.loadFromDb({
      id: aiConfigurationDoc._id,
      ownedByOrganizationId: aiConfigurationDoc.ownedByOrganizationId,
      createdByUserId: aiConfigurationDoc.createdByUserId,
      createdAt: aiConfigurationDoc.createdAt,
      provider: aiConfigurationDoc.provider,
      model: aiConfigurationDoc.aiModel,
      updatedAt: new Date(Date.now()),
      isEnabled: aiConfigurationDoc.isEnabled,
    })
  }

  async save(aiConfiguration: AiConfiguration) {
    const dataModelDoc = await this.aiConfigurationDoc.findOneAndUpdate(
      { _id: aiConfiguration.id },
      {
        $set: {
          ownedByOrganizationId: aiConfiguration.ownedByOrganizationId,
          createdByUserId: aiConfiguration.createdByUserId,
          provider: aiConfiguration.provider,
          aiModel: aiConfiguration.model,
          updatedAt: new Date(Date.now()),
          isEnabled: aiConfiguration.isEnabled,
        },
        $setOnInsert: {
          createdAt: aiConfiguration.createdAt ?? new Date(Date.now()),
        },
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if none found
        runValidators: true,
      },
    )

    return this.convertToDomain(dataModelDoc)
  }

  async findOneOrFail(id: string) {
    const aiConfigurationDocument = await this.aiConfigurationDoc.findById(id)
    if (!aiConfigurationDocument) {
      throw new NotFoundInDatabaseException(AiConfiguration.name)
    }
    return this.convertToDomain(aiConfigurationDocument)
  }

  async findOneByOrganizationIdOrFail(id: string) {
    const aiConfiguration = await this.findOneByOrganizationId(id)
    if (!aiConfiguration) {
      throw new NotFoundInDatabaseException(AiConfiguration.name)
    }
    return aiConfiguration
  }

  async findOneByOrganizationId(
    id: string,
  ): Promise<AiConfiguration | undefined> {
    const aiConfigurationDocument = await this.aiConfigurationDoc.findOne({
      ownedByOrganizationId: id,
    })
    return aiConfigurationDocument
      ? this.convertToDomain(aiConfigurationDocument)
      : undefined
  }
}
