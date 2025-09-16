import { Test, TestingModule } from '@nestjs/testing';
import { Model } from '../../models/domain/model';
import { randomUUID } from 'crypto';
import { Item } from '../domain/item';
import { ItemsService } from './items.service';
import { NotFoundInDatabaseException } from '../../exceptions/service.exceptions';
import { UniqueProductIdentifier } from '../../unique-product-identifier/domain/unique.product.identifier';
import { TraceabilityEventsModule } from '../../traceability-events/traceability-events.module';
import { MongooseTestingModule } from '../../../test/mongo.testing.module';
import { userObj1 } from '../../../test/users-and-orgs';
import { AuthContext } from '../../auth/auth-request';
import { Connection, Model as MongooseModel } from 'mongoose';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { ItemDoc, ItemDocSchemaVersion, ItemSchema } from './item.schema';
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from '../../unique-product-identifier/infrastructure/unique-product-identifier.schema';
import { PermissionsModule } from '../../permissions/permissions.module';
import { OrganizationsService } from '../../organizations/infrastructure/organizations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from '../../organizations/infrastructure/organization.entity';
import { TypeOrmTestingModule } from '../../../test/typeorm.testing.module';
import { KeycloakResourcesService } from '../../keycloak-resources/infrastructure/keycloak-resources.service';
import { UsersService } from '../../users/infrastructure/users.service';
import { UserEntity } from '../../users/infrastructure/user.entity';
import { UniqueProductIdentifierService } from '../../unique-product-identifier/infrastructure/unique-product-identifier.service';
import { Template } from '../../templates/domain/template';
import { ignoreIds } from '../../../test/utils';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { DataValue } from '../../product-passport-data/domain/data-value';
import { SectionType } from '../../data-modelling/domain/section-base';
import { DataFieldType } from '../../data-modelling/domain/data-field-base';
import { Sector } from '@open-dpp/api-client';
import { templateCreatePropsFactory } from '../../templates/fixtures/template.factory';

describe('ItemsService', () => {
  let itemService: ItemsService;
  const userId = randomUUID();
  const organizationId = randomUUID();
  let mongoConnection: Connection;
  const authContext = new AuthContext();
  authContext.user = userObj1;
  let itemDoc: MongooseModel<ItemDoc>;
  const template = Template.create(templateCreatePropsFactory.build());
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseTestingModule,
        MongooseModule.forFeature([
          {
            name: ItemDoc.name,
            schema: ItemSchema,
          },
          {
            name: UniqueProductIdentifierDoc.name,
            schema: UniqueProductIdentifierSchema,
          },
        ]),
        PermissionsModule,
        TraceabilityEventsModule,
        TypeOrmTestingModule,
        TypeOrmModule.forFeature([OrganizationEntity, UserEntity]),
      ],
      providers: [
        ItemsService,
        UniqueProductIdentifierService,
        OrganizationsService,
        KeycloakResourcesService,
        UsersService,
      ],
    }).compile();
    itemService = module.get<ItemsService>(ItemsService);
    mongoConnection = module.get<Connection>(getConnectionToken());
    itemDoc = mongoConnection.model(ItemDoc.name, ItemSchema);
  });

  it('fails if requested item could not be found', async () => {
    await expect(itemService.findOneOrFail(randomUUID())).rejects.toThrow(
      new NotFoundInDatabaseException(Item.name),
    );
  });

  it('should create and find item for a model', async () => {
    const model = Model.create({
      name: 'name',
      userId: userId,
      organizationId,
      template,
    });

    const item = Item.create({
      userId: userId,
      organizationId: organizationId,
      template,
      model,
    });
    const savedItem = await itemService.save(item);
    expect(savedItem.modelId).toEqual(model.id);
    const foundItem = await itemService.findOneOrFail(item.id);
    expect(foundItem.modelId).toEqual(model.id);
  });

  it('should create an item with template', async () => {
    const template1 = Template.loadFromDb({
      marketplaceResourceId: null,
      id: randomUUID(),
      name: 'Laptop',
      description: 'My Laptop',
      sectors: [Sector.ELECTRONICS],
      version: '1.0',
      organizationId: organizationId,
      userId: userId,
      sections: [
        {
          type: SectionType.GROUP,
          id: randomUUID(),
          parentId: undefined,
          subSections: [],
          name: 'Section 1',
          dataFields: [
            {
              id: randomUUID(),
              type: DataFieldType.TEXT_FIELD,
              name: 'Title',
              options: { min: 2 },
              granularityLevel: GranularityLevel.ITEM,
            },
            {
              id: randomUUID(),
              type: DataFieldType.TEXT_FIELD,
              name: 'Title 2',
              options: { min: 7 },
              granularityLevel: GranularityLevel.ITEM,
            },
          ],
        },
        {
          type: SectionType.GROUP,
          id: randomUUID(),
          name: 'Section 2',
          parentId: undefined,
          subSections: [],
          dataFields: [
            {
              id: randomUUID(),
              type: DataFieldType.TEXT_FIELD,
              name: 'Title 3',
              options: { min: 8 },
              granularityLevel: GranularityLevel.ITEM,
            },
          ],
        },
        {
          type: SectionType.REPEATABLE,
          id: randomUUID(),
          parentId: undefined,
          subSections: [],
          name: 'Section 3',
          dataFields: [
            {
              id: randomUUID(),
              type: DataFieldType.TEXT_FIELD,
              name: 'Title 4',
              options: { min: 8 },
              granularityLevel: GranularityLevel.ITEM,
            },
          ],
        },
      ],
    });
    const model = Model.create({
      name: 'name',
      userId: userId,
      organizationId: organizationId,
      template: template1,
    });
    const item = Item.create({
      userId: userId,
      organizationId: organizationId,
      template: template1,
      model,
    });

    item.addDataValues([
      DataValue.create({
        value: undefined,
        dataSectionId: template1.sections[2].id,
        dataFieldId: template1.sections[2].dataFields[0].id,
        row: 0,
      }),
    ]);
    const { id } = await itemService.save(item);
    const foundItem = await itemService.findOneOrFail(id);
    expect(foundItem.templateId).toEqual(template1.id);
    expect(foundItem.dataValues).toEqual(
      ignoreIds([
        DataValue.create({
          value: undefined,
          dataSectionId: template1.sections[0].id,
          dataFieldId: template1.sections[0].dataFields[0].id,
          row: 0,
        }),
        DataValue.create({
          value: undefined,
          dataSectionId: template1.sections[0].id,
          dataFieldId: template1.sections[0].dataFields[1].id,
          row: 0,
        }),
        DataValue.create({
          value: undefined,
          dataSectionId: template1.sections[1].id,
          dataFieldId: template1.sections[1].dataFields[0].id,
          row: 0,
        }),
        DataValue.create({
          value: undefined,
          dataSectionId: template1.sections[2].id,
          dataFieldId: template1.sections[2].dataFields[0].id,
          row: 0,
        }),
      ]),
    );
  });

  it('should create multiple items for a model and find them by model', async () => {
    const model1 = Model.create({
      name: 'name',
      userId: userId,
      organizationId: organizationId,
      template,
    });
    const model2 = Model.create({
      name: 'name',
      userId: userId,
      organizationId: organizationId,
      template,
    });
    const item1 = Item.create({
      userId: userId,
      organizationId: organizationId,
      template,
      model: model1,
    });
    const item2 = Item.create({
      userId: userId,
      organizationId: organizationId,
      template,
      model: model1,
    });

    await itemService.save(item1);
    await itemService.save(item2);
    const item3 = Item.create({
      userId: userId,
      organizationId: organizationId,
      model: model2,
      template,
    });
    await itemService.save(item3);
    const foundItems = await itemService.findAllByModel(model1.id);
    expect(foundItems).toEqual([item1, item2]);
  });

  it('should save item with unique product identifiers', async () => {
    const model = Model.create({
      name: 'Model with UPIs',
      userId: userId,
      organizationId: organizationId,
      template,
    });
    // Create item with unique product identifiers
    const item = Item.create({
      userId: userId,
      organizationId: organizationId,
      model,
      template,
    });

    // Add unique product identifiers to the item
    const upi1 = item.createUniqueProductIdentifier();
    const upi2 = item.createUniqueProductIdentifier();

    // Save the item
    const savedItem = await itemService.save(item);

    // Verify the saved item has the unique product identifiers
    expect(savedItem.uniqueProductIdentifiers).toHaveLength(2);
    expect(savedItem.uniqueProductIdentifiers[0].uuid).toBe(upi1.uuid);
    expect(savedItem.uniqueProductIdentifiers[1].uuid).toBe(upi2.uuid);

    // Verify the identifiers are linked to the item
    expect(savedItem.uniqueProductIdentifiers[0].referenceId).toBe(item.id);
    expect(savedItem.uniqueProductIdentifiers[1].referenceId).toBe(item.id);

    // Retrieve the item and verify UPIs are still there
    const foundItem = await itemService.findOneOrFail(item.id);
    expect(foundItem.uniqueProductIdentifiers).toHaveLength(2);
  });

  it('should correctly convert item entity to domain object', () => {
    // Create a mock ItemEntity
    const itemId = randomUUID();
    const modelId = randomUUID();
    const itemEntity = {
      id: itemId,
      modelId: modelId,
    } as ItemDoc;

    // Create mock UPIs
    const upi1 = UniqueProductIdentifier.create({ referenceId: itemId });
    const upi2 = UniqueProductIdentifier.create({ referenceId: itemId });
    const upis = [upi1, upi2];

    // Convert to domain object
    const item = itemService.convertToDomain(itemEntity, upis);

    // Verify conversion
    expect(item).toBeInstanceOf(Item);
    expect(item.id).toBe(itemId);
    expect(item.modelId).toBe(modelId);
    expect(item.uniqueProductIdentifiers).toEqual(upis);
    expect(item.uniqueProductIdentifiers).toHaveLength(2);
  });

  it(`should migrate from ${ItemDocSchemaVersion.v1_0_0} to ${ItemDocSchemaVersion.v1_0_1}`, async () => {
    const id = randomUUID();
    await itemDoc.findOneAndUpdate(
      { _id: id },
      {
        _schemaVersion: ItemDocSchemaVersion.v1_0_0,
        name: 'Migration Name',
        description: 'desc',
        templateId: 'templateId',
        dataValues: [],
        createdByUserId: 'userId',
        ownedByOrganizationId: 'orgId',
      },
      { upsert: true },
    );
    const found = await itemService.findOneOrFail(id); // or _id: new ObjectId(idAsString)
    expect(found.templateId).toEqual('templateId');
    const saved = await itemService.save(found);
    expect(saved.templateId).toEqual('templateId');
  });

  afterAll(async () => {
    await mongoConnection.close();
    await module.close();
  });
});
