import type { Model as MongooseModel } from 'mongoose'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { NotFoundInDatabaseException } from '@open-dpp/exception'
import { ModelDocSchemaVersion } from '../../models/infrastructure/model.schema'
import { UniqueProductIdentifier } from '../domain/unique.product.identifier'
import { UniqueProductIdentifierDoc } from './unique-product-identifier.schema'

@Injectable()
export class UniqueProductIdentifierService {
  constructor(
    @InjectModel(UniqueProductIdentifierDoc.name)
    private uniqueProductIdentifierDoc: MongooseModel<UniqueProductIdentifierDoc>,
  ) {}

  convertToDomain(uniqueProductIdentifierDoc: UniqueProductIdentifierDoc) {
    return UniqueProductIdentifier.loadFromDb({
      uuid: uniqueProductIdentifierDoc._id.toString(),
      referenceId: uniqueProductIdentifierDoc.referenceId,
    })
  }

  async save(uniqueProductIdentifier: UniqueProductIdentifier) {
    return this.convertToDomain(
      await this.uniqueProductIdentifierDoc.findOneAndUpdate(
        { _id: uniqueProductIdentifier.uuid },
        {
          _schemaVersion: ModelDocSchemaVersion.v1_0_0,
          referenceId: uniqueProductIdentifier.referenceId,
        },
        {
          new: true, // Return the updated document
          upsert: true, // Create a new document if none found
          runValidators: true,
        },
      ),
    )
  }

  async findOne(uuid: string) {
    const uniqueProductIdentifierDoc
      = await this.uniqueProductIdentifierDoc.findById(uuid)
    if (!uniqueProductIdentifierDoc) {
      return undefined
    }
    return this.convertToDomain(uniqueProductIdentifierDoc)
  }

  async findOneOrFail(uuid: string) {
    const uniqueProductIdentifier = await this.findOne(uuid)
    if (!uniqueProductIdentifier) {
      throw new NotFoundInDatabaseException(UniqueProductIdentifier.name)
    }
    return uniqueProductIdentifier
  }

  async findAllByReferencedId(referenceId: string) {
    const uniqueProductIdentifiers = await this.uniqueProductIdentifierDoc.find(
      { referenceId },
    )
    return uniqueProductIdentifiers.map(permalink =>
      this.convertToDomain(permalink),
    )
  }
}
