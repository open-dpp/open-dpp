import type { Model as MongooseModel } from "mongoose";
import type { UniqueProductIdentifier } from "../../unique-product-identifier/domain/unique.product.identifier";
import type { UniqueProductIdentifierService } from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { Item } from "../domain/item";
import { ItemDoc, ItemDocSchemaVersion } from "./item.schema";
import { migrateItemDoc } from "./migrations";

@Injectable()
export class ItemsService {
  private itemDoc: MongooseModel<ItemDoc>;
  private uniqueProductIdentifierService: UniqueProductIdentifierService;

  constructor(
    @InjectModel(ItemDoc.name)
    itemDoc: MongooseModel<ItemDoc>,
    uniqueProductIdentifierService: UniqueProductIdentifierService,
  ) {
    this.itemDoc = itemDoc;
    this.uniqueProductIdentifierService = uniqueProductIdentifierService;
  }

  convertToDomain(
    itemDoc: ItemDoc,
    uniqueProductIdentifiers: UniqueProductIdentifier[],
  ) {
    migrateItemDoc(itemDoc);
    return Item.loadFromDb({
      id: itemDoc.id,
      uniqueProductIdentifiers,
      organizationId: itemDoc.ownedByOrganizationId,
      userId: itemDoc.createdByUserId,
      modelId: itemDoc.modelId,
      dataValues: itemDoc.dataValues
        ? itemDoc.dataValues.map(dv => ({
            value: dv.value ?? undefined,
            dataSectionId: dv.dataSectionId,
            dataFieldId: dv.dataFieldId,
            row: dv.row,
          }))
        : [],
      templateId: itemDoc.templateId,
    });
  }

  async save(item: Item) {
    const itemEntity = await this.itemDoc.findOneAndUpdate(
      { _id: item.id },
      {
        $set: {
          _schemaVersion: ItemDocSchemaVersion.v1_0_2,
          modelId: item.modelId,
          templateId: item.templateId,
          ownedByOrganizationId: item.ownedByOrganizationId,
          createdByUserId: item.createdByUserId,
          dataValues: item.dataValues.map(d => ({
            value: d.value,
            dataSectionId: d.dataSectionId,
            dataFieldId: d.dataFieldId,
            row: d.row,
          })),
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
    for (const uniqueProductIdentifier of item.uniqueProductIdentifiers) {
      await this.uniqueProductIdentifierService.save(uniqueProductIdentifier);
    }
    return this.convertToDomain(itemEntity, item.uniqueProductIdentifiers);
  }

  async findOneOrFail(id: string): Promise<Item> {
    const item = await this.findOne(id);
    if (!item) {
      throw new NotFoundInDatabaseException(Item.name);
    }
    return item;
  }

  async findOne(id: string): Promise<Item | undefined> {
    const itemDoc = await this.itemDoc.findById(id);
    if (!itemDoc) {
      return undefined;
    }
    return this.convertToDomain(
      itemDoc,
      await this.uniqueProductIdentifierService.findAllByReferencedId(
        itemDoc.id,
      ),
    );
  }

  async findAllByModel(modelId: string) {
    const itemDocs = await this.itemDoc.find({
      modelId,
    });
    return await Promise.all(
      itemDocs.map(async idocs =>
        this.convertToDomain(
          idocs,
          await this.uniqueProductIdentifierService.findAllByReferencedId(
            idocs.id,
          ),
        ),
      ),
    );
  }
}
